import React from "react";
import { formatSelfCheckoutMoney } from "../../../lib/selfCheckout/selfCheckoutTypes";

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

export function StatTile({ label, value, hint }) {
  return (
    <div className="crx-card" style={{ padding: 14, minWidth: 120 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginTop: 6 }}>{value}</div>
      {hint ? <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{hint}</div> : null}
    </div>
  );
}

export function KioskMoneyRow({ label, value, strong }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: strong ? 20 : 14,
        fontWeight: strong ? 800 : 600,
        color: "#111827",
        marginTop: strong ? 12 : 6,
      }}
    >
      <span>{label}</span>
      <span>{formatSelfCheckoutMoney(value)}</span>
    </div>
  );
}

export function KioskTouchButton({ children, onClick, disabled, variant = "primary", style }) {
  const tones = {
    primary: { bg: "#2563eb", border: "#1d4ed8", color: "#fff" },
    secondary: { bg: "#f3f4f6", border: "#d1d5db", color: "#111827" },
    danger: { bg: "#fef2f2", border: "#fecaca", color: "#b91c1c" },
  };
  const tone = tones[variant] || tones.primary;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        minHeight: 52,
        padding: "14px 20px",
        borderRadius: 12,
        border: `2px solid ${tone.border}`,
        background: tone.bg,
        color: tone.color,
        fontSize: 16,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        touchAction: "manipulation",
        width: "100%",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
