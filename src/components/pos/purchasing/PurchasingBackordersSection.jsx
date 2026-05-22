import React from "react";
import { EmptyState, SectionIntro, WholesalerName } from "./PurchasingShared";

export default function PurchasingBackordersSection({ backorders }) {
  return (
    <div>
      <SectionIntro
        title="Backorder tracking"
        description="Open backorders are calculated from ordered minus received quantities on active POs."
      />
      <div className="crx-card" style={{ padding: 16 }}>
        {backorders.length === 0 ? (
          <EmptyState message="No backordered lines." />
        ) : (
          backorders.map((row) => (
            <div
              key={`${row.orderNumber}-${row.lineId}`}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px 80px 80px",
                gap: 8,
                padding: "10px 0",
                borderBottom: "1px solid #f3f4f6",
                fontSize: 13,
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{row.description}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  {row.orderNumber} · <WholesalerName id={row.supplier} />
                </div>
              </div>
              <span>{row.sku}</span>
              <span style={{ color: "#d97706", fontWeight: 700 }}>BO {row.qtyBackordered}</span>
              <span>Ordered {row.qtyOrdered}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
