/**
 * Client-side invoice uniqueness checks for local reporting (IndexedDB).
 * Authoritative numbering is allocated on the pharmacy API during complete-sale.
 */

export const INVOICE_SCOPE_GLOBAL = "global";
export const INVOICE_SCOPE_PER_TILL = "per_till";

export function resolveInvoiceNumberScope() {
  const raw = String(
    process.env.REACT_APP_POS_INVOICE_SCOPE ||
      process.env.NEXT_PUBLIC_POS_INVOICE_SCOPE ||
      INVOICE_SCOPE_GLOBAL
  )
    .trim()
    .toLowerCase();
  return raw === INVOICE_SCOPE_PER_TILL ? INVOICE_SCOPE_PER_TILL : INVOICE_SCOPE_GLOBAL;
}

function normalizeTillNumber(tillNumber) {
  const n = Number(tillNumber);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

/**
 * Whether two completed-sale rows conflict under the configured scope.
 */
export function invoiceNumbersConflict(existing, candidate, scope = resolveInvoiceNumberScope()) {
  const existingInvoice = String(existing?.invoiceNumber || "").trim();
  const candidateInvoice = String(candidate?.invoiceNumber || "").trim();
  if (!existingInvoice || !candidateInvoice) return false;
  if (existingInvoice !== candidateInvoice) return false;
  if (scope === INVOICE_SCOPE_PER_TILL) {
    return normalizeTillNumber(existing.tillNumber) === normalizeTillNumber(candidate.tillNumber);
  }
  return true;
}

export function findConflictingSale(sales, candidate, scope = resolveInvoiceNumberScope()) {
  return (sales || []).find((row) => invoiceNumbersConflict(row, candidate, scope)) || null;
}

/**
 * Reject duplicate invoice numbers returned by the API before persisting locally.
 */
export function assertInvoiceNumberAvailable(sales, candidate, scope = resolveInvoiceNumberScope()) {
  const conflict = findConflictingSale(sales, candidate, scope);
  if (!conflict) return;
  const scopeLabel = scope === INVOICE_SCOPE_PER_TILL ? "this till" : "the store";
  const err = new Error(
    `Invoice ${candidate.invoiceNumber} already exists on ${scopeLabel} (sale ${conflict.id}). Contact support — do not reprint as a new sale.`
  );
  err.code = "POS_INVOICE_DUPLICATE";
  throw err;
}
