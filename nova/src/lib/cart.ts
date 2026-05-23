import type { CartLine } from "@/types";

/** Mock Canadian split — configure per store province later. */
export const GST_RATE = 0.05;
export const PST_RATE = 0.07;

export function cartTotals(cart: CartLine[], discountPct: number) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const discount = subtotal * (discountPct / 100);
  const taxable = subtotal - discount;
  const gst = taxable * GST_RATE;
  const pst = taxable * PST_RATE;
  const tax = gst + pst;
  const total = taxable + tax;
  return { subtotal, count, discount, taxable, gst, pst, tax, total };
}

export function formatMoney(n: number) {
  return `$${n.toFixed(2)}`;
}

export function lineTotals(line: CartLine, discountPct: number) {
  const subtotal = line.price * line.qty;
  const discount = subtotal * (discountPct / 100);
  const taxable = subtotal - discount;
  const gst = taxable * GST_RATE;
  const pst = taxable * PST_RATE;
  const tax = gst + pst;
  return { subtotal, discount, tax, total: taxable + tax };
}
