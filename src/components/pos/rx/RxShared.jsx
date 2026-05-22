import React from "react";
import { formatRxMoney, rxStatusLabel } from "../../../lib/rx/rxIntegrationTypes";

export function SectionIntro({ title, description }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>{title}</div>
      {description ? (
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4, lineHeight: 1.5 }}>{description}</p>
      ) : null}
    </div>
  );
}

export function EmptyState({ message }) {
  return (
    <div style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>{message}</div>
  );
}

export function FieldLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{children}</div>;
}

export function StatusBadge({ tone, children }) {
  const colors = {
    ok: { bg: "#ecfdf5", border: "#bbf7d0", text: "#166534" },
    warn: { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
    error: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" },
    neutral: { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151" },
  };
  const style = colors[tone] || colors.neutral;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.text,
      }}
    >
      {children}
    </span>
  );
}

export function StatTile({ label, value, hint }) {
  return (
    <div className="crx-card" style={{ padding: 14, minWidth: 120 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginTop: 6 }}>{value}</div>
      {hint ? <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{hint}</div> : null}
    </div>
  );
}

export function RxStatusTable({ rows }) {
  if (!rows?.length) return <EmptyState message="No results." />;
  return (
    <div className="crx-card" style={{ overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#f9fafb", textAlign: "left" }}>
            <th style={{ padding: 10 }}>Source</th>
            <th style={{ padding: 10 }}>Rx #</th>
            <th style={{ padding: 10 }}>Patient</th>
            <th style={{ padding: 10 }}>Drug</th>
            <th style={{ padding: 10 }}>Stage</th>
            <th style={{ padding: 10 }}>Bag</th>
            <th style={{ padding: 10 }}>Copay</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.rxNumber}-${index}`} style={{ borderTop: "1px solid #e5e7eb" }}>
              <td style={{ padding: 10 }}>{row.source}</td>
              <td style={{ padding: 10, fontWeight: 700 }}>{row.rxNumber || "—"}</td>
              <td style={{ padding: 10 }}>{row.patientName || "—"}</td>
              <td style={{ padding: 10 }}>{row.drugName || "—"}</td>
              <td style={{ padding: 10 }}>{rxStatusLabel(row.stage)}</td>
              <td style={{ padding: 10 }}>{row.bagBarcode || "—"}</td>
              <td style={{ padding: 10 }}>{formatRxMoney(row.copay)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
