import React, { createContext, useCallback, useMemo } from "react";
import { activityAppend } from "./lib/clarityIndexedDb";
import { isPosPharmacyAuditEnabled } from "./lib/apiConfig";
import { redactSensitivePaymentFields } from "./lib/receipt/paymentReceiptRules";
import { recordDurableAuditEvent } from "./services/auditApi";

export const PosAppDataContext = createContext(null);

export function PosAppDataProvider({ children }) {
  const logActivity = useCallback(async (category, message, detail = {}, options = {}) => {
    const safeDetail =
      detail && typeof detail === "object"
        ? redactSensitivePaymentFields(detail)
        : { value: detail };
    const row = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      ts: Date.now(),
      category,
      message,
      detail: safeDetail,
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
