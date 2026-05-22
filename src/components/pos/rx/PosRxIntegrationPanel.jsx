import React, { useState } from "react";
import { useRxIntegration } from "../../../hooks/useRxIntegration";
import RxAccountChargeSection from "./RxAccountChargeSection";
import RxDeliveryMatchSection from "./RxDeliveryMatchSection";
import RxKrollSection from "./RxKrollSection";
import RxPaymentPostSection from "./RxPaymentPostSection";
import RxPickupSyncSection from "./RxPickupSyncSection";
import RxReceiptsSection from "./RxReceiptsSection";
import RxStatusLookupSection from "./RxStatusLookupSection";
import { StatTile } from "./RxShared";

const RX_SECTIONS = [
  { id: "kroll", label: "Kroll" },
  { id: "pickups", label: "Pickup sync" },
  { id: "payments", label: "Rx payments" },
  { id: "receipts", label: "Receipts" },
  { id: "status", label: "Status lookup" },
  { id: "accounts", label: "Account charge" },
  { id: "delivery", label: "Delivery match" },
];

export default function PosRxIntegrationPanel({
  onNotify,
  logActivity,
  onAttachPickup,
  onAttachCustomer,
  onOpenSales,
  onOpenCustomers,
}) {
  const [section, setSection] = useState("kroll");
  const rx = useRxIntegration({ onNotify, logActivity });

  if (rx.loading) {
    return (
      <div className="crx-card" style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
        Loading Rx integration…
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>Rx integration</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
          Kroll bridge · prescription pickup sync · Rx payment posting · combined receipts · status lookup · patient
          account charging · delivery matching
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
          <StatTile label="Pending Rx posts" value={rx.stats.pendingPayments} />
          <StatTile label="Ready pickups" value={rx.stats.readyPickups} />
          <StatTile label="Combined receipts" value={rx.stats.combinedReceipts} />
          <StatTile label="Unmatched delivery" value={rx.stats.unmatchedDeliveries} />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="button" className="btn-secondary" disabled={rx.busy} onClick={() => rx.refresh()}>
            Refresh all
          </button>
        </div>
      </div>

      <div className="crx-tabs" style={{ marginBottom: 16 }}>
        {RX_SECTIONS.map((row) => (
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

      {section === "kroll" ? (
        <RxKrollSection rx={rx} busy={rx.busy} onRefreshHealth={() => rx.refreshHealth()} />
      ) : null}
      {section === "pickups" ? (
        <RxPickupSyncSection
          rx={rx}
          busy={rx.busy}
          onSync={() => rx.requestPickupSync()}
          onAttachPickup={onAttachPickup}
          onOpenSales={onOpenSales}
        />
      ) : null}
      {section === "payments" ? (
        <RxPaymentPostSection
          rx={rx}
          busy={rx.busy}
          onPostRow={(row) => rx.postPaymentRow(row)}
          onPostAll={() => rx.postAllPendingPayments()}
        />
      ) : null}
      {section === "receipts" ? <RxReceiptsSection rx={rx} /> : null}
      {section === "status" ? (
        <RxStatusLookupSection rx={rx} busy={rx.busy} onLookup={(q) => rx.runStatusLookup(q)} />
      ) : null}
      {section === "accounts" ? (
        <RxAccountChargeSection
          rx={rx}
          onAttachCustomer={onAttachCustomer}
          onOpenCustomers={onOpenCustomers}
        />
      ) : null}
      {section === "delivery" ? (
        <RxDeliveryMatchSection
          rx={rx}
          busy={rx.busy}
          onCreate={(draft) => rx.createDeliveryMatch(draft)}
          onMatch={(id) => rx.markDeliveryMatched(id)}
        />
      ) : null}
    </div>
  );
}
