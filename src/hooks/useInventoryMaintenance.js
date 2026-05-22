import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteFrontStoreProduct,
  getFrontStoreProductBySku,
  listFrontStoreProducts,
  saveFrontStoreProduct,
} from "../lib/clarityIndexedDb";
import { invalidateSellableCatalogCache } from "../lib/inventory/frontStoreCatalog";
import { searchFrontStoreProducts } from "../lib/inventory/frontStoreSearch";
import { buildSeedFrontStoreProducts } from "../lib/inventory/seedFrontStore";
import {
  emptyCycleCountSession,
  emptyProduct,
  generateProductId,
  PRODUCT_STATUS,
} from "../lib/inventory/frontStoreTypes";
import { transmitInventoryAdjustments } from "../services/posApi";

function nextSku(products) {
  const nums = products
    .map((row) => String(row.sku || "").match(/FS-(\d+)/)?.[1])
    .filter(Boolean)
    .map(Number);
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `FS-${next}`;
}

export function useInventoryMaintenance({ accessToken, tillNumber, onNotify, logActivity }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [listQuery, setListQuery] = useState("");
  const [cycleSessions, setCycleSessions] = useState([]);
  const [activeCycleId, setActiveCycleId] = useState("");
  const [labelQueue, setLabelQueue] = useState([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let rows = await listFrontStoreProducts();
      if (!rows.length) {
        const seed = buildSeedFrontStoreProducts();
        await Promise.all(seed.map((row) => saveFrontStoreProduct(row)));
        rows = seed;
      }
      setProducts(rows);
      setSelectedProductId((prev) => prev || rows[0]?.id || "");
      invalidateSellableCatalogCache();
    } catch (e) {
      onNotify?.(e.message || "Unable to load inventory.", "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedProduct = useMemo(
    () => products.find((row) => row.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const filteredProducts = useMemo(() => {
    const hits = searchFrontStoreProducts(products, listQuery);
    return listQuery.trim() ? hits : products;
  }, [products, listQuery]);

  const saveProduct = useCallback(
    async (product) => {
      setBusy(true);
      try {
        const sku = String(product.sku || "").trim();
        if (!sku) {
          onNotify?.("SKU is required.", "error");
          return null;
        }
        const duplicate = products.find(
          (row) => row.id !== product.id && String(row.sku || "").trim().toLowerCase() === sku.toLowerCase()
        );
        if (duplicate) {
          onNotify?.(`SKU ${sku} is already used by another product.`, "error");
          return null;
        }
        const next = {
          ...product,
          sku,
          updatedAt: new Date().toISOString(),
        };
        await saveFrontStoreProduct(next);
        setProducts((prev) => {
          const idx = prev.findIndex((row) => row.id === next.id);
          if (idx === -1) return [next, ...prev];
          const copy = [...prev];
          copy[idx] = next;
          return copy;
        });
        setSelectedProductId(next.id);
        invalidateSellableCatalogCache();
        logActivity?.("pos.inventory.save", { productId: next.id, sku: next.sku });
        onNotify?.("Product saved.", "success");
        return next;
      } catch (e) {
        onNotify?.(e.message || "Unable to save product.", "error");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [logActivity, onNotify, products]
  );

  const createProduct = useCallback(async () => {
    const draft = emptyProduct();
    draft.id = generateProductId();
    draft.sku = nextSku(products);
    return saveProduct(draft);
  }, [products, saveProduct]);

  const removeProduct = useCallback(
    async (id) => {
      if (!id) return;
      setBusy(true);
      try {
        await deleteFrontStoreProduct(id);
        setProducts((prev) => prev.filter((row) => row.id !== id));
        setSelectedProductId((prev) => (prev === id ? "" : prev));
        invalidateSellableCatalogCache();
        logActivity?.("pos.inventory.delete", { productId: id });
        onNotify?.("Product removed.", "success");
      } catch (e) {
        onNotify?.(e.message || "Unable to remove product.", "error");
      } finally {
        setBusy(false);
      }
    },
    [logActivity, onNotify]
  );

  const postAdjustments = useCallback(
    async (adjustments, reason) => {
      if (!adjustments?.length) return false;
      setBusy(true);
      try {
        await transmitInventoryAdjustments(adjustments, accessToken, {
          tillNumber,
          reason,
        });
        logActivity?.("pos.inventory.adjustments", { count: adjustments.length, reason });
        onNotify?.(`${adjustments.length} adjustment(s) transmitted.`, "success");
        await refresh();
        return true;
      } catch (e) {
        onNotify?.(e.message || "Unable to post inventory adjustments.", "error");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [accessToken, logActivity, onNotify, refresh, tillNumber]
  );

  const applyPhysicalCount = useCallback(
    async (productId, countedQty) => {
      const product = products.find((row) => row.id === productId);
      if (!product) return false;
      const systemQty = Number(product.onHand) || 0;
      const counted = Number(countedQty);
      if (!Number.isFinite(counted)) return false;
      const delta = counted - systemQty;
      if (delta === 0) {
        onNotify?.("Count matches system on-hand.", "info");
        return true;
      }
      const ok = await postAdjustments([{ sku: product.sku, quantityDelta: delta }], "physical_count");
      if (!ok) return false;
      const updated = { ...product, onHand: counted, updatedAt: new Date().toISOString() };
      await saveFrontStoreProduct(updated);
      setProducts((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      invalidateSellableCatalogCache();
      return true;
    },
    [onNotify, postAdjustments, products]
  );

  const findBySkuOrUpc = useCallback(
    async (query) => {
      const q = String(query || "").trim().toLowerCase();
      if (!q) return null;
      const local = products.find(
        (row) =>
          String(row.sku || "").toLowerCase() === q ||
          String(row.upc || "").toLowerCase() === q ||
          (row.barcodes || []).some((b) => String(b).toLowerCase() === q)
      );
      if (local) return local;
      return getFrontStoreProductBySku(query);
    },
    [products]
  );

  const selectProductByQuery = useCallback(
    (query) => {
      const hits = searchFrontStoreProducts(products, query);
      const hit = hits[0];
      if (hit) {
        setSelectedProductId(hit.id);
        setListQuery("");
        return hit;
      }
      return null;
    },
    [products]
  );

  const createCycleCount = useCallback(() => {
    const session = emptyCycleCountSession();
    session.name = `Cycle ${new Date().toLocaleDateString()}`;
    setCycleSessions((prev) => [session, ...prev]);
    setActiveCycleId(session.id);
    return session;
  }, []);

  const updateCycleSession = useCallback((session) => {
    setCycleSessions((prev) => prev.map((row) => (row.id === session.id ? session : row)));
  }, []);

  const completeCycleCount = useCallback(
    async (sessionId) => {
      const session = cycleSessions.find((row) => row.id === sessionId);
      if (!session) return false;
      const adjustments = [];
      for (const line of session.lines || []) {
        const product = products.find((row) => row.id === line.productId);
        if (!product) continue;
        const systemQty = Number(product.onHand) || 0;
        const counted = Number(line.countedQty);
        if (!Number.isFinite(counted)) continue;
        const delta = counted - systemQty;
        if (delta !== 0) adjustments.push({ sku: product.sku, quantityDelta: delta });
      }
      if (adjustments.length) {
        const ok = await postAdjustments(adjustments, "cycle_count");
        if (!ok) return false;
      }
      const completed = {
        ...session,
        status: "completed",
        completedAt: new Date().toISOString(),
      };
      updateCycleSession(completed);
      onNotify?.("Cycle count completed.", "success");
      return true;
    },
    [cycleSessions, onNotify, postAdjustments, products, updateCycleSession]
  );

  const queueLabels = useCallback((items) => {
    setLabelQueue((prev) => [...prev, ...items]);
  }, []);

  const clearLabelQueue = useCallback(() => setLabelQueue([]), []);

  const activeCycle = useMemo(
    () => cycleSessions.find((row) => row.id === activeCycleId) || null,
    [activeCycleId, cycleSessions]
  );

  const stats = useMemo(() => {
    const active = products.filter((p) => p.status === PRODUCT_STATUS.ACTIVE).length;
    const lowStock = products.filter((p) => Number(p.onHand) <= 5).length;
    const expiryTracked = products.filter((p) => p.trackExpiry).length;
    const expiringSoon = products.reduce((sum, p) => {
      const soon = (p.lots || []).filter((lot) => {
        if (!lot.expiryDate) return false;
        const days = (new Date(lot.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
        return days >= 0 && days <= 90;
      }).length;
      return sum + soon;
    }, 0);
    return { active, lowStock, expiryTracked, expiringSoon, total: products.length };
  }, [products]);

  return {
    loading,
    busy,
    products,
    filteredProducts,
    selectedProduct,
    selectedProductId,
    setSelectedProductId,
    listQuery,
    setListQuery,
    saveProduct,
    createProduct,
    removeProduct,
    applyPhysicalCount,
    postAdjustments,
    findBySkuOrUpc,
    selectProductByQuery,
    cycleSessions,
    activeCycle,
    activeCycleId,
    setActiveCycleId,
    createCycleCount,
    updateCycleSession,
    completeCycleCount,
    labelQueue,
    queueLabels,
    clearLabelQueue,
    stats,
    refresh,
  };
}
