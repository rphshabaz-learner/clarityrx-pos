import React from "react";
import { WHOLESALERS } from "../../../lib/purchasing/wholesalers";
import { SectionIntro } from "./PurchasingShared";

export default function PurchasingWholesalersSection({
  catalogMeta,
  busy,
  onDownloadCatalog,
  onDownloadInvoices,
}) {
  return (
    <div>
      <SectionIntro
        title="Wholesaler integration"
        description="Download catalog and invoice feeds from connected wholesalers. Requires pharmacy transmit API routes on the backend."
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {WHOLESALERS.map((wholesaler) => {
          const meta = catalogMeta[wholesaler.id];
          return (
            <div key={wholesaler.id} className="crx-card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{wholesaler.label}</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6, lineHeight: 1.5 }}>
                EDI: {wholesaler.supportsEdi ? "Yes" : "Promotions only"}
                {wholesaler.isPromotionSource ? " · Head office promos" : ""}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                {wholesaler.supportsCatalogDownload ? (
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy}
                    onClick={() => onDownloadCatalog(wholesaler.id)}
                  >
                    Download catalog
                  </button>
                ) : null}
                {wholesaler.supportsInvoiceDownload ? (
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy}
                    onClick={() => onDownloadInvoices(wholesaler.id)}
                  >
                    Download invoices
                  </button>
                ) : null}
              </div>
              {meta?.message ? (
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 12 }}>{meta.message}</div>
              ) : null}
              {meta?.downloadedAt ? (
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
                  Last request: {new Date(meta.downloadedAt).toLocaleString()}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
