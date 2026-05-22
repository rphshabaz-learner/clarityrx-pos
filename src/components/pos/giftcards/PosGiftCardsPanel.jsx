import React, { useState } from "react";
import { useRoleAccess } from "../../../RoleAccessContext";
import { usePosTill } from "../../../context/PosTillContext";
import { useGiftCards } from "../../../hooks/useGiftCards";
import GiftCardActivateSection from "./GiftCardActivateSection";
import GiftCardBalanceSection from "./GiftCardBalanceSection";
import GiftCardRegistrySection from "./GiftCardRegistrySection";
import GiftCardReloadSection from "./GiftCardReloadSection";
import { StatTile } from "./GiftCardShared";

const SECTIONS = [
  { id: "balance", label: "Balance check" },
  { id: "activate", label: "Activation" },
  { id: "reload", label: "Reload" },
  { id: "registry", label: "Registry" },
];

export default function PosGiftCardsPanel({ onNotify, logActivity, tillNumber, operatorId }) {
  const [section, setSection] = useState("balance");
  const { activeRole, hasPermission } = useRoleAccess();
  const { managerOverrideActive } = usePosTill();
  const gc = useGiftCards({
    onNotify,
    logActivity,
    tillNumber,
    operatorId,
    activeRole,
    managerOverrideActive,
    hasPermission,
  });

  if (gc.loading) {
    return (
      <div className="crx-card" style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
        Loading gift cards…
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>Gift cards</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
          Activation · reload · balance inquiry · registry
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
          <StatTile label="Cards on file" value={gc.stats.count} hint={`${gc.stats.active} active`} />
          <StatTile label="Outstanding balance" value={`$${gc.stats.outstanding.toFixed(2)}`} />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="button" className="btn-secondary" disabled={gc.busy} onClick={() => gc.refresh()}>
            Refresh
          </button>
        </div>
      </div>

      <div className="crx-tabs" style={{ marginBottom: 16 }}>
        {SECTIONS.map((row) => (
          <button
            key={row.id}
            type="button"
            className={`crx-tab${section === row.id ? " active" : ""}`}
            onClick={() => setSection(row.id)}
          >
            {row.label}
          </button>
        ))}
      </div>

      {section === "balance" ? <GiftCardBalanceSection gc={gc} /> : null}
      {section === "activate" ? <GiftCardActivateSection gc={gc} /> : null}
      {section === "reload" ? <GiftCardReloadSection gc={gc} /> : null}
      {section === "registry" ? <GiftCardRegistrySection gc={gc} /> : null}
    </div>
  );
}
