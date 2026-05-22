import React from "react";
import { poStatusBadgeClass, poStatusLabel } from "../../../lib/purchasing/orderStatus";
import { wholesalerLabel } from "../../../lib/purchasing/wholesalers";

export function StatusBadge({ status }) {
  return <span className={poStatusBadgeClass(status)}>{poStatusLabel(status)}</span>;
}

export function WholesalerName({ id }) {
  return <span>{wholesalerLabel(id)}</span>;
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
