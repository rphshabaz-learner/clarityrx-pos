import React, { useMemo, useState } from "react";
import {
  actionTypeLabel,
  conditionFieldLabel,
  describeRule,
} from "../../../lib/promotions/ruleEngine";
import { PROMO_TYPE_OPTIONS } from "../../../lib/promotions/promotionTypes";
import { EmptyState, SectionIntro } from "./PromotionsShared";

export default function PromotionsRulesSection({
  campaigns,
  selectedCampaign,
  setSelectedCampaignId,
  evaluatePreview,
}) {
  const [previewSku, setPreviewSku] = useState("OTC-001");
  const [previewDemographic, setPreviewDemographic] = useState("general");
  const [previewCoupon, setPreviewCoupon] = useState("");
  const [previewQty, setPreviewQty] = useState(2);
  const [previewSubtotal, setPreviewSubtotal] = useState(24.99);

  const allRules = useMemo(() => {
    const rows = [];
    for (const campaign of campaigns) {
      for (const rule of campaign.rules || []) {
        rows.push({ campaign, rule });
      }
    }
    return rows.sort((a, b) => (a.rule.priority || 0) - (b.rule.priority || 0));
  }, [campaigns]);

  const previewResults = useMemo(() => {
    if (!selectedCampaign) return [];
    return evaluatePreview(selectedCampaign, {
      sku: previewSku,
      demographic: previewDemographic,
      couponCode: previewCoupon,
      minQty: Number(previewQty) || 0,
      minSubtotal: Number(previewSubtotal) || 0,
    });
  }, [
    selectedCampaign,
    evaluatePreview,
    previewSku,
    previewDemographic,
    previewCoupon,
    previewQty,
    previewSubtotal,
  ]);

  return (
    <div>
      <SectionIntro
        title="Discount rules engine"
        description="Priority-ordered conditions and actions across all campaigns. Preview how rules apply to a sample cart before going live on the till."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="crx-card" style={{ padding: 16 }}>
          <div className="crx-card-title" style={{ marginBottom: 10, fontSize: 13 }}>
            Rule stack ({allRules.length})
          </div>
          {allRules.length === 0 ? (
            <EmptyState message="No rules defined yet." />
          ) : (
            <div style={{ maxHeight: 360, overflow: "auto" }}>
              {allRules.map(({ campaign, rule }) => (
                <button
                  key={`${campaign.id}-${rule.id}`}
                  type="button"
                  onClick={() => setSelectedCampaignId(campaign.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    marginBottom: 8,
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    background: selectedCampaign?.id === campaign.id ? "#eff6ff" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{campaign.name}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{describeRule(rule)}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
                    P{rule.priority} · {rule.enabled === false ? "disabled" : "enabled"}
                    {rule.stackable ? " · stackable" : ""}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="crx-card" style={{ padding: 16 }}>
          <div className="crx-card-title" style={{ marginBottom: 10, fontSize: 13 }}>
            Till preview
          </div>
          <select
            className="crx-select"
            value={selectedCampaign?.id || ""}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            style={{ width: "100%", marginBottom: 12 }}
          >
            <option value="">Select campaign…</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700 }}>
              SKU
              <input className="crx-input" value={previewSku} onChange={(e) => setPreviewSku(e.target.value)} style={{ marginTop: 4 }} />
            </label>
            <label style={{ fontSize: 11, fontWeight: 700 }}>
              Demographic
              <select
                className="crx-select"
                value={previewDemographic}
                onChange={(e) => setPreviewDemographic(e.target.value)}
                style={{ marginTop: 4, width: "100%" }}
              >
                <option value="general">General</option>
                <option value="senior">Senior</option>
                <option value="family">Family</option>
              </select>
            </label>
            <label style={{ fontSize: 11, fontWeight: 700 }}>
              Qty
              <input
                className="crx-input"
                type="number"
                min="0"
                value={previewQty}
                onChange={(e) => setPreviewQty(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </label>
            <label style={{ fontSize: 11, fontWeight: 700 }}>
              Subtotal
              <input
                className="crx-input"
                type="number"
                min="0"
                step="0.01"
                value={previewSubtotal}
                onChange={(e) => setPreviewSubtotal(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </label>
            <label style={{ fontSize: 11, fontWeight: 700, gridColumn: "1 / -1" }}>
              Coupon code
              <input
                className="crx-input"
                value={previewCoupon}
                onChange={(e) => setPreviewCoupon(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </label>
          </div>
          {selectedCampaign ? (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Applied rules</div>
              {previewResults.length === 0 ? (
                <EmptyState message="No rules matched this preview cart." />
              ) : (
                previewResults.map((row) => (
                  <div
                    key={row.ruleId}
                    style={{
                      padding: 10,
                      marginBottom: 8,
                      background: "#ecfdf5",
                      border: "1px solid #bbf7d0",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  >
                    <strong>{row.description}</strong>
                    <div style={{ color: "#166534", marginTop: 4 }}>{actionTypeLabel(row.action?.type)}</div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <EmptyState message="Select a campaign to preview." />
          )}
        </div>
      </div>

      <div className="crx-card" style={{ padding: 16 }}>
        <div className="crx-card-title" style={{ marginBottom: 12, fontSize: 13 }}>
          Promotion types
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
          {PROMO_TYPE_OPTIONS.map((row) => (
            <div
              key={row.id}
              style={{
                padding: 12,
                border: "1px solid #f3f4f6",
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              <span style={{ fontSize: 18, marginRight: 6 }}>{row.emoji}</span>
              <strong>{row.label}</strong>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#6b7280", marginTop: 12, lineHeight: 1.5 }}>
          Conditions support:{" "}
          {["sku", "category", "minQty", "minSubtotal", "demographic", "dayOfWeek", "hour", "couponCode"]
            .map(conditionFieldLabel)
            .join(", ")}
          . Rules evaluate in priority order; non-stackable rules stop further discounts.
        </p>
      </div>
    </div>
  );
}
