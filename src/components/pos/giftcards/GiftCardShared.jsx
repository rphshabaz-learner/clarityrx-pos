import React from "react";

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

export function ManagerOverrideNotice({ gate }) {
  if (!gate || gate.allowed) return null;
  return (
    <div
      role="status"
      style={{
        padding: 12,
        borderRadius: 10,
        background: "#fffbeb",
        border: "1px solid #fde68a",
        color: "#92400e",
        fontSize: 13,
        fontWeight: 600,
        marginBottom: 14,
      }}
    >
      {gate.reason ||
        "This action requires manager override on this till. A manager must enable Mgr override in the header."}
    </div>
  );
}

export function BalanceBanner({ lookup, large }) {
  if (!lookup?.found) {
    return (
      <div
        style={{
          padding: 14,
          borderRadius: 10,
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#b91c1c",
          fontSize: large ? 15 : 13,
          fontWeight: 600,
        }}
      >
        {lookup?.message || "Card not found."}
      </div>
    );
  }
  const tone =
    lookup.status === "suspended"
      ? { bg: "#fffbeb", border: "#fde68a", text: "#92400e" }
      : lookup.status === "inactive"
        ? { bg: "#f8fafc", border: "#e2e8f0", text: "#475569" }
        : { bg: "#ecfdf5", border: "#bbf7d0", text: "#166534" };
  return (
    <div
      style={{
        padding: large ? 20 : 14,
        borderRadius: 10,
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.text,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", opacity: 0.85 }}>Balance</div>
      <div style={{ fontSize: large ? 32 : 24, fontWeight: 800, marginTop: 4 }}>${lookup.balance.toFixed(2)}</div>
      <div style={{ fontSize: 12, marginTop: 6, fontWeight: 600 }}>
        {lookup.card?.cardNumber} · {lookup.status}
        {lookup.message ? ` — ${lookup.message}` : ""}
      </div>
    </div>
  );
}
