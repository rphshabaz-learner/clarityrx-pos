import { runLocalRetentionRules } from "./retentionRules";

/** @deprecated Use runLocalRetentionRules via runPosPrivacyRetentionPurge */
export async function purgeLocalPrivacyRetention(cutoffMs) {
  const days = Math.max(1, Math.ceil((Date.now() - cutoffMs) / 86400000));
  return runLocalRetentionRules({
    financialRetentionDays: days,
    receiptArchiveRetentionDays: 90,
    loyaltyInactiveRetentionDays: 730,
  });
}
