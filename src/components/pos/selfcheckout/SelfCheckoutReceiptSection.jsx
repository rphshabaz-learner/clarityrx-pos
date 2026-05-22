import React from "react";
import { RECEIPT_DELIVERY, RECEIPT_DELIVERY_OPTIONS } from "../../../lib/selfCheckout/selfCheckoutTypes";
import { EmptyState, FieldLabel, SectionIntro } from "./SelfCheckoutShared";

export default function SelfCheckoutReceiptSection({ sc }) {
  const patch = (key, value) => sc.updateConfigDraft({ [key]: value });

  const toggleOffered = (id) => {
    const current = sc.config?.offeredReceiptOptions || [];
    const next = current.includes(id) ? current.filter((row) => row !== id) : [...current, id];
    if (!next.length) return;
    patch("offeredReceiptOptions", next);
  };

  return (
    <div>
      <SectionIntro
        title="Receipt options"
        description="Choose which receipt delivery methods appear on the kiosk and the default selection. Completed sales store the customer choice for reprint and audit."
      />
      <div className="crx-card" style={{ padding: 20, maxWidth: 560, marginBottom: 16 }}>
        <FieldLabel>Default receipt method</FieldLabel>
        <select
          className="crx-input"
          value={sc.config?.defaultReceiptDelivery || RECEIPT_DELIVERY.PRINT}
          onChange={(e) => patch("defaultReceiptDelivery", e.target.value)}
          style={{ width: "100%", marginTop: 6, marginBottom: 16 }}
        >
          {RECEIPT_DELIVERY_OPTIONS.map((row) => (
            <option key={row.id} value={row.id}>
              {row.label}
            </option>
          ))}
        </select>

        <FieldLabel>Offer on kiosk</FieldLabel>
        <div style={{ display: "grid", gap: 8, marginTop: 8, marginBottom: 16 }}>
          {RECEIPT_DELIVERY_OPTIONS.map((row) => (
            <label
              key={row.id}
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={(sc.config?.offeredReceiptOptions || []).includes(row.id)}
                onChange={() => toggleOffered(row.id)}
              />
              {row.label}
            </label>
          ))}
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={Boolean(sc.config?.requireEmailForEmailReceipt)}
            onChange={(e) => patch("requireEmailForEmailReceipt", e.target.checked)}
          />
          Require contact when email or text is selected
        </label>

        <button
          type="button"
          className="btn-primary"
          style={{ marginTop: 16 }}
          disabled={sc.busy}
          onClick={() => sc.saveConfig(sc.config)}
        >
          Save receipt settings
        </button>
      </div>

      <div className="crx-card" style={{ padding: 16 }}>
        <div className="crx-card-title" style={{ marginBottom: 10 }}>
          Recent kiosk sessions
        </div>
        {sc.sessions.length === 0 ? (
          <EmptyState message="No completed self-checkout sessions yet." />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                <th style={{ padding: 8 }}>Invoice</th>
                <th style={{ padding: 8 }}>Total</th>
                <th style={{ padding: 8 }}>Receipt</th>
                <th style={{ padding: 8 }}>When</th>
              </tr>
            </thead>
            <tbody>
              {sc.sessions.slice(0, 12).map((row) => (
                <tr key={row.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td style={{ padding: 8, fontWeight: 700 }}>{row.invoiceNumber || "—"}</td>
                  <td style={{ padding: 8 }}>${Number(row.total || 0).toFixed(2)}</td>
                  <td style={{ padding: 8 }}>{row.receiptDelivery || "—"}</td>
                  <td style={{ padding: 8, color: "#6b7280" }}>
                    {row.completedAt ? new Date(row.completedAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {sc.sessions.length > 0 ? (
          <button
            type="button"
            className="btn-secondary"
            style={{ marginTop: 12, fontSize: 12 }}
            disabled={sc.busy}
            onClick={() => void sc.clearSessions()}
          >
            Clear session history
          </button>
        ) : null}
      </div>
    </div>
  );
}
