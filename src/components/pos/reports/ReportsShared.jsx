import React from "react";
import { formatMoney } from "../../../lib/inventory/margin";

export { formatMoney };

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

export function StatChip({ label, value, tone }) {
  const colors =
    tone === "primary"
      ? { bg: "#eff6ff", text: "#1d4ed8" }
      : tone === "success"
        ? { bg: "#ecfdf5", text: "#047857" }
        : { bg: "#f9fafb", text: "#111827" };
  return (
    <div
      style={{
        flex: "1 1 140px",
        minWidth: 120,
        padding: "12px 14px",
        borderRadius: 10,
        background: colors.bg,
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: colors.text, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export function StatRow({ children }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>{children}</div>;
}

export function DataTable({ columns, rows, emptyMessage = "No data for this period." }) {
  if (!rows?.length) return <EmptyState message={emptyMessage} />;
  return (
    <div className="crx-card" style={{ overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f9fafb", textAlign: "left" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: "10px 12px",
                  fontWeight: 700,
                  color: "#374151",
                  borderBottom: "1px solid #e5e7eb",
                  whiteSpace: "nowrap",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || row.key || index} style={{ borderBottom: "1px solid #f3f4f6" }}>
              {columns.map((col) => (
                <td key={col.key} style={{ padding: "10px 12px", color: "#111827", verticalAlign: "top" }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SubTabs({ tabs, active, onChange }) {
  return (
    <div className="crx-tabs" style={{ marginBottom: 16 }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`crx-tab${active === tab.id ? " active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function formatTs(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "—";
  }
}
