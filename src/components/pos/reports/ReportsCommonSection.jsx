import React, { useState } from "react";
import { wholesalerLabel } from "../../../lib/purchasing/wholesalers";
import { DataTable, SectionIntro, StatChip, StatRow, SubTabs, formatMoney } from "./ReportsShared";

const TABS = [
  { id: "categories", label: "Category performance" },
  { id: "vendors", label: "Vendor purchases" },
];

export default function ReportsCommonSection({ reports }) {
  const [tab, setTab] = useState("categories");
  const { categoryPerformance, vendorPurchases, businessDateLabel } = reports;

  return (
    <div>
      <SectionIntro
        title="Common reports"
        description={`Standard store reports for ${businessDateLabel} and purchasing history.`}
      />
      <SubTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "categories" ? (
        <DataTable
          columns={[
            { key: "category", label: "Category" },
            { key: "units", label: "Units" },
            { key: "revenue", label: "Revenue", render: (row) => formatMoney(row.revenue) },
          ]}
          rows={categoryPerformance}
          emptyMessage="No category sales for this date."
        />
      ) : null}

      {tab === "vendors" ? (
        <>
          <StatRow>
            <StatChip label="Total POs" value={String(vendorPurchases.totalOrders)} tone="primary" />
            <StatChip label="Open POs" value={String(vendorPurchases.openOrders)} />
            <StatChip label="Open value" value={formatMoney(vendorPurchases.totalOpenValue)} />
          </StatRow>
          <DataTable
            columns={[
              {
                key: "supplier",
                label: "Vendor",
                render: (row) => wholesalerLabel(row.supplier),
              },
              { key: "orders", label: "Orders" },
              { key: "value", label: "Value", render: (row) => formatMoney(row.value) },
            ]}
            rows={vendorPurchases.bySupplier}
            emptyMessage="No purchase orders on file."
          />
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Recent purchase orders</div>
            <DataTable
              columns={[
                { key: "orderNumber", label: "PO #" },
                {
                  key: "supplier",
                  label: "Vendor",
                  render: (row) => wholesalerLabel(row.supplier),
                },
                { key: "status", label: "Status" },
                { key: "date", label: "Date" },
              ]}
              rows={vendorPurchases.recentOrders}
              emptyMessage="No recent orders."
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
