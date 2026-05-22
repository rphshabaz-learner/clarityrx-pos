import React, { useRef } from "react";
import { formatMoney } from "../../../lib/inventory/margin";
import { departmentLabel } from "../../../lib/inventory/frontStoreTypes";
import { EmptyState, SectionIntro } from "./InventoryShared";

function LabelPreview({ product, qty }) {
  return (
    <div
      style={{
        border: "1px dashed #9ca3af",
        padding: 12,
        width: 220,
        fontFamily: "monospace",
        fontSize: 11,
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 13 }}>{product.name}</div>
      <div style={{ marginTop: 4 }}>SKU {product.sku}</div>
      <div>UPC {product.upc || "—"}</div>
      <div style={{ fontSize: 16, fontWeight: 800, marginTop: 8 }}>{formatMoney(product.retail)}</div>
      <div style={{ color: "#6b7280", marginTop: 4 }}>{departmentLabel(product.departmentId)}</div>
      {qty > 1 ? <div style={{ marginTop: 4 }}>× {qty}</div> : null}
    </div>
  );
}

export default function InventoryLabelsSection({
  products,
  selectedProduct,
  labelQueue,
  busy,
  onQueueLabels,
  onClearQueue,
}) {
  const printRef = useRef(null);
  const [labelQty, setLabelQty] = React.useState(1);

  const handleQueue = () => {
    if (!selectedProduct) return;
    const qty = Math.max(1, Number(labelQty) || 1);
    onQueueLabels([{ productId: selectedProduct.id, qty }]);
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(`
      <html><head><title>Shelf labels</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 16px; }
        .label-grid { display: flex; flex-wrap: wrap; gap: 12px; }
        .label { border: 1px solid #ccc; padding: 12px; width: 200px; page-break-inside: avoid; }
        .name { font-weight: bold; font-size: 14px; }
        .price { font-size: 18px; font-weight: bold; margin-top: 8px; }
      </style></head><body>
      <div class="label-grid">${content.innerHTML}</div>
      <script>window.onload = () => { window.print(); window.close(); };</script>
      </body></html>
    `);
    win.document.close();
  };

  const queueItems = labelQueue
    .map((entry) => {
      const product = products.find((p) => p.id === entry.productId);
      if (!product) return null;
      return { product, qty: entry.qty || 1 };
    })
    .filter(Boolean);

  return (
    <div>
      <SectionIntro
        title="Label printing"
        description="Queue shelf labels for front-shop products. Preview and print via the browser print dialog (compatible with standard label sheets)."
      />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(200px, 1fr) minmax(0, 2fr)", gap: 16 }}>
        <div className="crx-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Queue label</div>
          {!selectedProduct ? (
            <EmptyState message="Select a product from the Products tab first." />
          ) : (
            <>
              <div style={{ fontSize: 12, marginBottom: 12 }}>{selectedProduct.name}</div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Copies</label>
              <input
                className="crx-input"
                type="number"
                min="1"
                max="99"
                value={labelQty}
                onChange={(e) => setLabelQty(e.target.value)}
                style={{ marginTop: 6, width: 80, marginBottom: 12 }}
              />
              <button type="button" className="btn-secondary" disabled={busy} onClick={handleQueue}>
                Add to print queue
              </button>
              <div style={{ marginTop: 16 }}>
                <LabelPreview product={selectedProduct} qty={1} />
              </div>
            </>
          )}
        </div>

        <div className="crx-card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Print queue ({queueItems.length})</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn-primary" disabled={!queueItems.length} onClick={handlePrint}>
                Print labels
              </button>
              <button type="button" className="btn-secondary" disabled={!queueItems.length} onClick={onClearQueue}>
                Clear
              </button>
            </div>
          </div>

          {queueItems.length === 0 ? (
            <EmptyState message="Queue is empty." />
          ) : (
            <div ref={printRef} style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {queueItems.flatMap(({ product, qty }) =>
                Array.from({ length: qty }, (_, i) => (
                  <div key={`${product.id}-${i}`} className="label">
                    <LabelPreview product={product} qty={1} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
