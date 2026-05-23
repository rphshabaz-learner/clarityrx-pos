import { PRODUCTS } from "@/lib/data/products";
import type { Transaction } from "@/types";

export function mockAssistantReply(
  question: string,
  ctx: { todayCount: number; todayRev: number; txns: Transaction[] }
): string {
  const q = question.toLowerCase();
  const lowStock = PRODUCTS.filter((p) => p.stock < 15);

  if (q.includes("low stock") || q.includes("inventory")) {
    if (lowStock.length === 0) return "All SKUs are above the low-stock threshold (15 units).";
    return `Low stock (${lowStock.length}): ${lowStock.map((p) => `${p.name} (${p.stock})`).join(", ")}. Prioritize OTC and first-aid reorders.`;
  }

  if (q.includes("today") || q.includes("sales")) {
    return `Today: ${ctx.todayCount} transactions, $${ctx.todayRev.toFixed(2)} revenue. Average basket $${(ctx.todayRev / Math.max(ctx.todayCount, 1)).toFixed(2)}.`;
  }

  if (q.includes("top") || q.includes("best")) {
    const sold = PRODUCTS.map((p) => ({
      name: p.name,
      qty: ctx.txns.reduce((s, t) => s + (t.items.find((i) => i.id === p.id)?.qty ?? 0), 0),
    }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
    return `Top sellers: ${sold.map((p) => `${p.name} (${p.qty})`).join(", ")}.`;
  }

  return `Snapshot — today ${ctx.todayCount} txns / $${ctx.todayRev.toFixed(2)}. Ask about "low stock", "today sales", or "top sellers". (Local mock — no API.)`;
}

export function mockInsights(ctx: { todayCount: number; todayRev: number; txns: Transaction[] }): string {
  const card = ctx.txns.filter((t) => t.method === "card").length;
  const cash = ctx.txns.filter((t) => t.method === "cash").length;
  const low = PRODUCTS.filter((p) => p.stock < 15).length;
  return [
    `1. Today: ${ctx.todayCount} sales · $${ctx.todayRev.toFixed(2)} — ${ctx.todayCount < 5 ? "below typical morning pace; check staffing on tills." : "on track for the day."}`,
    `2. Payment mix: ${card} card / ${cash} cash — ${card > cash * 2 ? "card-heavy; ensure terminal paper and contactless signage." : "balanced tender types."}`,
    `3. Inventory: ${low} SKUs under 15 units — prioritize OTC analgesics, cold/flu, and front-store sanitizer.`,
  ].join("\n\n");
}
