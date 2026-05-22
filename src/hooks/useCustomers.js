import { useCallback, useEffect, useMemo, useState } from "react";
import { searchPosCustomers } from "../lib/customers/customerSearch";
import { buildSeedCustomers } from "../lib/customers/seedCustomers";
import {
  CUSTOMER_TYPE,
  emptyCustomer,
  generateCustomerId,
} from "../lib/customers/customerTypes";
import { deletePosCustomer, listPosCustomers, savePosCustomer } from "../lib/clarityIndexedDb";

function nextAccountNumber(customers) {
  const nums = customers
    .map((row) => String(row.accountNumber || "").match(/C-(\d+)/)?.[1])
    .filter(Boolean)
    .map(Number);
  const next = (nums.length ? Math.max(...nums) : 10000) + 1;
  return `C-${next}`;
}

export function useCustomers({ onNotify, logActivity }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [listQuery, setListQuery] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let rows = await listPosCustomers();
      if (!rows.length) {
        const seed = buildSeedCustomers();
        await Promise.all(seed.map((row) => savePosCustomer(row)));
        rows = seed;
      }
      setCustomers(rows);
      setSelectedCustomerId((prev) => prev || rows[0]?.id || "");
    } catch (e) {
      onNotify?.(e.message || "Unable to load customers.", "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedCustomer = useMemo(
    () => customers.find((row) => row.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const filteredCustomers = useMemo(() => {
    const hits = searchPosCustomers(customers, listQuery);
    return listQuery.trim() ? hits : customers;
  }, [customers, listQuery]);

  const saveCustomer = useCallback(
    async (customer) => {
      setBusy(true);
      try {
        const next = {
          ...customer,
          updatedAt: new Date().toISOString(),
        };
        await savePosCustomer(next);
        setCustomers((prev) => {
          const idx = prev.findIndex((row) => row.id === next.id);
          if (idx === -1) return [next, ...prev];
          const copy = [...prev];
          copy[idx] = next;
          return copy;
        });
        setSelectedCustomerId(next.id);
        logActivity?.("pos.customers.save", { customerId: next.id, accountNumber: next.accountNumber });
        onNotify?.("Customer saved.", "success");
        return next;
      } catch (e) {
        onNotify?.(e.message || "Unable to save customer.", "error");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [logActivity, onNotify]
  );

  const createCustomer = useCallback(
    async (type = CUSTOMER_TYPE.INDIVIDUAL) => {
      const draft = emptyCustomer(type);
      draft.id = generateCustomerId();
      draft.accountNumber = nextAccountNumber(customers);
      if (type === CUSTOMER_TYPE.LOYALTY) {
        draft.loyalty = {
          ...draft.loyalty,
          memberId: `LY-${Date.now().toString().slice(-6)}`,
          enrolledAt: new Date().toISOString(),
        };
      }
      return saveCustomer(draft);
    },
    [customers, saveCustomer]
  );

  const removeCustomer = useCallback(
    async (id) => {
      if (!id) return;
      setBusy(true);
      try {
        await deletePosCustomer(id);
        setCustomers((prev) => prev.filter((row) => row.id !== id));
        setSelectedCustomerId((prev) => (prev === id ? "" : prev));
        logActivity?.("pos.customers.delete", { customerId: id });
        onNotify?.("Customer removed.", "success");
      } catch (e) {
        onNotify?.(e.message || "Unable to remove customer.", "error");
      } finally {
        setBusy(false);
      }
    },
    [logActivity, onNotify]
  );

  const findByQuery = useCallback(
    (query) => {
      const hits = searchPosCustomers(customers, query);
      return hits[0] || null;
    },
    [customers]
  );

  const selectCustomerByQuery = useCallback(
    (query) => {
      const hit = findByQuery(query);
      if (hit) {
        setSelectedCustomerId(hit.id);
        setListQuery("");
        return hit;
      }
      return null;
    },
    [findByQuery]
  );

  const stats = useMemo(() => {
    const loyalty = customers.filter((c) => c.type === CUSTOMER_TYPE.LOYALTY).length;
    const storeCharge = customers.filter((c) => c.type === CUSTOMER_TYPE.STORE_CHARGE).length;
    const facilities = customers.filter(
      (c) => c.type === CUSTOMER_TYPE.CARE_HOME || c.type === CUSTOMER_TYPE.LTC
    ).length;
    const rxLinked = customers.filter((c) => c.rxProfile?.krollPatientId).length;
    const readyPickups = customers.reduce(
      (sum, c) => sum + (c.pickups || []).filter((p) => p.status === "ready").length,
      0
    );
    return { loyalty, storeCharge, facilities, rxLinked, readyPickups };
  }, [customers]);

  return {
    loading,
    busy,
    customers,
    filteredCustomers,
    selectedCustomer,
    selectedCustomerId,
    setSelectedCustomerId,
    listQuery,
    setListQuery,
    saveCustomer,
    createCustomer,
    removeCustomer,
    findByQuery,
    selectCustomerByQuery,
    stats,
    refresh,
  };
}
