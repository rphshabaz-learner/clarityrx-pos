import { computeLineTotal } from "../posSalesRegister";
import { formatBusinessDate } from "./businessDate";

export function generateCompletedSaleId() {
  return `sale-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCartLines(cart) {
  return (cart || [])
    .filter((line) => line && Number(line.qty) > 0)
    .map((line) => {
      const qty = Number(line.qty) || 0;
      const price = Number(line.price) || 0;
      const lineTotal = computeLineTotal(line);
      return {
        sku: String(line.sku || ""),
        name: String(line.name || line.sku || "Item"),
        category: String(line.category || ""),
        qty,
        price,
        lineTotal: Number(lineTotal.toFixed(2)),
      };
    });
}

/**
 * Persisted sale row for local reporting (IndexedDB).
 */
export function buildCompletedSaleSnapshot({
  cart,
  result,
  totals,
  payMethod,
  splitPayments,
  tillNumber,
  shift,
  user,
  rxCopay,
  pickupId,
  demographicLabel,
  tenderedAmount,
  changeDue,
  taxExempt,
}) {
  const chargedAt = Date.now();
  const lines = normalizeCartLines(cart);
  const otcSubtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  return {
    id: generateCompletedSaleId(),
    invoiceNumber: result?.invoiceNumber || null,
    chargedAt,
    businessDate: shift?.businessDate || formatBusinessDate(new Date(chargedAt)),
    shiftId: shift?.id || null,
    tillNumber: Number(tillNumber) || 1,
    cashierId: user?.id || shift?.cashierId || "",
    cashierName: user?.fullName || user?.username || shift?.cashierId || "—",
    subtotal: Number(totals?.subtotal?.toFixed?.(2) ?? otcSubtotal.toFixed(2)),
    discount: Number(totals?.discount?.toFixed?.(2) ?? 0),
    couponDiscount: Number(totals?.couponDiscount?.toFixed?.(2) ?? 0),
    tax: Number(totals?.tax?.toFixed?.(2) ?? 0),
    total: Number(totals?.total?.toFixed?.(2) ?? 0),
    rxCopay: Number(rxCopay) || 0,
    pickupId: pickupId || null,
    payMethod: String(payMethod || ""),
    splitPayments: splitPayments || null,
    tenderedAmount: tenderedAmount != null ? Number(tenderedAmount) : null,
    changeDue: Number(changeDue?.toFixed?.(2) ?? 0),
    taxExempt: Boolean(taxExempt),
    demographic: demographicLabel || "",
    lineCount: lines.length,
    lines,
  };
}
