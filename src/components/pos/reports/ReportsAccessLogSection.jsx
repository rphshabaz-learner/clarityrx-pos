import React, { useMemo, useState } from "react";
import {
  ACCESS_LOG_TYPES,
  ACCESS_LOG_TYPE_ORDER,
  filterAccessLogActivities,
} from "../../../lib/access/posAccessLog";
import { DataTable, SectionIntro, formatTs } from "./ReportsShared";

const TYPE_OPTIONS = [
  { id: "all", label: "All access events" },
  ...ACCESS_LOG_TYPE_ORDER.map((id) => ({
    id,
    label: ACCESS_LOG_TYPES[id].label,
  })),
];

function formatDetail(row) {
  const d = row.detail;
  if (!d || typeof d !== "object") return "—";
  const parts = [];
  if (d.operatorId) parts.push(`op ${d.operatorId}`);
  if (d.tillNumber != null) parts.push(`till ${d.tillNumber}`);
  if (d.customerId) parts.push(`customer ${d.customerId}`);
  if (d.accountNumber) parts.push(d.accountNumber);
  if (d.pickupId) parts.push(`pickup ${d.pickupId}`);
  if (d.invoiceNumber) parts.push(d.invoiceNumber);
  if (d.sku) parts.push(d.sku);
  if (d.amount != null) parts.push(`$${Number(d.amount).toFixed(2)}`);
  if (d.total != null && d.amount == null) parts.push(`$${Number(d.total).toFixed(2)}`);
  if (d.managerOverride) parts.push("mgr override");
  if (d.classId) parts.push(d.classId);
  if (d.purchaserAge != null) parts.push(`age ${d.purchaserAge}`);
  const text = parts.length ? parts.join(" · ") : JSON.stringify(d);
  return text.length > 96 ? `${text.slice(0, 96)}…` : text;
}

export default function ReportsAccessLogSection({ activities }) {
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () => filterAccessLogActivities(activities, { type, query, limit: 200 }),
    [activities, type, query]
  );

  return (
    <div>
      <SectionIntro
        title="Access logs"
        description="Sensitive POS actions on this workstation: profile views, refund overrides, voids, discount overrides, and Rx-linked transactions."
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {ACCESS_LOG_TYPE_ORDER.map((id) => (
          <div key={id} className="crx-card" style={{ padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>
              {ACCESS_LOG_TYPES[id].label}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
              {ACCESS_LOG_TYPES[id].description}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <select
          className="crx-select"
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ maxWidth: 220 }}
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          className="crx-input"
          type="search"
          placeholder="Search operator, customer, invoice…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: "1 1 200px", minWidth: 180 }}
        />
      </div>
      <DataTable
        columns={[
          { key: "ts", label: "Time", render: (row) => formatTs(row.ts) },
          {
            key: "accessLogType",
            label: "Type",
            render: (row) => ACCESS_LOG_TYPES[row.accessLogType]?.label || row.accessLogType,
          },
          { key: "message", label: "Event" },
          { key: "detail", label: "Context", render: (row) => formatDetail(row) },
        ]}
        rows={rows}
        emptyMessage="No access log events match your filters."
      />
    </div>
  );
}
