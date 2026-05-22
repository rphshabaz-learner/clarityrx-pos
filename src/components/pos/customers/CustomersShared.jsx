import React from "react";
import {
  customerStatusBadgeClass,
  customerStatusLabel,
  customerTypeLabel,
} from "../../../lib/customers/customerTypes";

export function CustomerStatusBadge({ status }) {
  return <span className={customerStatusBadgeClass(status)}>{customerStatusLabel(status)}</span>;
}

export function CustomerTypeLabel({ type }) {
  return <span style={{ fontSize: 11, color: "#6b7280" }}>{customerTypeLabel(type)}</span>;
}

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

export function formatCustomerDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function CustomerListSidebar({
  customers,
  selectedCustomerId,
  setSelectedCustomerId,
  listQuery,
  setListQuery,
  onCreate,
  busy,
}) {
  return (
    <div className="crx-card" style={{ padding: 12, maxHeight: 520, overflow: "auto" }}>
      <div className="crx-card-title" style={{ marginBottom: 10, fontSize: 13 }}>
        Customers ({customers.length})
      </div>
      <input
        className="crx-input"
        placeholder="Search name, account, phone, Kroll ID…"
        value={listQuery}
        onChange={(e) => setListQuery(e.target.value)}
        style={{ marginBottom: 10, width: "100%" }}
      />
      <button type="button" className="btn-secondary" style={{ width: "100%", marginBottom: 12, fontSize: 12 }} disabled={busy} onClick={onCreate}>
        + New customer
      </button>
      {customers.length === 0 ? (
        <EmptyState message="No matches." />
      ) : (
        customers.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => setSelectedCustomerId(row.id)}
            style={{
              width: "100%",
              textAlign: "left",
              border: selectedCustomerId === row.id ? "2px solid #1447e6" : "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 8,
              background: selectedCustomerId === row.id ? "#eff6ff" : "#fff",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>
              {row.profile?.displayName || [row.profile?.firstName, row.profile?.lastName].filter(Boolean).join(" ") || row.accountNumber}
            </div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              {row.accountNumber} · <CustomerTypeLabel type={row.type} />
            </div>
            <div style={{ marginTop: 6 }}>
              <CustomerStatusBadge status={row.status} />
            </div>
          </button>
        ))
      )}
    </div>
  );
}

export function FieldLabel({ children }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block" }}>{children}</label>
  );
}
