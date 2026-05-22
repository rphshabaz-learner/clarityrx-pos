import React from "react";
import { StatChip, StatRow, SectionIntro, formatMoney } from "./ReportsShared";

export default function ReportsOverviewSection({ reports }) {
  const { daily, inventoryValuation, shrinkage, sales, businessDateLabel } = reports;

  return (
    <div>
      <SectionIntro
        title="Overview"
        description={`Snapshot for ${businessDateLabel}. Reports use completed sales stored on this workstation.`}
      />
      <StatRow>
        <StatChip label="Transactions" value={String(daily.transactionCount)} tone="primary" />
        <StatChip label="Gross sales" value={formatMoney(daily.grossSales)} />
        <StatChip label="Net sales" value={formatMoney(daily.netSales)} />
        <StatChip label="Avg ticket" value={formatMoney(daily.avgTicket)} />
        <StatChip label="Items sold" value={String(daily.itemsSold)} />
        <StatChip
          label="Inventory (cost)"
          value={formatMoney(inventoryValuation.costValue)}
          tone="success"
        />
      </StatRow>
      <StatRow>
        <StatChip label="Open damaged" value={String(shrinkage.openDamagedCount)} />
        <StatChip label="Dead stock SKUs" value={String(reports.deadStock.length)} />
        <StatChip label="Sale history" value={`${sales.length} records`} />
        <StatChip
          label="Shift"
          value={reports.shift?.status === "open" ? "Open" : reports.shift ? "Closed" : "None"}
        />
      </StatRow>
      {daily.transactionCount === 0 ? (
        <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
          No completed sales for this date yet. Sales are recorded locally when you charge on the till.
        </p>
      ) : null}
    </div>
  );
}
