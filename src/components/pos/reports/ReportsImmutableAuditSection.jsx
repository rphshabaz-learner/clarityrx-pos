import React, { useMemo, useState } from "react";
import {
  IMMUTABLE_AUDIT_ACTIONS,
  IMMUTABLE_AUDIT_ACTION_ORDER,
  filterImmutableAuditRows,
} from "../../../lib/audit/posImmutableAudit";
import { DataTable, SectionIntro, formatTs } from "./ReportsShared";

function formatAuditValue(value) {
  if (value == null || value === "") return "—";
  const text = String(value);
  return text.length > 48 ? `${text.slice(0, 48)}…` : text;
}

export default function ReportsImmutableAuditSection({ immutableAudit }) {
  const [action, setAction] = useState("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () => filterImmutableAuditRows(immutableAudit, { action, query, limit: 200 }),
    [immutableAudit, action, query]
  );

  return (
    <div>
      <SectionIntro
        title="Must-log audit trail"
        description="Append-only records for price overrides, refunds, voids, deleted sales, manager overrides, controlled items, till opens, cash drops, and sign-in/out. Each row stores user, action, timestamp, terminal, old_value, new_value, and reason."
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <select
          className="crx-select"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          style={{ maxWidth: 220 }}
        >
          <option value="all">All must-log actions</option>
          {IMMUTABLE_AUDIT_ACTION_ORDER.map((id) => (
            <option key={id} value={id}>
              {IMMUTABLE_AUDIT_ACTIONS[id].label}
            </option>
          ))}
        </select>
        <input
          className="crx-input"
          type="search"
          placeholder="Search user, reason, values…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: "1 1 200px", minWidth: 180 }}
        />
      </div>
      <DataTable
        columns={[
          { key: "timestamp", label: "Time", render: (row) => formatTs(row.timestamp) },
          { key: "action", label: "Action", render: (row) => IMMUTABLE_AUDIT_ACTIONS[row.action]?.label || row.action },
          { key: "user", label: "User" },
          { key: "terminal", label: "Terminal", render: (row) => (row.terminal != null ? `Till ${row.terminal}` : "—") },
          { key: "old_value", label: "Old", render: (row) => formatAuditValue(row.old_value) },
          { key: "new_value", label: "New", render: (row) => formatAuditValue(row.new_value) },
          { key: "reason", label: "Reason", render: (row) => formatAuditValue(row.reason) },
        ]}
        rows={rows}
        emptyMessage="No must-log audit events match your filters."
      />
    </div>
  );
}
