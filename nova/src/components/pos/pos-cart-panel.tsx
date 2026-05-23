"use client";

import { cartTotals, formatMoney, GST_RATE, lineTotals, PST_RATE } from "@/lib/cart";
import type { CartLine, SuspendedSale } from "@/types";

type PosCartPanelProps = {
  cart: CartLine[];
  discountPct: number;
  tillSuspended: SuspendedSale[];
  focusCart: boolean;
  lineIdx: number;
  showRecall: boolean;
  recallIdx: number;
  onFocusCart: () => void;
  onLineSelect: (index: number) => void;
  onQtyChange: (id: number, qty: number) => void;
  onDiscountChange: (pct: number) => void;
  onRemoveLine: (id: number) => void;
  onClearCart: () => void;
  onSuspend: () => void;
  onToggleRecall: () => void;
  onRecall: (sale: SuspendedSale) => void;
};

export function PosCartPanel({
  cart,
  discountPct,
  tillSuspended,
  focusCart,
  lineIdx,
  showRecall,
  recallIdx,
  onFocusCart,
  onLineSelect,
  onQtyChange,
  onDiscountChange,
  onRemoveLine,
  onClearCart,
  onSuspend,
  onToggleRecall,
  onRecall,
}: PosCartPanelProps) {
  const totals = cartTotals(cart, discountPct);

  return (
    <section
      className="flex min-w-0 flex-[1.15] flex-col border-r border-nova-border bg-nova-bg"
      onMouseDown={onFocusCart}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-nova-border bg-nova-card px-4 py-2.5">
        <div>
          <h2 className="font-condensed text-lg font-bold tracking-wide">Sale</h2>
          <p className="text-[11px] text-nova-dim">
            {totals.count} item{totals.count === 1 ? "" : "s"}
            {focusCart && cart.length > 0 ? " · cart focused (F6)" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSuspend}
            disabled={!cart.length}
            className="rounded-md border border-nova-border px-3 py-1.5 text-xs font-semibold hover:border-nova-accent disabled:opacity-40"
          >
            Suspend (F8)
          </button>
          <button
            type="button"
            onClick={onToggleRecall}
            disabled={!tillSuspended.length}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${
              showRecall ? "border-nova-accent bg-nova-accent/15" : "border-nova-border"
            }`}
          >
            Recall ({tillSuspended.length}) (F9)
          </button>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="rounded-md border border-red-400/50 px-3 py-1.5 text-xs text-red-400"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {showRecall && tillSuspended.length > 0 && (
        <div className="shrink-0 border-b border-nova-border bg-nova-card/80 px-4 py-3">
          <p className="mb-2 text-[10px] uppercase tracking-widest text-nova-dim">
            Suspended on this till · ↑↓ select · Enter recall · Del discard
          </p>
          <ul className="max-h-28 space-y-1 overflow-y-auto">
            {tillSuspended.map((sale, i) => (
              <li key={sale.id}>
                <button
                  type="button"
                  onClick={() => onRecall(sale)}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                    recallIdx === i
                      ? "border-nova-accent bg-nova-accent/10"
                      : "border-nova-border hover:border-nova-dim"
                  }`}
                >
                  <span>
                    <span className="font-mono text-nova-accent">{sale.id}</span>
                    <span className="ml-2 text-nova-dim">
                      {sale.cart.length} lines · {sale.cashierName.split(" ")[0]}
                    </span>
                  </span>
                  <span className="text-[11px] text-nova-dim">
                    {sale.suspendedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-nova-dim">
            <p className="mb-2 text-3xl">🛒</p>
            <p>Scan or select products on the left.</p>
            <p className="mt-2 text-xs">
              F6 focus cart · F8 suspend · F9 recall
              {tillSuspended.length ? ` · ${tillSuspended.length} suspended` : ""}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-nova-card text-[10px] uppercase tracking-wider text-nova-dim">
              <tr>
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 text-right font-medium">Unit</th>
                <th className="w-20 px-3 py-2 text-center font-medium">Qty</th>
                <th className="px-3 py-2 text-right font-medium">Tax</th>
                <th className="px-3 py-2 text-right font-medium">Line</th>
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {cart.map((item, i) => {
                const lt = lineTotals(item, discountPct);
                const selected = focusCart && lineIdx === i;
                return (
                  <tr
                    key={item.id}
                    className={`border-t border-nova-border/70 ${
                      selected ? "bg-nova-accent/10" : "hover:bg-nova-card/50"
                    }`}
                    onClick={() => onLineSelect(i)}
                  >
                    <td className="px-3 py-2 font-mono text-xs text-nova-dim">{item.sku}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 font-medium">{item.name}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {formatMoney(item.price)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={item.qty}
                        onChange={(e) => onQtyChange(item.id, Math.max(1, Number(e.target.value) || 1))}
                        onFocus={() => onLineSelect(i)}
                        className={`w-14 rounded border bg-nova-bg px-1 py-1 text-center font-mono text-sm ${
                          selected ? "border-nova-accent" : "border-nova-border"
                        }`}
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-nova-dim">
                      {formatMoney(lt.tax)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-sm font-semibold text-nova-accent">
                      {formatMoney(lt.total)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveLine(item.id);
                        }}
                        className="rounded px-1.5 text-nova-dim hover:bg-red-400/20 hover:text-red-400"
                        title="Remove (Del)"
                        aria-label={`Remove ${item.name}`}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="shrink-0 border-t border-nova-border bg-nova-card px-4 py-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wide text-nova-dim">
              Discount %
              <input
                type="number"
                min={0}
                max={100}
                value={discountPct}
                onChange={(e) => onDiscountChange(Number(e.target.value))}
                onFocus={onFocusCart}
                className="w-16 rounded-md border border-nova-border bg-nova-bg px-2 py-1.5 text-center font-mono text-sm focus:border-nova-accent"
              />
            </label>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-nova-dim">Tax indicator</span>
              <span
                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-300"
                title="GST + PST on taxable amount after discount"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                GST {formatMoney(totals.gst)} · PST {formatMoney(totals.pst)}
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-nova-dim">
            <span>
              Subtotal <span className="font-mono text-nova-text">{formatMoney(totals.subtotal)}</span>
            </span>
            {totals.discount > 0 && (
              <span className="ml-4">
                Off <span className="font-mono text-emerald-400">−{formatMoney(totals.discount)}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
