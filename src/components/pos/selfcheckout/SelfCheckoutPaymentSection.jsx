import React from "react";
import { FieldLabel, SectionIntro } from "./SelfCheckoutShared";

export default function SelfCheckoutPaymentSection({ sc }) {
  const patch = (key, value) => sc.updateConfigDraft({ [key]: value });

  return (
    <div>
      <SectionIntro
        title="Customer-facing payment"
        description="Configure the dedicated self-checkout till and pinpad terminal. Card charges use Securelink when enabled; otherwise mock approval is used in development."
      />
      <div className="crx-card" style={{ padding: 20, maxWidth: 560 }}>
        <div style={{ marginBottom: 14 }}>
          <FieldLabel>Kiosk till number</FieldLabel>
          <input
            className="crx-input"
            type="number"
            min={1}
            value={sc.config?.kioskTillNumber ?? 99}
            onChange={(e) => patch("kioskTillNumber", Number(e.target.value) || 99)}
            style={{ width: "100%", marginTop: 6 }}
          />
          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
            Override with REACT_APP_POS_SELF_CHECKOUT_TILL. Current active: #{sc.tillNumber}
          </p>
        </div>
        <div style={{ marginBottom: 14 }}>
          <FieldLabel>Pinpad terminal ID (optional)</FieldLabel>
          <input
            className="crx-input"
            placeholder="Uses till demographic default when blank"
            value={sc.config?.terminalId || ""}
            onChange={(e) => patch("terminalId", e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <FieldLabel>Kiosk idle timeout (seconds)</FieldLabel>
          <input
            className="crx-input"
            type="number"
            min={30}
            max={600}
            value={sc.config?.idleTimeoutSec ?? 120}
            onChange={(e) => patch("idleTimeoutSec", Math.min(600, Math.max(30, Number(e.target.value) || 120)))}
            style={{ width: "100%", marginTop: 6 }}
          />
          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
            Ends an active customer session after inactivity (PCI session control). Minimum 30s.
          </p>
        </div>
        <div style={{ marginBottom: 14 }}>
          <FieldLabel>Payment prompt (customer screen)</FieldLabel>
          <textarea
            className="crx-input"
            rows={2}
            value={sc.config?.paymentPrompt || ""}
            onChange={(e) => patch("paymentPrompt", e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          />
        </div>
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: sc.securelinkActive ? "#ecfdf5" : "#fffbeb",
            border: `1px solid ${sc.securelinkActive ? "#bbf7d0" : "#fde68a"}`,
            fontSize: 12,
            color: sc.securelinkActive ? "#166534" : "#92400e",
          }}
        >
          {sc.securelinkActive
            ? "Securelink is enabled — customer card payments route to the configured pinpad."
            : "Securelink is off — kiosk uses mock card approval or staff intervention."}
        </div>
        <button
          type="button"
          className="btn-primary"
          style={{ marginTop: 16 }}
          disabled={sc.busy}
          onClick={() => sc.saveConfig(sc.config)}
        >
          Save payment settings
        </button>
      </div>
    </div>
  );
}
