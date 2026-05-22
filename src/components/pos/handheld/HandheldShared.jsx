import React, { useRef } from "react";
import { formatMoney } from "../../../lib/inventory/margin";
import { departmentLabel, productDisplayName } from "../../../lib/inventory/frontStoreTypes";

export function HandheldSectionIntro({ title, description }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{title}</div>
      {description ? (
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4, lineHeight: 1.5 }}>{description}</p>
      ) : null}
    </div>
  );
}

export function HandheldScanField({ value, onChange, onSubmit, disabled, placeholder, autoFocus }) {
  const inputRef = useRef(null);

  return (
    <div className="crx-handheld__scan">
      <input
        ref={inputRef}
        className="crx-input crx-handheld__scan-input"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        disabled={disabled}
        placeholder={placeholder || "Scan SKU / UPC…"}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit?.();
          }
        }}
      />
      <button
        type="button"
        className="btn-primary crx-handheld__scan-btn"
        disabled={disabled || !String(value || "").trim()}
        onClick={() => onSubmit?.()}
      >
        Look up
      </button>
    </div>
  );
}

export function HandheldProductCard({ product, children }) {
  if (!product) return null;
  const onHand = Number(product.onHand) || 0;
  const low = onHand <= 5;
  return (
    <div className="crx-card crx-handheld__product-card">
      <div style={{ fontSize: 17, fontWeight: 800, color: "#111827", lineHeight: 1.3 }}>
        {productDisplayName(product)}
      </div>
      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
        {product.sku}
        {product.upc ? ` · UPC ${product.upc}` : ""}
      </div>
      <div className="crx-handheld__product-stats">
        <HandheldStat label="On hand" value={String(onHand)} highlight={low} warn={low} />
        <HandheldStat label="Retail" value={formatMoney(product.retail)} />
        <HandheldStat label="Department" value={departmentLabel(product.departmentId)} />
      </div>
      {children}
    </div>
  );
}

export function HandheldStat({ label, value, highlight, warn }) {
  return (
    <div
      className="crx-handheld__stat"
      style={
        warn
          ? { borderColor: "#fde68a", background: "#fffbeb" }
          : highlight
            ? { borderColor: "#bfdbfe", background: "#eff6ff" }
            : undefined
      }
    >
      <div className="crx-handheld__stat-label">{label}</div>
      <div className="crx-handheld__stat-value">{value}</div>
    </div>
  );
}

export function HandheldTaskTile({ emoji, label, description, onClick }) {
  return (
    <button type="button" className="crx-handheld__task" onClick={onClick}>
      <span className="crx-handheld__task-emoji" aria-hidden>
        {emoji}
      </span>
      <span className="crx-handheld__task-label">{label}</span>
      <span className="crx-handheld__task-desc">{description}</span>
    </button>
  );
}

export function HandheldBackButton({ onClick, label = "All tasks" }) {
  return (
    <button type="button" className="crx-handheld__back" onClick={onClick}>
      ← {label}
    </button>
  );
}
