import React, { useCallback, useState } from "react";
import { formatMoney } from "../../../lib/inventory/margin";
import {
  HandheldBackButton,
  HandheldProductCard,
  HandheldScanField,
  HandheldSectionIntro,
  HandheldStat,
} from "./HandheldShared";

export default function HandheldStockCheckSection({ busy, findProduct, onApplyCount, onBack, onNotify }) {
  const [scanInput, setScanInput] = useState("");
  const [product, setProduct] = useState(null);
  const [countedQty, setCountedQty] = useState("");

  const systemQty = product ? Number(product.onHand) || 0 : 0;
  const parsedCount = Number(countedQty);
  const variance =
    product && Number.isFinite(parsedCount) ? parsedCount - systemQty : null;

  const handleLookup = useCallback(async () => {
    const query = scanInput.trim();
    if (!query) return;
    const hit = await findProduct(query);
    if (hit) {
      setProduct(hit);
      setCountedQty(String(hit.onHand ?? 0));
      setScanInput("");
    } else {
      onNotify?.("No product found for that SKU or UPC.", "warning");
    }
  }, [findProduct, onNotify, scanInput]);

  const handlePost = async () => {
    if (!product || !Number.isFinite(parsedCount)) return;
    const ok = await onApplyCount(product.id, parsedCount);
    if (ok) {
      setProduct({ ...product, onHand: parsedCount });
      setCountedQty("");
    }
  };

  return (
    <div>
      <HandheldBackButton onClick={onBack} />
      <HandheldSectionIntro
        title="Stock check"
        description="Scan a SKU, enter the physical count, and post variances to inventory adjustments."
      />
      <HandheldScanField
        value={scanInput}
        onChange={setScanInput}
        onSubmit={() => void handleLookup()}
        disabled={busy}
        placeholder="Scan SKU / UPC for count…"
        autoFocus={!product}
      />
      {product ? (
        <>
          <HandheldProductCard product={product} />
          <div className="crx-card" style={{ padding: 16, marginTop: 12 }}>
            <div className="crx-handheld__product-stats" style={{ marginBottom: 14 }}>
              <HandheldStat label="System qty" value={String(systemQty)} />
              <HandheldStat
                label="Variance"
                value={variance == null ? "—" : variance === 0 ? "0" : variance > 0 ? `+${variance}` : String(variance)}
                warn={variance != null && variance !== 0}
              />
            </div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>
              COUNTED QUANTITY
            </label>
            <input
              className="crx-input"
              type="number"
              min="0"
              step="1"
              value={countedQty}
              disabled={busy}
              onChange={(e) => setCountedQty(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <button
              type="button"
              className="btn-primary"
              style={{ width: "100%", minHeight: 48 }}
              disabled={busy || !Number.isFinite(parsedCount)}
              onClick={() => void handlePost()}
            >
              Post count
            </button>
            {product.retail != null ? (
              <div style={{ marginTop: 10, fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
                Retail {formatMoney(product.retail)}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: "100%", marginTop: 10, minHeight: 44 }}
            onClick={() => {
              setProduct(null);
              setCountedQty("");
            }}
          >
            Scan next item
          </button>
        </>
      ) : (
        <div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
          Scan a product to start a stock check.
        </div>
      )}
    </div>
  );
}
