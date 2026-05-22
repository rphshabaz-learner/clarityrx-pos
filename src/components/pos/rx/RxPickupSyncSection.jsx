import React from "react";
import { formatRxMoney } from "../../../lib/rx/rxIntegrationTypes";
import { EmptyState, SectionIntro, StatusBadge } from "./RxShared";

export default function RxPickupSyncSection({
  rx,
  busy,
  onSync,
  onAttachPickup,
  onOpenSales,
}) {
  const ready = (rx.pickups || []).filter((row) => row?.status !== "picked_up");

  return (
    <div>
      <SectionIntro
        title="Prescription pickup sync"
        description="Ready bags from Kroll / packaging queue. Attach to the sales register for combined OTC + Rx billing."
      />
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <StatusBadge tone={rx.pickupSyncOn ? "ok" : "neutral"}>
          {rx.pickupSyncOn ? "Live sync enabled" : "Polling / manual refresh"}
        </StatusBadge>
        <button type="button" className="btn-secondary" disabled={busy || rx.pickupsLoading} onClick={onSync}>
          Sync pickups now
        </button>
        <button type="button" className="btn-secondary" onClick={onOpenSales}>
          Open sales register
        </button>
      </div>
      <div className="crx-card" style={{ padding: 12, maxHeight: 480, overflow: "auto" }}>
        {ready.length === 0 ? (
          <EmptyState message={rx.pickupsLoading ? "Loading pickups…" : "No ready pickups in queue."} />
        ) : (
          ready.map((pickup) => (
            <div
              key={pickup.id || pickup.barcode}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{pickup.barcode || pickup.id || "Pickup"}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                  {pickup.rxCount || 1} script(s) · {pickup.patientName || pickup.customerName || "Patient"} ·{" "}
                  {formatRxMoney(pickup.totalCopay)}
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Status: {pickup.status || "ready"}</div>
              </div>
              <button
                type="button"
                className="btn-primary"
                style={{ fontSize: 12 }}
                disabled={busy}
                onClick={() => onAttachPickup?.(pickup)}
              >
                Attach to till
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
