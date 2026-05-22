import { scopedStorageKey } from "../../session/scopedStorage";
import { runLocalRetentionRules } from "./retentionRules";

export const POS_PRIVACY_CONFIG_STORAGE_KEY = "clarityrx-pos-privacy-v1";

export const DEFAULT_POS_PRIVACY_CONFIG = {
  noticeVersion: "2026-01",
  noticeUrl: "",
  /** Delete local completed sales and audit rows older than this many days (0 = disabled). */
  localRetentionDays: 365,
  /** Financial / tax reporting rows — typically longer than receipt detail. */
  financialRetentionDays: 2555,
  /** Strip receipt contact, line detail, and card blocks from older sales (financial totals kept). */
  receiptArchiveRetentionDays: 90,
  /** Purge loyalty points/history on inactive or dormant loyalty accounts. */
  loyaltyInactiveRetentionDays: 730,
};

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function normalizeDays(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

export function loadPosPrivacyConfig() {
  const raw = localStorage.getItem(scopedStorageKey(POS_PRIVACY_CONFIG_STORAGE_KEY));
  const parsed = safeParse(raw, null);
  const legacyDays = normalizeDays(parsed?.localRetentionDays, DEFAULT_POS_PRIVACY_CONFIG.localRetentionDays);
  const financialDays = normalizeDays(
    parsed?.financialRetentionDays ?? parsed?.localRetentionDays,
    legacyDays
  );
  return {
    noticeVersion:
      typeof parsed?.noticeVersion === "string" && parsed.noticeVersion.trim()
        ? parsed.noticeVersion.trim()
        : DEFAULT_POS_PRIVACY_CONFIG.noticeVersion,
    noticeUrl: typeof parsed?.noticeUrl === "string" ? parsed.noticeUrl.trim() : "",
    localRetentionDays: legacyDays,
    financialRetentionDays: financialDays,
    receiptArchiveRetentionDays: normalizeDays(
      parsed?.receiptArchiveRetentionDays,
      DEFAULT_POS_PRIVACY_CONFIG.receiptArchiveRetentionDays
    ),
    loyaltyInactiveRetentionDays: normalizeDays(
      parsed?.loyaltyInactiveRetentionDays,
      DEFAULT_POS_PRIVACY_CONFIG.loyaltyInactiveRetentionDays
    ),
  };
}

export function savePosPrivacyConfig(config) {
  const legacyDays = normalizeDays(config?.localRetentionDays, DEFAULT_POS_PRIVACY_CONFIG.localRetentionDays);
  const financialDays = normalizeDays(
    config?.financialRetentionDays ?? config?.localRetentionDays,
    legacyDays
  );
  const payload = {
    noticeVersion: String(config?.noticeVersion || DEFAULT_POS_PRIVACY_CONFIG.noticeVersion).trim(),
    noticeUrl: String(config?.noticeUrl || "").trim(),
    localRetentionDays: legacyDays,
    financialRetentionDays: financialDays,
    receiptArchiveRetentionDays: normalizeDays(
      config?.receiptArchiveRetentionDays,
      DEFAULT_POS_PRIVACY_CONFIG.receiptArchiveRetentionDays
    ),
    loyaltyInactiveRetentionDays: normalizeDays(
      config?.loyaltyInactiveRetentionDays,
      DEFAULT_POS_PRIVACY_CONFIG.loyaltyInactiveRetentionDays
    ),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(scopedStorageKey(POS_PRIVACY_CONFIG_STORAGE_KEY), JSON.stringify(payload));
  return payload;
}

export async function runPosPrivacyRetentionPurge(config = loadPosPrivacyConfig()) {
  const financialDays = Number(config?.financialRetentionDays ?? config?.localRetentionDays) || 0;
  if (financialDays <= 0) {
    return {
      salesRemoved: 0,
      activitiesRemoved: 0,
      receiptsSecured: 0,
      loyaltyCustomersPurged: 0,
      skipped: true,
      reason: "Financial retention disabled (0 days).",
    };
  }
  return runLocalRetentionRules(config);
}
