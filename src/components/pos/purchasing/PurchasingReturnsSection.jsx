import React, { useState } from "react";
import { generateRecordId } from "../../../lib/purchasing/orderStatus";
import { WHOLESALERS } from "../../../lib/purchasing/wholesalers";
import { EmptyState, SectionIntro, WholesalerName } from "./PurchasingShared";

export default function PurchasingReturnsSection({ returns, busy, onCreateReturn, onSubmitReturn }) {
  const [supplier, setSupplier] = useState("mckesson");
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("overstock");

  const handleCreate = () => {
    if (!sku.trim()) return;
    onCreateReturn({
      supplier,
      lines: [
        {
          lineId: generateRecordId("rtvln"),
          sku: sku.trim(),
          qty: Number(qty) || 1,
          reason,
        },
      ],
      notes: reason,
    });
    setSku("");
  };

  return (
    <div>
      <SectionIntro
        title="Return to vendor (RTV)"
        description="Create RTV drafts and submit to the wholesaler via EDI when the pharmacy gateway is configured."
      />
      <div className="crx-card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select className="crx-select" value={supplier} onChange={(e) => setSupplier(e.target.value)} style={{ maxWidth: 220 }}>
            {WHOLESALERS.filter((w) => w.supportsEdi).map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
          <input className="crx-input" placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} style={{ maxWidth: 160 }} />
          <input className="crx-input" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} style={{ maxWidth: 80 }} />
          <select className="crx-select" value={reason} onChange={(e) => setReason(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="overstock">Overstock</option>
            <option value="near_expiry">Near expiry</option>
            <option value="recall">Recall</option>
            <option value="damaged">Damaged</option>
          </select>
          <button type="button" className="btn-primary" disabled={busy} onClick={handleCreate}>
            New RTV
          </button>
        </div>
      </div>
      <div className="crx-card" style={{ padding: 16 }}>
        {returns.length === 0 ? (
          <EmptyState message="No vendor returns." />
        ) : (
          returns.map((row) => (
            <div
              key={row.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{row.id}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>
                  <WholesalerName id={row.supplier} /> · {row.status}
                  {row.edi?.reference ? ` · ${row.edi.reference}` : ""}
                </div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  {(row.lines || []).map((line) => (
                    <span key={line.lineId} style={{ marginRight: 12 }}>
                      {line.sku} × {line.qty}
                    </span>
                  ))}
                </div>
              </div>
              {row.status === "draft" ? (
                <button type="button" className="btn-secondary" disabled={busy} onClick={() => onSubmitReturn(row.id)}>
                  Submit RTV
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
