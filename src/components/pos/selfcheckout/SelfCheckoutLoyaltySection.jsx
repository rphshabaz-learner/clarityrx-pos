import React from "react";
import { FieldLabel, SectionIntro } from "./SelfCheckoutShared";

export default function SelfCheckoutLoyaltySection({ sc }) {
  const patch = (key, value) => sc.updateConfigDraft({ [key]: value });

  return (
    <div>
      <SectionIntro
        title="Loyalty entry"
        description="Kiosk loyalty lookup matches phone, member ID, or account number against local customer profiles. Points redeem at 100 pts = $1 (same as staff till)."
      />
      <div className="crx-card" style={{ padding: 20, maxWidth: 560, marginBottom: 16 }}>
        <div style={{ marginBottom: 14 }}>
          <FieldLabel>Loyalty prompt (customer screen)</FieldLabel>
          <textarea
            className="crx-input"
            rows={2}
            value={sc.config?.loyaltyPrompt || ""}
            onChange={(e) => patch("loyaltyPrompt", e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 14 }}>
          <input
            type="checkbox"
            checked={sc.config?.allowLoyaltySkip !== false}
            onChange={(e) => patch("allowLoyaltySkip", e.target.checked)}
          />
          Allow “Skip loyalty” on kiosk
        </label>
        <div style={{ marginBottom: 14 }}>
          <FieldLabel>Max points to redeem (optional cap)</FieldLabel>
          <input
            className="crx-input"
            type="number"
            min={0}
            placeholder="All available points"
            value={sc.config?.maxLoyaltyRedeemPoints ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              patch("maxLoyaltyRedeemPoints", raw === "" ? null : Math.max(0, Number(raw) || 0));
            }}
            style={{ width: "100%", marginTop: 6 }}
          />
        </div>
        <button
          type="button"
          className="btn-primary"
          disabled={sc.busy}
          onClick={() => sc.saveConfig(sc.config)}
        >
          Save loyalty settings
        </button>
      </div>

      <div className="crx-card" style={{ padding: 20, maxWidth: 560 }}>
        <div className="crx-card-title" style={{ marginBottom: 10 }}>
          Test loyalty lookup
        </div>
        <input
          className="crx-input"
          placeholder="Phone, member ID, or name"
          value={sc.loyaltyQuery}
          onChange={(e) => sc.setLoyaltyQuery(e.target.value)}
          style={{ width: "100%", marginBottom: 12 }}
        />
        {sc.loyaltyMatches.length === 0 ? (
          <p style={{ fontSize: 12, color: "#9ca3af" }}>Enter at least 3 characters to search.</p>
        ) : (
          sc.loyaltyMatches.map((customer) => (
            <div
              key={customer.id}
              style={{
                padding: 10,
                marginBottom: 8,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 700 }}>
                {customer.profile?.firstName} {customer.profile?.lastName}
              </div>
              <div style={{ color: "#6b7280", marginTop: 4 }}>
                {customer.loyalty?.memberId || "No member ID"} · {customer.loyalty?.pointsBalance || 0} points
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
