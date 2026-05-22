export const POS_WARNING_STORAGE_KEY = "clarityrx-pos-warning-config-v1";

export const DEFAULT_POS_WARNING_CONFIG = {
  /** Single refund or cumulative refunds in the lookback window that trigger a header warning. */
  refundManagerThreshold: 50,
  /** Minutes to sum refund activity for threshold checks. */
  refundLookbackMinutes: 60,
  /** Voids on this till in the lookback window before warning. */
  voidCountThreshold: 3,
  voidLookbackMinutes: 30,
  /** Max downward % from catalog price without supervisor / override. */
  priceOverrideMaxPercentDown: 20,
  /** Max upward % from catalog price without supervisor / override. */
  priceOverrideMaxPercentUp: 50,
  /** $ difference between counted drawer and expected cash before warning. */
  tillVarianceThreshold: 5,
};

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

export function normalizePosWarningConfig(parsed) {
  const base = { ...DEFAULT_POS_WARNING_CONFIG, ...(parsed || {}) };
  return {
    refundManagerThreshold: Math.max(0, Number(base.refundManagerThreshold) || 50),
    refundLookbackMinutes: Math.max(5, Number(base.refundLookbackMinutes) || 60),
    voidCountThreshold: Math.max(1, Number(base.voidCountThreshold) || 3),
    voidLookbackMinutes: Math.max(5, Number(base.voidLookbackMinutes) || 30),
    priceOverrideMaxPercentDown: Math.max(0, Number(base.priceOverrideMaxPercentDown) || 20),
    priceOverrideMaxPercentUp: Math.max(0, Number(base.priceOverrideMaxPercentUp) || 50),
    tillVarianceThreshold: Math.max(0, Number(base.tillVarianceThreshold) || 5),
  };
}

export function loadPosWarningConfig() {
  if (typeof window === "undefined") return { ...DEFAULT_POS_WARNING_CONFIG };
  const raw = window.localStorage.getItem(POS_WARNING_STORAGE_KEY);
  return normalizePosWarningConfig(safeParse(raw, {}));
}

export function savePosWarningConfig(config) {
  const normalized = normalizePosWarningConfig(config);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(POS_WARNING_STORAGE_KEY, JSON.stringify(normalized));
  }
  return normalized;
}
