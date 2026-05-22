import React, { useState } from "react";
import { productDisplayName } from "../../../lib/inventory/frontStoreTypes";
import { EmptyState, FieldLabel, SectionIntro } from "./InventoryShared";

export default function InventoryCountsSection({
  products,
  selectedProduct,
  selectedProductId,
  setSelectedProductId,
  busy,
  onApplyCount,
}) {
  const [countedQty, setCountedQty] = useState("");

  const systemQty = selectedProduct ? Number(selectedProduct.onHand) || 0 : 0;
  const parsedCount = Number(countedQty);
  const variance =
    selectedProduct && Number.isFinite(parsedCount) ? parsedCount - systemQty : null;

  const handlePost = async () => {
    if (!selectedProduct || !Number.isFinite(parsedCount)) return;
    const ok = await onApplyCount(selectedProduct.id, parsedCount);
    if (ok) setCountedQty("");
  };

  return (
    <div>
      <SectionIntro
        title="Inventory counts"
        description="Enter a physical count for a SKU. Variances post to the pharmacy API as inventory adjustments with reason physical_count."
      />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(200px, 1fr) minmax(0, 2fr)", gap: 16 }}>
        <div className="crx-card" style={{ padding: 12, maxHeight: 400, overflow: "auto" }}>
          <div className="crx-card-title" style={{ marginBottom: 10, fontSize: 13 }}>
            Select SKU
          </div>
          {products.length === 0 ? (
            <EmptyState message="No products." />
          ) : (
            products.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => {
                  setSelectedProductId(row.id);
                  setCountedQty(String(row.onHand ?? 0));
                }}
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
                {row.sku} · Qty {row.onHand ?? 0}
              </button>
            ))
          )}
        </div>

        <div className="crx-card" style={{ padding: 16 }}>
          {!selectedProduct ? (
            <EmptyState message="Select a product to count." />
          ) : (
            <>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{productDisplayName(selectedProduct)}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
                System on-hand: <strong>{systemQty}</strong>
              </div>
              <div style={{ maxWidth: 200 }}>
                <FieldLabel>Counted quantity</FieldLabel>
                <input
                  className="crx-input"
                  type="number"
                  min="0"
                  step="1"
                  value={countedQty}
                  onChange={(e) => setCountedQty(e.target.value)}
                  style={{ marginTop: 6, width: "100%" }}
                />
              </div>
              {variance != null ? (
                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    borderRadius: 8,
                    background: variance === 0 ? "#ecfdf5" : "#fffbeb",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Variance: {variance > 0 ? `+${variance}` : variance} units
                </div>
              ) : null}
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: 16 }}
                disabled={busy || !Number.isFinite(parsedCount)}
                onClick={handlePost}
              >
                Post count adjustment
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
