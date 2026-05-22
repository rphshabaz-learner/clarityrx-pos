import React from "react";
import {
  promoSourceLabel,
  promoStatusBadgeClass,
  promoStatusLabel,
  promoTypeLabel,
} from "../../../lib/promotions/promotionTypes";

export function PromoStatusBadge({ status }) {
  return <span className={promoStatusBadgeClass(status)}>{promoStatusLabel(status)}</span>;
}

export function PromoTypeLabel({ type }) {
  return <span>{promoTypeLabel(type)}</span>;
}

export function PromoSourceLabel({ source }) {
  return <span style={{ fontSize: 11, color: "#6b7280" }}>{promoSourceLabel(source)}</span>;
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

export function formatPromoDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}
