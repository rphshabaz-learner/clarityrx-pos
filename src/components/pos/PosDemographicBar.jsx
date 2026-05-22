import React from "react";

/**
 * Finestra-style demographic strip: pick customer type or use default without prompting.
 */
export default function PosDemographicBar({
  options,
  selectedId,
  defaultId,
  skipPrompt,
  onSelect,
  onSetDefault,
  onToggleSkipPrompt,
}) {
  const defaultLabel = options.find((o) => o.id === defaultId)?.label || "General Customer";

  return (
    <div
      className="crx-card"
      style={{
        padding: "10px 14px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 10,
        marginBottom: 14,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Customer
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1 }}>
        {options.map((option) => {
          const active = option.id === selectedId;
          const isDefault = option.id === defaultId;
          return (
            <button
              key={option.id}
              type="button"
              className={`crx-demographic-chip${active ? " active" : ""}`}
              onClick={() => onSelect(option.id)}
            >
              {option.label}
              {isDefault ? " · default" : ""}
            </button>
          );
        })}
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280", cursor: "pointer" }}>
        <input type="checkbox" checked={skipPrompt} onChange={(e) => onToggleSkipPrompt(e.target.checked)} />
        Use <strong style={{ color: "#374151" }}>{defaultLabel}</strong> at till (no prompt)
      </label>
      <button
        type="button"
        className="btn-secondary"
        style={{ padding: "5px 10px", fontSize: 11 }}
        onClick={() => onSetDefault(selectedId)}
        title="Set selected customer as default (Finestra Set Default Demographic)"
      >
        Set default
      </button>
    </div>
  );
}
