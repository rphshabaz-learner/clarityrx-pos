"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { RouteGuard } from "@/components/auth/route-guard";
import { PosActionsPanel } from "@/components/pos/pos-actions-panel";
import { PosCartPanel } from "@/components/pos/pos-cart-panel";
import { NovaLogo, ShortcutBar } from "@/components/ui/nova-shell";
import { cartTotals, formatMoney } from "@/lib/cart";
import { CATEGORIES, findProductBySkuOrId, PRODUCTS } from "@/lib/data/products";
import { useKeyboard } from "@/hooks/use-keyboard";
import {
  buildTransaction,
  useNovaStore,
  usePosCart,
} from "@/store/nova-store";
import type { PaymentMethod, Product, SuspendedSale } from "@/types";

export function PosScreen() {
  const router = useRouter();
  const user = useNovaStore((s) => s.user);
  const till = useNovaStore((s) => s.till);
  const logout = useNovaStore((s) => s.logout);
  const addTransaction = useNovaStore((s) => s.addTransaction);

  const cart = usePosCart((s) => s.cart);
  const discountPct = usePosCart((s) => s.discountPct);
  const suspendedSales = usePosCart((s) => s.suspendedSales);
  const addProduct = usePosCart((s) => s.addProduct);
  const setQty = usePosCart((s) => s.setQty);
  const removeLine = usePosCart((s) => s.removeLine);
  const clearCart = usePosCart((s) => s.clearCart);
  const setDiscountPct = usePosCart((s) => s.setDiscountPct);
  const customer = usePosCart((s) => s.customer);
  const setCustomer = usePosCart((s) => s.setCustomer);
  const clearCustomer = usePosCart((s) => s.clearCustomer);
  const suspendSale = usePosCart((s) => s.suspendSale);
  const recallSale = usePosCart((s) => s.recallSale);
  const discardSuspended = usePosCart((s) => s.discardSuspended);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [highlight, setHighlight] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTxnId, setLastTxnId] = useState<string | null>(null);

  const [focusCart, setFocusCart] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);
  const [showRecall, setShowRecall] = useState(false);
  const [recallIdx, setRecallIdx] = useState(0);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const cartMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tillSuspended = useMemo(
    () => (till != null ? suspendedSales.filter((s) => s.till === till) : []),
    [suspendedSales, till]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    );
  }, [query, category]);

  const totals = cartTotals(cart, discountPct);

  const notify = useCallback((msg: string) => {
    setCartMessage(msg);
    if (cartMessageTimer.current) clearTimeout(cartMessageTimer.current);
    cartMessageTimer.current = setTimeout(() => setCartMessage(null), 3500);
  }, []);

  const addFromProduct = useCallback(
    (p: Product) => {
      addProduct({ ...p, qty: 1 });
      setFocusCart(true);
      setLineIdx(cart.length);
    },
    [addProduct, cart.length]
  );

  const scanEnter = useCallback(() => {
    const hit = findProductBySkuOrId(query);
    if (hit) {
      addFromProduct(hit);
      setQuery("");
      setHighlight(0);
    }
  }, [addFromProduct, query]);

  const suspend = useCallback(() => {
    if (till == null || !user) return;
    const id = suspendSale({ till, cashierName: user.name });
    if (!id) notify("Nothing to suspend.");
    else {
      notify(`Suspended ${id}.`);
      setShowRecall(false);
      setFocusCart(false);
    }
  }, [notify, suspendSale, till, user]);

  const recall = useCallback(
    (sale: SuspendedSale) => {
      if (cart.length > 0) {
        notify("Clear or suspend the current sale first.");
        return;
      }
      if (recallSale(sale.id)) {
        notify(`Recalled ${sale.id}.`);
        setShowRecall(false);
        setFocusCart(true);
        setLineIdx(0);
      }
    },
    [cart.length, notify, recallSale]
  );

  const completePay = useCallback(
    (method: PaymentMethod, cashTendered?: number) => {
      if (!user || till == null || !cart.length) return;
      if (method === "cash" && (cashTendered ?? 0) < totals.total) return;
      const txn = buildTransaction({
        cart,
        subtotal: totals.taxable,
        gst: totals.gst,
        pst: totals.pst,
        total: totals.total,
        discount: totals.discount,
        method,
        user,
        till,
        customer,
        cashIn: method === "cash" ? cashTendered : undefined,
      });
      addTransaction(txn);
      setLastTxnId(txn.id);
      clearCart();
      setShowReceipt(true);
      setFocusCart(false);
    },
    [addTransaction, cart.length, clearCart, customer, till, totals, user, cart]
  );

  useKeyboard(
    useCallback(
      (e) => {
        if (showReceipt) {
          if (e.key === "Enter" || e.key === "Escape") {
            setShowReceipt(false);
            searchRef.current?.focus();
          }
          return;
        }
        if (e.key === "F2" || (e.key === "1" && !showRecall && !focusCart)) {
          e.preventDefault();
          if (cart.length) completePay("card");
          return;
        }

        if (e.key === "F6") {
          e.preventDefault();
          setFocusCart(true);
          setShowRecall(false);
          if (cart.length) setLineIdx((i) => Math.min(i, cart.length - 1));
          return;
        }
        if (e.key === "F8") {
          e.preventDefault();
          suspend();
          return;
        }
        if (e.key === "F9") {
          e.preventDefault();
          if (!tillSuspended.length) return;
          setShowRecall((v) => !v);
          setRecallIdx(0);
          return;
        }

        if (showRecall && tillSuspended.length) {
          if (e.key === "ArrowDown") setRecallIdx((i) => Math.min(tillSuspended.length - 1, i + 1));
          if (e.key === "ArrowUp") setRecallIdx((i) => Math.max(0, i - 1));
          if (e.key === "Enter") recall(tillSuspended[recallIdx]);
          if (e.key === "Delete") {
            const sale = tillSuspended[recallIdx];
            if (sale) {
              discardSuspended(sale.id);
              notify(`Discarded ${sale.id}.`);
              if (recallIdx >= tillSuspended.length - 1) setRecallIdx(Math.max(0, recallIdx - 1));
            }
          }
          if (e.key === "Escape") setShowRecall(false);
          return;
        }

        if (focusCart && cart.length) {
          if (e.key === "ArrowDown") setLineIdx((i) => Math.min(cart.length - 1, i + 1));
          if (e.key === "ArrowUp") setLineIdx((i) => Math.max(0, i - 1));
          if (e.key === "Delete" || (e.key === "Backspace" && e.metaKey)) {
            e.preventDefault();
            const line = cart[lineIdx];
            if (line) removeLine(line.id);
          }
          if (e.key === "+" || e.key === "=") {
            e.preventDefault();
            const line = cart[lineIdx];
            if (line) setQty(line.id, line.qty + 1);
          }
          if (e.key === "-") {
            e.preventDefault();
            const line = cart[lineIdx];
            if (line) setQty(line.id, line.qty - 1);
          }
          if (e.key === "Escape") {
            setFocusCart(false);
            searchRef.current?.focus();
          }
          return;
        }

        if (e.key === "/" || (e.key === "f" && e.ctrlKey)) {
          e.preventDefault();
          setFocusCart(false);
          searchRef.current?.focus();
          return;
        }
        if (e.key === "Escape") {
          if (query) setQuery("");
          else if (cart.length) clearCart();
          return;
        }
        if (e.key === "Enter" && document.activeElement === searchRef.current) {
          e.preventDefault();
          scanEnter();
          return;
        }

        const row = Math.floor(Math.sqrt(filtered.length)) || 1;
        if (e.key === "ArrowDown") setHighlight((i) => Math.min(filtered.length - 1, i + row));
        if (e.key === "ArrowUp") setHighlight((i) => Math.max(0, i - row));
        if (e.key === "ArrowRight") setHighlight((i) => Math.min(filtered.length - 1, i + 1));
        if (e.key === "ArrowLeft") setHighlight((i) => Math.max(0, i - 1));
        if (e.key === "Enter" && filtered[highlight]) {
          e.preventDefault();
          addFromProduct(filtered[highlight]);
        }
        if (/^F([3-9]|1[0-2])$/.test(e.key)) {
          const idx = Number(e.key.slice(1)) - 3;
          if (CATEGORIES[idx]) setCategory(CATEGORIES[idx]);
        }
      },
      [
        addFromProduct,
        cart,
        clearCart,
        completePay,
        discardSuspended,
        filtered,
        focusCart,
        highlight,
        lineIdx,
        query,
        recall,
        recallIdx,
        removeLine,
        scanEnter,
        setQty,
        showRecall,
        showReceipt,
        suspend,
        tillSuspended,
      ]
    )
  );

  if (!user || till == null) return null;

  return (
    <RouteGuard requireTill>
      <div className="flex h-dvh flex-col bg-nova-bg font-sans text-nova-text">
        <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-nova-border bg-nova-card px-4">
          <div className="flex items-center gap-3">
            <NovaLogo size="sm" />
            <span className="font-mono text-xs text-nova-dim">
              TILL {till} · {user.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-nova-dim">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="rounded-md bg-nova-accent px-3 py-1 text-xs font-semibold text-nova-bg"
              >
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="rounded-md border border-red-400/60 px-3 py-1 text-xs text-red-400"
            >
              Exit
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <section className="flex min-w-0 flex-1 flex-col border-r border-nova-border">
            <div className="shrink-0 border-b border-nova-border p-3">
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                  setFocusCart(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    scanEnter();
                  }
                }}
                placeholder="Search SKU, UPC, or product… (/ to focus)"
                className="mb-2 w-full rounded-md border border-nova-border bg-nova-bg px-3 py-2 text-sm outline-none focus:border-nova-accent"
                autoFocus
              />
              <div className="flex flex-wrap gap-1">
                {CATEGORIES.map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCategory(c);
                      setFocusCart(false);
                    }}
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                      category === c
                        ? "border-nova-accent bg-nova-accent text-nova-bg"
                        : "border-nova-border text-nova-dim"
                    }`}
                    title={i > 1 ? `F${i + 2}` : undefined}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-1.5 overflow-y-auto p-3 content-start">
              {filtered.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addFromProduct(p)}
                  className={`rounded-lg border bg-nova-card p-3 text-left transition-colors hover:border-nova-accent ${
                    !focusCart && highlight === i
                      ? "border-nova-accent ring-1 ring-nova-accent/50"
                      : "border-nova-border"
                  }`}
                >
                  <div className="text-[10px] text-nova-dim">{p.sku}</div>
                  <div className="mb-2 line-clamp-2 text-[13px] font-medium leading-snug">{p.name}</div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-nova-accent">
                      {formatMoney(p.price)}
                    </span>
                    <span className={`text-[10px] ${p.stock < 15 ? "text-red-400" : "text-nova-dim"}`}>
                      {p.stock}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <PosCartPanel
            cart={cart}
            discountPct={discountPct}
            tillSuspended={tillSuspended}
            focusCart={focusCart}
            lineIdx={lineIdx}
            showRecall={showRecall}
            recallIdx={recallIdx}
            onFocusCart={() => setFocusCart(true)}
            onLineSelect={(i) => {
              setFocusCart(true);
              setLineIdx(i);
            }}
            onQtyChange={setQty}
            onDiscountChange={setDiscountPct}
            onRemoveLine={removeLine}
            onClearCart={clearCart}
            onSuspend={suspend}
            onToggleRecall={() => setShowRecall((v) => !v)}
            onRecall={recall}
          />

          <PosActionsPanel
            cart={cart}
            discountPct={discountPct}
            customer={customer}
            cartMessage={cartMessage}
            onCustomerChange={setCustomer}
            onClearCustomer={clearCustomer}
            onDiscountChange={setDiscountPct}
            onPay={completePay}
          />
        </div>

        <ShortcutBar
          items={[
            { keys: "/", label: "search" },
            { keys: "F6", label: "cart" },
            { keys: "↑↓ Del", label: "lines" },
            { keys: "F8", label: "suspend" },
            { keys: "F9", label: "recall" },
            { keys: "1 / F2", label: "card" },
            { keys: "2", label: "cash" },
          ]}
        />

        {showReceipt && lastTxnId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-xl border border-nova-border bg-nova-card p-8 text-center">
              <div className="mb-2 text-4xl">✓</div>
              <p className="font-condensed text-xl font-bold">Sale complete</p>
              <p className="mt-2 font-mono text-sm text-nova-dim">{lastTxnId}</p>
              <button
                type="button"
                onClick={() => {
                  setShowReceipt(false);
                  searchRef.current?.focus();
                }}
                className="mt-6 w-full rounded-lg bg-nova-accent py-2.5 font-semibold text-nova-bg"
              >
                New sale (Enter)
              </button>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
