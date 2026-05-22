import React from "react";
import { PROMO_SOURCE } from "../../../lib/promotions/promotionTypes";
import { formatPromoDate, PromoSourceLabel, PromoStatusBadge, SectionIntro } from "./PromotionsShared";

export default function PromotionsSyncSection({
  campaigns,
  syncMeta,
  busy,
  onSyncFromHeadOffice,
}) {
  const hoCampaigns = campaigns.filter(
    (c) => c.source === PROMO_SOURCE.HEAD_OFFICE || c.source === PROMO_SOURCE.BANNER
  );
  const storeCampaigns = campaigns.filter((c) => c.source === PROMO_SOURCE.STORE);

  return (
    <div>
      <SectionIntro
        title="Banner & head office sync"
        description="Import national flyer, mix-and-match, and coupon campaigns from head office or banner. Store-local promos stay editable after sync."
      />

      <div className="crx-card" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Last sync</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              {syncMeta.lastSyncAt
                ? new Date(syncMeta.lastSyncAt).toLocaleString()
                : "Never synced"}
              {syncMeta.lastSource ? ` · ${syncMeta.lastSource}` : ""}
            </div>
          </div>
          <button type="button" className="btn-primary" disabled={busy} onClick={onSyncFromHeadOffice}>
            Sync from head office
          </button>
        </div>
        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 12, lineHeight: 1.5 }}>
          Pulls pending HO/banner campaigns (flyer endcaps, seasonal bundles). Duplicates are skipped by head office ID.
          Connect your pharmacy API when ready for live sync.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="crx-card" style={{ padding: 16 }}>
          <div className="crx-card-title" style={{ marginBottom: 10, fontSize: 13 }}>
            Head office / banner ({hoCampaigns.length})
          </div>
          {hoCampaigns.length === 0 ? (
            <p style={{ fontSize: 12, color: "#9ca3af" }}>No synced campaigns yet. Run sync above.</p>
          ) : (
            hoCampaigns.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: 10,
                  marginBottom: 8,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              >
                <div style={{ fontWeight: 700 }}>{c.name}</div>
                <div style={{ marginTop: 4, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <PromoSourceLabel source={c.source} />
                  <PromoStatusBadge status={c.status} />
                </div>
                {c.headOfficeId ? (
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>ID: {c.headOfficeId}</div>
                ) : null}
                <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>
                  {formatPromoDate(c.startAt)} – {formatPromoDate(c.endAt)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="crx-card" style={{ padding: 16 }}>
          <div className="crx-card-title" style={{ marginBottom: 10, fontSize: 13 }}>
            Store-local ({storeCampaigns.length})
          </div>
          {storeCampaigns.map((c) => (
            <div
              key={c.id}
              style={{
                padding: 10,
                marginBottom: 8,
                border: "1px solid #f3f4f6",
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 700 }}>{c.name}</div>
              <div style={{ marginTop: 4 }}>
                <PromoStatusBadge status={c.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
