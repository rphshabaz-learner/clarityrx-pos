import React from "react";

/**
 * Customer type strip: pick customer type or use default without prompting.
 */
export default function PosDemographicBar({
  options,
  selectedId,
  defaultId,
  onSelect,
  onSetDefault,
}) {
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
      <button
        type="button"
        className="btn-secondary"
        style={{ padding: "5px 10px", fontSize: 11 }}
        onClick={() => onSetDefault(selectedId)}
        title="Set selected customer as default"
      >
        Set default
      </button>
    </div>
  );
}
