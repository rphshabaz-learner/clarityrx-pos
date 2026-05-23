"use client";

import { create } from "zustand";
import { makeSampleTransactions } from "@/lib/data/transactions";
import type { CartLine, NovaUser, PaymentMethod, SaleCustomer, SuspendedSale, Transaction } from "@/types";

const emptyCustomer = (): SaleCustomer => ({ name: "", phone: "" });

type NovaState = {
  user: NovaUser | null;
  till: number | null;
  activeTills: Record<number, number>;
  transactions: Transaction[];
  setUser: (user: NovaUser | null) => void;
  openTill: (till: number, userId: number) => void;
  releaseTill: (till: number) => void;
  addTransaction: (txn: Transaction) => void;
  logout: () => void;
};

export const useNovaStore = create<NovaState>((set, get) => ({
  user: null,
  till: null,
  activeTills: {},
  transactions: makeSampleTransactions(),

  setUser: (user) => set({ user }),

  openTill: (till, userId) =>
    set((s) => ({
      till,
      activeTills: { ...s.activeTills, [till]: userId },
    })),

  releaseTill: (till) =>
    set((s) => {
      const activeTills = { ...s.activeTills };
      delete activeTills[till];
      return { activeTills };
    }),

  addTransaction: (txn) =>
    set((s) => ({ transactions: [txn, ...s.transactions] })),

  logout: () => {
    const { till } = get();
    if (till != null) get().releaseTill(till);
    set({ user: null, till: null });
  },
}));

export type PosCartState = {
  cart: CartLine[];
  discountPct: number;
  customer: SaleCustomer;
  suspendedSales: SuspendedSale[];
  addProduct: (line: CartLine) => void;
  setQty: (id: number, qty: number) => void;
  removeLine: (id: number) => void;
  clearCart: () => void;
  setDiscountPct: (pct: number) => void;
  setCustomer: (customer: Partial<SaleCustomer>) => void;
  clearCustomer: () => void;
  loadCart: (cart: CartLine[], discountPct: number, customer?: SaleCustomer | null) => void;
  suspendSale: (meta: { till: number; cashierName: string }) => string | null;
  recallSale: (id: string) => boolean;
  discardSuspended: (id: string) => void;
};

let suspendCounter = 1;

export const usePosCart = create<PosCartState>((set, get) => ({
  cart: [],
  discountPct: 0,
  customer: emptyCustomer(),
  suspendedSales: [],

  addProduct: (product) =>
    set((s) => {
      const existing = s.cart.find((i) => i.id === product.id);
      if (existing) {
        return {
          cart: s.cart.map((i) =>
            i.id === product.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { cart: [...s.cart, { ...product, qty: 1 }] };
    }),

  setQty: (id, qty) =>
    set((s) => ({
      cart:
        qty <= 0
          ? s.cart.filter((i) => i.id !== id)
          : s.cart.map((i) => (i.id === id ? { ...i, qty } : i)),
    })),

  removeLine: (id) => set((s) => ({ cart: s.cart.filter((i) => i.id !== id) })),
  clearCart: () => set({ cart: [], discountPct: 0, customer: emptyCustomer() }),
  setDiscountPct: (pct) => set({ discountPct: Math.min(100, Math.max(0, pct)) }),

  setCustomer: (patch) =>
    set((s) => ({ customer: { ...s.customer, ...patch } })),

  clearCustomer: () => set({ customer: emptyCustomer() }),

  loadCart: (cart, discountPct, customer) =>
    set({
      cart: cart.map((l) => ({ ...l })),
      discountPct,
      customer: customer ? { ...customer } : emptyCustomer(),
    }),

  suspendSale: ({ till, cashierName }) => {
    const { cart, discountPct, customer } = get();
    if (!cart.length) return null;
    const id = `SUSP-${String(suspendCounter++).padStart(3, "0")}`;
    const label = `${id} · ${cart.length} line${cart.length === 1 ? "" : "s"}`;
    const sale: SuspendedSale = {
      id,
      label,
      till,
      cashierName,
      cart: cart.map((l) => ({ ...l })),
      discountPct,
      customer:
        customer.name.trim() || customer.phone.trim()
          ? { ...customer }
          : null,
      suspendedAt: new Date(),
    };
    set((s) => ({
      suspendedSales: [sale, ...s.suspendedSales],
      cart: [],
      discountPct: 0,
      customer: emptyCustomer(),
    }));
    return id;
  },

  recallSale: (id) => {
    const sale = get().suspendedSales.find((s) => s.id === id);
    if (!sale) return false;
    if (get().cart.length > 0) return false;
    set((s) => ({
      cart: sale.cart.map((l) => ({ ...l })),
      discountPct: sale.discountPct,
      customer: sale.customer ? { ...sale.customer } : emptyCustomer(),
      suspendedSales: s.suspendedSales.filter((x) => x.id !== id),
    }));
    return true;
  },

  discardSuspended: (id) =>
    set((s) => ({ suspendedSales: s.suspendedSales.filter((x) => x.id !== id) })),
}));

export function buildTransaction(params: {
  cart: CartLine[];
  subtotal: number;
  gst: number;
  pst: number;
  total: number;
  discount: number;
  method: PaymentMethod;
  user: NovaUser;
  till: number;
  customer?: SaleCustomer | null;
  cashIn?: number;
}): Transaction {
  const { transactions } = useNovaStore.getState();
  const customer =
    params.customer?.name.trim() || params.customer?.phone.trim()
      ? params.customer
      : null;
  return {
    id: `TXN-${String(transactions.length + 1).padStart(4, "0")}`,
    items: [...params.cart],
    subtotal: params.subtotal,
    gst: params.gst,
    pst: params.pst,
    tax: params.gst + params.pst,
    total: params.total,
    discount: params.discount,
    method: params.method,
    user: params.user,
    till: params.till,
    timestamp: new Date(),
    customer,
    cashIn: params.method === "cash" ? params.cashIn ?? null : null,
  };
}
