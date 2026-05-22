import React, { useState } from "react";
import { usePurchasing } from "../../../hooks/usePurchasing";
import PurchasingBackordersSection from "./PurchasingBackordersSection";
import PurchasingDamagedSection from "./PurchasingDamagedSection";
import PurchasingOrdersSection from "./PurchasingOrdersSection";
import PurchasingReceiveSection from "./PurchasingReceiveSection";
import PurchasingReplenishmentSection from "./PurchasingReplenishmentSection";
import PurchasingReturnsSection from "./PurchasingReturnsSection";
import PurchasingWholesalersSection from "./PurchasingWholesalersSection";

const PURCHASING_SECTIONS = [
  { id: "orders", label: "Orders" },
  { id: "receive", label: "Receiving" },
  { id: "replenish", label: "Replenishment" },
  { id: "backorders", label: "Backorders" },
  { id: "wholesalers", label: "Wholesalers" },
  { id: "returns", label: "RTV" },
  { id: "damaged", label: "Damaged" },
];

export default function PosPurchasingPanel({ accessToken, tillNumber, onNotify, logActivity }) {
  const [section, setSection] = useState("orders");
  const purchasing = usePurchasing({ accessToken, tillNumber, onNotify, logActivity });

  if (purchasing.loading) {
    return (
      <div className="crx-card" style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
        Loading purchasing…
      </div>
    );
  }

  const openPoCount = purchasing.orders.filter((o) => o.status !== "received" && o.status !== "cancelled").length;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>Purchasing &amp; receiving</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
          McKesson · Kohl &amp; Frisch · Imperial · Head office promotions · EDI submit · inventory sync on receive
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 12, fontWeight: 600, color: "#374151" }}>
          <span>Open POs: {openPoCount}</span>
          <span>Backorders: {purchasing.backorders.length}</span>
          <span>Open damaged: {purchasing.damaged.filter((d) => d.status === "open").length}</span>
        </div>
      </div>

      <div className="crx-tabs" style={{ marginBottom: 16 }}>
        {PURCHASING_SECTIONS.map((row) => (
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

      {section === "orders" ? (
        <PurchasingOrdersSection
          orders={purchasing.orders}
          selectedOrder={purchasing.selectedOrder}
          selectedOrderNumber={purchasing.selectedOrderNumber}
          setSelectedOrderNumber={purchasing.setSelectedOrderNumber}
          busy={purchasing.busy}
          onCreateDraft={purchasing.createDraftOrder}
          onSaveOrder={purchasing.saveOrder}
          onSubmitEdi={purchasing.submitOrderEdi}
          onCancelOrder={purchasing.cancelOrder}
          emptyDraftLine={purchasing.emptyDraftLine}
          searchCatalog={purchasing.searchCatalog}
        />
      ) : null}

      {section === "receive" ? (
        <PurchasingReceiveSection orders={purchasing.orders} busy={purchasing.busy} onReceive={purchasing.receiveOrder} />
      ) : null}

      {section === "replenish" ? (
        <PurchasingReplenishmentSection
          rules={purchasing.rules}
          busy={purchasing.busy}
          onSaveRule={purchasing.saveRule}
          onRemoveRule={purchasing.removeRule}
          onBuildOrder={purchasing.buildReplenishmentOrder}
        />
      ) : null}

      {section === "backorders" ? <PurchasingBackordersSection backorders={purchasing.backorders} /> : null}

      {section === "wholesalers" ? (
        <PurchasingWholesalersSection
          catalogMeta={purchasing.catalogMeta}
          busy={purchasing.busy}
          onDownloadCatalog={purchasing.downloadCatalog}
          onDownloadInvoices={purchasing.downloadInvoices}
        />
      ) : null}

      {section === "returns" ? (
        <PurchasingReturnsSection
          returns={purchasing.returns}
          busy={purchasing.busy}
          onCreateReturn={purchasing.createReturn}
          onSubmitReturn={purchasing.submitReturn}
        />
      ) : null}

      {section === "damaged" ? (
        <PurchasingDamagedSection
          damaged={purchasing.damaged}
          onRecordDamaged={purchasing.recordDamaged}
          onResolveDamaged={purchasing.resolveDamaged}
        />
      ) : null}
    </div>
  );
}
