import { POS_FRONT_STORE_ITEMS } from "../modules/pos/posCatalog";

export const SALES_PAYMENT_METHODS = [
  "Cash",
  "Debit",
  "Credit Card",
  "Gift Card",
  "Insurance",
  "Other",
];

/** Demo coupon codes until promotions engine is wired at checkout. */
export const POS_CHECKOUT_COUPONS = {
  SAVE10: { label: "10% off OTC", type: "percent", value: 10 },
  SAVE5: { label: "$5 off OTC", type: "amount", value: 5 },
};

export function listPosDepartments() {
  const seen = new Set();
  const rows = [];
  for (const item of POS_FRONT_STORE_ITEMS) {
    const category = item.category || "General";
    if (seen.has(category)) continue;
    seen.add(category);
    rows.push(category);
  }
  return rows.sort((a, b) => a.localeCompare(b));
}

export function filterCatalogByDepartment(department) {
  return POS_FRONT_STORE_ITEMS.filter((item) => (item.category || "General") === department);
}

export function computeLineTotal(item) {
  const gross = Number(item.price || 0) * Number(item.qty || 0);
  const lineDiscount = Math.max(0, Number(item.lineDiscount) || 0);
  return Math.max(0, gross - lineDiscount);
}

export function computeCouponDiscount(code, baseAmount) {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized || baseAmount <= 0) return 0;
  const rule = POS_CHECKOUT_COUPONS[normalized];
  if (!rule) return 0;
  if (rule.type === "percent") {
    return Math.min(baseAmount, baseAmount * (Number(rule.value) / 100));
  }
  return Math.min(baseAmount, Number(rule.value) || 0);
}

export function loyaltyRedemptionAmount(points, maxRedeemable) {
  const parsed = Math.max(0, Number(points) || 0);
  if (!parsed) return 0;
  return Math.min(maxRedeemable, parsed * 0.01);
}
