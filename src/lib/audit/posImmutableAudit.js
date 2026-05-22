/**
 * Immutable POS audit log — append-only rows for compliance "must log" events.
 * Stored in IndexedDB (`immutable_audit`) and mirrored to `activities` (category `pos.audit`).
 */

import { immutableAuditAppend } from "../clarityIndexedDb";

/** @typedef {keyof typeof IMMUTABLE_AUDIT_ACTIONS} ImmutableAuditAction */

export const IMMUTABLE_AUDIT_ACTIONS = {
  price_override: {
    id: "price_override",
    label: "Price override",
    mustLog: true,
  },
  refund: {
    id: "refund",
    label: "Refund",
    mustLog: true,
  },
  refund_override: {
    id: "refund_override",
    label: "Refund override",
    mustLog: true,
  },
  void: {
    id: "void",
    label: "Void",
    mustLog: true,
  },
  sale_deleted: {
    id: "sale_deleted",
    label: "Deleted sale",
    mustLog: true,
  },
  manager_override: {
    id: "manager_override",
    label: "Manager override",
    mustLog: true,
  },
  controlled_item_sale: {
    id: "controlled_item_sale",
    label: "Controlled item sale",
    mustLog: true,
  },
  till_open: {
    id: "till_open",
    label: "Till open",
    mustLog: true,
  },
  cash_drop: {
    id: "cash_drop",
    label: "Cash drop",
    mustLog: true,
  },
  user_login: {
    id: "user_login",
    label: "User login",
    mustLog: true,
  },
  user_logout: {
    id: "user_logout",
    label: "User logout",
    mustLog: true,
  },
};

export const IMMUTABLE_AUDIT_ACTION_ORDER = Object.keys(IMMUTABLE_AUDIT_ACTIONS);

function nextAuditId() {
  return `aud-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function serializeValue(value) {
  if (value == null) return null;
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/**
 * @param {object} params
 * @param {string} params.user — operator id or username
 * @param {ImmutableAuditAction} params.action
 * @param {number} [params.timestamp]
 * @param {string|number|null} [params.terminal] — till / terminal id
 * @param {*} [params.oldValue]
 * @param {*} [params.newValue]
 * @param {string|null} [params.reason]
 * @param {object} [params.detail] — extra context (never PAN/CVV)
 */
export function buildImmutableAuditRow({
  user,
  action,
  timestamp = Date.now(),
  terminal = null,
  oldValue = null,
  newValue = null,
  reason = null,
  detail = {},
}) {
  const actionDef = IMMUTABLE_AUDIT_ACTIONS[action];
  if (!actionDef) {
    throw new Error(`Unknown immutable audit action: ${action}`);
  }
  return {
    id: nextAuditId(),
    user: user ? String(user) : "unknown",
    action,
    timestamp,
    terminal: terminal != null ? String(terminal) : null,
    old_value: serializeValue(oldValue),
    new_value: serializeValue(newValue),
    reason: reason ? String(reason) : null,
    detail: detail && typeof detail === "object" ? detail : {},
    immutable: true,
  };
}

export function isControlledSaleItem(item) {
  if (!item || typeof item !== "object") return false;
  return Boolean(item.controlled || item.controlledSale || item.requiresControlledSale);
}

/**
 * Append immutable audit row locally; optionally mirror to activities via logActivity.
 *
 * @param {Function|null} logActivity — PosAppDataProvider logActivity
 * @param {object} params — buildImmutableAuditRow fields
 */
export async function logImmutableAudit(logActivity, params) {
  const row = buildImmutableAuditRow(params);
  await immutableAuditAppend(row);
  if (logActivity) {
    const label = IMMUTABLE_AUDIT_ACTIONS[row.action]?.label || row.action;
    await logActivity(
      "pos.audit",
      label,
      {
        auditAction: row.action,
        user: row.user,
        terminal: row.terminal,
        old_value: row.old_value,
        new_value: row.new_value,
        reason: row.reason,
        timestamp: row.timestamp,
        ...row.detail,
      },
      {}
    );
  }
  return row;
}

export function filterImmutableAuditRows(rows, { action = "all", query, limit = 200 } = {}) {
  let list = [...(rows || [])];
  if (action && action !== "all") {
    list = list.filter((row) => row.action === action);
  }
  if (query?.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter((row) => {
      const label = IMMUTABLE_AUDIT_ACTIONS[row.action]?.label || row.action || "";
      return (
        label.toLowerCase().includes(q) ||
        String(row.user || "").toLowerCase().includes(q) ||
        String(row.reason || "").toLowerCase().includes(q) ||
        String(row.old_value || "").toLowerCase().includes(q) ||
        String(row.new_value || "").toLowerCase().includes(q) ||
        JSON.stringify(row.detail || {}).toLowerCase().includes(q)
      );
    });
  }
  list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  return list.slice(0, limit);
}

/** Map legacy access-log / activity detail into immutable audit when backfilling views. */
export function activityToImmutableAuditShape(activity) {
  if (!activity?.detail || typeof activity.detail !== "object") return null;
  const d = activity.detail;
  if (d.auditAction && IMMUTABLE_AUDIT_ACTIONS[d.auditAction]) {
    return {
      id: activity.id,
      user: d.user || d.operatorId || "unknown",
      action: d.auditAction,
      timestamp: d.timestamp || activity.ts,
      terminal: d.terminal ?? d.tillNumber ?? null,
      old_value: d.old_value ?? null,
      new_value: d.new_value ?? null,
      reason: d.reason ?? null,
      detail: d,
    };
  }
  const accessType = d.accessLogType;
  if (accessType === "void") {
    return {
      id: activity.id,
      user: d.operatorId || "unknown",
      action: "void",
      timestamp: activity.ts,
      terminal: d.tillNumber ?? null,
      old_value: d.voidKind === "line" ? d.lineTotal : d.lineCount,
      new_value: null,
      reason: d.voidKind || null,
      detail: d,
    };
  }
  if (accessType === "discount_override" && d.discountKind === "price") {
    return {
      id: activity.id,
      user: d.operatorId || "unknown",
      action: "price_override",
      timestamp: activity.ts,
      terminal: d.tillNumber ?? null,
      old_value: d.priorPrice,
      new_value: d.newPrice,
      reason: d.managerOverride ? "manager_override" : null,
      detail: d,
    };
  }
  if (accessType === "refund_override") {
    return {
      id: activity.id,
      user: d.operatorId || "unknown",
      action: "refund_override",
      timestamp: activity.ts,
      terminal: d.tillNumber ?? null,
      old_value: null,
      new_value: d.amount ?? null,
      reason: "manager_override",
      detail: d,
    };
  }
  if (accessType === "age_verification") {
    return {
      id: activity.id,
      user: d.operatorId || "unknown",
      action: "controlled_item_sale",
      timestamp: activity.ts,
      terminal: d.tillNumber ?? null,
      old_value: null,
      new_value: d.classId ?? null,
      reason: d.managerOverride ? "manager_override" : "dob_verified",
      detail: d,
    };
  }
  return null;
}
