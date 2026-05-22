import React from "react";
import { SectionIntro, StatusBadge } from "./RxShared";

export default function RxKrollSection({ rx, busy, onRefreshHealth }) {
  const tone = rx.kroll.connected === true ? "ok" : rx.kroll.connected === false ? "error" : "neutral";

  return (
    <div>
      <SectionIntro
        title="Kroll integration"
        description="Connection health from the pharmacy transmit API. Sales, pickup sync, and Rx payment posting depend on this bridge."
      />
      <div className="crx-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <StatusBadge tone={tone}>{rx.kroll.label}</StatusBadge>
          <span style={{ fontSize: 12, color: "#6b7280" }}>{rx.kroll.detail || "No detail"}</span>
        </div>
        <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
          <div>
            Transmit API:{" "}
            <strong>{rx.health.ok === true ? "Online" : rx.health.ok === false ? "Offline" : "Unknown"}</strong>
            {rx.health.message ? ` — ${rx.health.message}` : ""}
          </div>
          <div style={{ marginTop: 8 }}>
            When connected, completed POS charges with Rx copay are queued for Kroll write-back. Use{" "}
            <code style={{ fontSize: 11 }}>REACT_APP_POS_KROLL_ENABLED=1</code> on dev tills until health reports a live
            signal.
          </div>
        </div>
        <button type="button" className="btn-secondary" style={{ marginTop: 16 }} disabled={busy} onClick={onRefreshHealth}>
          Refresh connection
        </button>
      </div>
    </div>
  );
}
