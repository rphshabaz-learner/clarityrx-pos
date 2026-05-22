/**
 * Per-till POS action gates and audit helpers.
 * Manager override is session-scoped on the active till (PosTillContext).
 */

import { logImmutableAudit } from "./audit/posImmutableAudit";
import { POS_SUPERVISOR_ROLES } from "./posRoleAccess";

export const MANAGER_OVERRIDE_ROLES = POS_SUPERVISOR_ROLES;

/** Actions that cashiers / assistants / etc. may perform only while manager override is active. */
export const POS_PROTECTED_ACTIONS = {
  "giftcards.activate": {
    permission: "pos.giftcards",
    label: "Gift card activation",
  },
  "giftcards.reload": {
    permission: "pos.giftcards",
    label: "Gift card reload",
  },
  "sales.price_override": {
    permission: "pos.discounts",
    label: "Line price override",
  },
  "sales.refund_override": {
    permission: "pos.refunds",
    label: "Refund override",
  },
  "sales.line_void": {
    permission: "pos.voids",
    label: "Void sale line",
  },
  "sales.cart_void": {
    permission: "pos.voids",
    label: "Void cart",
  },
  "sales.discount": {
    permission: "pos.discounts",
    label: "Sale discount",
  },
  "inventory.adjust": {
    permission: "pos.purchasing",
    label: "Inventory adjustment",
  },
  "customers.delete": {
    permission: "pos.customers",
    label: "Customer delete",
  },
};

export function roleBypassesManagerOverride(activeRole) {
  return MANAGER_OVERRIDE_ROLES.includes(activeRole);
}

/**
 * @returns {{ allowed: boolean, usedOverride: boolean, reason?: string }}
 */
export function evaluatePosAction(actionKey, { activeRole, managerOverrideActive, hasPermission }) {
  const action = POS_PROTECTED_ACTIONS[actionKey];
  if (!action) {
    return { allowed: true, usedOverride: false };
  }
  if (typeof hasPermission === "function" && !hasPermission(action.permission)) {
    return {
      allowed: false,
      usedOverride: false,
      reason: `You do not have permission for ${action.label.toLowerCase()}.`,
    };
  }
  if (roleBypassesManagerOverride(activeRole)) {
    return { allowed: true, usedOverride: false };
  }
  if (managerOverrideActive) {
    return { allowed: true, usedOverride: true };
  }
  return {
    allowed: false,
    usedOverride: false,
    reason: `${action.label} requires manager override on this till. Use Mgr override in the header.`,
  };
}

/** Standard fields appended to local audit log entries for protected actions. */
export function buildPosAuditDetail(actionKey, detail = {}, context = {}) {
  const evaluation = evaluatePosAction(actionKey, context);
  return {
    action: actionKey,
    tillNumber: context.tillNumber ?? null,
    operatorId: context.operatorId ?? null,
    operatorRole: context.activeRole ?? null,
    managerOverride: Boolean(evaluation.usedOverride),
    ...detail,
  };
}

export async function logProtectedPosAction(logActivity, actionKey, message, detail, context, options) {
  if (!logActivity) return;
  const auditDetail = buildPosAuditDetail(actionKey, detail, context);
  await logActivity("pos", message, auditDetail, options);

  const user = context.operatorId || context.operatorName;
  const terminal = context.tillNumber;
  if (actionKey === "sales.price_override") {
    await logImmutableAudit(logActivity, {
      user,
      action: "price_override",
      terminal,
      oldValue: detail.priorPrice ?? null,
      newValue: detail.newPrice ?? null,
      reason: auditDetail.managerOverride ? "manager_override" : detail.reason || null,
      detail: auditDetail,
    });
  } else if (actionKey === "sales.refund_override") {
    await logImmutableAudit(logActivity, {
      user,
      action: "refund_override",
      terminal,
      oldValue: detail.invoiceNumber ?? null,
      newValue: detail.amount ?? detail.refundAmount ?? null,
      reason: auditDetail.managerOverride ? "manager_override" : detail.reason || null,
      detail: auditDetail,
    });
  }
}

/** Audit rows where manager override was used or enabled. */
export function filterOverrideAuditActivities(activities, { query, limit = 150 } = {}) {
  let rows = (activities || []).filter((row) => {
    const detail = row.detail;
    if (detail && typeof detail === "object" && detail.managerOverride) return true;
    if (/manager override/i.test(row.message || "")) return true;
    return false;
  });
  if (query?.trim()) {
    const q = query.trim().toLowerCase();
    rows = rows.filter(
      (row) =>
        String(row.message || "").toLowerCase().includes(q) ||
        JSON.stringify(row.detail || {}).toLowerCase().includes(q)
    );
  }
  return rows.slice(0, limit);
}
