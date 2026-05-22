import { PROVINCE_TAX_REGIMES, TAX_COMPONENT_IDS } from "../tax/canadianProvincialTax";

const RECEIPT_WIDTH = 42;

function padLine(left, right) {
  const l = String(left);
  const r = String(right);
  const spaces = Math.max(1, RECEIPT_WIDTH - l.length - r.length);
  return l + " ".repeat(spaces) + r;
}

function money(amount) {
  return `$${(Number(amount) || 0).toFixed(2)}`;
}

function formatDateTime(ms) {
  const d = new Date(ms || Date.now());
  const date = d.toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" });
  const time = d.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", hour12: true });
  return { date, time };
}

/**
 * Ordered tax lines for thermal receipt (GST, HST, PST, QST).
 */
export function formatTaxReceiptLines(taxBreakdown) {
  if (!taxBreakdown) return [];
  const order = [
    TAX_COMPONENT_IDS.GST,
    TAX_COMPONENT_IDS.HST,
    TAX_COMPONENT_IDS.PST,
    TAX_COMPONENT_IDS.QST,
  ];
  const lines = [];
  for (const id of order) {
    const amount = Number(taxBreakdown[id]) || 0;
    if (amount !== 0) {
      lines.push({ label: id, amount });
    }
  }
  if (!lines.length && Number(taxBreakdown.totalTax) > 0) {
    lines.push({ label: "TAX", amount: taxBreakdown.totalTax });
  }
  return lines;
}

/**
 * Build audit-ready 80mm receipt text (42 columns).
 */
export function formatSaleReceiptText({
  store = {},
  sale = {},
  taxConfig = {},
  reprint = false,
  transactionType = "SALE",
}) {
  const { date, time } = formatDateTime(sale.chargedAt);
  const taxBreakdown = sale.taxBreakdown || {};
  const lines = [];

  const push = (text = "") => lines.push(text);

  push(store.name || taxConfig.storeName || "CLARITYRX");
  push("PHARMACY & FRONT STORE");
  if (store.addressLine1 || taxConfig.storeAddressLine1) {
    push(store.addressLine1 || taxConfig.storeAddressLine1);
  }
  if (store.addressLine2 || taxConfig.storeAddressLine2) {
    push(store.addressLine2 || taxConfig.storeAddressLine2);
  }
  if (store.phone || taxConfig.storePhone) {
    push(store.phone || taxConfig.storePhone);
  }
  push("=".repeat(RECEIPT_WIDTH));
  if (reprint) push("*** REPRINT ***");
  push(`RECEIPT #: ${sale.invoiceNumber || "—"}`);
  push(`DATE:      ${date}    TIME: ${time}`);
  if (taxConfig.businessNumber) {
    push(`BN:        ${taxConfig.businessNumber}`);
  }
  push(
    `STORE:     ${sale.storeId || "—"}`.padEnd(22) +
      `TERMINAL: ${sale.terminalId || `POS-${sale.tillNumber || "—"}`}`
  );
  push(
    `SHIFT:     ${sale.shiftId || "—"}`.slice(0, 22) +
      ` CASHIER: ${String(sale.cashierName || "—").slice(0, 10)}`
  );
  push(`TYPE:      ${transactionType}`.padEnd(22) + `PROV: ${taxBreakdown.provinceCode || taxConfig.provinceCode || "—"}`);
  if (sale.taxExempt) push("TAX STATUS: EXEMPT");
  push("=".repeat(RECEIPT_WIDTH));

  push("ITEMS");
  push("-".repeat(RECEIPT_WIDTH));
  push(padLine("ITEM", "TOTAL"));
  push("-".repeat(RECEIPT_WIDTH));

  const itemLines = sale.lines || [];
  if (!itemLines.length) {
    push("No items");
  } else {
    for (const row of itemLines) {
      const qty = Number(row.qty) || 1;
      const label = `${String(row.name || row.sku || "Item").slice(0, 28)} x${qty}`;
      push(padLine(label, money(row.lineTotal)));
      if (row.taxClass && row.taxClass !== "standard") {
        push(`  (${row.taxClass})`);
      }
    }
  }

  push("=".repeat(RECEIPT_WIDTH));
  const pricingNote =
    taxBreakdown.pricingMode === "inclusive" ? " (tax-incl.)" : "";
  push(padLine(`SUBTOTAL${pricingNote}`, money(sale.subtotal)));
  if (Number(sale.discount) > 0) push(padLine("DISCOUNT", `-${money(sale.discount)}`));
  if (Number(sale.couponDiscount) > 0) push(padLine("COUPON", `-${money(sale.couponDiscount)}`));

  for (const taxLine of formatTaxReceiptLines(taxBreakdown)) {
    const sign = transactionType === "REFUND" ? "-" : "";
    push(padLine(taxLine.label, `${sign}${money(Math.abs(taxLine.amount))}`));
  }

  push("-".repeat(RECEIPT_WIDTH));
  const totalSign = transactionType === "REFUND" ? "-" : "";
  push(padLine("TOTAL", `${totalSign}${money(Math.abs(sale.total))}`));
  push("=".repeat(RECEIPT_WIDTH));

  if (sale.payMethod) {
    push("PAYMENT");
    push(String(sale.payMethod));
    push(padLine("AMOUNT PAID", money(sale.total)));
    if (Number(sale.changeDue) > 0) {
      push(padLine("CHANGE DUE", money(sale.changeDue)));
    }
  }

  push("=".repeat(RECEIPT_WIDTH));
  push("Returns with original receipt per store policy.");
  push("        Thank you for choosing");
  push("             ClarityRx");
  push("=".repeat(RECEIPT_WIDTH));

  return lines.join("\n");
}
