import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deletePurchaseOrder,
  deleteReplenishmentRule,
  getAllPurchaseOrders,
  getPurchaseOrder,
  listDamagedGoods,
  listReplenishmentRules,
  listVendorReturns,
  saveDamagedGoods,
  savePurchaseOrder,
  saveReplenishmentRule,
  saveVendorReturn,
  searchInventoryItems,
} from "../lib/clarityIndexedDb";
import {
  computePoReceiveStatus,
  generateLineId,
  generateOrderNumber,
  generateRecordId,
  PO_STATUS,
  RTV_STATUS,
  summarizePoBackorders,
} from "../lib/purchasing/orderStatus";
import { applyReceiveToLines, buildReceiveAdjustments } from "../lib/purchasing/receiveStock";
import { getWholesaler } from "../lib/purchasing/wholesalers";
import {
  downloadWholesalerCatalog,
  downloadWholesalerInvoices,
  submitPurchaseOrderEdi,
  submitVendorReturnEdi,
} from "../services/purchasingApi";
import { transmitInventoryAdjustments } from "../services/posApi";

function emptyDraftLine() {
  return {
    lineId: generateLineId(),
    sku: "",
    wholesalerItemNumber: "",
    din: "",
    description: "",
    qtyOrdered: 1,
    qtyReceived: 0,
    qtyBackordered: 0,
    unitCost: 0,
    lastCost: 0,
  };
}

export function usePurchasing({ accessToken, tillNumber, onNotify, logActivity }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState([]);
  const [rules, setRules] = useState([]);
  const [returns, setReturns] = useState([]);
  const [damaged, setDamaged] = useState([]);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState("");
  const [catalogMeta, setCatalogMeta] = useState({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [orderRows, ruleRows, returnRows, damagedRows] = await Promise.all([
        getAllPurchaseOrders(),
        listReplenishmentRules(),
        listVendorReturns(),
        listDamagedGoods(),
      ]);
      setOrders(orderRows);
      setRules(ruleRows);
      setReturns(returnRows);
      setDamaged(damagedRows);
    } catch (e) {
      onNotify?.(e.message || "Unable to load purchasing data.", "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedOrder = useMemo(
    () => orders.find((row) => row.orderNumber === selectedOrderNumber) || null,
    [orders, selectedOrderNumber]
  );

  const backorders = useMemo(
    () => orders.flatMap((order) => summarizePoBackorders(order)),
    [orders]
  );

  const createDraftOrder = useCallback(
    async (supplier, source = "manual") => {
      const wholesaler = getWholesaler(supplier);
      if (!wholesaler) {
        onNotify?.("Select a valid wholesaler.", "error");
        return null;
      }
      const now = new Date().toISOString();
      const order = {
        orderNumber: generateOrderNumber(),
        supplier,
        status: PO_STATUS.DRAFT,
        source,
        lines: [emptyDraftLine()],
        edi: null,
        invoices: [],
        notes: "",
        createdAt: now,
        updatedAt: now,
      };
      await savePurchaseOrder(order);
      await refresh();
      setSelectedOrderNumber(order.orderNumber);
      onNotify?.(`Draft PO ${order.orderNumber} created.`, "success");
      return order;
    },
    [onNotify, refresh]
  );

  const saveOrder = useCallback(
    async (order) => {
      const next = { ...order, updatedAt: new Date().toISOString() };
      await savePurchaseOrder(next);
      await refresh();
      setSelectedOrderNumber(next.orderNumber);
    },
    [refresh]
  );

  const submitOrderEdi = useCallback(
    async (orderNumber) => {
      const order = await getPurchaseOrder(orderNumber);
      if (!order) {
        onNotify?.("Purchase order not found.", "error");
        return;
      }
      if (!order.lines?.length) {
        onNotify?.("Add at least one line before submitting.", "error");
        return;
      }
      setBusy(true);
      try {
        const ediResult = await submitPurchaseOrderEdi(order, accessToken);
        const submittedAt = ediResult.submittedAt || new Date().toISOString();
        const next = {
          ...order,
          status: PO_STATUS.SUBMITTED,
          submittedAt,
          updatedAt: submittedAt,
          edi: {
            reference: ediResult.ediReference || ediResult.reference || `EDI-${Date.now()}`,
            mode: ediResult.mode || "api",
            message: ediResult.message || "Submitted",
            responseCode: ediResult.responseCode || "OK",
            submittedAt,
          },
          lines: order.lines.map((line) => ({
            ...line,
            qtyBackordered: Math.max(0, (Number(line.qtyOrdered) || 0) - (Number(line.qtyReceived) || 0)),
          })),
        };
        await savePurchaseOrder(next);
        await logActivity?.("purchasing", "PO submitted via EDI", {
          orderNumber: order.orderNumber,
          supplier: order.supplier,
          ediReference: next.edi.reference,
        });
        await refresh();
        onNotify?.(`PO ${order.orderNumber} submitted (${next.edi.reference}).`, "success");
      } catch (e) {
        onNotify?.(e.message || "EDI submit failed.", "error");
      } finally {
        setBusy(false);
      }
    },
    [accessToken, logActivity, onNotify, refresh]
  );

  const receiveOrder = useCallback(
    async ({ orderNumber, receiveDraft, invoiceNumber }) => {
      const order = await getPurchaseOrder(orderNumber);
      if (!order) {
        onNotify?.("Purchase order not found.", "error");
        return;
      }
      const linesWithPass = applyReceiveToLines(order.lines, receiveDraft);
      const adjustments = buildReceiveAdjustments(
        order.lines.map((line) => ({
          ...line,
          qtyReceivedThisPass: Math.max(0, Number(receiveDraft[line.lineId]?.qtyThisPass) || 0),
          unitCost:
            receiveDraft[line.lineId]?.unitCost != null
              ? Number(receiveDraft[line.lineId].unitCost)
              : line.unitCost,
        })),
        {
          tillNumber,
          purchaseOrderNumber: orderNumber,
          invoiceNumber: invoiceNumber || undefined,
          reason: "purchase_receive",
        }
      );

      setBusy(true);
      try {
        if (adjustments.length) {
          await transmitInventoryAdjustments(adjustments, accessToken, {
            source: "purchasing_receive",
            purchaseOrderNumber: orderNumber,
            invoiceNumber: invoiceNumber || undefined,
          });
        }
        const status = computePoReceiveStatus(linesWithPass);
        const now = new Date().toISOString();
        const invoiceRow = invoiceNumber
          ? {
              invoiceNumber,
              receivedAt: now,
              lineCount: adjustments.length,
            }
          : null;
        const next = {
          ...order,
          lines: linesWithPass,
          status,
          updatedAt: now,
          receivedAt: status === PO_STATUS.RECEIVED ? now : order.receivedAt,
          invoices: invoiceRow
            ? [...(order.invoices || []).filter((inv) => inv.invoiceNumber !== invoiceNumber), invoiceRow]
            : order.invoices || [],
        };
        await savePurchaseOrder(next);
        await logActivity?.("purchasing", "Stock received against PO", {
          orderNumber,
          adjustmentCount: adjustments.length,
          invoiceNumber,
        });
        await refresh();
        onNotify?.(
          adjustments.length
            ? `Received ${adjustments.length} line(s); inventory synced.`
            : "No quantities entered to receive.",
          adjustments.length ? "success" : "warning"
        );
      } catch (e) {
        onNotify?.(e.message || "Receive failed.", "error");
      } finally {
        setBusy(false);
      }
    },
    [accessToken, logActivity, onNotify, refresh, tillNumber]
  );

  const cancelOrder = useCallback(
    async (orderNumber) => {
      const order = await getPurchaseOrder(orderNumber);
      if (!order) return;
      if (order.status !== PO_STATUS.DRAFT) {
        onNotify?.("Only draft orders can be deleted.", "warning");
        return;
      }
      await deletePurchaseOrder(orderNumber);
      if (selectedOrderNumber === orderNumber) setSelectedOrderNumber("");
      await refresh();
      onNotify?.("Draft order removed.", "success");
    },
    [onNotify, refresh, selectedOrderNumber]
  );

  const downloadCatalog = useCallback(
    async (supplier) => {
      setBusy(true);
      try {
        const result = await downloadWholesalerCatalog(supplier, accessToken);
        setCatalogMeta((prev) => ({ ...prev, [supplier]: result }));
        onNotify?.(result.message || `Catalog request sent for ${supplier}.`, "info");
      } catch (e) {
        onNotify?.(e.message || "Catalog download failed.", "error");
      } finally {
        setBusy(false);
      }
    },
    [accessToken, onNotify]
  );

  const downloadInvoices = useCallback(
    async (supplier) => {
      setBusy(true);
      try {
        const result = await downloadWholesalerInvoices(supplier, accessToken);
        onNotify?.(result.message || `Invoice download requested for ${supplier}.`, "info");
        return result;
      } catch (e) {
        onNotify?.(e.message || "Invoice download failed.", "error");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [accessToken, onNotify]
  );

  const saveRule = useCallback(
    async (rule) => {
      const id = rule.id || generateRecordId("repl");
      await saveReplenishmentRule({
        ...rule,
        id,
        enabled: rule.enabled !== false,
        updatedAt: new Date().toISOString(),
        createdAt: rule.createdAt || new Date().toISOString(),
      });
      await refresh();
      onNotify?.("Replenishment rule saved.", "success");
    },
    [onNotify, refresh]
  );

  const removeRule = useCallback(
    async (id) => {
      await deleteReplenishmentRule(id);
      await refresh();
      onNotify?.("Rule removed.", "success");
    },
    [onNotify, refresh]
  );

  const buildReplenishmentOrder = useCallback(
    async (supplier) => {
      const supplierRules = rules.filter(
        (rule) => rule.enabled !== false && rule.supplier === supplier && (Number(rule.currentQty) || 0) <= (Number(rule.minQty) || 0)
      );
      if (!supplierRules.length) {
        onNotify?.("No rules below minimum for this wholesaler.", "warning");
        return null;
      }
      const order = await createDraftOrder(supplier, "replenishment");
      if (!order) return null;
      const lines = supplierRules.map((rule) => ({
        lineId: generateLineId(),
        sku: rule.sku,
        wholesalerItemNumber: rule.wholesalerItemNumber || "",
        din: rule.din || "",
        description: rule.description || rule.sku,
        qtyOrdered: Number(rule.reorderQty) || 1,
        qtyReceived: 0,
        qtyBackordered: 0,
        unitCost: Number(rule.unitCost) || 0,
        lastCost: Number(rule.lastCost) || 0,
      }));
      await saveOrder({ ...order, lines, notes: "Auto-replenishment" });
      onNotify?.(`Replenishment draft with ${lines.length} line(s).`, "success");
      return order.orderNumber;
    },
    [createDraftOrder, onNotify, rules, saveOrder]
  );

  const searchCatalog = useCallback(async (query) => {
    if (!String(query || "").trim()) return [];
    return searchInventoryItems(query, 12);
  }, []);

  const createReturn = useCallback(
    async ({ supplier, orderNumber, lines, notes }) => {
      const id = generateRecordId("rtv");
      const now = new Date().toISOString();
      const row = {
        id,
        supplier,
        orderNumber: orderNumber || "",
        status: RTV_STATUS.DRAFT,
        lines: lines || [],
        notes: notes || "",
        edi: null,
        createdAt: now,
        updatedAt: now,
      };
      await saveVendorReturn(row);
      await refresh();
      onNotify?.("Return-to-vendor draft created.", "success");
      return id;
    },
    [onNotify, refresh]
  );

  const submitReturn = useCallback(
    async (id) => {
      const rows = await listVendorReturns();
      const row = rows.find((r) => r.id === id);
      if (!row) return;
      setBusy(true);
      try {
        const ediResult = await submitVendorReturnEdi(row, accessToken);
        const now = ediResult.submittedAt || new Date().toISOString();
        await saveVendorReturn({
          ...row,
          status: RTV_STATUS.SUBMITTED,
          updatedAt: now,
          edi: {
            reference: ediResult.ediReference || `RTV-${Date.now()}`,
            message: ediResult.message,
            submittedAt: now,
          },
        });
        await refresh();
        onNotify?.("RTV submitted.", "success");
      } catch (e) {
        onNotify?.(e.message || "RTV submit failed.", "error");
      } finally {
        setBusy(false);
      }
    },
    [accessToken, onNotify, refresh]
  );

  const recordDamaged = useCallback(
    async (payload) => {
      const id = generateRecordId("dmg");
      const now = new Date().toISOString();
      await saveDamagedGoods({
        id,
        status: "open",
        createdAt: now,
        updatedAt: now,
        ...payload,
      });
      await refresh();
      onNotify?.("Damaged goods record saved.", "success");
    },
    [onNotify, refresh]
  );

  const resolveDamaged = useCallback(
    async (id, patch = {}) => {
      const rows = await listDamagedGoods();
      const row = rows.find((r) => r.id === id);
      if (!row) return;
      await saveDamagedGoods({
        ...row,
        ...patch,
        status: "resolved",
        updatedAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString(),
      });
      await refresh();
      onNotify?.("Damaged goods marked resolved.", "success");
    },
    [onNotify, refresh]
  );

  return {
    loading,
    busy,
    orders,
    rules,
    returns,
    damaged,
    backorders,
    selectedOrder,
    selectedOrderNumber,
    setSelectedOrderNumber,
    catalogMeta,
    refresh,
    createDraftOrder,
    saveOrder,
    submitOrderEdi,
    receiveOrder,
    cancelOrder,
    downloadCatalog,
    downloadInvoices,
    saveRule,
    removeRule,
    buildReplenishmentOrder,
    searchCatalog,
    createReturn,
    submitReturn,
    recordDamaged,
    resolveDamaged,
    emptyDraftLine,
  };
}
