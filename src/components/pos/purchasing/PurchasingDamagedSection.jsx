import React, { useState } from "react";
import { WHOLESALERS } from "../../../lib/purchasing/wholesalers";
import { EmptyState, SectionIntro, WholesalerName } from "./PurchasingShared";

export default function PurchasingDamagedSection({ damaged, onRecordDamaged, onResolveDamaged }) {
  const [supplier, setSupplier] = useState("mckesson");
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState(1);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [disposition, setDisposition] = useState("return");
  const [notes, setNotes] = useState("");

  const handleRecord = () => {
    if (!sku.trim()) return;
    onRecordDamaged({
      supplier,
      sku: sku.trim(),
      qty: Number(qty) || 1,
      invoiceNumber: invoiceNumber.trim(),
      disposition,
      notes: notes.trim(),
    });
    setSku("");
    setNotes("");
  };

  return (
    <div>
      <SectionIntro
        title="Damaged goods handling"
        description="Log damaged receipts, link to RTV or credit, and mark resolved when the vendor confirms."
      />
      <div className="crx-card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(120px, 1fr)) 1fr auto", gap: 8 }}>
          <select className="crx-select" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
            {WHOLESALERS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
          <input className="crx-input" placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
          <input className="crx-input" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
          <input
            className="crx-input"
            placeholder="Invoice #"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
          <select className="crx-select" value={disposition} onChange={(e) => setDisposition(e.target.value)}>
            <option value="return">Return to vendor</option>
            <option value="destroy">Destroy on site</option>
            <option value="credit">Vendor credit only</option>
          </select>
          <button type="button" className="btn-primary" onClick={handleRecord}>
            Log
          </button>
        </div>
        <input
          className="crx-input"
          style={{ marginTop: 8 }}
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="crx-card" style={{ padding: 16 }}>
        {damaged.length === 0 ? (
          <EmptyState message="No damaged goods records." />
        ) : (
          damaged.map((row) => (
            <div
              key={row.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "10px 0",
                borderBottom: "1px solid #f3f4f6",
                fontSize: 13,
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>
                  {row.sku} × {row.qty}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>
                  <WholesalerName id={row.supplier} /> · {row.disposition} · {row.status}
                  {row.invoiceNumber ? ` · Inv ${row.invoiceNumber}` : ""}
                </div>
                {row.notes ? <div style={{ fontSize: 12, marginTop: 4 }}>{row.notes}</div> : null}
              </div>
              {row.status === "open" ? (
                <button type="button" className="btn-secondary" onClick={() => onResolveDamaged(row.id)}>
                  Resolve
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
