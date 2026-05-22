import { useCallback, useEffect, useRef, useState } from "react";
import { activityList, immutableAuditList, listCompletedSales } from "../lib/clarityIndexedDb";
import { todayBusinessDate } from "../lib/reporting/businessDate";
import { loadPosWarningConfig } from "../lib/warnings/posWarningConfig";
import {
  evaluatePosRealTimeWarnings,
  loadDrawerCountAudit,
} from "../lib/warnings/posRealTimeWarnings";

const POLL_MS = 20_000;

/**
 * Pushes real-time compliance warnings into the header alert strip (PosTillContext).
 */
export function usePosRealTimeWarnings({
  pushHeaderAlert,
  dismissHeaderAlert,
  cart,
  catalogItems,
  tillNumber,
  activeRole,
  managerOverrideActive,
  sessionWarning,
  sessionTimeoutMinutes,
  pendingRefundAmount = null,
  enabled = true,
}) {
  const [activities, setActivities] = useState([]);
  const [immutableAudit, setImmutableAudit] = useState([]);
  const [sales, setSales] = useState([]);
  const [drawerAudit, setDrawerAudit] = useState(() => loadDrawerCountAudit(tillNumber));
  const [warningConfig, setWarningConfig] = useState(() => loadPosWarningConfig());
  const activeIdsRef = useRef(new Set());

  const refreshDrawerAudit = useCallback(() => {
    setDrawerAudit(loadDrawerCountAudit(tillNumber));
  }, [tillNumber]);

  const refreshSources = useCallback(async () => {
    try {
      const [activityRows, auditRows, saleRows] = await Promise.all([
        activityList(300),
        immutableAuditList(200),
        listCompletedSales(),
      ]);
      setActivities(activityRows);
      setImmutableAudit(auditRows);
      setSales(saleRows);
      setWarningConfig(loadPosWarningConfig());
      refreshDrawerAudit();
    } catch {
      // Header warnings are best-effort; register flow must not break.
    }
  }, [refreshDrawerAudit]);

  useEffect(() => {
    if (!enabled) return undefined;
    refreshSources();
    const timer = setInterval(refreshSources, POLL_MS);
    return () => clearInterval(timer);
  }, [enabled, refreshSources]);

  useEffect(() => {
    refreshDrawerAudit();
  }, [refreshDrawerAudit, tillNumber]);

  useEffect(() => {
    if (!enabled || !pushHeaderAlert) return;

    const warnings = evaluatePosRealTimeWarnings({
      cart,
      catalogItems,
      activities,
      immutableAudit,
      sales,
      tillNumber,
      activeRole,
      managerOverrideActive,
      sessionWarning,
      sessionTimeoutMinutes,
      pendingRefundAmount,
      drawerAudit,
      config: warningConfig,
    });

    const nextIds = new Set(warnings.map((row) => row.id));
    activeIdsRef.current.forEach((id) => {
      if (!nextIds.has(id) && dismissHeaderAlert) dismissHeaderAlert(id);
    });
    warnings.forEach((row) => {
      pushHeaderAlert({ id: row.id, tone: row.tone || "warn", message: row.message });
    });
    activeIdsRef.current = nextIds;
  }, [
    enabled,
    cart,
    catalogItems,
    activities,
    immutableAudit,
    sales,
    tillNumber,
    activeRole,
    managerOverrideActive,
    sessionWarning,
    sessionTimeoutMinutes,
    pendingRefundAmount,
    drawerAudit,
    warningConfig,
    pushHeaderAlert,
    dismissHeaderAlert,
  ]);

  useEffect(() => {
    if (!enabled) {
      activeIdsRef.current.forEach((id) => {
        if (dismissHeaderAlert) dismissHeaderAlert(id);
      });
      activeIdsRef.current = new Set();
    }
  }, [dismissHeaderAlert, enabled]);

  return {
    refreshWarnings: refreshSources,
    refreshDrawerAudit,
    businessDate: todayBusinessDate(),
  };
}
