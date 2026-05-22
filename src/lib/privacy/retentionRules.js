import { CUSTOMER_STATUS, CUSTOMER_TYPE } from "../customers/customerTypes";
import {
  listCompletedSales,
  listPosCustomers,
  purgeActivitiesBefore,
  purgeCompletedSalesBefore,
  purgeImmutableAuditBefore,
  saveCompletedSale,
  savePosCustomer,
} from "../clarityIndexedDb";
import { DEFAULT_POS_PRIVACY_CONFIG } from "./posPrivacyConfig";

/** @typedef {import('./posPrivacyConfig').PosPrivacyConfig} PosPrivacyConfig */

export function normalizeRetentionDays(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

/**
 * Resolve day-based retention settings (backward compatible with localRetentionDays).
 * @param {Partial<PosPrivacyConfig>} config
 */
export function resolveRetentionPolicy(config = {}) {
  const legacyFinancial = normalizeRetentionDays(
    config.localRetentionDays,
    DEFAULT_POS_PRIVACY_CONFIG.localRetentionDays
  );
  const financialRetentionDays = normalizeRetentionDays(
    config.financialRetentionDays,
    legacyFinancial
  );
  const receiptArchiveRetentionDays = normalizeRetentionDays(
    config.receiptArchiveRetentionDays,
    DEFAULT_POS_PRIVACY_CONFIG.receiptArchiveRetentionDays
  );
  const loyaltyInactiveRetentionDays = normalizeRetentionDays(
    config.loyaltyInactiveRetentionDays,
    DEFAULT_POS_PRIVACY_CONFIG.loyaltyInactiveRetentionDays
  );
  const now = Date.now();
  return {
    financialRetentionDays,
    receiptArchiveRetentionDays,
    loyaltyInactiveRetentionDays,
    financialCutoffMs: now - financialRetentionDays * 86400000,
    receiptArchiveCutoffMs: now - receiptArchiveRetentionDays * 86400000,
    loyaltyInactiveCutoffMs: now - loyaltyInactiveRetentionDays * 86400000,
  };
}

function customerLastActivityMs(customer) {
  const stamps = [
    customer.updatedAt,
    customer.createdAt,
    customer.loyalty?.enrolledAt,
  ];
  for (const row of customer.purchaseHistory || []) {
    if (row?.at) stamps.push(row.at);
  }
  for (const row of customer.pointsHistory || []) {
    if (row?.at) stamps.push(row.at);
  }
  const ms = stamps
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));
  return ms.length ? Math.max(...ms) : 0;
}

export function isInactiveLoyaltyCustomer(customer, loyaltyInactiveCutoffMs) {
  if (!customer) return false;
  const hasLoyalty =
    customer.type === CUSTOMER_TYPE.LOYALTY ||
    Boolean(String(customer.loyalty?.memberId || "").trim());
  if (!hasLoyalty) return false;
  if (customer.status === CUSTOMER_STATUS.INACTIVE) return true;
  return customerLastActivityMs(customer) < loyaltyInactiveCutoffMs;
}

/** Strip marketing/loyalty detail from dormant or inactive loyalty accounts (profiles remain). */
export async function purgeInactiveLoyaltyData(loyaltyInactiveCutoffMs) {
  const customers = await listPosCustomers();
  let customersUpdated = 0;
  for (const row of customers) {
    if (!isInactiveLoyaltyCustomer(row, loyaltyInactiveCutoffMs)) continue;
    const next = {
      ...row,
      loyalty: {
        memberId: "",
        pointsBalance: 0,
        tier: "standard",
        enrolledAt: null,
      },
      pointsHistory: [],
      purchaseHistory: [],
      loyaltyDataPurgedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await savePosCustomer(next);
    customersUpdated += 1;
  }
  return { customersUpdated, loyaltyInactiveCutoffMs };
}

const RECEIPT_ARCHIVE_STRIP_KEYS = [
  "receiptContact",
  "receiptDelivery",
  "cardPayment",
  "signatureImage",
  "signatureCaptured",
];

/**
 * Remove receipt-detail fields from older sales while keeping financial totals for reporting.
 */
export function secureReceiptArchiveOnSale(sale, receiptArchiveCutoffMs) {
  const chargedAt = sale?.chargedAt || 0;
  if (chargedAt >= receiptArchiveCutoffMs || sale?.receiptArchived) {
    return { sale, changed: false };
  }
  const next = { ...sale, receiptArchived: true, receiptArchivedAt: new Date().toISOString() };
  let changed = !sale.receiptArchived;
  for (const key of RECEIPT_ARCHIVE_STRIP_KEYS) {
    if (next[key] != null) {
      delete next[key];
      changed = true;
    }
  }
  if (Array.isArray(next.lines) && next.lines.length) {
    next.lines = [];
    changed = true;
  }
  return { sale: next, changed };
}

export async function secureArchivedReceipts(receiptArchiveCutoffMs) {
  const all = await listCompletedSales(0);
  let receiptsSecured = 0;
  for (const row of all) {
    const { sale, changed } = secureReceiptArchiveOnSale(row, receiptArchiveCutoffMs);
    if (!changed) continue;
    await saveCompletedSale(sale);
    receiptsSecured += 1;
  }
  return { receiptsSecured, receiptArchiveCutoffMs };
}

/**
 * Run all local retention rules: financial purge, receipt archive hardening, inactive loyalty purge.
 * @param {Partial<PosPrivacyConfig>} config
 */
export async function runLocalRetentionRules(config = {}) {
  const policy = resolveRetentionPolicy(config);
  if (policy.financialRetentionDays <= 0) {
    return {
      skipped: true,
      reason: "Financial retention disabled (0 days).",
      salesRemoved: 0,
      activitiesRemoved: 0,
      immutableAuditRemoved: 0,
      receiptsSecured: 0,
      loyaltyCustomersPurged: 0,
      policy,
    };
  }

  const salesRemoved = await purgeCompletedSalesBefore(policy.financialCutoffMs, {
    auditDeletedSales: true,
  });
  const activitiesRemoved = await purgeActivitiesBefore(policy.financialCutoffMs);
  const immutableAuditRemoved = await purgeImmutableAuditBefore(policy.financialCutoffMs);
  const { receiptsSecured } = await secureArchivedReceipts(policy.receiptArchiveCutoffMs);
  const { customersUpdated: loyaltyCustomersPurged } = await purgeInactiveLoyaltyData(
    policy.loyaltyInactiveCutoffMs
  );

  return {
    skipped: false,
    salesRemoved,
    activitiesRemoved,
    immutableAuditRemoved,
    receiptsSecured,
    loyaltyCustomersPurged,
    policy,
    cutoffMs: policy.financialCutoffMs,
  };
}
