import React, { useState } from "react";
import { DataTable, SectionIntro, StatChip, StatRow, SubTabs, formatMoney, formatTs } from "./ReportsShared";

const TABS = [
  { id: "till", label: "Till balancing" },
  { id: "cash", label: "Cash reconciliation" },
  { id: "eod", label: "End of day" },
  { id: "cashier", label: "Cashier audit" },
];

export default function ReportsCashSection({ reports }) {
  const [tab, setTab] = useState("till");
  const { tillBalancing, cashReconciliation, endOfDay, cashierAudit, businessDateLabel } = reports;

  return (
    <div>
      <SectionIntro
        title="Cash & till"
        description={`Drawer and tender summary for ${businessDateLabel}.`}
      />
      <SubTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "till" ? (
        <DataTable
          columns={[
            { key: "tillNumber", label: "Till" },
            { key: "transactions", label: "Txns" },
            { key: "gross", label: "Gross", render: (row) => formatMoney(row.gross) },
            { key: "cash", label: "Cash", render: (row) => formatMoney(row.cash) },
            { key: "card", label: "Card", render: (row) => formatMoney(row.card) },
            { key: "other", label: "Other", render: (row) => formatMoney(row.other) },
          ]}
          rows={tillBalancing}
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
            <StatChip label="Gross sales" value={formatMoney(endOfDay.daily.grossSales)} tone="primary" />
            <StatChip label="Transactions" value={String(endOfDay.daily.transactionCount)} />
            <StatChip label="Cash expected" value={formatMoney(endOfDay.cash.expectedDrawer)} />
            <StatChip label="POS events" value={String(endOfDay.posActivityCount)} />
          </StatRow>
          <DataTable
            columns={[
              { key: "tillNumber", label: "Till" },
              { key: "transactions", label: "Txns" },
              { key: "gross", label: "Gross", render: (row) => formatMoney(row.gross) },
            ]}
            rows={endOfDay.till}
            emptyMessage="No tills to close."
          />
          {endOfDay.shift ? (
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 12 }}>
              Shift {endOfDay.shift.id} · {endOfDay.shift.status} · opened {formatTs(endOfDay.shift.openedAt)}
            </p>
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
