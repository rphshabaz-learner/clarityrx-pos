/**
 * Multi-till stress harness: parallel completed sales, mixed tenders,
 * invoice uniqueness, inventory deltas, and report reconciliation.
 */
import { POS_TILL_OPTIONS } from "../posTill";
import { buildCompletedSaleSnapshot } from "./saleSnapshot";
import { formatBusinessDate } from "./businessDate";
import {
  aggregateDailySales,
  aggregateTillBalancing,
  sumTillBalanceRows,
  aggregateCashReconciliation,
} from "./reportAggregates";
import {
  assertInvoiceNumberAvailable,
  findConflictingSale,
  INVOICE_SCOPE_GLOBAL,
  INVOICE_SCOPE_PER_TILL,
} from "../invoice/invoiceNumbering";

const BUSINESS_DATE = formatBusinessDate(new Date("2026-05-22T14:00:00"));
const SHIFT_STUB = { id: "shift-test", businessDate: BUSINESS_DATE, openedBy: "cashier-test" };
const USER_STUB = { id: "u-test", fullName: "Test Cashier", username: "test" };

/** Mirrors PosScreen checkout inventory transmit payload. */
function buildInventoryLinesFromCart(cart) {
  return cart
    .filter((line) => line?.sku && Number(line.qty) > 0)
    .map((line) => ({
      sku: String(line.sku),
      quantityDelta: -Math.abs(Number(line.qty)),
    }));
}

function applyInventoryAdjustments(productsBySku, lines) {
  const next = new Map(productsBySku);
  for (const { sku, quantityDelta } of lines) {
    const key = String(sku).trim().toLowerCase();
    const product = next.get(key);
    if (!product) throw new Error(`Unknown SKU ${sku}`);
    next.set(key, {
      ...product,
      onHand: (Number(product.onHand) || 0) + quantityDelta,
    });
  }
  return next;
}

function seedProducts() {
  const rows = [
    { sku: "FS-1001", name: "Tylenol", onHand: 100, retail: 8.99 },
    { sku: "FS-1002", name: "Advil", onHand: 80, retail: 10.49 },
    { sku: "FS-1003", name: "Tums", onHand: 60, retail: 6.49 },
    { sku: "FS-1004", name: "Polysporin", onHand: 40, retail: 12.99 },
    { sku: "FS-1005", name: "Reactine", onHand: 50, retail: 18.49 },
    { sku: "FS-1006", name: "Vitamin D", onHand: 70, retail: 11.99 },
    { sku: "FS-1007", name: "Bandages", onHand: 90, retail: 5.99 },
    { sku: "FS-1008", name: "Saline", onHand: 30, retail: 7.49 },
  ];
  return new Map(rows.map((row) => [row.sku.toLowerCase(), { ...row }]));
}

function formatTillInvoice(tillNumber, seq, scope) {
  if (scope === INVOICE_SCOPE_PER_TILL) {
    const pad = String(tillNumber).padStart(2, "0");
    return `POS-T${pad}-${String(seq).padStart(6, "0")}`;
  }
  return `POS-${String(seq).padStart(6, "0")}`;
}

const PAYMENT_SCENARIOS = [
  { label: "cash", payMethod: "Cash", splitPayments: null, cashTender: true },
  { label: "debit", payMethod: "Debit", splitPayments: null },
  { label: "credit", payMethod: "Credit Card", splitPayments: null },
  { label: "split-cash-debit", payMethod: "Split", splitKind: "cash-debit" },
  { label: "split-gift-credit", payMethod: "Split", splitKind: "gift-credit" },
  { label: "gift", payMethod: "Gift Card", splitPayments: null },
  { label: "insurance", payMethod: "Insurance", splitPayments: null },
  { label: "other", payMethod: "Other", splitPayments: null },
];

function cartForTill(tillNumber, saleIndex) {
  const skuIndex = (tillNumber + saleIndex) % 8;
  const skus = ["FS-1001", "FS-1002", "FS-1003", "FS-1004", "FS-1005", "FS-1006", "FS-1007", "FS-1008"];
  const sku = skus[skuIndex];
  const qty = 1 + (saleIndex % 3);
  const price = [8.99, 10.49, 6.49, 12.99, 18.49, 11.99, 5.99, 7.49][skuIndex];
  return [{ sku, name: `Item ${sku}`, category: "Test", qty, price }];
}

function totalsFromCart(cart) {
  const subtotal = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
  const tax = Number((subtotal * 0.13).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  return { subtotal: Number(subtotal.toFixed(2)), discount: 0, couponDiscount: 0, tax, total };
}

function resolvePaymentScenario(scenario, total) {
  if (scenario.cashTender) {
    const tenderedAmount = Number((total + 5).toFixed(2));
    return {
      payMethod: "Cash",
      splitPayments: null,
      tenderedAmount,
      changeDue: Number((tenderedAmount - total).toFixed(2)),
    };
  }
  if (!scenario.splitKind) {
    return {
      payMethod: scenario.payMethod,
      splitPayments: scenario.splitPayments,
      tenderedAmount: scenario.tenderedAmount ?? null,
      changeDue: scenario.changeDue ?? 0,
    };
  }
  if (scenario.splitKind === "cash-debit") {
    const cash = Number((total * 0.4).toFixed(2));
    const debit = Number((total - cash).toFixed(2));
    const tenderedAmount = Number((cash + 5).toFixed(2));
    return {
      payMethod: "Split",
      splitPayments: [
        { method: "Cash", amount: cash },
        { method: "Debit", amount: debit },
      ],
      tenderedAmount,
      changeDue: Number((tenderedAmount - cash).toFixed(2)),
    };
  }
  const gift = Number((total * 0.35).toFixed(2));
  const credit = Number((total - gift).toFixed(2));
  return {
    payMethod: "Split",
    splitPayments: [
      { method: "Gift Card", amount: gift },
      { method: "Credit Card", amount: credit },
    ],
    tenderedAmount: null,
    changeDue: 0,
  };
}

function createInvoiceAllocator(scope) {
  let globalSeq = 0;
  const perTillSeq = new Map();
  return (tillNumber) => {
    if (scope === INVOICE_SCOPE_PER_TILL) {
      const next = (perTillSeq.get(tillNumber) || 0) + 1;
      perTillSeq.set(tillNumber, next);
      return formatTillInvoice(tillNumber, next, scope);
    }
    globalSeq += 1;
    return formatTillInvoice(1, globalSeq, scope);
  };
}

async function simulateParallelTillSales({
  tillNumbers,
  salesPerTill = 1,
  scope = INVOICE_SCOPE_GLOBAL,
}) {
  const allocateInvoice = createInvoiceAllocator(scope);
  const jobs = [];

  for (const tillNumber of tillNumbers) {
    for (let saleIndex = 0; saleIndex < salesPerTill; saleIndex += 1) {
      jobs.push({
        tillNumber,
        saleIndex,
        invoiceNumber: allocateInvoice(tillNumber),
      });
    }
  }

  let productsBySku = seedProducts();
  const expectedQtySoldBySku = new Map();

  const built = await Promise.all(
    jobs.map(async ({ tillNumber, saleIndex, invoiceNumber }) => {
      const scenario = PAYMENT_SCENARIOS[(tillNumber + saleIndex) % PAYMENT_SCENARIOS.length];
      const cart = cartForTill(tillNumber, saleIndex);
      const totals = totalsFromCart(cart);
      const payment = resolvePaymentScenario(scenario, totals.total);

      const snapshot = buildCompletedSaleSnapshot({
        cart,
        result: { invoiceNumber },
        totals,
        payMethod: payment.payMethod,
        splitPayments: payment.splitPayments,
        tillNumber,
        shift: SHIFT_STUB,
        user: USER_STUB,
        tenderedAmount: payment.tenderedAmount,
        changeDue: payment.changeDue,
        taxExempt: false,
      });

      snapshot.businessDate = BUSINESS_DATE;
      snapshot.chargedAt = Date.now() + tillNumber * 10 + saleIndex;
      return { snapshot, cart };
    })
  );

  built.sort((a, b) => (a.snapshot.chargedAt || 0) - (b.snapshot.chargedAt || 0));
  const persisted = [];
  for (const { snapshot, cart } of built) {
    assertInvoiceNumberAvailable(persisted, snapshot, scope);
    const inventoryLines = buildInventoryLinesFromCart(cart);
    for (const line of inventoryLines) {
      const key = line.sku.toLowerCase();
      expectedQtySoldBySku.set(key, (expectedQtySoldBySku.get(key) || 0) + Math.abs(line.quantityDelta));
    }
    productsBySku = applyInventoryAdjustments(productsBySku, inventoryLines);
    persisted.push(snapshot);
  }
  return { sales: persisted, productsBySku, expectedQtySoldBySku };
}

function assertReportsBalance(sales) {
  const daily = aggregateDailySales(sales, BUSINESS_DATE);
  const tillRows = aggregateTillBalancing(sales, BUSINESS_DATE);
  const combined = sumTillBalanceRows(tillRows);
  const cash = aggregateCashReconciliation(sales, BUSINESS_DATE);

  expect(daily.transactionCount).toBe(sales.length);
  expect(combined.transactions).toBe(sales.length);

  const saleGross = sales.reduce((sum, row) => sum + (Number(row.total) || 0), 0);
  expect(daily.grossSales).toBeCloseTo(saleGross, 2);
  expect(combined.gross).toBeCloseTo(saleGross, 2);

  const itemsFromLines = sales.reduce(
    (sum, sale) => sum + (sale.lines || []).reduce((s, line) => s + (Number(line.qty) || 0), 0),
    0
  );
  expect(daily.itemsSold).toBe(itemsFromLines);

  tillRows.forEach((row) => {
    const tenderTotal = (Number(row.cash) || 0) + (Number(row.card) || 0) + (Number(row.other) || 0);
    expect(tenderTotal).toBeCloseTo(Number(row.gross) || 0, 2);
  });

  expect(combined.cash).toBeCloseTo(
    tillRows.reduce((sum, row) => sum + (Number(row.cash) || 0), 0),
    2
  );
  expect(combined.card).toBeCloseTo(
    tillRows.reduce((sum, row) => sum + (Number(row.card) || 0), 0),
    2
  );
  expect(combined.other).toBeCloseTo(
    tillRows.reduce((sum, row) => sum + (Number(row.other) || 0), 0),
    2
  );

  const cashSalesFromRows = sales.reduce((sum, sale) => {
    if (sale.splitPayments?.length) {
      return (
        sum +
        sale.splitPayments
          .filter((row) => String(row.method).toLowerCase().includes("cash"))
          .reduce((s, row) => s + (Number(row.amount) || 0), 0)
      );
    }
    return sum + (String(sale.payMethod).toLowerCase() === "cash" ? Number(sale.total) || 0 : 0);
  }, 0);
  expect(cash.cashSales).toBeCloseTo(cashSalesFromRows, 2);
}

describe("multi-till parallel sales harness", () => {
  it("runs 12 tills in parallel with mixed payments and balanced store reports (global invoices)", async () => {
    const { sales, productsBySku, expectedQtySoldBySku } = await simulateParallelTillSales({
      tillNumbers: POS_TILL_OPTIONS,
      salesPerTill: 1,
      scope: INVOICE_SCOPE_GLOBAL,
    });

    expect(sales.length).toBeGreaterThanOrEqual(10);
    expect(new Set(sales.map((row) => row.invoiceNumber)).size).toBe(sales.length);

    const invoiceNumbers = sales.map((row) => row.invoiceNumber);
    expect(invoiceNumbers.every((n) => /^POS-\d{6}$/.test(n))).toBe(true);

    for (const [sku, sold] of expectedQtySoldBySku.entries()) {
      const product = productsBySku.get(sku);
      const seed = seedProducts().get(sku);
      expect(product.onHand).toBe((Number(seed.onHand) || 0) - sold);
    }

    assertReportsBalance(sales);
  });

  it("runs 10 tills × 2 parallel sales with per-till invoice scope", async () => {
    const activeTills = POS_TILL_OPTIONS.slice(0, 10);
    const { sales } = await simulateParallelTillSales({
      tillNumbers: activeTills,
      salesPerTill: 2,
      scope: INVOICE_SCOPE_PER_TILL,
    });

    expect(sales.length).toBe(20);

    activeTills.forEach((till) => {
      const onTill = sales.filter((row) => Number(row.tillNumber) === till);
      const invoices = onTill.map((row) => row.invoiceNumber);
      expect(new Set(invoices).size).toBe(2);
      expect(invoices.every((n) => n.startsWith(`POS-T${String(till).padStart(2, "0")}-`))).toBe(true);
    });

    expect(
      findConflictingSale(
        [{ invoiceNumber: "POS-T01-000001", tillNumber: 1 }],
        { invoiceNumber: "POS-T01-000001", tillNumber: 2 },
        INVOICE_SCOPE_PER_TILL
      )
    ).toBeNull();

    assertReportsBalance(sales);
  });

  it("rejects duplicate invoice numbers under global scope", () => {
    const existing = [{ id: "s1", invoiceNumber: "POS-000099", tillNumber: 3 }];
    const duplicate = { id: "s2", invoiceNumber: "POS-000099", tillNumber: 7 };

    let err;
    try {
      assertInvoiceNumberAvailable(existing, duplicate, INVOICE_SCOPE_GLOBAL);
    } catch (caught) {
      err = caught;
    }
    expect(err).toBeDefined();
    expect(err.message).toMatch(/already exists/);
    expect(err.code).toBe("POS_INVOICE_DUPLICATE");
  });
});
