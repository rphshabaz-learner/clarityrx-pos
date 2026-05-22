/**
 * PCI-safe card display — prefer `paymentReceiptRules` for new code.
 * @deprecated Use `formatCardReceiptLines` / `maskCardLast4` from `../receipt/paymentReceiptRules.js`.
 */

import {
  formatCardReceiptLines,
  maskCardLast4 as maskCardLast4Thermal,
} from "../receipt/paymentReceiptRules";

export { maskCardLast4Thermal as maskCardLast4 };

/** @param {{ copy?: 'customer' | 'merchant' }} [options] — copy type ignored; same safe lines for both. */
export function formatReceiptCardLines(cardPayment, _options = {}) {
  return formatCardReceiptLines(cardPayment);
}

const PAN_LIKE_PATTERN = /\b(?:\d[ -]*?){13,19}\b/;

/** Dev/validation helper — returns true if text may contain a full PAN-like sequence. */
export function containsProhibitedCardData(text) {
  const raw = String(text || "");
  if (!raw) return false;
  const matches = raw.match(PAN_LIKE_PATTERN);
  if (!matches) return false;
  return matches.some((segment) => {
    const digits = segment.replace(/\D/g, "");
    return digits.length >= 13 && digits.length <= 19;
  });
}
