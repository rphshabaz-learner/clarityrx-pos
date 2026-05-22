import React, { useMemo, useState } from "react";
import { groupFavoritesByTab } from "../../lib/posFavorites";

/**
 * Finestra Favorites: custom tabs with image tiles for quick till access.
 */
export default function PosFavoritesPanel({ tabs, items, onAddItem }) {
  const grouped = useMemo(() => groupFavoritesByTab(tabs, items), [tabs, items]);
  const [activeTabId, setActiveTabId] = useState(() => tabs[0]?.id || "");

  const activeGroup = grouped.find((g) => g.tab.id === activeTabId) || grouped[0];

  return (
    <div className="crx-card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="crx-card-header" style={{ borderBottom: "1px solid #f3f4f6" }}>
        <span className="crx-card-title">Favorites</span>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>Tap to add — no barcode required</span>
      </div>

      <div className="crx-tabs" style={{ margin: 0, padding: "0 12px", borderBottom: "1px solid #e5e7eb" }}>
        {grouped.map(({ tab }) => (
          <button
            key={tab.id}
            type="button"
            className={`crx-tab${activeGroup?.tab.id === tab.id ? " active" : ""}`}
            onClick={() => setActiveTabId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
        {activeGroup?.items.length ? (
          activeGroup.items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onAddItem(item)}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 14,
                background: "#fff",
                cursor: "pointer",
                textAlign: "center",
                transition: "border-color 0.13s, box-shadow 0.13s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#1447e6";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(20,71,230,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: 36, lineHeight: 1, marginBottom: 8 }} aria-hidden>
                {item.emoji || "📦"}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{item.name}</div>
              <div style={{ fontSize: 12, color: "#1447e6", fontWeight: 700, marginTop: 6 }}>
                ${Number(item.price).toFixed(2)}
              </div>
            </button>
          ))
        ) : (
          <div style={{ gridColumn: "1 / -1", padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
            No items in this tab. Add items in Manage.
          </div>
        )}
      </div>
    </div>
  );
}
