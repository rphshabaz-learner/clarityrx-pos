import React, { createContext, useCallback, useMemo } from "react";
import { activityAppend } from "./lib/clarityIndexedDb";
import { isPosPharmacyAuditEnabled } from "./lib/apiConfig";
import { recordDurableAuditEvent } from "./services/auditApi";

export const PosAppDataContext = createContext(null);

export function PosAppDataProvider({ children }) {
  const logActivity = useCallback(async (category, message, detail = {}, options = {}) => {
    const row = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      ts: Date.now(),
      category,
      message,
      detail: detail && typeof detail === "object" ? detail : { value: detail },
    };
    try {
      await activityAppend(row);
    } catch (e) {
      console.error("logActivity", e);
    }
    if (isPosPharmacyAuditEnabled() && options.auditEvent && options.accessToken) {
      try {
        await recordDurableAuditEvent(options.accessToken, options.auditEvent);
      } catch (e) {
        console.warn("pharmacy audit transmit", e.message || e);
      }
    }
  }, []);

  const runAutosave = useCallback(async () => {}, []);

  const value = useMemo(() => ({ logActivity, runAutosave }), [logActivity, runAutosave]);

  return <PosAppDataContext.Provider value={value}>{children}</PosAppDataContext.Provider>;
}
