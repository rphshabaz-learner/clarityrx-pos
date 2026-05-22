import React, { useState } from "react";
import { useSelfCheckout } from "../../../hooks/useSelfCheckout";
import SelfCheckoutLoyaltySection from "./SelfCheckoutLoyaltySection";
import SelfCheckoutPaymentSection from "./SelfCheckoutPaymentSection";
import SelfCheckoutReceiptSection from "./SelfCheckoutReceiptSection";
import SelfCheckoutScanPaySection from "./SelfCheckoutScanPaySection";
import { StatTile } from "./SelfCheckoutShared";

const SECTIONS = [
  { id: "scan", label: "Scan-and-pay" },
  { id: "payment", label: "Payment" },
  { id: "receipts", label: "Receipt options" },
  { id: "loyalty", label: "Loyalty entry" },
];

export default function PosSelfCheckoutPanel({ onNotify, logActivity }) {
  const [section, setSection] = useState("scan");
  const sc = useSelfCheckout({ onNotify, logActivity });

  if (sc.loading) {
    return (
      <div className="crx-card" style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
        Loading self-checkout…
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>Self checkout</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
          Customer-facing payment · scan-and-pay kiosk · receipt options · loyalty entry
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
          <StatTile label="Today (kiosk)" value={sc.stats.todayCount} hint={`$${sc.stats.todayTotal.toFixed(2)}`} />
          <StatTile label="Kiosk till" value={`#${sc.tillNumber}`} />
          <StatTile label="Last invoice" value={sc.stats.lastInvoice} />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="button" className="btn-secondary" disabled={sc.busy} onClick={() => sc.refresh()}>
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

      {section === "scan" ? <SelfCheckoutScanPaySection sc={sc} /> : null}
      {section === "payment" ? <SelfCheckoutPaymentSection sc={sc} /> : null}
      {section === "receipts" ? <SelfCheckoutReceiptSection sc={sc} /> : null}
      {section === "loyalty" ? <SelfCheckoutLoyaltySection sc={sc} /> : null}
    </div>
  );
}
