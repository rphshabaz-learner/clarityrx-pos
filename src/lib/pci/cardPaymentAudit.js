import {
  redactSensitivePaymentFields,
  sanitizeCardPaymentForStorage,
} from "../receipt/paymentReceiptRules";

export function classifyCardPaymentError(error) {
  const msg = String(error?.message || "").toLowerCase();
  if (/declined/.test(msg)) return "declined";
  if (/cancel/.test(msg)) return "cancelled";
  if (/timed out|timeout/.test(msg)) return "timeout";
  return "error";
}

/**
 * Write PCI-safe card payment rows to the local activity log (Reports → Audit logs).
 */
export async function logCardPaymentActivity(logActivity, message, detail = {}) {
  if (!logActivity) return;
  const payload = { ...detail };
  if (payload.cardPayment) {
    payload.cardPayment = sanitizeCardPaymentForStorage(payload.cardPayment);
  }
  await logActivity("pos", message, redactSensitivePaymentFields(payload));
}

/**
 * Initiate pinpad payment with audit trail (no PAN/CVV in logs).
 */
export async function runAuditedCardPayment({
  logActivity,
  processCardPayment,
  paymentParams,
  auditContext,
}) {
  const ctx = auditContext || {};
  await logCardPaymentActivity(logActivity, "Card payment initiated", {
    tillNumber: ctx.tillNumber,
    channel: ctx.channel || "register",
    payMethod: paymentParams?.payMethod,
    amount: paymentParams?.amount,
    terminalId: paymentParams?.terminalId,
  });

  try {
    const approved = await processCardPayment(paymentParams);
    await logCardPaymentActivity(logActivity, "Card payment approved", {
      tillNumber: ctx.tillNumber,
      channel: ctx.channel || "register",
      cardPayment: approved,
    });
    return approved;
  } catch (error) {
    const outcome = classifyCardPaymentError(error);
    const labels = {
      declined: "Card payment declined",
      cancelled: "Card payment cancelled",
      timeout: "Card payment timed out",
      error: "Card payment failed",
    };
    await logCardPaymentActivity(logActivity, labels[outcome] || labels.error, {
      tillNumber: ctx.tillNumber,
      channel: ctx.channel || "register",
      outcome,
      message: error?.message || String(error),
    });
    throw error;
  }
}
