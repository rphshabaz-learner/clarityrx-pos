import React, { useState } from "react";

export default function PosManagePanel({
  tabs,
  items,
  demographicConfig,
  onSaveFavorites,
  onSaveDemographics,
}) {
  const [draftTabs, setDraftTabs] = useState(tabs);
  const [draftItems, setDraftItems] = useState(items);
  const [newTabLabel, setNewTabLabel] = useState("");
  const [printMerchantCopy, setPrintMerchantCopy] = useState(demographicConfig.printMerchantCopy);

  const addTab = () => {
    const label = newTabLabel.trim();
    if (!label) return;
    const id = `tab-${Date.now()}`;
    setDraftTabs((prev) => [...prev, { id, label }]);
    setNewTabLabel("");
  };

  const addItem = (tabId) => {
    const id = `item-${Date.now()}`;
    setDraftItems((prev) => [
      ...prev,
      { id, tabId, name: "New item", price: 0, emoji: "📦", sku: `FAV-${id}` },
    ]);
  };

  const updateItem = (id, patch) => {
    setDraftItems((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeItem = (id) => {
    setDraftItems((prev) => prev.filter((row) => row.id !== id));
  };

  const handleSave = () => {
    onSaveFavorites({ tabs: draftTabs, items: draftItems });
    onSaveDemographics({ ...demographicConfig, printMerchantCopy });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="crx-card" style={{ padding: 18 }}>
        <div className="crx-card-title" style={{ marginBottom: 12 }}>
          Till options
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
          <input
            type="checkbox"
            checked={printMerchantCopy}
            onChange={(e) => setPrintMerchantCopy(e.target.checked)}
          />
          Print merchant copy for card payments (Finestra: disable when unchecked)
        </label>
      </div>

      <div className="crx-card" style={{ padding: 18 }}>
        <div className="crx-card-title" style={{ marginBottom: 8 }}>
          Favorite tabs
        </div>
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
          Organize quick-access tiles for newspapers, local products, and other non-barcoded items.
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {draftTabs.map((tab) => (
            <span
              key={tab.id}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 10px",
                borderRadius: 8,
                background: "#f3f4f6",
                color: "#374151",
              }}
            >
              {tab.label}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input
            className="crx-input"
            placeholder="New tab name"
            value={newTabLabel}
            onChange={(e) => setNewTabLabel(e.target.value)}
            style={{ maxWidth: 220 }}
          />
          <button type="button" className="btn-secondary" onClick={addTab}>
            Add tab
          </button>
        </div>

        {draftTabs.map((tab) => (
          <div key={tab.id} style={{ marginBottom: 20, borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{tab.label}</span>
              <button type="button" className="btn-secondary" style={{ fontSize: 12 }} onClick={() => addItem(tab.id)}>
                + Item
              </button>
            </div>
            {draftItems
              .filter((item) => item.tabId === tab.id)
              .map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "48px 1fr 100px 80px 60px",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <input
                    className="crx-input"
                    value={item.emoji || ""}
                    onChange={(e) => updateItem(item.id, { emoji: e.target.value })}
                    style={{ textAlign: "center", fontSize: 20 }}
                    maxLength={2}
                    title="Tile image (emoji)"
                  />
                  <input
                    className="crx-input"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  />
                  <input
                    className="crx-input"
                    type="number"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                  />
                  <input
                    className="crx-input"
                    value={item.sku || ""}
                    onChange={(e) => updateItem(item.id, { sku: e.target.value })}
                    placeholder="SKU"
                  />
                  <button type="button" className="btn-secondary" style={{ fontSize: 11 }} onClick={() => removeItem(item.id)}>
                    Remove
                  </button>
                </div>
              ))}
          </div>
        ))}

        <button type="button" className="btn-primary" onClick={handleSave}>
          Save favorites &amp; till options
        </button>
      </div>
    </div>
  );
}
