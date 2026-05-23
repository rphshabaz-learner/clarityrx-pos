import { GST_RATE, PST_RATE } from "@/lib/cart";
import { PRODUCTS } from "@/lib/data/products";
import { USERS } from "@/lib/data/users";
import type { CartLine, Transaction } from "@/types";

export function makeSampleTransactions(): Transaction[] {
  const methods: Array<"card" | "cash"> = ["card", "card", "card", "cash", "cash"];
  const cashiers = USERS.slice(1);

  return Array.from({ length: 30 }, (_, i) => {
    const items: CartLine[] = PRODUCTS.slice(0, Math.floor(Math.random() * 4) + 1).map((p) => ({
      ...p,
      qty: Math.floor(Math.random() * 3) + 1,
    }));
    const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0);
    const gst = subtotal * GST_RATE;
    const pst = subtotal * PST_RATE;
    const tax = gst + pst;
    const total = subtotal + tax;

    return {
      id: `TXN-${String(i + 1).padStart(4, "0")}`,
      items,
      subtotal,
      gst,
      pst,
      tax,
      total,
      method: methods[i % 5],
      user: cashiers[i % cashiers.length],
      till: (i % 5) + 1,
      timestamp: new Date(Date.now() - (30 - i) * 1_900_000),
      discount: 0,
    };
  });
}
