import React, { useMemo, useState } from "react";
import { PO_STATUS } from "../../../lib/purchasing/orderStatus";
import { wholesalerLabel } from "../../../lib/purchasing/wholesalers";
import {
  HandheldBackButton,
  HandheldScanField,
  HandheldSectionIntro,
} from "./HandheldShared";

function normalizeSku(value) {
  return String(value || "").trim().toLowerCase();
}

export default function HandheldReceiveSection({
  busy,
  orders,
  onReceive,
  onBack,
  onNotify,
  canReceive,
}) {
  const receivable = useMemo(
    () => orders.filter((o) => o.status === PO_STATUS.SUBMITTED || o.status === PO_STATUS.PARTIAL),
    [orders]
  );
  const [orderNumber, setOrderNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [receiveDraft, setReceiveDraft] = useState({});
  const [scanInput, setScanInput] = useState("");

  const order = receivable.find((o) => o.orderNumber === orderNumber) || null;

  const handleSelectPo = (num) => {
    setOrderNumber(num);
    const selected = receivable.find((o) => o.orderNumber === num);
    const draft = {};
    for (const line of selected?.lines || []) {
      draft[line.lineId] = { qtyThisPass: 0, unitCost: line.unitCost ?? "" };
    }
    setReceiveDraft(draft);
    setScanInput("");
  };

  const handleScanLine = () => {
    if (!order) {
      onNotify?.("Select a purchase order first.", "warning");
      return;
    }
    const q = normalizeSku(scanInput);
    if (!q) return;
    const line = (order.lines || []).find(
      (row) =>
        normalizeSku(row.sku) === q ||
        normalizeSku(row.wholesalerItemNumber) === q ||
        normalizeSku(row.din) === q
    );
    if (!line) {
      onNotify?.("SKU not on this PO.", "warning");
      return;
    }
    const remaining = Math.max(0, (Number(line.qtyOrdered) || 0) - (Number(line.qtyReceived) || 0));
    const current = Number(receiveDraft[line.lineId]?.qtyThisPass) || 0;
    if (current >= remaining) {
      onNotify?.("Line already fully counted for this pass.", "info");
      return;
    }
    setReceiveDraft((prev) => ({
      ...prev,
      [line.lineId]: {
        ...prev[line.lineId],
        qtyThisPass: current + 1,
      },
    }));
    setScanInput("");
    onNotify?.(`${line.description || line.sku}: ${current + 1} of ${remaining}`, "success");
  };

  const handleReceive = () => {
    if (!orderNumber) return;
    const hasQty = Object.values(receiveDraft).some((row) => Number(row?.qtyThisPass) > 0);
    if (!hasQty) {
      onNotify?.("Scan or enter quantities before receiving.", "warning");
      return;
    }
    onReceive({ orderNumber, receiveDraft, invoiceNumber: invoiceNumber.trim() });
  };

  if (!canReceive) {
    return (
      <div>
        <HandheldBackButton onClick={onBack} />
        <div className="crx-card" style={{ padding: 20, color: "#6b7280", fontSize: 13 }}>
          You do not have permission to receive stock. Ask a manager or use the Purchasing tab on a
          workstation.
        </div>
      </div>
    );
  }

  return (
    <div>
      <HandheldBackButton onClick={onBack} />
      <HandheldSectionIntro
        title="Receiving"
        description="Select a submitted PO, scan each carton to increment received quantity, then confirm receipt."
      />

      <div className="crx-card" style={{ padding: 14, marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>
          PURCHASE ORDER
        </label>
        <select
          className="crx-select"
          style={{ width: "100%", marginBottom: 12 }}
          value={orderNumber}
          onChange={(e) => handleSelectPo(e.target.value)}
          disabled={busy}
        >
          <option value="">Select PO…</option>
          {receivable.map((row) => (
            <option key={row.orderNumber} value={row.orderNumber}>
              {row.orderNumber} — {wholesalerLabel(row.supplier)}
            </option>
          ))}
        </select>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>
          INVOICE # (optional)
        </label>
        <input
          className="crx-input"
          value={invoiceNumber}
          disabled={busy || !order}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          placeholder="Wholesaler invoice"
        />
      </div>

      {order ? (
        <>
          <HandheldScanField
            value={scanInput}
            onChange={setScanInput}
            onSubmit={handleScanLine}
            disabled={busy}
            placeholder="Scan SKU on PO (+1 each scan)…"
            autoFocus
          />
          <div className="crx-card" style={{ padding: 12, marginTop: 12, maxHeight: 280, overflow: "auto" }}>
            {(order.lines || []).map((line) => {
              const remaining = Math.max(0, (Number(line.qtyOrdered) || 0) - (Number(line.qtyReceived) || 0));
              const qtyThisPass = Number(receiveDraft[line.lineId]?.qtyThisPass) || 0;
              return (
                <div
                  key={line.lineId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 72px",
                    gap: 8,
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{line.description || line.sku}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      {line.sku} · open {remaining}
                    </div>
                  </div>
                  <input
                    className="crx-input"
                    type="number"
                    min="0"
                    max={remaining}
                    value={qtyThisPass}
                    disabled={busy}
                    onChange={(e) =>
                      setReceiveDraft((prev) => ({
                        ...prev,
                        [line.lineId]: {
                          ...prev[line.lineId],
                          qtyThisPass: Math.min(remaining, Math.max(0, Number(e.target.value) || 0)),
                        },
                      }))
                    }
                  />
                </div>
              );
            })}
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{ width: "100%", marginTop: 14, minHeight: 52 }}
            disabled={busy}
            onClick={handleReceive}
          >
            Confirm receive
          </button>
        </>
      ) : (
        <div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
          {receivable.length ? "Select a PO to begin receiving." : "No submitted POs awaiting receipt."}
        </div>
      )}
    </div>
  );
}
