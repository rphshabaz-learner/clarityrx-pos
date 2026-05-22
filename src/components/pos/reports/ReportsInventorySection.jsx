import React, { useState } from "react";
import { departmentLabel } from "../../../lib/inventory/frontStoreTypes";
import { DataTable, SectionIntro, StatChip, StatRow, SubTabs, formatMoney } from "./ReportsShared";

const TABS = [
  { id: "margins", label: "Profit margins" },
  { id: "departments", label: "Departments" },
  { id: "dead", label: "Dead stock" },
  { id: "shrinkage", label: "Shrinkage" },
  { id: "valuation", label: "Valuation" },
];

function formatMargin(row) {
  if (row.marginPercent == null) return "—";
  return `${row.marginPercent.toFixed(1)}%`;
}

export default function ReportsInventorySection({ reports }) {
  const [tab, setTab] = useState("margins");
  const {
    profitMargins,
    avgMargin,
    departmentPerformance,
    deadStock,
    shrinkage,
    inventoryValuation,
    businessDateLabel,
  } = reports;

  return (
    <div>
      <SectionIntro
        title="Inventory insights"
        description={`Margins and stock metrics; sales mix for ${businessDateLabel}.`}
      />
      <SubTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "margins" ? (
        <>
          <StatRow>
            <StatChip
              label="Avg margin"
              value={avgMargin != null && Number.isFinite(avgMargin) ? `${avgMargin.toFixed(1)}%` : "—"}
              tone="primary"
            />
            <StatChip label="SKUs" value={String(profitMargins.length)} />
          </StatRow>
          <DataTable
            columns={[
              { key: "sku", label: "SKU" },
              { key: "name", label: "Product" },
              { key: "cost", label: "Cost", render: (row) => formatMoney(row.cost) },
              { key: "retail", label: "Retail", render: (row) => formatMoney(row.retail) },
              { key: "marginPercent", label: "Margin", render: (row) => formatMargin(row) },
              { key: "onHand", label: "On hand" },
            ]}
            rows={profitMargins.slice(0, 50)}
            emptyMessage="No front-store products in inventory."
          />
        </>
      ) : null}

      {tab === "departments" ? (
        <DataTable
          columns={[
            { key: "label", label: "Department" },
            { key: "units", label: "Units" },
            { key: "revenue", label: "Revenue", render: (row) => formatMoney(row.revenue) },
          ]}
          rows={departmentPerformance.map((row) => ({
            ...row,
            label: row.label || departmentLabel(row.departmentId),
          }))}
          emptyMessage="No department sales for this date."
        />
      ) : null}

      {tab === "dead" ? (
        <DataTable
          columns={[
            { key: "sku", label: "SKU" },
            { key: "name", label: "Product" },
            { key: "onHand", label: "On hand" },
            {
              key: "daysSinceSale",
              label: "Days since sale",
              render: (row) => (row.daysSinceSale == null ? "Never" : String(row.daysSinceSale)),
            },
            {
              key: "inventoryValue",
              label: "Cost value",
              render: (row) => formatMoney(row.inventoryValue),
            },
          ]}
          rows={deadStock.slice(0, 40)}
          emptyMessage="No dead stock candidates (on-hand with no recent sales)."
        />
      ) : null}

      {tab === "shrinkage" ? (
        <>
          <StatRow>
            <StatChip label="Open damaged" value={String(shrinkage.openDamagedCount)} tone="primary" />
            <StatChip label="Damaged value" value={formatMoney(shrinkage.damagedValue)} />
            <StatChip label="Negative on-hand" value={String(shrinkage.negativeOnHandCount)} />
          </StatRow>
          {shrinkage.negativeOnHandSkus?.length ? (
            <p style={{ fontSize: 12, color: "#92400e" }}>
              SKUs below zero: {shrinkage.negativeOnHandSkus.join(", ")}
            </p>
          ) : null}
        </>
      ) : null}

      {tab === "valuation" ? (
        <>
          <StatRow>
            <StatChip label="Cost value" value={formatMoney(inventoryValuation.costValue)} tone="primary" />
            <StatChip label="Retail value" value={formatMoney(inventoryValuation.retailValue)} />
            <StatChip label="SKUs on hand" value={String(inventoryValuation.skuCount)} />
            <StatChip label="Units" value={String(inventoryValuation.unitsOnHand)} />
          </StatRow>
        </>
      ) : null}
    </div>
  );
}
