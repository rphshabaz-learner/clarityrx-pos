import React, { useMemo, useState } from "react";
import { filterAuditActivities } from "../../../lib/reporting/reportAggregates";
import { DataTable, SectionIntro, formatTs } from "./ReportsShared";

const CATEGORY_OPTIONS = [
  { id: "all", label: "All" },
  { id: "pos", label: "POS" },
  { id: "pos.inventory", label: "Inventory" },
  { id: "system", label: "System" },
];

export default function ReportsAuditSection({ activities }) {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () => filterAuditActivities(activities, { category, query, limit: 150 }),
    [activities, category, query]
  );

  return (
    <div>
      <SectionIntro
        title="Audit logs"
        description="Local activity trail from this workstation (charges, suspends, inventory, overrides)."
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <select
          className="crx-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ maxWidth: 180 }}
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          className="crx-input"
          type="search"
          placeholder="Search message or detail…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: "1 1 200px", minWidth: 180 }}
        />
      </div>
      <DataTable
        columns={[
          { key: "ts", label: "Time", render: (row) => formatTs(row.ts) },
          { key: "category", label: "Category" },
          { key: "message", label: "Event" },
          {
            key: "detail",
            label: "Detail",
            render: (row) => {
              if (!row.detail) return "—";
              const text = typeof row.detail === "string" ? row.detail : JSON.stringify(row.detail);
              return text.length > 80 ? `${text.slice(0, 80)}…` : text;
            },
          },
        ]}
        rows={rows}
        emptyMessage="No audit events match your filters."
      />
    </div>
  );
}
