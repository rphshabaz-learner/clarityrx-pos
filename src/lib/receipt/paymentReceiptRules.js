/**
 * PCI-aligned receipt and audit rules for card-present payments.
 * Never persist or print CVV, full PAN, or card expiry on customer copies or local logs.
 */

const SENSITIVE_KEY_PATTERN =
  /^(pan|cardNumber|card_number|primaryAccountNumber|fullPan|accountNumber|cvv|cvc|securityCode|expiry|expiration|expDate|exp_month|exp_year|cardExpiry)$/i;

const PAN_LIKE_PATTERN = /\b(?:\d[ -]*?){13,19}\b/;

/**
 * Mask last four digits for thermal receipts: **** **** **** 1234
 * @param {string|number|null|undefined} last4
 */
export function maskCardLast4(last4) {
  const digits = String(last4 ?? "")
    .replace(/\D/g, "")
    .slice(-4);
  if (!digits) return "**** **** **** ****";
  return `**** **** **** ${digits}`;
}

/**
 * Strip digits from a value that might be a full PAN; returns masked last4 when possible.
 */
export function maskPanValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return maskCardLast4("");
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 13) return maskCardLast4(digits.slice(-4));
  if (digits.length <= 4) return maskCardLast4(digits);
  return maskCardLast4(digits.slice(-4));
}

/**
 * True when a detail key must never appear in logs or receipt payloads.
 */
export function isSensitivePaymentField(key) {
  return SENSITIVE_KEY_PATTERN.test(String(key || "").trim());
}

function redactString(value) {
  const text = String(value);
  if (PAN_LIKE_PATTERN.test(text)) {
    return maskPanValue(text);
  }
  return "[REDACTED]";
}

/**
 * Deep-clone and redact payment-sensitive fields for activity logs and audit detail.
 */
export function redactSensitivePaymentFields(value, depth = 0) {
  if (depth > 8) return "[REDACTED]";
  if (value == null || typeof value !== "object") {
    if (typeof value === "string" && PAN_LIKE_PATTERN.test(value)) {
      return maskPanValue(value);
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitivePaymentFields(item, depth + 1));
  }
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    if (isSensitivePaymentField(key)) {
      out[key] = "[REDACTED]";
      continue;
    }
    out[key] = redactSensitivePaymentFields(child, depth + 1);
  }
  return out;
}

/**
 * Safe card block for 42-char thermal receipts (customer / merchant copy).
 */
export function formatCardReceiptLines(cardPayment = {}) {
  if (!cardPayment || typeof cardPayment !== "object") return [];
  const brand = String(cardPayment.cardBrand || cardPayment.brand || "CARD").trim().toUpperCase();
  const masked = maskCardLast4(cardPayment.last4);
  const lines = [`${brand} ${masked}`];
  const auth = String(cardPayment.authCode || "").trim();
  const ref = String(cardPayment.reference || "").trim();
  if (auth) lines.push(`AUTH ${auth}`);
  if (ref && ref !== auth) lines.push(`REF ${ref}`);
  const entry = String(cardPayment.entryMethod || "").trim();
  if (entry) lines.push(entry.toUpperCase());
  return lines;
}

/**
 * Subset allowed on complete-sale transmit and sale records (no CVV/PAN/expiry).
 */
export function sanitizeCardPaymentForStorage(cardPayment) {
  if (!cardPayment || typeof cardPayment !== "object") return null;
  const last4 = String(cardPayment.last4 ?? "")
    .replace(/\D/g, "")
    .slice(-4);
  return {
    reference: String(cardPayment.reference || cardPayment.authCode || "").trim() || null,
    authCode: String(cardPayment.authCode || "").trim() || null,
    last4: last4 || null,
    cardBrand: String(cardPayment.cardBrand || cardPayment.brand || "").trim() || null,
    entryMethod: String(cardPayment.entryMethod || "").trim() || null,
    terminalId: String(cardPayment.terminalId || "").trim() || null,
    maskedPan: maskCardLast4(last4),
  };
}
