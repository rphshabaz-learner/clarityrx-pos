import { classifyAccessLogActivity } from "../access/posAccessLog";
import { roleBypassesManagerOverride } from "../posPermissions";
import { isControlledSaleItem } from "../audit/posImmutableAudit";
import {
  aggregateCashReconciliation,
  salesForBusinessDate,
  salesForTill,
} from "../reporting/reportAggregates";
import { todayBusinessDate } from "../reporting/businessDate";
import { DEFAULT_POS_WARNING_CONFIG } from "./posWarningConfig";

export const POS_REALTIME_WARNING_IDS = {
  refundThreshold: "warn-refund-threshold",
  multipleVoids: "warn-multiple-voids",
  controlledPharmacist: "warn-controlled-pharmacist",
  sessionTimeout: "warn-session-timeout",
  tillVariance: "warn-till-variance",
  priceOverrideRange: "warn-price-override-range",
};

const PHARMACIST_ROLES = new Set(["pharmacist", "relief_pharmacist"]);

function warningMessage(text) {
  const trimmed = String(text || "").trim();
  return trimmed.startsWith("⚠") ? trimmed : `⚠ ${trimmed}`;
}

function withinLookback(ts, lookbackMinutes, now = Date.now()) {
  const at = Number(ts) || 0;
  if (!at) return false;
  return now - at <= lookbackMinutes * 60 * 1000;
}

function refundAmountFromRow(row) {
  const detail = row?.detail;
  if (detail && typeof detail === "object") {
    const amount = Number(detail.amount ?? detail.refundAmount ?? detail.newValue);
    if (Number.isFinite(amount)) return Math.abs(amount);
  }
  const newValue = Number(row?.newValue);
  if (Number.isFinite(newValue)) return Math.abs(newValue);
  return 0;
}

export function countRecentVoids(activities, { tillNumber, lookbackMinutes, now = Date.now() }) {
  const till = Number(tillNumber);
  let count = 0;
  (activities || []).forEach((row) => {
    if (!withinLookback(row.ts, lookbackMinutes, now)) return;
    if (classifyAccessLogActivity(row) !== "void") return;
    const rowTill = Number(row.detail?.tillNumber);
    if (Number.isFinite(till) && Number.isFinite(rowTill) && rowTill !== till) return;
    count += 1;
  });
  return count;
}

export function sumRecentRefunds(activities, immutableAudit, { tillNumber, lookbackMinutes, now = Date.now() }) {
  const till = Number(tillNumber);
  let total = 0;

  (activities || []).forEach((row) => {
    if (!withinLookback(row.ts, lookbackMinutes, now)) return;
    const type = classifyAccessLogActivity(row);
    if (type !== "refund_override") return;
    const rowTill = Number(row.detail?.tillNumber);
    if (Number.isFinite(till) && Number.isFinite(rowTill) && rowTill !== till) return;
    total += refundAmountFromRow(row);
  });

  (immutableAudit || []).forEach((row) => {
    if (!withinLookback(row.timestamp ?? row.ts, lookbackMinutes, now)) return;
    const action = String(row.action || "");
    if (action !== "refund" && action !== "refund_override") return;
    const terminal = Number(row.terminal);
    if (Number.isFinite(till) && Number.isFinite(terminal) && terminal !== till) return;
    total += refundAmountFromRow(row);
  });

  return Number(total.toFixed(2));
}

export function cartHasControlledProduct(cart) {
  return (cart || []).some((line) => isControlledSaleItem(line));
}

export function requiresPharmacistForControlled(activeRole, managerOverrideActive) {
  if (PHARMACIST_ROLES.has(activeRole)) return false;
  if (managerOverrideActive) return false;
  return true;
}

export function findPriceOverrideRangeIssue(cart, catalogBySku, config, { activeRole, managerOverrideActive }) {
  if (roleBypassesManagerOverride(activeRole) || managerOverrideActive) return null;
  const maxDown = config.priceOverrideMaxPercentDown;
  const maxUp = config.priceOverrideMaxPercentUp;

  for (const line of cart || []) {
    const sku = String(line.sku || "").trim().toLowerCase();
    if (!sku) continue;
    const catalog = catalogBySku.get(sku);
    const catalogPrice = Number(catalog?.price);
    const linePrice = Number(line.price);
    if (!Number.isFinite(catalogPrice) || catalogPrice <= 0 || !Number.isFinite(linePrice)) continue;
    if (linePrice === catalogPrice) continue;
    const pct = ((linePrice - catalogPrice) / catalogPrice) * 100;
    if (pct < -maxDown || pct > maxUp) {
      return {
        sku: line.sku,
        name: line.name || line.sku,
        catalogPrice,
        linePrice,
        pct: Number(pct.toFixed(1)),
      };
    }
  }
  return null;
}

export function computeExpectedDrawerCash(sales, tillNumber, businessDate = todayBusinessDate()) {
  const tillSales = salesForTill(sales || [], tillNumber).filter(
    (row) => row.businessDate === businessDate
  );
  const recon = aggregateCashReconciliation(tillSales, businessDate);
  return Number(recon.expectedDrawer.toFixed(2));
}

export function evaluateTillVariance(drawerAudit, expectedDrawer, config) {
  if (!drawerAudit || drawerAudit.countedDrawer == null) return null;
  const counted = Number(drawerAudit.countedDrawer);
  const expected = Number(expectedDrawer);
  if (!Number.isFinite(counted) || !Number.isFinite(expected)) return null;
  const opening = Number(drawerAudit.openingCash) || 0;
  const variance = Number((counted - opening - expected).toFixed(2));
  if (Math.abs(variance) < config.tillVarianceThreshold) return null;
  return { counted, expected, opening, variance };
}

/**
 * @typedef {{ id: string, message: string, tone?: string }} PosRealtimeWarning
 */

/**
 * @param {object} input
 * @returns {PosRealtimeWarning[]}
 */
export function evaluatePosRealTimeWarnings(input = {}) {
  const config = { ...DEFAULT_POS_WARNING_CONFIG, ...(input.config || {}) };
  const now = input.now ?? Date.now();
  const warnings = [];
  const {
    cart = [],
    catalogItems = [],
    activities = [],
    immutableAudit = [],
    sales = [],
    tillNumber,
    activeRole,
    managerOverrideActive = false,
    sessionWarning = false,
    sessionTimeoutMinutes,
    drawerAudit = null,
    pendingRefundAmount = null,
  } = input;

  const catalogBySku = new Map();
  (catalogItems || []).forEach((item) => {
    const sku = String(item.sku || "").trim().toLowerCase();
    if (sku) catalogBySku.set(sku, item);
  });

  const refundTotal = sumRecentRefunds(activities, immutableAudit, {
    tillNumber,
    lookbackMinutes: config.refundLookbackMinutes,
    now,
  });
  const pendingRefund = Number(pendingRefundAmount);
  const refundExposure =
    refundTotal + (Number.isFinite(pendingRefund) && pendingRefund > 0 ? pendingRefund : 0);

  if (refundExposure >= config.refundManagerThreshold) {
    warnings.push({
      id: POS_REALTIME_WARNING_IDS.refundThreshold,
      tone: "warn",
      message: warningMessage("Refund exceeds manager threshold"),
    });
  }

  const voidCount = countRecentVoids(activities, {
    tillNumber,
    lookbackMinutes: config.voidLookbackMinutes,
    now,
  });
  if (voidCount >= config.voidCountThreshold) {
    warnings.push({
      id: POS_REALTIME_WARNING_IDS.multipleVoids,
      tone: "warn",
      message: warningMessage("Multiple voids detected"),
    });
  }

  if (cartHasControlledProduct(cart) && requiresPharmacistForControlled(activeRole, managerOverrideActive)) {
    warnings.push({
      id: POS_REALTIME_WARNING_IDS.controlledPharmacist,
      tone: "warn",
      message: warningMessage("Controlled product requires pharmacist"),
    });
  }

  if (sessionWarning) {
    const minutes =
      Number.isFinite(Number(sessionTimeoutMinutes)) && Number(sessionTimeoutMinutes) > 0
        ? Number(sessionTimeoutMinutes)
        : null;
    warnings.push({
      id: POS_REALTIME_WARNING_IDS.sessionTimeout,
      tone: "warn",
      message: warningMessage(
        minutes
          ? `Session timeout approaching (${minutes} min idle limit)`
          : "Session timeout approaching"
      ),
    });
  }

  const expectedDrawer = computeExpectedDrawerCash(sales, tillNumber);
  const variance = evaluateTillVariance(drawerAudit, expectedDrawer, config);
  if (variance) {
    const sign = variance.variance > 0 ? "+" : "";
    warnings.push({
      id: POS_REALTIME_WARNING_IDS.tillVariance,
      tone: "warn",
      message: warningMessage(
        `Till variance detected (${sign}$${variance.variance.toFixed(2)} vs expected)`
      ),
    });
  }

  const priceIssue = findPriceOverrideRangeIssue(cart, catalogBySku, config, {
    activeRole,
    managerOverrideActive,
  });
  if (priceIssue) {
    warnings.push({
      id: POS_REALTIME_WARNING_IDS.priceOverrideRange,
      tone: "warn",
      message: warningMessage("Price override outside allowed range"),
    });
  }

  return warnings;
}

export function loadDrawerCountAudit(tillNumber) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`clarityrx.pos.drawerCount.${tillNumber}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDrawerCountAudit(tillNumber, { countedDrawer, openingCash = 0, expectedDrawer }) {
  if (typeof window === "undefined") return null;
  const payload = {
    countedDrawer: Number(countedDrawer),
    openingCash: Number(openingCash) || 0,
    expectedDrawer: Number(expectedDrawer),
    at: Date.now(),
  };
  window.localStorage.setItem(`clarityrx.pos.drawerCount.${tillNumber}`, JSON.stringify(payload));
  return payload;
}
