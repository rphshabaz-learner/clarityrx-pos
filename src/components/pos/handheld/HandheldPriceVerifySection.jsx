import React, { useCallback, useState } from "react";
import { formatMoney } from "../../../lib/inventory/margin";
import {
  HandheldBackButton,
  HandheldProductCard,
  HandheldScanField,
  HandheldSectionIntro,
  HandheldStat,
} from "./HandheldShared";

function pricesMatch(systemRetail, shelfPrice) {
  const a = Number(systemRetail);
  const b = Number(shelfPrice);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.abs(a - b) < 0.005;
}

export default function HandheldPriceVerifySection({ busy, findProduct, onBack, onNotify }) {
  const [scanInput, setScanInput] = useState("");
  const [product, setProduct] = useState(null);
  const [shelfPrice, setShelfPrice] = useState("");
  const [lastResult, setLastResult] = useState(null);

  const systemRetail = product ? Number(product.retail) || 0 : 0;
  const parsedShelf = Number(shelfPrice);
  const match =
    product && Number.isFinite(parsedShelf) ? pricesMatch(systemRetail, parsedShelf) : null;

  const handleLookup = useCallback(async () => {
    const query = scanInput.trim();
    if (!query) return;
    const hit = await findProduct(query);
    if (hit) {
      setProduct(hit);
      setShelfPrice("");
      setLastResult(null);
      setScanInput("");
    } else {
      onNotify?.("No product found for that SKU or UPC.", "warning");
    }
  }, [findProduct, onNotify, scanInput]);

  const handleVerify = () => {
    if (!product || !Number.isFinite(parsedShelf)) return;
    const ok = pricesMatch(systemRetail, parsedShelf);
    setLastResult(ok ? "match" : "mismatch");
    if (ok) {
      onNotify?.("Shelf price matches system retail.", "success");
    } else {
      onNotify?.(
        `Mismatch: system ${formatMoney(systemRetail)}, shelf ${formatMoney(parsedShelf)}.`,
        "warning"
      );
    }
  };

  return (
    <div>
      <HandheldBackButton onClick={onBack} />
      <HandheldSectionIntro
        title="Price verification"
        description="Scan the product, then enter the price printed on the shelf tag to confirm it matches system retail."
      />
      <HandheldScanField
        value={scanInput}
        onChange={setScanInput}
        onSubmit={() => void handleLookup()}
        disabled={busy}
        placeholder="Scan SKU / UPC…"
        autoFocus={!product}
      />
      {product ? (
        <>
          <HandheldProductCard product={product}>
            <div className="crx-handheld__product-stats" style={{ marginTop: 12 }}>
              <HandheldStat label="System retail" value={formatMoney(systemRetail)} highlight />
            </div>
          </HandheldProductCard>
          <div className="crx-card" style={{ padding: 16, marginTop: 12 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>
              SHELF TAG PRICE
            </label>
            <input
              className="crx-input"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={shelfPrice}
              disabled={busy}
              placeholder="0.00"
              onChange={(e) => {
                setShelfPrice(e.target.value);
                setLastResult(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleVerify();
              }}
              style={{ marginBottom: 12 }}
            />
            <button
              type="button"
              className="btn-primary"
              style={{ width: "100%", minHeight: 48 }}
              disabled={busy || !Number.isFinite(parsedShelf)}
              onClick={handleVerify}
            >
              Verify price
            </button>
            {lastResult === "match" ? (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 10,
                  background: "#ecfdf5",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                Prices match
              </div>
            ) : null}
            {lastResult === "mismatch" ? (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 10,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                Mismatch — update shelf tag or system retail
              </div>
            ) : null}
            {match === false && lastResult == null ? (
              <div style={{ marginTop: 8, fontSize: 12, color: "#92400e" }}>
                Difference: {formatMoney(Math.abs(systemRetail - parsedShelf))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: "100%", marginTop: 10, minHeight: 44 }}
            onClick={() => {
              setProduct(null);
              setShelfPrice("");
              setLastResult(null);
            }}
          >
            Scan next item
          </button>
        </>
      ) : (
        <div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
          Scan a product to verify shelf pricing.
        </div>
      )}
    </div>
  );
}
