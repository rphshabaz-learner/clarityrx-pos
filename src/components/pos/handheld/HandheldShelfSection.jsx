import React, { useCallback, useState } from "react";
import { HandheldBackButton, HandheldProductCard, HandheldScanField, HandheldSectionIntro } from "./HandheldShared";

export default function HandheldShelfSection({ busy, findProduct, onBack, onNotify }) {
  const [scanInput, setScanInput] = useState("");
  const [product, setProduct] = useState(null);

  const handleLookup = useCallback(async () => {
    const query = scanInput.trim();
    if (!query) return;
    const hit = await findProduct(query);
    if (hit) {
      setProduct(hit);
      setScanInput("");
    } else {
      onNotify?.("No product found for that SKU or UPC.", "warning");
    }
  }, [findProduct, onNotify, scanInput]);

  return (
    <div>
      <HandheldBackButton onClick={onBack} />
      <HandheldSectionIntro
        title="Shelf inventory"
        description="Scan a shelf label or product barcode to view on-hand quantity, department, and retail price."
      />
      <HandheldScanField
        value={scanInput}
        onChange={setScanInput}
        onSubmit={() => void handleLookup()}
        disabled={busy}
        autoFocus
      />
      {product ? (
        <HandheldProductCard product={product}>
          {product.location ? (
            <div style={{ marginTop: 12, fontSize: 12, color: "#374151" }}>
              Location: <strong>{product.location}</strong>
            </div>
          ) : null}
          {(product.barcodes || []).length > 1 ? (
            <div style={{ marginTop: 8, fontSize: 11, color: "#9ca3af" }}>
              Alt barcodes: {(product.barcodes || []).join(", ")}
            </div>
          ) : null}
        </HandheldProductCard>
      ) : (
        <div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
          Scan a product to view shelf details.
        </div>
      )}
    </div>
  );
}
