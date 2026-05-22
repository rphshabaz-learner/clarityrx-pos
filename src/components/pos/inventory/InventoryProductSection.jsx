import React, { useState } from "react";
import { WHOLESALERS } from "../../../lib/purchasing/wholesalers";
import {
  FRONT_STORE_DEPARTMENTS,
  PRODUCT_STATUS_OPTIONS,
  productDisplayName,
} from "../../../lib/inventory/frontStoreTypes";
import {
  computeMarginPercent,
  formatMarginPercent,
  formatMoney,
  retailFromCostAndMargin,
} from "../../../lib/inventory/margin";
import {
  EmptyState,
  FieldLabel,
  ProductListSidebar,
  ProductStatusBadge,
  SectionIntro,
} from "./InventoryShared";

export default function InventoryProductSection({
  filteredProducts,
  selectedProduct,
  selectedProductId,
  setSelectedProductId,
  listQuery,
  setListQuery,
  busy,
  onCreateProduct,
  onSaveProduct,
  onRemoveProduct,
  onSelectByScan,
}) {
  const [scanInput, setScanInput] = useState("");

  const update = (patch) => {
    if (!selectedProduct) return;
    onSaveProduct({ ...selectedProduct, ...patch });
  };

  const applyTargetMargin = () => {
    if (!selectedProduct) return;
    const target = Number(selectedProduct.targetMarginPercent);
    const retail = retailFromCostAndMargin(selectedProduct.cost, target);
    if (retail == null) return;
    onSaveProduct({ ...selectedProduct, retail: Math.round(retail * 100) / 100 });
  };

  const margin = selectedProduct
    ? computeMarginPercent(selectedProduct.cost, selectedProduct.retail)
    : null;

  const handleScan = () => {
    const hit = onSelectByScan?.(scanInput);
    if (hit) setScanInput("");
  };

  return (
    <div>
      <SectionIntro
        title="Product search & maintenance"
        description="Search front-shop items by SKU or UPC. Maintain identifiers, pricing, departments, vendor mapping, and margin targets."
      />

      <div className="crx-card" style={{ padding: 12, marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          className="crx-input"
          placeholder="Scan or enter SKU / UPC to open product…"
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleScan();
          }}
          style={{ flex: "1 1 240px", minWidth: 200 }}
        />
        <button type="button" className="btn-secondary" disabled={busy || !scanInput.trim()} onClick={handleScan}>
          Open product
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) minmax(0, 2fr)", gap: 16 }}>
        <ProductListSidebar
          products={filteredProducts}
          selectedProductId={selectedProductId}
          setSelectedProductId={setSelectedProductId}
          listQuery={listQuery}
          setListQuery={setListQuery}
          onCreate={onCreateProduct}
          busy={busy}
        />

        <div className="crx-card" style={{ padding: 16 }}>
          {!selectedProduct ? (
            <EmptyState message="Select a product or create a new SKU." />
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  marginBottom: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
                    {productDisplayName(selectedProduct)}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                    {selectedProduct.sku} · On hand {selectedProduct.onHand ?? 0}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <ProductStatusBadge status={selectedProduct.status} />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm("Remove this product from front-shop inventory?")) {
                      onRemoveProduct(selectedProduct.id);
                    }
                  }}
                >
                  Remove
                </button>
              </div>

              <div style={{ fontSize: 13, fontWeight: 800, color: "#374151", marginBottom: 10 }}>SKU &amp; description</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
                <div>
                  <FieldLabel>SKU</FieldLabel>
                  <input
                    className="crx-input"
                    value={selectedProduct.sku || ""}
                    onChange={(e) => update({ sku: e.target.value })}
                    style={{ marginTop: 6, width: "100%" }}
                  />
                </div>
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <select
                    className="crx-select"
                    value={selectedProduct.status}
                    onChange={(e) => update({ status: e.target.value })}
                    style={{ marginTop: 6, width: "100%" }}
                  >
                    {PRODUCT_STATUS_OPTIONS.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <FieldLabel>Product name</FieldLabel>
                  <input
                    className="crx-input"
                    value={selectedProduct.name || ""}
                    onChange={(e) => update({ name: e.target.value })}
                    style={{ marginTop: 6, width: "100%" }}
                  />
                </div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 800, color: "#374151", marginBottom: 10 }}>UPC management</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
                <div>
                  <FieldLabel>Primary UPC</FieldLabel>
                  <input
                    className="crx-input"
                    value={selectedProduct.upc || ""}
                    onChange={(e) => update({ upc: e.target.value })}
                    style={{ marginTop: 6, width: "100%" }}
                  />
                </div>
                <div>
                  <FieldLabel>Alternate barcodes</FieldLabel>
                  <input
                    className="crx-input"
                    placeholder="Comma-separated"
                    value={(selectedProduct.barcodes || []).join(", ")}
                    onChange={(e) =>
                      update({
                        barcodes: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    style={{ marginTop: 6, width: "100%" }}
                  />
                </div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 800, color: "#374151", marginBottom: 10 }}>
                Department &amp; category
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
                <div>
                  <FieldLabel>Department</FieldLabel>
                  <select
                    className="crx-select"
                    value={selectedProduct.departmentId}
                    onChange={(e) => update({ departmentId: e.target.value })}
                    style={{ marginTop: 6, width: "100%" }}
                  >
                    {FRONT_STORE_DEPARTMENTS.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Sub-category</FieldLabel>
                  <input
                    className="crx-input"
                    placeholder="e.g. Pain relief, Lip care"
                    value={selectedProduct.category || ""}
                    onChange={(e) => update({ category: e.target.value })}
                    style={{ marginTop: 6, width: "100%" }}
                  />
                </div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 800, color: "#374151", marginBottom: 10 }}>Vendor mapping</div>
              <div style={{ marginBottom: 16 }}>
                <FieldLabel>Primary vendor</FieldLabel>
                <select
                  className="crx-select"
                  value={selectedProduct.vendorId || ""}
                  onChange={(e) => update({ vendorId: e.target.value })}
                  style={{ marginTop: 6, width: "100%", maxWidth: 320 }}
                >
                  <option value="">— None —</option>
                  {WHOLESALERS.filter((w) => !w.isPromotionSource).map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ fontSize: 13, fontWeight: 800, color: "#374151", marginBottom: 10 }}>
                Cost, retail &amp; margin
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(120px, 1fr))", gap: 12, marginBottom: 12 }}>
                <div>
                  <FieldLabel>Unit cost</FieldLabel>
                  <input
                    className="crx-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={selectedProduct.cost ?? 0}
                    onChange={(e) => update({ cost: Number(e.target.value) })}
                    style={{ marginTop: 6, width: "100%" }}
                  />
                </div>
                <div>
                  <FieldLabel>Retail price</FieldLabel>
                  <input
                    className="crx-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={selectedProduct.retail ?? 0}
                    onChange={(e) => update({ retail: Number(e.target.value) })}
                    style={{ marginTop: 6, width: "100%" }}
                  />
                </div>
                <div>
                  <FieldLabel>Current margin</FieldLabel>
                  <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: "#111827" }}>
                    {formatMarginPercent(selectedProduct.cost, selectedProduct.retail)}
                    {margin != null && margin < 15 ? (
                      <span style={{ marginLeft: 8, fontSize: 11, color: "#b45309" }}>Low</span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 16 }}>
                <div>
                  <FieldLabel>Target margin %</FieldLabel>
                  <input
                    className="crx-input"
                    type="number"
                    min="0"
                    max="99"
                    step="0.5"
                    value={selectedProduct.targetMarginPercent ?? ""}
                    onChange={(e) =>
                      update({
                        targetMarginPercent: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    style={{ marginTop: 6, width: 120 }}
                  />
                </div>
                <button type="button" className="btn-secondary" disabled={busy} onClick={applyTargetMargin}>
                  Apply margin to retail
                </button>
                <span style={{ fontSize: 12, color: "#6b7280" }}>
                  Suggested retail:{" "}
                  {formatMoney(
                    retailFromCostAndMargin(selectedProduct.cost, selectedProduct.targetMarginPercent) ??
                      selectedProduct.retail
                  )}
                </span>
              </div>

              <div>
                <FieldLabel>Notes</FieldLabel>
                <textarea
                  className="crx-input"
                  rows={2}
                  value={selectedProduct.notes || ""}
                  onChange={(e) => update({ notes: e.target.value })}
                  style={{ marginTop: 6, width: "100%", resize: "vertical" }}
                />
              </div>

              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={() => onSaveProduct(selectedProduct)}
                >
                  Save product
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
