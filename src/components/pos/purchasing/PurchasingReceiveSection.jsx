import React, { useMemo, useState } from "react";
import { PO_STATUS } from "../../../lib/purchasing/orderStatus";
import { wholesalerLabel } from "../../../lib/purchasing/wholesalers";
import { EmptyState, SectionIntro, StatusBadge } from "./PurchasingShared";

export default function PurchasingReceiveSection({ orders, busy, onReceive }) {
  const receivable = useMemo(
    () => orders.filter((o) => o.status === PO_STATUS.SUBMITTED || o.status === PO_STATUS.PARTIAL),
    [orders]
  );
  const [orderNumber, setOrderNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [receiveDraft, setReceiveDraft] = useState({});

  const order = receivable.find((o) => o.orderNumber === orderNumber) || null;

  const handleSelect = (num) => {
    setOrderNumber(num);
    const selected = receivable.find((o) => o.orderNumber === num);
    const draft = {};
    for (const line of selected?.lines || []) {
      const remaining = Math.max(0, (Number(line.qtyOrdered) || 0) - (Number(line.qtyReceived) || 0));
      draft[line.lineId] = { qtyThisPass: remaining, unitCost: line.unitCost ?? "" };
    }
    setReceiveDraft(draft);
  };

  const handleReceive = () => {
    if (!orderNumber) return;
    onReceive({ orderNumber, receiveDraft, invoiceNumber: invoiceNumber.trim() });
  };

  return (
    <div>
      <SectionIntro
        title="Receiving invoices"
        description="Receive against submitted POs. Confirmed quantities post positive stock deltas via /pos/inventory/adjustments."
      />
      <div className="crx-card" style={{ padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
            Purchase order
            <select
              className="crx-select"
              style={{ marginTop: 6 }}
              value={orderNumber}
              onChange={(e) => handleSelect(e.target.value)}
            >
              <option value="">Select PO…</option>
              {receivable.map((row) => (
                <option key={row.orderNumber} value={row.orderNumber}>
                  {row.orderNumber} — {wholesalerLabel(row.supplier)}
                </option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
            Invoice #
            <input
              className="crx-input"
              style={{ marginTop: 6 }}
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Wholesaler invoice"
            />
          </label>
        </div>

        {!order ? (
          <EmptyState message={receivable.length ? "Select a PO to receive." : "No submitted POs awaiting receipt."} />
        ) : (
          <>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
              <StatusBadge status={order.status} /> · {(order.lines || []).length} line(s)
            </div>
            {(order.lines || []).map((line) => {
              const remaining = Math.max(0, (Number(line.qtyOrdered) || 0) - (Number(line.qtyReceived) || 0));
              return (
                <div
                  key={line.lineId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 90px 90px 90px",
                    gap: 8,
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{line.description}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      {line.sku} · ordered {line.qtyOrdered} · received {line.qtyReceived || 0} · open {remaining}
                    </div>
                  </div>
                  <input
                    className="crx-input"
                    type="number"
                    min="0"
                    max={remaining}
                    value={receiveDraft[line.lineId]?.qtyThisPass ?? 0}
                    onChange={(e) =>
                      setReceiveDraft((prev) => ({
                        ...prev,
                        [line.lineId]: { ...prev[line.lineId], qtyThisPass: Number(e.target.value) || 0 },
                      }))
                    }
                    title="Receive now"
                  />
                  <input
                    className="crx-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={receiveDraft[line.lineId]?.unitCost ?? line.unitCost ?? ""}
                    onChange={(e) =>
                      setReceiveDraft((prev) => ({
                        ...prev,
                        [line.lineId]: { ...prev[line.lineId], unitCost: e.target.value },
                      }))
                    }
                    title="Unit cost update"
                  />
                  <span style={{ fontSize: 11, color: line.qtyBackordered > 0 ? "#d97706" : "#6b7280" }}>
                    BO {line.qtyBackordered || 0}
                  </span>
                </div>
              );
            })}
            <button type="button" className="btn-primary" style={{ marginTop: 16 }} disabled={busy} onClick={handleReceive}>
              Receive &amp; sync inventory
            </button>
          </>
        )}
      </div>
    </div>
  );
}
