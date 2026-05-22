import React from "react";
import { emptyLot, productDisplayName } from "../../../lib/inventory/frontStoreTypes";
import { EmptyState, SectionIntro } from "./InventoryShared";

function daysUntilExpiry(dateStr) {
  if (!dateStr) return null;
  const days = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return days;
}

export default function InventoryExpirySection({
  products,
  selectedProduct,
  selectedProductId,
  setSelectedProductId,
  busy,
  onSaveProduct,
}) {
  const expiryProducts = products.filter((p) => p.trackExpiry || (p.lots || []).length > 0);

  const updateLots = (lots) => {
    if (!selectedProduct) return;
    onSaveProduct({ ...selectedProduct, trackExpiry: true, lots });
  };

  return (
    <div>
      <SectionIntro
        title="Expiry tracking"
        description="Track lot numbers and expiry dates for OTC and home healthcare items. Lots with expiry within 90 days are flagged."
      />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 1fr) minmax(0, 2fr)", gap: 16 }}>
        <div className="crx-card" style={{ padding: 12, maxHeight: 480, overflow: "auto" }}>
          <div className="crx-card-title" style={{ marginBottom: 10, fontSize: 13 }}>
            Tracked products ({expiryProducts.length})
          </div>
          {products.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setSelectedProductId(row.id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: 8,
                marginBottom: 6,
                borderRadius: 8,
                border: selectedProductId === row.id ? "2px solid #2563eb" : "1px solid #e5e7eb",
                background: selectedProductId === row.id ? "#eff6ff" : "#fff",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              {row.sku}
              {row.trackExpiry ? " · tracking on" : ""}
            </button>
          ))}
        </div>

        <div className="crx-card" style={{ padding: 16 }}>
          {!selectedProduct ? (
            <EmptyState message="Select a product to manage expiry lots." />
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{productDisplayName(selectedProduct)}</div>
                <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={!!selectedProduct.trackExpiry}
                    onChange={(e) => onSaveProduct({ ...selectedProduct, trackExpiry: e.target.checked })}
                    disabled={busy}
                  />
                  Track expiry
                </label>
              </div>

              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#6b7280" }}>
                    <th style={{ padding: "6px 4px" }}>Lot</th>
                    <th style={{ padding: "6px 4px" }}>Expiry</th>
                    <th style={{ padding: "6px 4px" }}>Qty</th>
                    <th style={{ padding: "6px 4px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedProduct.lots || []).map((lot, index) => {
                    const days = daysUntilExpiry(lot.expiryDate);
                    const warn = days != null && days >= 0 && days <= 90;
                    return (
                      <tr key={lot.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                        <td style={{ padding: 4 }}>
                          <input
                            className="crx-input"
                            value={lot.lotNumber || ""}
                            onChange={(e) => {
                              const lots = [...(selectedProduct.lots || [])];
                              lots[index] = { ...lot, lotNumber: e.target.value };
                              updateLots(lots);
                            }}
                            style={{ width: "100%" }}
                          />
                        </td>
                        <td style={{ padding: 4 }}>
                          <input
                            className="crx-input"
                            type="date"
                            value={lot.expiryDate || ""}
                            onChange={(e) => {
                              const lots = [...(selectedProduct.lots || [])];
                              lots[index] = { ...lot, expiryDate: e.target.value };
                              updateLots(lots);
                            }}
                            style={{ width: "100%" }}
                          />
                          {warn ? (
                            <span style={{ fontSize: 10, color: "#b45309" }}>{days}d left</span>
                          ) : null}
                        </td>
                        <td style={{ padding: 4 }}>
                          <input
                            className="crx-input"
                            type="number"
                            min="0"
                            value={lot.qty ?? 0}
                            onChange={(e) => {
                              const lots = [...(selectedProduct.lots || [])];
                              lots[index] = { ...lot, qty: Number(e.target.value) };
                              updateLots(lots);
                            }}
                            style={{ width: 72 }}
                          />
                        </td>
                        <td style={{ padding: 4 }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ fontSize: 11 }}
                            onClick={() => {
                              const lots = (selectedProduct.lots || []).filter((_, i) => i !== index);
                              updateLots(lots);
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: 12 }}
                disabled={busy}
                onClick={() => updateLots([...(selectedProduct.lots || []), emptyLot()])}
              >
                + Add lot
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
