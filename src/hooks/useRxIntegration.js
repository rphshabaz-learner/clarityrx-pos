import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../AuthContext";
import {
  getRxWorkItemCount,
  listCompletedSales,
  searchRxWorkItems,
} from "../lib/clarityIndexedDb";
import { addDeliveryMatchDraft, loadDeliveryMatches, updateDeliveryMatch } from "../lib/rx/deliveryMatch";
import {
  loadRxPaymentQueue,
  updateRxPaymentRow,
} from "../lib/rx/paymentQueue";
import { RX_DELIVERY_MATCH_STATUS, RX_PAYMENT_STATUS } from "../lib/rx/rxIntegrationTypes";
import { ensureDemoRxWorkItems } from "../lib/rx/seedRxStatus";
import { listPosCustomers } from "../lib/clarityIndexedDb";
import { customerDisplayName } from "../lib/customers/customerTypes";
import { usePosHeaderStatus } from "./usePosHeaderStatus";
import { usePosPickups } from "./usePosPickups";
import {
  lookupRxStatus,
  postRxPayment,
  syncPosPickups,
} from "../services/posApi";

import { logAccessEvent } from "../lib/access/posAccessLog";

export function useRxIntegration({ onNotify, logActivity, accessLogContext } = {}) {
  const { accessToken } = useAuth();
  const { kroll, health, pickupSyncOn, refreshHealth } = usePosHeaderStatus();
  const { pickups, isLoading: pickupsLoading, reload: reloadPickups } = usePosPickups();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [paymentQueue, setPaymentQueue] = useState([]);
  const [deliveryMatches, setDeliveryMatches] = useState([]);
  const [completedSales, setCompletedSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [statusQuery, setStatusQuery] = useState("");
  const [statusResults, setStatusResults] = useState([]);
  const [statusSource, setStatusSource] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await ensureDemoRxWorkItems();
      const [payments, deliveries, sales, customerRows] = await Promise.all([
        loadRxPaymentQueue(),
        loadDeliveryMatches(),
        listCompletedSales(400),
        listPosCustomers(),
      ]);
      setPaymentQueue(payments);
      setDeliveryMatches(deliveries);
      setCompletedSales(sales);
      setCustomers(customerRows);
    } catch (cause) {
      onNotify?.(cause?.message || "Could not load Rx integration data.", "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const combinedReceipts = useMemo(
    () =>
      completedSales.filter(
        (sale) =>
          Number(sale.rxCopay) > 0 ||
          Boolean(sale.pickupId) ||
          (Number(sale.lineCount) > 0 && Number(sale.rxCopay) > 0)
      ),
    [completedSales]
  );

  const pendingPayments = useMemo(
    () => paymentQueue.filter((row) => row.status === RX_PAYMENT_STATUS.PENDING),
    [paymentQueue]
  );

  const accountCustomers = useMemo(() => {
    return customers
      .filter(
        (row) =>
          row.rxProfile?.krollPatientId ||
          Number(row.storeCharge?.balance) > 0 ||
          Number(row.storeCharge?.creditLimit) > 0
      )
      .map((row) => ({
        id: row.id,
        label: customerDisplayName(row),
        accountNumber: row.accountNumber,
        krollPatientId: row.rxProfile?.krollPatientId || "",
        balance: Number(row.storeCharge?.balance) || 0,
        creditLimit: Number(row.storeCharge?.creditLimit) || 0,
        readyPickups: (row.pickups || []).filter((p) => p.status === "ready").length,
      }));
  }, [customers]);

  const [rxWorkItemCount, setRxWorkItemCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void getRxWorkItemCount().then((count) => {
      if (!cancelled) setRxWorkItemCount(count);
    });
    return () => {
      cancelled = true;
    };
  }, [paymentQueue.length, completedSales.length]);

  const stats = useMemo(
    () => ({
      pendingPayments: pendingPayments.length,
      readyPickups: pickups.filter((p) => p?.status !== "picked_up").length,
      combinedReceipts: combinedReceipts.length,
      unmatchedDeliveries: deliveryMatches.filter((r) => r.status === RX_DELIVERY_MATCH_STATUS.UNMATCHED).length,
      rxWorkItems: rxWorkItemCount,
    }),
    [
      pendingPayments.length,
      pickups,
      combinedReceipts.length,
      deliveryMatches,
      rxWorkItemCount,
    ]
  );

  const runStatusLookup = useCallback(
    async (query) => {
      const q = String(query || statusQuery || "").trim();
      if (!q) {
        onNotify?.("Enter an Rx number, bag barcode, or Kroll patient ID.", "warning");
        return [];
      }
      setBusy(true);
      setStatusQuery(q);
      try {
        let remote = null;
        if (accessToken) {
          try {
            remote = await lookupRxStatus(q, accessToken);
          } catch {
            remote = null;
          }
        }
        const localHits = await searchRxWorkItems(q, 25);
        const localRows = localHits.map(({ item }) => ({
          source: "local",
          rxNumber: item.rxNumber,
          patientName: item.patientName,
          drugName: item.drugName,
          stage: item.stage,
          krollPatientId: item.krollPatientId,
          bagBarcode: item.bagBarcode,
          copay: item.copay,
          updatedAt: item.updatedAt,
        }));
        const remoteRows = remote
          ? [
              {
                source: "kroll",
                rxNumber: remote.rxNumber || remote.number,
                patientName: remote.patientName || remote.patient,
                drugName: remote.drugName || remote.description,
                stage: remote.stage || remote.status,
                krollPatientId: remote.krollPatientId || remote.patientId,
                bagBarcode: remote.bagBarcode || remote.barcode,
                copay: remote.copay ?? remote.totalCopay,
                updatedAt: remote.updatedAt || remote.lastSync,
              },
            ]
          : [];
        const merged = [...remoteRows, ...localRows];
        setStatusResults(merged);
        setStatusSource(remote ? "Kroll transmit + local cache" : "Local cache (transmit offline)");
        if (merged.length === 0) {
          onNotify?.("No prescription found for that query.", "warning");
        }
        return merged;
      } finally {
        setBusy(false);
      }
    },
    [accessToken, onNotify, statusQuery]
  );

  const postPaymentRow = useCallback(
    async (row) => {
      if (!row?.id) return;
      if (!accessToken) {
        onNotify?.("Sign in required to post Rx payments.", "error");
        return;
      }
      setBusy(true);
      try {
        await postRxPayment(
          {
            paymentId: row.id,
            invoiceNumber: row.invoiceNumber,
            pickupId: row.pickupId,
            rxCopay: row.rxCopay,
            otcTotal: row.otcTotal,
            payMethod: row.payMethod,
            tillNumber: row.tillNumber,
            customerAccount: row.customerAccount,
            krollPatientId: row.krollPatientId,
            rxNumbers: row.rxNumbers,
          },
          accessToken
        );
        await updateRxPaymentRow(row.id, {
          status: RX_PAYMENT_STATUS.POSTED,
          postedAt: Date.now(),
          errorMessage: null,
        });
        logActivity?.("pos", "Rx payment posted to Kroll", {
          paymentId: row.id,
          invoiceNumber: row.invoiceNumber,
        });
        void logAccessEvent(
          logActivity,
          "rx_transaction",
          "Rx payment posted to Kroll",
          {
            rxLinked: true,
            paymentId: row.id,
            invoiceNumber: row.invoiceNumber,
            pickupId: row.pickupId,
            rxCopay: row.rxCopay,
          },
          accessLogContext
        );
        onNotify?.("Rx payment posted to Kroll.", "success");
        await refresh();
      } catch (cause) {
        await updateRxPaymentRow(row.id, {
          status: RX_PAYMENT_STATUS.FAILED,
          errorMessage: cause?.message || "Post failed",
        });
        onNotify?.(cause?.message || "Rx payment post failed.", "error");
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [accessLogContext, accessToken, logActivity, onNotify, refresh]
  );

  const postAllPendingPayments = useCallback(async () => {
    const pending = await loadRxPaymentQueue();
    const rows = pending.filter((r) => r.status === RX_PAYMENT_STATUS.PENDING);
    for (const row of rows) {
      await postPaymentRow(row);
    }
  }, [postPaymentRow]);

  const requestPickupSync = useCallback(async () => {
    setBusy(true);
    try {
      if (accessToken) {
        try {
          await syncPosPickups(accessToken);
        } catch (cause) {
          onNotify?.(cause?.message || "Pickup sync request failed.", "warning");
        }
      }
      await reloadPickups();
      await refreshHealth();
      onNotify?.("Pickup queue refreshed.", "success");
      logActivity?.("pos", "Rx pickup sync", { count: pickups.length });
    } finally {
      setBusy(false);
    }
  }, [accessToken, logActivity, onNotify, pickups.length, refreshHealth, reloadPickups]);

  const createDeliveryMatch = useCallback(
    async (draft) => {
      setBusy(true);
      try {
        await addDeliveryMatchDraft(draft);
        onNotify?.("Delivery match saved.", "success");
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [onNotify, refresh]
  );

  const markDeliveryMatched = useCallback(
    async (id) => {
      setBusy(true);
      try {
        await updateDeliveryMatch(id, {
          status: RX_DELIVERY_MATCH_STATUS.MATCHED,
          matchedAt: Date.now(),
        });
        await refresh();
        onNotify?.("Delivery matched.", "success");
      } finally {
        setBusy(false);
      }
    },
    [onNotify, refresh]
  );

  return {
    loading,
    busy,
    kroll,
    health,
    pickupSyncOn,
    pickups,
    pickupsLoading,
    paymentQueue,
    pendingPayments,
    deliveryMatches,
    combinedReceipts,
    accountCustomers,
    customers,
    stats,
    statusQuery,
    setStatusQuery,
    statusResults,
    statusSource,
    refresh,
    refreshHealth,
    reloadPickups,
    requestPickupSync,
    runStatusLookup,
    postPaymentRow,
    postAllPendingPayments,
    createDeliveryMatch,
    markDeliveryMatched,
  };
}
