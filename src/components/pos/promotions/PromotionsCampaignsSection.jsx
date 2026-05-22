import React from "react";
import {
  PROMO_STATUS,
  PROMO_TYPE_OPTIONS,
  promoTypeLabel,
} from "../../../lib/promotions/promotionTypes";
import {
  EmptyState,
  formatPromoDate,
  PromoSourceLabel,
  PromoStatusBadge,
  SectionIntro,
} from "./PromotionsShared";

export default function PromotionsCampaignsSection({
  campaigns,
  activeCampaigns,
  selectedCampaign,
  selectedCampaignId,
  setSelectedCampaignId,
  busy,
  onCreateCampaign,
  onSaveCampaign,
  onRemoveCampaign,
}) {
  const updateSelected = (patch) => {
    if (!selectedCampaign) return;
    onSaveCampaign({ ...selectedCampaign, ...patch });
  };

  const updateRule = (ruleId, patch) => {
    if (!selectedCampaign) return;
    const rules = (selectedCampaign.rules || []).map((row) =>
      row.id === ruleId ? { ...row, ...patch } : row
    );
    onSaveCampaign({ ...selectedCampaign, rules });
  };

  return (
    <div>
      <SectionIntro
        title="Active campaigns"
        description="Flyer, mix-and-match, BOGO, loyalty, coupons, senior day, and time-based promotions. Manage status and date range per campaign."
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <select
          className="crx-select"
          defaultValue=""
          onChange={(e) => {
            const type = e.target.value;
            if (type) onCreateCampaign(type);
            e.target.value = "";
          }}
          style={{ maxWidth: 220 }}
        >
          <option value="">+ New campaign…</option>
          {PROMO_TYPE_OPTIONS.map((row) => (
            <option key={row.id} value={row.id}>
              {row.emoji} {row.label}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#15803d", alignSelf: "center" }}>
          {activeCampaigns.length} active now
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) minmax(0, 2fr)", gap: 16 }}>
        <div className="crx-card" style={{ padding: 12, maxHeight: 480, overflow: "auto" }}>
          <div className="crx-card-title" style={{ marginBottom: 10, fontSize: 13 }}>
            All campaigns ({campaigns.length})
          </div>
          {campaigns.length === 0 ? (
            <EmptyState message="No campaigns yet. Create one above." />
          ) : (
            campaigns.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCampaignId(c.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: selectedCampaignId === c.id ? "2px solid #1447e6" : "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "10px 12px",
                  marginBottom: 8,
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                  {promoTypeLabel(c.type)} · <PromoSourceLabel source={c.source} />
                </div>
                <div style={{ marginTop: 6 }}>
                  <PromoStatusBadge status={c.status} />
                </div>
              </button>
            ))
          )}
        </div>

        <div className="crx-card" style={{ padding: 16 }}>
          {!selectedCampaign ? (
            <EmptyState message="Select a campaign to edit." />
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                  Name
                  <input
                    className="crx-input"
                    value={selectedCampaign.name}
                    onChange={(e) => updateSelected({ name: e.target.value })}
                    style={{ marginTop: 6, width: "100%" }}
                  />
                </label>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                  Status
                  <select
                    className="crx-select"
                    value={selectedCampaign.status}
                    onChange={(e) => updateSelected({ status: e.target.value })}
                    style={{ marginTop: 6, width: "100%" }}
                  >
                    {Object.values(PROMO_STATUS).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                  Start
                  <input
                    className="crx-input"
                    type="datetime-local"
                    value={selectedCampaign.startAt ? selectedCampaign.startAt.slice(0, 16) : ""}
                    onChange={(e) =>
                      updateSelected({
                        startAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                    style={{ marginTop: 6, width: "100%" }}
                  />
                </label>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                  End
                  <input
                    className="crx-input"
                    type="datetime-local"
                    value={selectedCampaign.endAt ? selectedCampaign.endAt.slice(0, 16) : ""}
                    onChange={(e) =>
                      updateSelected({
                        endAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                    style={{ marginTop: 6, width: "100%" }}
                  />
                </label>
              </div>

              {selectedCampaign.type === "coupon" ? (
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 12 }}>
                  Coupon code
                  <input
                    className="crx-input"
                    value={selectedCampaign.config?.code || ""}
                    onChange={(e) =>
                      updateSelected({ config: { ...selectedCampaign.config, code: e.target.value } })
                    }
                    style={{ marginTop: 6, maxWidth: 200 }}
                  />
                </label>
              ) : null}

              {selectedCampaign.headOfficeId ? (
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 12 }}>
                  Head office ID: <strong>{selectedCampaign.headOfficeId}</strong>
                </div>
              ) : null}

              <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                Discount rules ({(selectedCampaign.rules || []).length})
              </div>
              {(selectedCampaign.rules || []).map((rule) => (
                <div
                  key={rule.id}
                  style={{
                    border: "1px solid #f3f4f6",
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 8,
                    fontSize: 12,
                  }}
                >
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={rule.enabled !== false}
                      onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })}
                    />
                    Priority {rule.priority}
                    {rule.stackable ? " · stackable" : ""}
                  </label>
                  <div style={{ marginTop: 6, color: "#6b7280" }}>
                    Action: {rule.action?.type} {rule.action?.value != null ? `(${rule.action.value})` : ""}
                  </div>
                </div>
              ))}

              <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={() => onSaveCampaign(selectedCampaign)}
                >
                  Save campaign
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => onRemoveCampaign(selectedCampaign.id)}
                >
                  Delete
                </button>
              </div>
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 10 }}>
                {formatPromoDate(selectedCampaign.startAt)} – {formatPromoDate(selectedCampaign.endAt)}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
