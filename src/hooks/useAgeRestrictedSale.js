import { useCallback, useMemo, useState } from "react";
import { logAccessEvent } from "../lib/access/posAccessLog";
import { logImmutableAudit } from "../lib/audit/posImmutableAudit";
import {
  buildAgeVerificationRecord,
  cartLineWithAgeRestriction,
  isAgeRestrictedItem,
  mergeCartLineWithRestriction,
  missingAgeVerifications,
  normalizeAgeRestrictionClass,
  resolveMinimumPurchaseAge,
  resolveAgeRestrictionClass,
  summarizeAgeComplianceForSale,
  verifyPurchaserAge,
} from "../lib/compliance/ageRestrictedProducts";
import { loadPosAgeComplianceConfig } from "../lib/compliance/posAgeComplianceConfig";

export function useAgeRestrictedSale({
  logActivity,
  accessLogContext,
  tillNumber,
  operatorId,
  managerOverrideActive,
  onNotify,
} = {}) {
  const [ageConfig, setAgeConfig] = useState(() => loadPosAgeComplianceConfig());
  const [verifications, setVerifications] = useState({});
  const [pendingItem, setPendingItem] = useState(null);

  const refreshAgeConfig = useCallback(() => {
    setAgeConfig(loadPosAgeComplianceConfig());
  }, []);

  const restrictedOnCart = useCallback(
    (cart) => missingAgeVerifications(cart, verifications, ageConfig),
    [ageConfig, verifications]
  );

  const pendingClassId = pendingItem ? resolveAgeRestrictionClass(pendingItem) : null;
  const pendingMinAge = pendingClassId
    ? resolveMinimumPurchaseAge(pendingClassId, ageConfig)
    : 0;

  const clearVerifications = useCallback(() => {
    setVerifications({});
    setPendingItem(null);
  }, []);

  const recordVerification = useCallback(
    async ({ classId, purchaserAge, managerOverride = false, method = "dob" }) => {
      const normalized = normalizeAgeRestrictionClass(classId);
      const record = buildAgeVerificationRecord({
        classId: normalized,
        purchaserAge,
        managerOverride,
        method,
        operatorId,
        tillNumber,
      });
      setVerifications((prev) => ({ ...prev, [normalized]: record }));
      if (logActivity) {
        await logAccessEvent(
          logActivity,
          "age_verification",
          managerOverride
            ? "Age verification (manager override)"
            : "Age verification passed",
          {
            classId: normalized,
            purchaserAge,
            managerOverride,
            method,
            minAge: resolveMinimumPurchaseAge(normalized, ageConfig),
          },
          accessLogContext
        );
      }
    },
    [accessLogContext, ageConfig, logActivity, operatorId, tillNumber]
  );

  const cancelPending = useCallback(() => {
    setPendingItem(null);
  }, []);

  const submitDobVerification = useCallback(
    async (dateOfBirth) => {
      if (!pendingClassId) return { ok: false, reason: "No item awaiting verification." };
      const result = verifyPurchaserAge(dateOfBirth, pendingClassId, ageConfig);
      if (!result.ok) {
        onNotify?.(result.reason || "Age verification failed.", "warning");
        return result;
      }
      await recordVerification({
        classId: pendingClassId,
        purchaserAge: result.age,
        managerOverride: false,
      });
      return { ok: true, age: result.age };
    },
    [ageConfig, onNotify, pendingClassId, recordVerification]
  );

  const submitManagerOverride = useCallback(
    async (reason) => {
      if (!pendingClassId) return;
      if (!managerOverrideActive) {
        onNotify?.("Manager override must be active in the header.", "warning");
        return;
      }
      const trimmed = String(reason || "").trim();
      if (!trimmed) {
        onNotify?.("Enter a reason for the manager override.", "warning");
        return;
      }
      await recordVerification({
        classId: pendingClassId,
        managerOverride: true,
        method: "manager_override",
        purchaserAge: null,
      });
      if (logActivity) {
        await logImmutableAudit(logActivity, {
          user: operatorId || "unknown",
          action: "manager_override",
          terminal: tillNumber,
          reason: trimmed,
          detail: { context: "age_verification", classId: pendingClassId },
        });
      }
      onNotify?.("Manager override recorded for age-restricted sale.", "info");
    },
    [
      accessLogContext,
      logActivity,
      managerOverrideActive,
      onNotify,
      operatorId,
      pendingClassId,
      recordVerification,
      tillNumber,
    ]
  );

  /**
   * Returns true if item was added (or queued and caller should wait for modal).
   * When enforcement is off, adds immediately.
   */
  const guardAddToCart = useCallback(
    (item, addLine) => {
      if (!ageConfig.enforcementEnabled || !isAgeRestrictedItem(item)) {
        addLine(cartLineWithAgeRestriction(item));
        return { added: true };
      }
      const classId = resolveAgeRestrictionClass(item);
      if (!ageConfig.enabledClasses.includes(classId)) {
        addLine(cartLineWithAgeRestriction(item));
        return { added: true };
      }
      if (verifications[classId]?.status === "verified") {
        addLine(cartLineWithAgeRestriction(item));
        return { added: true };
      }
      setPendingItem(item);
      return { added: false, pending: true, classId };
    },
    [ageConfig, verifications]
  );

  const completePendingAdd = useCallback(
    (addLine) => {
      if (!pendingItem) return false;
      const line = cartLineWithAgeRestriction(pendingItem);
      addLine(line);
      setPendingItem(null);
      return true;
    },
    [pendingItem]
  );

  const assertCheckoutCompliance = useCallback(
    (cart) => {
      if (!ageConfig.enforcementEnabled) return { ok: true };
      const missing = restrictedOnCart(cart);
      if (!missing.length) return { ok: true };
      return {
        ok: false,
        message: `Age verification required: ${missing.map((id) => id).join(", ")}.`,
        missing,
      };
    },
    [ageConfig.enforcementEnabled, restrictedOnCart]
  );

  const logControlledSaleIfNeeded = useCallback(
    async (cart) => {
      const summary = summarizeAgeComplianceForSale(cart, verifications, ageConfig);
      if (!summary.restrictedClasses.length || !logActivity) return;
      await logImmutableAudit(logActivity, {
        user: operatorId || "unknown",
        action: "controlled_item_sale",
        terminal: tillNumber,
        newValue: summary.restrictedClasses.join(", "),
        reason: "age_restricted_sale",
        detail: summary,
      });
    },
    [ageConfig, logActivity, operatorId, tillNumber, verifications]
  );

  const ageComplianceBanner = useMemo(() => {
    if (!ageConfig.enforcementEnabled) return null;
    return `Store minimum age ${ageConfig.storeMinimumAge}+ for restricted classes enabled on this till.`;
  }, [ageConfig]);

  return {
    ageConfig,
    refreshAgeConfig,
    setAgeConfig,
    verifications,
    pendingItem,
    pendingClassId,
    pendingMinAge,
    clearVerifications,
    guardAddToCart,
    completePendingAdd,
    cancelPending,
    submitDobVerification,
    submitManagerOverride,
    assertCheckoutCompliance,
    restrictedOnCart,
    logControlledSaleIfNeeded,
    mergeCartLineWithRestriction,
    ageComplianceBanner,
  };
}
