import React from "react";
import { departmentLabel, productStatusLabel } from "../../../lib/inventory/frontStoreTypes";
import { formatMoney } from "../../../lib/inventory/margin";

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

export function ProductListSidebar({
  products,
  selectedProductId,
  setSelectedProductId,
  listQuery,
  setListQuery,
  onCreate,
  busy,
}) {
  return (
    <div className="crx-card" style={{ padding: 12, maxHeight: 520, overflow: "auto" }}>
      <div className="crx-card-title" style={{ marginBottom: 10, fontSize: 13 }}>
        Products ({products.length})
      </div>
      <input
        className="crx-input"
        placeholder="Search SKU, UPC, name, category…"
        value={listQuery}
        onChange={(e) => setListQuery(e.target.value)}
        style={{ marginBottom: 10, width: "100%" }}
      />
      <button
        type="button"
        className="btn-secondary"
        style={{ width: "100%", marginBottom: 12, fontSize: 12 }}
        disabled={busy}
        onClick={onCreate}
      >
        + New product
      </button>
      {products.length === 0 ? (
        <EmptyState message="No matches." />
      ) : (
        products.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => setSelectedProductId(row.id)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 10px",
              marginBottom: 6,
              borderRadius: 8,
              border: selectedProductId === row.id ? "2px solid #2563eb" : "1px solid #e5e7eb",
              background: selectedProductId === row.id ? "#eff6ff" : "#fff",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{row.name || row.sku}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
              {row.sku} · {departmentLabel(row.departmentId)}
            </div>
            <div style={{ fontSize: 11, color: "#374151", marginTop: 4 }}>
              {formatMoney(row.retail)} · Qty {row.onHand ?? 0}
            </div>
          </button>
        ))
      )}
    </div>
  );
}

export function ProductStatusBadge({ status }) {
  const tone =
    status === "active"
      ? { bg: "#ecfdf5", color: "#166534" }
      : status === "seasonal_hold"
        ? { bg: "#fffbeb", color: "#92400e" }
        : { bg: "#f3f4f6", color: "#6b7280" };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 999,
        background: tone.bg,
        color: tone.color,
      }}
    >
      {productStatusLabel(status)}
    </span>
  );
}
