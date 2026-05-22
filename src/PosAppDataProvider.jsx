import React, { createContext, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { activityAppend } from "./lib/clarityIndexedDb";
import { recordDurableAuditEvent } from "./services/auditApi";
import { sessionContextForAudit } from "./session/workspaceSession";

export const PosAppDataContext = createContext(null);

export function PosAppDataProvider({ children }) {
  const { accessToken, user, sessionContext } = useAuth();

  const logActivity = useCallback(
    async (category, message, detail = {}, options = {}) => {
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
      if (accessToken && options.auditEvent) {
        try {
          await recordDurableAuditEvent(accessToken, {
            userId: user?.id || null,
            ...options.auditEvent,
            metadata: {
              ...(options.auditEvent.metadata || {}),
              sessionContext: sessionContextForAudit(sessionContext),
            },
          });
        } catch (e) {
          console.warn("durable audit", e.message || e);
        }
      }
    },
    [accessToken, sessionContext, user]
  );

  const runAutosave = useCallback(async () => {}, []);

  const value = useMemo(() => ({ logActivity, runAutosave }), [logActivity, runAutosave]);

  return <PosAppDataContext.Provider value={value}>{children}</PosAppDataContext.Provider>;
}
