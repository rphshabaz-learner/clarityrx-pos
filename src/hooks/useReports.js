import { useCallback, useEffect, useMemo, useState } from "react";
import {
  activityList,
  getAllPurchaseOrders,
  immutableAuditList,
  listCompletedSales,
  listDamagedGoods,
  listFrontStoreProducts,
} from "../lib/clarityIndexedDb";
import { listTillShiftsForBusinessDate } from "../lib/posShift";
import { todayBusinessDate, formatBusinessDateLabel } from "../lib/reporting/businessDate";
import {
  aggregateCashReconciliation,
  aggregateCategoryPerformance,
  aggregateDailySales,
  aggregateDepartmentPerformance,
  aggregateEmployeeSales,
  aggregateHourlySales,
  aggregateProfitMargins,
  aggregateShrinkage,
  aggregateTillBalancing,
  sumTillBalanceRows,
  buildCashierAudit,
  buildEndOfDayReport,
  computeInventoryValuation,
  findDeadStock,
  rankTopSellingItems,
  summarizeVendorPurchases,
} from "../lib/reporting/reportAggregates";

export function useReports({ onNotify } = {}) {
  const [loading, setLoading] = useState(true);
  const [businessDate, setBusinessDate] = useState(todayBusinessDate());
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [damaged, setDamaged] = useState([]);
  const [activities, setActivities] = useState([]);
  const [immutableAudit, setImmutableAudit] = useState([]);
  const [tillShifts, setTillShifts] = useState(() => listTillShiftsForBusinessDate(todayBusinessDate()));

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [saleRows, productRows, orderRows, damagedRows, activityRows, auditRows] = await Promise.all([
        listCompletedSales(),
        listFrontStoreProducts(),
        getAllPurchaseOrders(),
        listDamagedGoods(),
        activityList(500),
        immutableAuditList(500),
      ]);
      setSales(saleRows);
      setProducts(productRows);
      setOrders(orderRows);
      setDamaged(damagedRows);
      setActivities(activityRows);
      setImmutableAudit(auditRows);
      setTillShifts(listTillShiftsForBusinessDate(businessDate));
    } catch (e) {
      onNotify?.(e.message || "Unable to load reporting data.", "error");
    } finally {
      setLoading(false);
    }
  }, [businessDate, onNotify]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setTillShifts(listTillShiftsForBusinessDate(businessDate));
  }, [businessDate]);

  const metrics = useMemo(() => {
    const daily = aggregateDailySales(sales, businessDate);
    const hourly = aggregateHourlySales(sales, businessDate);
    const tillBalancing = aggregateTillBalancing(sales, businessDate);
    const tillBalancingCombined = sumTillBalanceRows(tillBalancing);
    const cashReconciliation = aggregateCashReconciliation(sales, businessDate);
    const profitMargins = aggregateProfitMargins(products);
    const departmentPerformance = aggregateDepartmentPerformance(sales, products, businessDate);
    const topSellingItems = rankTopSellingItems(sales, businessDate);
    const deadStock = findDeadStock(products, sales);
    const shrinkage = aggregateShrinkage(damaged, products);
    const employeeSales = aggregateEmployeeSales(sales, businessDate);
    const categoryPerformance = aggregateCategoryPerformance(sales, businessDate);
    const vendorPurchases = summarizeVendorPurchases(orders);
    const inventoryValuation = computeInventoryValuation(products);
    const endOfDay = buildEndOfDayReport(sales, tillShifts, activities, businessDate);
    const cashierAudit = buildCashierAudit(sales, tillShifts[0] || null, activities, null);

    const avgMargin =
      profitMargins.length > 0
        ? profitMargins.reduce((s, row) => s + (row.marginPercent ?? 0), 0) /
          profitMargins.filter((row) => row.marginPercent != null).length
        : null;

    return {
      daily,
      hourly,
      tillBalancing,
      tillBalancingCombined,
      cashReconciliation,
      profitMargins,
      avgMargin,
      departmentPerformance,
      topSellingItems,
      deadStock,
      shrinkage,
      employeeSales,
      categoryPerformance,
      vendorPurchases,
      inventoryValuation,
      endOfDay,
      cashierAudit,
    };
  }, [sales, products, orders, damaged, activities, tillShifts, businessDate]);

  return {
    loading,
    businessDate,
    setBusinessDate,
    businessDateLabel: formatBusinessDateLabel(businessDate),
    sales,
    products,
    orders,
    damaged,
    activities,
    immutableAudit,
    tillShifts,
    refresh,
    ...metrics,
  };
}
