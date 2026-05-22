import React, { useState } from "react";
import {
  DataTable,
  SectionIntro,
  StatChip,
  StatRow,
  SubTabs,
  formatMoney,
  formatTs,
  tillTableColumns,
} from "./ReportsShared";

const TABS = [
  { id: "till", label: "Till balancing" },
  { id: "cash", label: "Cash reconciliation" },
  { id: "eod", label: "End of day" },
  { id: "cashier", label: "Cashier audit" },
];

export default function ReportsCashSection({ reports }) {
  const [tab, setTab] = useState("till");
  const {
    tillBalancing,
    tillBalancingCombined,
    cashReconciliation,
    endOfDay,
    cashierAudit,
    businessDateLabel,
  } = reports;
  const tillColumns = tillTableColumns({ includeTender: true });

  return (
    <div>
      <SectionIntro
        title="Cash & till"
        description={`Drawer and tender summary for ${businessDateLabel}.`}
      />
      <SubTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "till" ? (
        <DataTable
          columns={tillColumns}
          rows={tillBalancing}
          summaryRow={tillBalancingCombined}
          emptyMessage="No till activity for this date."
        />
      ) : null}

      {tab === "cash" ? (
        <>
          <StatRow>
            <StatChip label="Cash sales" value={formatMoney(cashReconciliation.cashSales)} tone="primary" />
            <StatChip label="Tendered" value={formatMoney(cashReconciliation.cashTendered)} />
            <StatChip label="Change given" value={formatMoney(cashReconciliation.changeGiven)} />
            <StatChip label="Expected drawer" value={formatMoney(cashReconciliation.expectedDrawer)} />
            <StatChip label="Cash txns" value={String(cashReconciliation.cashTransactions)} />
          </StatRow>
          <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
            Expected drawer = cash tendered minus change. Record physical counts in your store procedure; over/short
            entry is not stored in POS yet.
          </p>
        </>
      ) : null}

      {tab === "eod" ? (
        <>
          <StatRow>
            <StatChip
              label="All tills — gross"
              value={formatMoney(endOfDay.combined?.gross ?? endOfDay.daily.grossSales)}
              tone="primary"
            />
            <StatChip
              label="All tills — txns"
              value={String(endOfDay.combined?.transactions ?? endOfDay.daily.transactionCount)}
            />
            <StatChip label="Cash expected" value={formatMoney(endOfDay.cash.expectedDrawer)} />
            <StatChip label="POS events" value={String(endOfDay.posActivityCount)} />
          </StatRow>
          <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, marginBottom: 12 }}>
            Per-till totals for {businessDateLabel}. The summary row matches all tills combined.
          </p>
          <DataTable
            columns={tillColumns}
            rows={endOfDay.till}
            summaryRow={endOfDay.combined}
            emptyMessage="No till activity for this date."
          />
          {endOfDay.tillShifts?.length ? (
            <DataTable
              columns={[
                { key: "tillNumber", label: "Till" },
                { key: "id", label: "Shift" },
                { key: "status", label: "Status" },
                {
                  key: "openedAt",
                  label: "Opened",
                  render: (row) => formatTs(row.openedAt),
                },
                {
                  key: "closedAt",
                  label: "Closed",
                  render: (row) => (row.closedAt ? formatTs(row.closedAt) : "—"),
                },
              ]}
              rows={endOfDay.tillShifts}
              emptyMessage="No till shifts recorded for this date."
            />
          ) : null}
        </>
      ) : null}

      {tab === "cashier" ? (
        <>
          <StatRow>
            <StatChip label="Cashier" value={cashierAudit.cashierId || "—"} />
            <StatChip label="Transactions" value={String(cashierAudit.transactionCount)} tone="primary" />
            <StatChip label="Gross" value={formatMoney(cashierAudit.grossSales)} />
            <StatChip label="Suspicious events" value={String(cashierAudit.voidLikeEvents)} />
          </StatRow>
          <DataTable
            columns={[
              { key: "invoiceNumber", label: "Invoice" },
              { key: "total", label: "Total", render: (row) => formatMoney(row.total) },
              { key: "payMethod", label: "Tender" },
              {
                key: "chargedAt",
                label: "Time",
                render: (row) => formatTs(row.chargedAt),
              },
            ]}
            rows={cashierAudit.recentSales}
            emptyMessage="No sales for active shift cashier on this date."
          />
        </>
      ) : null}
    </div>
  );
}
