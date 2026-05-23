"use client";

import { useState } from "react";
import { cartTotals, formatMoney, GST_RATE, PST_RATE } from "@/lib/cart";
import type { CartLine, PaymentMethod, SaleCustomer } from "@/types";

type PosActionsPanelProps = {
  cart: CartLine[];
  discountPct: number;
  customer: SaleCustomer;
  cartMessage: string | null;
  onCustomerChange: (patch: Partial<SaleCustomer>) => void;
  onClearCustomer: () => void;
  onDiscountChange: (pct: number) => void;
  onPay: (method: PaymentMethod, cashTendered?: number) => void;
};

export function PosActionsPanel({
  cart,
  discountPct,
  customer,
  cartMessage,
  onCustomerChange,
  onClearCustomer,
  onDiscountChange,
  onPay,
}: PosActionsPanelProps) {
  const totals = cartTotals(cart, discountPct);
  const hasCart = cart.length > 0;
  const [payMethod, setPayMethod] = useState<PaymentMethod>("card");
  const [cashIn, setCashIn] = useState("");

  const cashAmount = parseFloat(cashIn) || 0;
  const cashOk = payMethod !== "cash" || cashAmount >= totals.total;
  const changeDue = payMethod === "cash" && cashOk ? cashAmount - totals.total : 0;

  const complete = () => {
    if (!hasCart || !cashOk) return;
    onPay(payMethod, payMethod === "cash" ? cashAmount : undefined);
    setCashIn("");
    setPayMethod("card");
  };

  const hasCustomer = Boolean(customer.name.trim() || customer.phone.trim());

  return (
    <aside className="flex w-[min(100%,300px)] shrink-0 flex-col border-l border-nova-border bg-nova-card">
      <div className="border-b border-nova-border px-4 py-3">
        <h2 className="font-condensed text-lg font-bold tracking-wide">Checkout</h2>
      </div>

      {cartMessage && (
        <div className="border-b border-nova-accent/30 bg-nova-accent/10 px-4 py-2 text-xs text-nova-accent">
          {cartMessage}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        <section className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[11px] font-medium uppercase tracking-wide text-nova-dim">
              Customer <span className="normal-case text-nova-dim/80">(optional)</span>
            </label>
            {hasCustomer && (
              <button
                type="button"
                onClick={onClearCustomer}
                className="text-[11px] text-nova-dim hover:text-red-400"
              >
                Clear
              </button>
            )}
          </div>
          <input
            value={customer.name}
            onChange={(e) => onCustomerChange({ name: e.target.value })}
            placeholder="Name"
            className="mb-2 w-full rounded-md border border-nova-border bg-nova-bg px-3 py-2 text-sm focus:border-nova-accent"
          />
          <input
            value={customer.phone}
            onChange={(e) => onCustomerChange({ phone: e.target.value })}
            placeholder="Phone"
            className="w-full rounded-md border border-nova-border bg-nova-bg px-3 py-2 text-sm font-mono focus:border-nova-accent"
          />
        </section>

        <dl className="mb-5 space-y-2.5 border-b border-nova-border pb-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-nova-dim">Subtotal</dt>
            <dd className="font-mono font-medium">{formatMoney(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-nova-dim">GST ({(GST_RATE * 100).toFixed(0)}%)</dt>
            <dd className="font-mono">{formatMoney(totals.gst)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-nova-dim">PST ({(PST_RATE * 100).toFixed(0)}%)</dt>
            <dd className="font-mono">{formatMoney(totals.pst)}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-nova-dim">Discounts</dt>
            <dd className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={discountPct}
                onChange={(e) => onDiscountChange(Number(e.target.value))}
                disabled={!hasCart}
                className="w-12 rounded border border-nova-border bg-nova-bg px-1 py-0.5 text-center font-mono text-xs disabled:opacity-40"
                aria-label="Discount percent"
              />
              <span className="text-xs text-nova-dim">%</span>
              {totals.discount > 0 && (
                <span className="font-mono text-emerald-400">−{formatMoney(totals.discount)}</span>
              )}
            </dd>
          </div>
          <div className="flex justify-between border-t border-nova-border pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd className="font-mono text-xl text-nova-accent">{formatMoney(totals.total)}</dd>
          </div>
        </dl>

        <section className="mt-auto space-y-3">
          <p className="text-[11px] uppercase tracking-wide text-nova-dim">Payment</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!hasCart}
              onClick={() => {
                setPayMethod("card");
                if (hasCart) onPay("card");
              }}
              className={`rounded-lg border py-3 text-sm font-bold transition-colors disabled:opacity-40 ${
                payMethod === "card"
                  ? "border-nova-accent bg-nova-accent text-nova-bg"
                  : "border-nova-border bg-nova-bg hover:border-nova-accent"
              }`}
            >
              Card
              <span className="mt-0.5 block text-[10px] font-normal opacity-80">1 · F2</span>
            </button>
            <button
              type="button"
              disabled={!hasCart}
              onClick={() => setPayMethod("cash")}
              className={`rounded-lg border py-3 text-sm font-bold transition-colors disabled:opacity-40 ${
                payMethod === "cash"
                  ? "border-nova-accent bg-nova-accent text-nova-bg"
                  : "border-nova-border bg-nova-bg hover:border-nova-accent"
              }`}
            >
              Cash
              <span className="mt-0.5 block text-[10px] font-normal opacity-80">2</span>
            </button>
          </div>

          {payMethod === "cash" && hasCart && (
            <div className="rounded-lg border border-nova-border bg-nova-bg p-3">
              <label className="mb-1 block text-[11px] text-nova-dim">Cash tendered</label>
              <input
                value={cashIn}
                onChange={(e) => setCashIn(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && complete()}
                placeholder="0.00"
                className="w-full rounded-md border border-nova-border bg-nova-card px-3 py-2 font-mono text-lg focus:border-nova-accent"
                autoFocus
              />
              {cashAmount > 0 && (
                <p
                  className={`mt-2 text-xs font-mono ${cashOk ? "text-emerald-400" : "text-red-400"}`}
                >
                  {cashOk ? `Change ${formatMoney(changeDue)}` : `Need ${formatMoney(totals.total - cashAmount)} more`}
                </p>
              )}
              <button
                type="button"
                onClick={complete}
                disabled={!cashOk}
                className="mt-3 w-full rounded-lg bg-nova-accent py-2.5 text-sm font-bold text-nova-bg disabled:opacity-40"
              >
                Complete cash sale (Enter)
              </button>
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
