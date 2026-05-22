import { computeMarginPercent } from "../inventory/margin";
import { departmentLabel } from "../inventory/frontStoreTypes";
import { todayBusinessDate } from "./businessDate";

function sumMoney(rows, pick) {
  return rows.reduce((sum, row) => sum + (Number(pick(row)) || 0), 0);
}

export function salesForBusinessDate(sales, businessDate = todayBusinessDate()) {
  return (sales || []).filter((row) => row.businessDate === businessDate);
}

export function salesForTill(sales, tillNumber) {
  const till = Number(tillNumber);
  return (sales || []).filter((row) => Number(row.tillNumber) === till);
}

function isCashPayment(method) {
  const m = String(method || "").toLowerCase();
  return m === "cash" || m.includes("cash");
}

function cashAmountFromSale(sale) {
  if (sale.splitPayments?.length) {
    return sale.splitPayments
      .filter((row) => isCashPayment(row.method))
      .reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  }
  if (isCashPayment(sale.payMethod)) return Number(sale.total) || 0;
  return 0;
}

export function buildSkuDepartmentMap(products) {
  const map = new Map();
  (products || []).forEach((product) => {
    const sku = String(product.sku || "").trim().toLowerCase();
    if (!sku) return;
    map.set(sku, product.departmentId || product.category || "");
  });
  return map;
}

export function aggregateDailySales(sales, businessDate = todayBusinessDate()) {
  const rows = salesForBusinessDate(sales, businessDate);
  const transactionCount = rows.length;
  const grossSales = sumMoney(rows, (r) => r.total);
  const discounts = sumMoney(rows, (r) => (Number(r.discount) || 0) + (Number(r.couponDiscount) || 0));
  const tax = sumMoney(rows, (r) => r.tax);
  const itemsSold = rows.reduce((sum, row) => sum + (row.lines || []).reduce((s, line) => s + (Number(line.qty) || 0), 0), 0);
  const avgTicket = transactionCount > 0 ? grossSales / transactionCount : 0;
  return {
    businessDate,
    transactionCount,
    grossSales,
    discounts,
    tax,
    netSales: grossSales - discounts,
    itemsSold,
    avgTicket,
  };
}

export function aggregateHourlySales(sales, businessDate = todayBusinessDate()) {
  const rows = salesForBusinessDate(sales, businessDate);
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}:00`,
    transactions: 0,
    total: 0,
  }));
  rows.forEach((sale) => {
    const hour = new Date(sale.chargedAt || 0).getHours();
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) return;
    buckets[hour].transactions += 1;
    buckets[hour].total += Number(sale.total) || 0;
  });
  return buckets;
}

export function aggregateTillBalancing(sales, businessDate = todayBusinessDate(), tillNumber = null) {
  let rows = salesForBusinessDate(sales, businessDate);
  if (tillNumber != null) rows = salesForTill(rows, tillNumber);
  const byTill = new Map();
  rows.forEach((sale) => {
    const till = Number(sale.tillNumber) || 1;
    if (!byTill.has(till)) {
      byTill.set(till, { tillNumber: till, transactions: 0, gross: 0, cash: 0, card: 0, other: 0 });
    }
    const bucket = byTill.get(till);
    bucket.transactions += 1;
    bucket.gross += Number(sale.total) || 0;
    const cash = cashAmountFromSale(sale);
    bucket.cash += cash;
    const total = Number(sale.total) || 0;
    if (sale.splitPayments?.length) {
      sale.splitPayments.forEach((row) => {
        const amt = Number(row.amount) || 0;
        if (isCashPayment(row.method)) return;
        const method = String(row.method || "").toLowerCase();
        if (method.includes("card") || method.includes("debit") || method.includes("credit")) {
          bucket.card += amt;
        } else {
          bucket.other += amt;
        }
      });
    } else if (!isCashPayment(sale.payMethod)) {
      const method = String(sale.payMethod || "").toLowerCase();
      if (method.includes("card") || method.includes("debit") || method.includes("credit")) {
        bucket.card += total;
      } else {
        bucket.other += total;
      }
    }
  });
  return [...byTill.values()].sort((a, b) => a.tillNumber - b.tillNumber);
}

export function aggregateCashReconciliation(sales, businessDate = todayBusinessDate()) {
  const rows = salesForBusinessDate(sales, businessDate);
  let cashSales = 0;
  let cashTendered = 0;
  let changeGiven = 0;
  rows.forEach((sale) => {
    const cash = cashAmountFromSale(sale);
    if (cash <= 0) return;
    cashSales += cash;
    if (sale.tenderedAmount != null && Number.isFinite(Number(sale.tenderedAmount))) {
      cashTendered += Number(sale.tenderedAmount);
      changeGiven += Number(sale.changeDue) || 0;
    } else {
      cashTendered += cash;
    }
  });
  const expectedDrawer = cashTendered - changeGiven;
  return {
    businessDate,
    cashTransactions: rows.filter((sale) => cashAmountFromSale(sale) > 0).length,
    cashSales,
    cashTendered,
    changeGiven,
    expectedDrawer,
    overShort: null,
  };
}

export function aggregateProfitMargins(products) {
  return (products || [])
    .map((product) => {
      const cost = Number(product.cost) || 0;
      const retail = Number(product.retail) || 0;
      const onHand = Number(product.onHand) || 0;
      const margin = computeMarginPercent(cost, retail);
      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        departmentId: product.departmentId,
        cost,
        retail,
        onHand,
        marginPercent: margin,
        inventoryValue: cost * onHand,
        retailValue: retail * onHand,
      };
    })
    .sort((a, b) => (b.marginPercent ?? -1) - (a.marginPercent ?? -1));
}

export function aggregateDepartmentPerformance(sales, products, businessDate = todayBusinessDate()) {
  const skuMap = buildSkuDepartmentMap(products);
  const rows = salesForBusinessDate(sales, businessDate);
  const byDept = new Map();
  rows.forEach((sale) => {
    (sale.lines || []).forEach((line) => {
      const sku = String(line.sku || "").trim().toLowerCase();
      const deptKey = skuMap.get(sku) || line.category || "other";
      const label = departmentLabel(deptKey) || deptKey || "Other";
      if (!byDept.has(deptKey)) {
        byDept.set(deptKey, { departmentId: deptKey, label, revenue: 0, units: 0, transactions: 0 });
      }
      const bucket = byDept.get(deptKey);
      bucket.revenue += Number(line.lineTotal) || 0;
      bucket.units += Number(line.qty) || 0;
    });
  });
  return [...byDept.values()].sort((a, b) => b.revenue - a.revenue);
}

export function rankTopSellingItems(sales, businessDate = todayBusinessDate(), limit = 25) {
  const rows = salesForBusinessDate(sales, businessDate);
  const bySku = new Map();
  rows.forEach((sale) => {
    (sale.lines || []).forEach((line) => {
      const sku = String(line.sku || "").trim();
      if (!sku) return;
      const key = sku.toLowerCase();
      if (!bySku.has(key)) {
        bySku.set(key, { sku, name: line.name, units: 0, revenue: 0 });
      }
      const bucket = bySku.get(key);
      bucket.units += Number(line.qty) || 0;
      bucket.revenue += Number(line.lineTotal) || 0;
      if (line.name) bucket.name = line.name;
    });
  });
  return [...bySku.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export function findDeadStock(products, sales, staleDays = 45) {
  const cutoff = Date.now() - staleDays * 24 * 60 * 60 * 1000;
  const lastSold = new Map();
  (sales || []).forEach((sale) => {
    const ts = sale.chargedAt || 0;
    (sale.lines || []).forEach((line) => {
      const sku = String(line.sku || "").trim().toLowerCase();
      if (!sku) return;
      const prev = lastSold.get(sku) || 0;
      if (ts > prev) lastSold.set(sku, ts);
    });
  });
  return (products || [])
    .filter((product) => (Number(product.onHand) || 0) > 0)
    .map((product) => {
      const sku = String(product.sku || "").trim().toLowerCase();
      const soldAt = lastSold.get(sku) || 0;
      const daysSinceSale = soldAt ? Math.floor((Date.now() - soldAt) / (24 * 60 * 60 * 1000)) : null;
      return {
        ...product,
        lastSoldAt: soldAt || null,
        daysSinceSale,
        inventoryValue: (Number(product.cost) || 0) * (Number(product.onHand) || 0),
      };
    })
    .filter((row) => !row.lastSoldAt || row.lastSoldAt < cutoff)
    .sort((a, b) => (b.inventoryValue || 0) - (a.inventoryValue || 0));
}

export function aggregateShrinkage(damagedRows, products) {
  const damagedValue = (damagedRows || [])
    .filter((row) => row.status === "open" || row.status === "pending")
    .reduce((sum, row) => sum + (Number(row.estimatedValue) || Number(row.qty) * Number(row.unitCost) || 0), 0);
  const negativeOnHand = (products || []).filter((row) => (Number(row.onHand) || 0) < 0);
  return {
    openDamagedCount: (damagedRows || []).filter((row) => row.status === "open").length,
    damagedValue,
    negativeOnHandCount: negativeOnHand.length,
    negativeOnHandSkus: negativeOnHand.map((row) => row.sku).slice(0, 10),
  };
}

export function computeInventoryValuation(products) {
  const rows = products || [];
  const costValue = rows.reduce((sum, row) => sum + (Number(row.cost) || 0) * (Number(row.onHand) || 0), 0);
  const retailValue = rows.reduce((sum, row) => sum + (Number(row.retail) || 0) * (Number(row.onHand) || 0), 0);
  const skuCount = rows.filter((row) => (Number(row.onHand) || 0) > 0).length;
  const unitsOnHand = rows.reduce((sum, row) => sum + (Number(row.onHand) || 0), 0);
  return { costValue, retailValue, skuCount, unitsOnHand, productCount: rows.length };
}

export function aggregateCategoryPerformance(sales, businessDate = todayBusinessDate()) {
  const rows = salesForBusinessDate(sales, businessDate);
  const byCategory = new Map();
  rows.forEach((sale) => {
    (sale.lines || []).forEach((line) => {
      const category = String(line.category || "Uncategorized").trim() || "Uncategorized";
      if (!byCategory.has(category)) {
        byCategory.set(category, { category, revenue: 0, units: 0 });
      }
      const bucket = byCategory.get(category);
      bucket.revenue += Number(line.lineTotal) || 0;
      bucket.units += Number(line.qty) || 0;
    });
  });
  return [...byCategory.values()].sort((a, b) => b.revenue - a.revenue);
}

export function summarizeVendorPurchases(orders) {
  const rows = orders || [];
  const open = rows.filter((o) => o.status !== "received" && o.status !== "cancelled");
  const received = rows.filter((o) => o.status === "received");
  const totalOpenValue = open.reduce((sum, order) => {
    const lines = order.lines || [];
    return sum + lines.reduce((s, line) => s + (Number(line.qtyOrdered) || 0) * (Number(line.unitCost) || 0), 0);
  }, 0);
  const bySupplier = new Map();
  rows.forEach((order) => {
    const supplier = order.supplier || "unknown";
    if (!bySupplier.has(supplier)) {
      bySupplier.set(supplier, { supplier, orders: 0, value: 0 });
    }
    const bucket = bySupplier.get(supplier);
    bucket.orders += 1;
    const lines = order.lines || [];
    bucket.value += lines.reduce((s, line) => s + (Number(line.qtyOrdered) || 0) * (Number(line.unitCost) || 0), 0);
  });
  return {
    totalOrders: rows.length,
    openOrders: open.length,
    receivedOrders: received.length,
    totalOpenValue,
    bySupplier: [...bySupplier.values()].sort((a, b) => b.value - a.value),
    recentOrders: [...rows]
      .sort((a, b) => new Date(b.date || b.updatedAt || 0) - new Date(a.date || a.updatedAt || 0))
      .slice(0, 15),
  };
}

export function aggregateEmployeeSales(sales, businessDate = todayBusinessDate()) {
  const rows = salesForBusinessDate(sales, businessDate);
  const byCashier = new Map();
  rows.forEach((sale) => {
    const id = sale.cashierId || "unknown";
    if (!byCashier.has(id)) {
      byCashier.set(id, {
        cashierId: id,
        cashierName: sale.cashierName || id,
        transactions: 0,
        total: 0,
        items: 0,
      });
    }
    const bucket = byCashier.get(id);
    bucket.transactions += 1;
    bucket.total += Number(sale.total) || 0;
    bucket.items += (sale.lines || []).reduce((s, line) => s + (Number(line.qty) || 0), 0);
    if (sale.cashierName) bucket.cashierName = sale.cashierName;
  });
  return [...byCashier.values()].sort((a, b) => b.total - a.total);
}

export function buildEndOfDayReport(sales, shift, activities) {
  const businessDate = shift?.businessDate || todayBusinessDate();
  const daily = aggregateDailySales(sales, businessDate);
  const cash = aggregateCashReconciliation(sales, businessDate);
  const till = aggregateTillBalancing(sales, businessDate);
  const posActivities = (activities || []).filter((row) => row.category === "pos").length;
  return {
    businessDate,
    shift,
    daily,
    cash,
    till,
    posActivityCount: posActivities,
    generatedAt: Date.now(),
  };
}

export function buildCashierAudit(sales, shift, activities, cashierId) {
  const businessDate = shift?.businessDate || todayBusinessDate();
  const id = cashierId || shift?.cashierId || "";
  const cashierSales = salesForBusinessDate(sales, businessDate).filter((row) => row.cashierId === id);
  const posEvents = (activities || []).filter(
    (row) => row.category === "pos" && String(row.detail?.tillNumber ?? "") !== ""
  );
  return {
    businessDate,
    cashierId: id,
    transactionCount: cashierSales.length,
    grossSales: sumMoney(cashierSales, (r) => r.total),
    voidLikeEvents: posEvents.filter((row) => /suspend|cancel|override/i.test(row.message || "")).length,
    recentSales: cashierSales.slice(0, 20),
    recentActivities: posEvents.slice(0, 30),
  };
}

export function filterAuditActivities(activities, { category, query, limit = 200 } = {}) {
  let rows = [...(activities || [])];
  if (category && category !== "all") {
    rows = rows.filter((row) => row.category === category);
  }
  if (query?.trim()) {
    const q = query.trim().toLowerCase();
    rows = rows.filter(
      (row) =>
        String(row.message || "").toLowerCase().includes(q) ||
        String(row.category || "").toLowerCase().includes(q) ||
        JSON.stringify(row.detail || {}).toLowerCase().includes(q)
    );
  }
  return rows.slice(0, limit);
}
