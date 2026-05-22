import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../AuthContext";
import { closeActiveShift, ensureOpenShift, getActiveShift } from "../lib/posShift";
import { clearSuspendedSale, loadSuspendedSale } from "../lib/posSuspendedSale";
import { loadSelectedTillNumber, POS_TILL_OPTIONS, saveSelectedTillNumber } from "../lib/posTill";

const PosTillContext = createContext(null);

export function PosTillProvider({ children }) {
  const { user } = useAuth();
  const [selectedTillNumber, setSelectedTillNumberState] = useState(loadSelectedTillNumber);
  const [shift, setShift] = useState(() => getActiveShift());
  const [suspendedSale, setSuspendedSale] = useState(() => loadSuspendedSale());
  const [lastCompletedSale, setLastCompletedSale] = useState(null);
  const [managerOverrideActive, setManagerOverrideActive] = useState(false);
  const [headerAlerts, setHeaderAlerts] = useState([]);
  const tillActionsRef = useRef({});

  useEffect(() => {
    saveSelectedTillNumber(selectedTillNumber);
  }, [selectedTillNumber]);

  useEffect(() => {
    const nextShift = ensureOpenShift({
      cashierId: user?.id || user?.username || "",
      tillNumber: selectedTillNumber,
    });
    setShift(nextShift);
  }, [selectedTillNumber, user?.id, user?.username]);

  const setSelectedTillNumber = useCallback((value) => {
    const parsed = Number(value);
    if (!POS_TILL_OPTIONS.includes(parsed)) return;
    setSelectedTillNumberState(parsed);
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
    setSuspendedSale(loadSuspendedSale());
  }, []);

  const clearSuspended = useCallback(() => {
    clearSuspendedSale();
    setSuspendedSale(null);
  }, []);

  const closeShift = useCallback(() => {
    const closed = closeActiveShift();
    setShift(closed);
    return closed;
  }, []);

  const activateManagerOverride = useCallback((minutes = 5) => {
    setManagerOverrideActive(true);
    const timer = setTimeout(() => setManagerOverrideActive(false), minutes * 60_000);
    return () => clearTimeout(timer);
  }, []);

  const value = useMemo(
    () => ({
      selectedTillNumber,
      setSelectedTillNumber,
      shift,
      closeShift,
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
      shift,
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
