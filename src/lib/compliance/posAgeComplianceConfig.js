import { AGE_RESTRICTION_CLASS_OPTIONS } from "./ageRestrictedProducts";

export const POS_AGE_COMPLIANCE_STORAGE_KEY = "clarityrx-pos-age-compliance-v1";

export const DEFAULT_AGE_COMPLIANCE_CONFIG = {
  /** Minimum purchase age for classes that follow store/province rules (BC/ON typically 19). */
  storeMinimumAge: 19,
  /** When false, restricted items scan like normal OTC (not recommended). */
  enforcementEnabled: true,
  /** Block self-checkout when cart contains restricted classes. */
  blockSelfCheckout: true,
  /** Active restriction classes — all catalogued classes enabled by default. */
  enabledClasses: AGE_RESTRICTION_CLASS_OPTIONS.map((row) => row.id),
};

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

export function normalizeAgeComplianceConfig(parsed) {
  const base = { ...DEFAULT_AGE_COMPLIANCE_CONFIG, ...(parsed || {}) };
  const storeMinimumAge = Math.max(0, Math.min(99, Number(base.storeMinimumAge) || 19));
  const enabled = Array.isArray(base.enabledClasses)
    ? base.enabledClasses.filter((id) =>
        AGE_RESTRICTION_CLASS_OPTIONS.some((row) => row.id === id)
      )
    : DEFAULT_AGE_COMPLIANCE_CONFIG.enabledClasses;
  return {
    enforcementEnabled: base.enforcementEnabled !== false,
    blockSelfCheckout: base.blockSelfCheckout !== false,
    storeMinimumAge,
    enabledClasses: enabled.length ? enabled : DEFAULT_AGE_COMPLIANCE_CONFIG.enabledClasses,
  };
}

export function loadPosAgeComplianceConfig() {
  if (typeof window === "undefined") return { ...DEFAULT_AGE_COMPLIANCE_CONFIG };
  const raw = window.localStorage.getItem(POS_AGE_COMPLIANCE_STORAGE_KEY);
  return normalizeAgeComplianceConfig(safeParse(raw, {}));
}

export function savePosAgeComplianceConfig(config) {
  const normalized = normalizeAgeComplianceConfig(config);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(POS_AGE_COMPLIANCE_STORAGE_KEY, JSON.stringify(normalized));
  }
  return normalized;
}
