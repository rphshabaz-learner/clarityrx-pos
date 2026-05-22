import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../AuthContext";
import { closeActiveShift, getActiveShift, openTillShift } from "../lib/posShift";
import { clearSuspendedSale, loadSuspendedSale } from "../lib/posSuspendedSale";
import {
  getDeviceTillBindingSync,
  hydrateDeviceTillBinding,
  isDeviceTillLocked,
  resolveInitialTillNumber,
} from "../lib/posDeviceTill";
import { logImmutableAudit } from "../lib/audit/posImmutableAudit";
import { POS_TILL_OPTIONS, saveSelectedTillNumber } from "../lib/posTill";

const PosTillContext = createContext(null);

export function PosTillProvider({ children }) {
  const { user } = useAuth();
  const [deviceTillBinding, setDeviceTillBinding] = useState(getDeviceTillBindingSync);
  const [selectedTillNumber, setSelectedTillNumberState] = useState(resolveInitialTillNumber);
  const [shift, setShift] = useState(() => getActiveShift(resolveInitialTillNumber()));
  const [suspendedSale, setSuspendedSale] = useState(() => loadSuspendedSale(resolveInitialTillNumber()));
  const [lastCompletedSale, setLastCompletedSale] = useState(null);
  const [managerOverrideActive, setManagerOverrideActive] = useState(false);
  const [headerAlerts, setHeaderAlerts] = useState([]);
  const tillActionsRef = useRef({});

  useEffect(() => {
    let cancelled = false;
    hydrateDeviceTillBinding().then((binding) => {
      if (cancelled || !binding) return;
      setDeviceTillBinding(binding);
      setSelectedTillNumberState(binding.tillNumber);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isDeviceTillLocked(deviceTillBinding)) {
      saveSelectedTillNumber(selectedTillNumber);
    }
  }, [selectedTillNumber, deviceTillBinding]);

  useEffect(() => {
    setShift(getActiveShift(selectedTillNumber));
  }, [selectedTillNumber]);

  useEffect(() => {
    setSuspendedSale(loadSuspendedSale(selectedTillNumber));
  }, [selectedTillNumber]);

  const operatorId = user?.id || user?.username || "";

  const setSelectedTillNumber = useCallback(
    (value) => {
      if (isDeviceTillLocked(deviceTillBinding)) return;
      const parsed = Number(value);
      if (!POS_TILL_OPTIONS.includes(parsed)) return;
      setSelectedTillNumberState(parsed);
    },
    [deviceTillBinding]
  );

  const applyDeviceTillBinding = useCallback((binding) => {
    const normalized = binding || getDeviceTillBindingSync();
    setDeviceTillBinding(normalized);
    setSelectedTillNumberState(normalized.tillNumber);
  }, []);

  const registerTillActions = useCallback((handlers) => {
    tillActionsRef.current = handlers || {};
  }, []);

  const invokeTillAction = useCallback((name, ...args) => {
    const handler = tillActionsRef.current?.[name];
    if (typeof handler === "function") {
      return handler(...args);
    }
    return undefined;
  }, []);

  const pushHeaderAlert = useCallback((alert) => {
    const id = alert?.id || `alert-${Date.now()}`;
    setHeaderAlerts((prev) => {
      const without = prev.filter((row) => row.id !== id);
      return [{ id, tone: alert.tone || "info", message: alert.message, at: Date.now() }, ...without].slice(0, 6);
    });
    return id;
  }, []);

  const dismissHeaderAlert = useCallback((id) => {
    setHeaderAlerts((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const refreshSuspendedSale = useCallback(() => {
    setSuspendedSale(loadSuspendedSale(selectedTillNumber));
  }, [selectedTillNumber]);

  const clearSuspended = useCallback(() => {
    clearSuspendedSale(selectedTillNumber);
    setSuspendedSale(null);
  }, [selectedTillNumber]);

  const openShift = useCallback(() => {
    const prior = getActiveShift(selectedTillNumber);
    const opened = openTillShift({
      tillNumber: selectedTillNumber,
      openedBy: operatorId,
    });
    if (opened?.status === "open" && (!prior || prior.id !== opened.id)) {
      void logImmutableAudit(null, {
        user: operatorId,
        action: "till_open",
        terminal: selectedTillNumber,
        newValue: opened.id,
        detail: {
          openedBy: opened.openedBy,
          businessDate: opened.businessDate,
        },
      });
    }
    setShift(opened);
    return opened;
  }, [operatorId, selectedTillNumber]);

  const closeShift = useCallback(() => {
    const closed = closeActiveShift(selectedTillNumber, { closedBy: operatorId });
    setShift(closed);
    return closed;
  }, [operatorId, selectedTillNumber]);

  const activateManagerOverride = useCallback((minutes = 5) => {
    setManagerOverrideActive(true);
    const timer = setTimeout(() => setManagerOverrideActive(false), minutes * 60_000);
    return () => clearTimeout(timer);
  }, []);

  const value = useMemo(
    () => ({
      selectedTillNumber,
      setSelectedTillNumber,
      deviceTillBinding,
      deviceTillLocked: isDeviceTillLocked(deviceTillBinding),
      applyDeviceTillBinding,
      shift,
      openShift,
      closeShift,
      isShiftOpen: shift?.status === "open",
      suspendedSale,
      refreshSuspendedSale,
      clearSuspended,
      lastCompletedSale,
      setLastCompletedSale,
      managerOverrideActive,
      activateManagerOverride,
      headerAlerts,
      pushHeaderAlert,
      dismissHeaderAlert,
      registerTillActions,
      invokeTillAction,
    }),
    [
      selectedTillNumber,
      setSelectedTillNumber,
      deviceTillBinding,
      applyDeviceTillBinding,
      shift,
      openShift,
      closeShift,
      suspendedSale,
      refreshSuspendedSale,
      clearSuspended,
      lastCompletedSale,
      managerOverrideActive,
      activateManagerOverride,
      headerAlerts,
      pushHeaderAlert,
      dismissHeaderAlert,
      registerTillActions,
      invokeTillAction,
    ]
  );

  return <PosTillContext.Provider value={value}>{children}</PosTillContext.Provider>;
}

export function usePosTill() {
  const ctx = useContext(PosTillContext);
  if (!ctx) {
    throw new Error("usePosTill requires PosTillProvider");
  }
  return ctx;
}
