/**
 * POS access log — sensitive actions for compliance review (Reports → Access logs).
 * Events are stored in the local activities store via logActivity / logAccessEvent.
 * Must-log events are also appended to the immutable audit store (`posImmutableAudit.js`).
 */

import { logImmutableAudit } from "../audit/posImmutableAudit";

export const ACCESS_LOG_TYPES = {
  profile_view: {
    id: "profile_view",
    label: "Profile views",
    description: "Who opened a customer profile on this workstation.",
  },
  refund_override: {
    id: "refund_override",
    label: "Refund overrides",
    description: "Refunds approved with manager override.",
  },
  void: {
    id: "void",
    label: "Voids",
    description: "Line removals, cart clears, and cancelled in-progress sales.",
  },
  discount_override: {
    id: "discount_override",
    label: "Discount overrides",
    description: "Cart or line discounts and manager price overrides.",
  },
  rx_transaction: {
    id: "rx_transaction",
    label: "Rx-linked transactions",
    description: "Pickup attach, Rx copay charges, and Rx payment posts.",
  },
  age_verification: {
    id: "age_verification",
    label: "Age verification",
    description: "DOB checks and manager overrides for age-restricted items (nicotine, lottery, alcohol, etc.).",
  },
};

export const ACCESS_LOG_TYPE_ORDER = Object.keys(ACCESS_LOG_TYPES);

const MESSAGE_PATTERNS = [
  { type: "profile_view", re: /customer profile viewed/i },
  { type: "refund_override", re: /refund.*override|override.*refund/i },
  { type: "void", re: /sale line voided|sale voided|sale suspended|sale resumed|card payment cancelled/i },
  { type: "discount_override", re: /price override|line discount override|cart discount override/i },
  {
    type: "rx_transaction",
    re: /rx (pickup|payment|attached|linked)|pickup attached|rx-linked|rx copay/i,
  },
  { type: "age_verification", re: /age verification/i },
];

/** @returns {string|null} ACCESS_LOG_TYPES key */
export function classifyAccessLogActivity(activity) {
  const detail = activity?.detail;
  if (detail && typeof detail === "object" && detail.accessLogType) {
    const key = String(detail.accessLogType);
    return ACCESS_LOG_TYPES[key] ? key : null;
  }
  const message = String(activity?.message || "");
  for (const row of MESSAGE_PATTERNS) {
    if (row.re.test(message)) return row.type;
  }
  if (detail && typeof detail === "object") {
    if (detail.pickupId || detail.rxLinked) return "rx_transaction";
    if (detail.managerOverride && /refund/i.test(message)) return "refund_override";
    if (detail.voidKind) return "void";
    if (detail.discountKind || detail.action === "sales.price_override") return "discount_override";
    if (detail.customerId && /profile|customer/i.test(message)) return "profile_view";
  }
  return null;
}

export function buildAccessLogContext(context = {}) {
  return {
    tillNumber: context.tillNumber ?? null,
    operatorId: context.operatorId ?? null,
    operatorRole: context.activeRole ?? context.operatorRole ?? null,
    operatorName: context.operatorName ?? null,
  };
}

/**
 * Log a refund approved under manager override (call from refund/return UI).
 */
export async function logAccessRefundOverride(logActivity, detail, context, logProtectedPosActionFn) {
  if (!logActivity) return;
  if (logProtectedPosActionFn) {
    await logProtectedPosActionFn(
      logActivity,
      "sales.refund_override",
      "Refund override",
      { accessLogType: "refund_override", ...detail },
      context
    );
  }
  await logAccessEvent(logActivity, "refund_override", "Refund override", detail, context);
}

/** Log a standard refund (no manager override). */
export async function logAccessRefund(logActivity, detail, context) {
  const payload = {
    accessLogType: "refund_override",
    refundKind: "standard",
    ...buildAccessLogContext(context),
    ...detail,
  };
  await logActivity("pos.access", "Refund", payload);
  await logImmutableAudit(logActivity, {
    user: context.operatorId || context.operatorName,
    action: "refund",
    terminal: context.tillNumber,
    oldValue: detail.invoiceNumber ?? null,
    newValue: detail.amount ?? detail.refundAmount ?? null,
    reason: detail.reason || null,
    detail: payload,
  });
}

/**
 * Append a categorized access log row (category `pos.access`).
 */
export async function logAccessEvent(logActivity, accessLogType, message, detail = {}, context = {}) {
  if (!logActivity || !ACCESS_LOG_TYPES[accessLogType]) return;
  const payload = {
    accessLogType,
    ...buildAccessLogContext(context),
    ...detail,
  };
  await logActivity("pos.access", message, payload);

  const ctx = buildAccessLogContext(context);
  const user = ctx.operatorId || ctx.operatorName;
  const terminal = ctx.tillNumber;

  if (accessLogType === "void") {
    await logImmutableAudit(logActivity, {
      user,
      action: "void",
      terminal,
      oldValue: detail.lineTotal ?? detail.lineCount ?? detail.pickupId ?? null,
      newValue: null,
      reason: detail.voidKind || message,
      detail: payload,
    });
  } else if (accessLogType === "discount_override" && detail.discountKind === "price") {
    await logImmutableAudit(logActivity, {
      user,
      action: "price_override",
      terminal,
      oldValue: detail.priorPrice ?? null,
      newValue: detail.newPrice ?? null,
      reason: detail.managerOverride ? "manager_override" : null,
      detail: payload,
    });
  } else if (accessLogType === "refund_override" && detail.refundKind !== "standard") {
    await logImmutableAudit(logActivity, {
      user,
      action: "refund_override",
      terminal,
      oldValue: detail.invoiceNumber ?? null,
      newValue: detail.amount ?? detail.refundAmount ?? null,
      reason: detail.reason || "manager_override",
      detail: payload,
    });
  }
}

export function filterAccessLogActivities(activities, { type = "all", query, limit = 150 } = {}) {
  let rows = (activities || [])
    .map((row) => ({ ...row, accessLogType: classifyAccessLogActivity(row) }))
    .filter((row) => row.accessLogType);

  if (type && type !== "all") {
    rows = rows.filter((row) => row.accessLogType === type);
  }
  if (query?.trim()) {
    const q = query.trim().toLowerCase();
    rows = rows.filter((row) => {
      const label = ACCESS_LOG_TYPES[row.accessLogType]?.label || "";
      return (
        label.toLowerCase().includes(q) ||
        String(row.message || "").toLowerCase().includes(q) ||
        JSON.stringify(row.detail || {}).toLowerCase().includes(q)
      );
    });
  }
  return rows.slice(0, limit);
}
