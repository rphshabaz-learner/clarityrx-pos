import React, { useState } from "react";
import { usePromotions } from "../../../hooks/usePromotions";
import PromotionsCalendarSection from "./PromotionsCalendarSection";
import PromotionsCampaignsSection from "./PromotionsCampaignsSection";
import PromotionsRulesSection from "./PromotionsRulesSection";
import PromotionsSyncSection from "./PromotionsSyncSection";

const PROMO_SECTIONS = [
  { id: "calendar", label: "Calendar" },
  { id: "campaigns", label: "Active campaigns" },
  { id: "rules", label: "Rules engine" },
  { id: "sync", label: "HO / Banner sync" },
];

export default function PosPromotionsPanel({ onNotify, logActivity, initialSection, onSectionChange }) {
  const [section, setSection] = useState(initialSection || "calendar");
  const promotions = usePromotions({ onNotify, logActivity });

  const setSectionAndNotify = (next) => {
    setSection(next);
    onSectionChange?.(next);
  };

  if (promotions.loading) {
    return (
      <div className="crx-card" style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
        Loading promotions…
      </div>
    );
  }

  const openCampaign = (id) => {
    promotions.setSelectedCampaignId(id);
    setSectionAndNotify("campaigns");
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>Promotions management</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
          Flyer · mix-and-match · BOGO · loyalty · coupons · senior day · time-based · head office sync
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 12, fontWeight: 600, color: "#374151", flexWrap: "wrap" }}>
          <span>Active: {promotions.activeCampaigns.length}</span>
          <span>Total campaigns: {promotions.campaigns.length}</span>
          <span>
            Last HO sync:{" "}
            {promotions.syncMeta.lastSyncAt
              ? new Date(promotions.syncMeta.lastSyncAt).toLocaleDateString()
              : "—"}
          </span>
        </div>
      </div>

      <div className="crx-tabs" style={{ marginBottom: 16 }}>
        {PROMO_SECTIONS.map((row) => (
          <button
            key={row.id}
            type="button"
            className={`crx-tab${section === row.id ? " active" : ""}`}
            onClick={() => setSectionAndNotify(row.id)}
          >
            {row.label}
          </button>
        ))}
      </div>

      {section === "calendar" ? (
        <PromotionsCalendarSection campaigns={promotions.campaigns} onSelectCampaign={openCampaign} />
      ) : null}

      {section === "campaigns" ? (
        <PromotionsCampaignsSection
          campaigns={promotions.campaigns}
          activeCampaigns={promotions.activeCampaigns}
          selectedCampaign={promotions.selectedCampaign}
          selectedCampaignId={promotions.selectedCampaignId}
          setSelectedCampaignId={promotions.setSelectedCampaignId}
          busy={promotions.busy}
          onCreateCampaign={promotions.createCampaign}
          onSaveCampaign={promotions.saveCampaign}
          onRemoveCampaign={promotions.removeCampaign}
        />
      ) : null}

      {section === "rules" ? (
        <PromotionsRulesSection
          campaigns={promotions.campaigns}
          selectedCampaign={promotions.selectedCampaign}
          setSelectedCampaignId={promotions.setSelectedCampaignId}
          evaluatePreview={promotions.evaluatePreview}
        />
      ) : null}

      {section === "sync" ? (
        <PromotionsSyncSection
          campaigns={promotions.campaigns}
          syncMeta={promotions.syncMeta}
          busy={promotions.busy}
          onSyncFromHeadOffice={promotions.syncFromHeadOffice}
        />
      ) : null}
    </div>
  );
}
