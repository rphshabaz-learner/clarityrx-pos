import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { searchPosCustomers } from "../lib/customers/customerSearch";
import { buildSeedCustomers } from "../lib/customers/seedCustomers";
import {
  CUSTOMER_TYPE,
  emptyCustomer,
  generateCustomerId,
} from "../lib/customers/customerTypes";
import { deletePosCustomer, listPosCustomers, savePosCustomer } from "../lib/clarityIndexedDb";
import { logAccessEvent } from "../lib/access/posAccessLog";
import { diffConsentChanges, normalizeCustomerPrivacy } from "../lib/customers/customerConsent";

function nextAccountNumber(customers) {
  const nums = customers
    .map((row) => String(row.accountNumber || "").match(/C-(\d+)/)?.[1])
    .filter(Boolean)
    .map(Number);
  const next = (nums.length ? Math.max(...nums) : 10000) + 1;
  return `C-${next}`;
}

export function useCustomers({ onNotify, logActivity, accessLogContext }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [listQuery, setListQuery] = useState("");
  const lastViewedCustomerId = useRef("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let rows = await listPosCustomers();
      if (!rows.length) {
        const seed = buildSeedCustomers();
        await Promise.all(seed.map((row) => savePosCustomer(row)));
        rows = seed;
      }
      rows = rows.map((row) => ({ ...row, ...normalizeCustomerPrivacy(row) }));
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

  useEffect(() => {
    if (!selectedCustomerId || selectedCustomerId === lastViewedCustomerId.current) return;
    lastViewedCustomerId.current = selectedCustomerId;
    const customer = customers.find((row) => row.id === selectedCustomerId);
    void logAccessEvent(
      logActivity,
      "profile_view",
      "Customer profile viewed",
      {
        customerId: selectedCustomerId,
        accountNumber: customer?.accountNumber || null,
        customerType: customer?.type || null,
        rxLinked: Boolean(customer?.rxProfile?.krollPatientId),
      },
      accessLogContext
    );
  }, [selectedCustomerId, logActivity, accessLogContext, customers]);

  const filteredCustomers = useMemo(() => {
    const hits = searchPosCustomers(customers, listQuery);
    return listQuery.trim() ? hits : customers;
  }, [customers, listQuery]);

  const saveCustomer = useCallback(
    async (customer) => {
      setBusy(true);
      try {
        const prior = customers.find((row) => row.id === customer.id) || null;
        const next = {
          ...customer,
          ...normalizeCustomerPrivacy(customer),
          updatedAt: new Date().toISOString(),
        };
        const consentChanges = diffConsentChanges(prior, next);
        await savePosCustomer(next);
        setCustomers((prev) => {
          const idx = prev.findIndex((row) => row.id === next.id);
          if (idx === -1) return [next, ...prev];
          const copy = [...prev];
          copy[idx] = next;
          return copy;
        });
        setSelectedCustomerId(next.id);
        logActivity?.("pos", "Customer saved", {
          customerId: next.id,
          accountNumber: next.accountNumber,
        });
        for (const change of consentChanges) {
          logActivity?.("pos", "Customer consent updated", {
            customerId: next.id,
            channel: change.channel,
            granted: change.granted,
          });
        }
        onNotify?.("Customer saved.", "success");
        return next;
      } catch (e) {
        onNotify?.(e.message || "Unable to save customer.", "error");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [customers, logActivity, onNotify]
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
        logActivity?.("pos", "Customer removed", { customerId: id });
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
