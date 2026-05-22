import React, { useState } from "react";
import { DataTable, SectionIntro, StatChip, StatRow, SubTabs, formatMoney } from "./ReportsShared";

const TABS = [
  { id: "daily", label: "Daily sales" },
  { id: "hourly", label: "Hourly sales" },
  { id: "top", label: "Top selling" },
  { id: "employees", label: "Employees" },
];

export default function ReportsSalesSection({ reports }) {
  const [tab, setTab] = useState("daily");
  const { daily, hourly, topSellingItems, employeeSales, businessDateLabel } = reports;

  return (
    <div>
      <SectionIntro title="Sales analytics" description={`Performance for ${businessDateLabel}.`} />
      <SubTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "daily" ? (
        <>
          <StatRow>
            <StatChip label="Gross" value={formatMoney(daily.grossSales)} tone="primary" />
            <StatChip label="Discounts" value={formatMoney(daily.discounts)} />
            <StatChip label="Tax" value={formatMoney(daily.tax)} />
            <StatChip label="Transactions" value={String(daily.transactionCount)} />
          </StatRow>
        </>
      ) : null}

      {tab === "hourly" ? (
        <DataTable
          columns={[
            { key: "label", label: "Hour" },
            { key: "transactions", label: "Txns" },
            { key: "total", label: "Sales", render: (row) => formatMoney(row.total) },
          ]}
          rows={hourly.filter((row) => row.transactions > 0)}
          emptyMessage="No hourly sales for this date."
        />
      ) : null}

      {tab === "top" ? (
        <DataTable
          columns={[
            { key: "sku", label: "SKU" },
            { key: "name", label: "Item" },
            { key: "units", label: "Qty" },
            { key: "revenue", label: "Revenue", render: (row) => formatMoney(row.revenue) },
          ]}
          rows={topSellingItems}
          emptyMessage="No line items sold for this date."
        />
      ) : null}

      {tab === "employees" ? (
        <DataTable
          columns={[
            { key: "cashierName", label: "Employee" },
            { key: "transactions", label: "Txns" },
            { key: "items", label: "Items" },
            { key: "total", label: "Sales", render: (row) => formatMoney(row.total) },
          ]}
          rows={employeeSales}
          emptyMessage="No employee-attributed sales for this date."
        />
      ) : null}
    </div>
  );
}
