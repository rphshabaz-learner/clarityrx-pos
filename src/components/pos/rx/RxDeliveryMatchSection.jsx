import React, { useState } from "react";
import { RX_DELIVERY_MATCH_STATUS, formatRxMoney } from "../../../lib/rx/rxIntegrationTypes";
import { EmptyState, FieldLabel, SectionIntro, StatusBadge } from "./RxShared";

export default function RxDeliveryMatchSection({ rx, busy, onCreate, onMatch }) {
  const [deliveryRef, setDeliveryRef] = useState("");
  const [amount, setAmount] = useState("");
  const [pickupBarcode, setPickupBarcode] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [note, setNote] = useState("");

  const handleCreate = () => {
    void onCreate({
      deliveryRef,
      amount: Number(amount) || 0,
      pickupBarcode,
      invoiceNumber,
      note,
    });
    setDeliveryRef("");
    setAmount("");
    setPickupBarcode("");
    setInvoiceNumber("");
    setNote("");
  };

  return (
    <div>
      <SectionIntro
        title="Delivery / payment matching"
        description="Match delivery fees and courier references to Rx pickups or POS invoices before month-end reconciliation."
      />
      <div className="crx-card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          <div>
            <FieldLabel>Delivery ref</FieldLabel>
            <input className="crx-input" value={deliveryRef} onChange={(e) => setDeliveryRef(e.target.value)} style={{ marginTop: 4, width: "100%" }} />
          </div>
          <div>
            <FieldLabel>Amount ($)</FieldLabel>
            <input
              className="crx-input"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ marginTop: 4, width: "100%" }}
            />
          </div>
          <div>
            <FieldLabel>Bag barcode</FieldLabel>
            <input
              className="crx-input"
              value={pickupBarcode}
              onChange={(e) => setPickupBarcode(e.target.value)}
              style={{ marginTop: 4, width: "100%" }}
            />
          </div>
          <div>
            <FieldLabel>POS invoice</FieldLabel>
            <input
              className="crx-input"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              style={{ marginTop: 4, width: "100%" }}
            />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <FieldLabel>Note</FieldLabel>
          <input className="crx-input" value={note} onChange={(e) => setNote(e.target.value)} style={{ marginTop: 4, width: "100%" }} />
        </div>
        <button type="button" className="btn-primary" style={{ marginTop: 12 }} disabled={busy} onClick={handleCreate}>
          Save match draft
        </button>
      </div>
      <div className="crx-card" style={{ padding: 12, maxHeight: 400, overflow: "auto" }}>
        {rx.deliveryMatches.length === 0 ? (
          <EmptyState message="No delivery matches logged." />
        ) : (
          rx.deliveryMatches.map((row) => (
            <div
              key={row.id}
              style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, marginBottom: 8 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{row.deliveryRef || "Delivery"}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                    {formatRxMoney(row.amount)}
                    {row.pickupBarcode ? ` · Bag ${row.pickupBarcode}` : ""}
                    {row.invoiceNumber ? ` · Inv ${row.invoiceNumber}` : ""}
                  </div>
                  {row.note ? <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{row.note}</div> : null}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <StatusBadge tone={row.status === RX_DELIVERY_MATCH_STATUS.MATCHED ? "ok" : "warn"}>
                    {row.status}
                  </StatusBadge>
                  {row.status === RX_DELIVERY_MATCH_STATUS.UNMATCHED ? (
                    <button type="button" className="btn-secondary" style={{ fontSize: 12 }} disabled={busy} onClick={() => onMatch(row.id)}>
                      Mark matched
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
