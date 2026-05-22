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
  const [taxRatePercent, setTaxRatePercent] = useState(() => Number(demographicConfig.taxRate || 0) * 100);
  const [defaultDiscountType, setDefaultDiscountType] = useState(demographicConfig.defaultDiscountType || "none");
  const [defaultDiscountValue, setDefaultDiscountValue] = useState(demographicConfig.defaultDiscountValue || 0);
  const [collectSaleNotes, setCollectSaleNotes] = useState(demographicConfig.collectSaleNotes !== false);
  const [promptForBag, setPromptForBag] = useState(demographicConfig.promptForBag !== false);
  const [quickTenderText, setQuickTenderText] = useState(
    (demographicConfig.quickTenderAmounts || [10, 20, 50, 100]).join(", ")
  );
  const [securelinkTerminalPrefix, setSecurelinkTerminalPrefix] = useState(
    demographicConfig.securelinkTerminalPrefix || "POS-"
  );

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
    const quickTenderAmounts = quickTenderText
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((amount) => Number.isFinite(amount) && amount > 0);

    onSaveFavorites({ tabs: draftTabs, items: draftItems });
    onSaveDemographics({
      ...demographicConfig,
      securelinkTerminalPrefix: securelinkTerminalPrefix.trim() || "POS-",
      printMerchantCopy,
      taxRate: Math.max(0, Number(taxRatePercent) || 0) / 100,
      defaultDiscountType,
      defaultDiscountValue: Math.max(0, Number(defaultDiscountValue) || 0),
      collectSaleNotes,
      promptForBag,
      quickTenderAmounts: quickTenderAmounts.length ? quickTenderAmounts : [10, 20, 50, 100],
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="crx-card" style={{ padding: 18 }}>
        <div className="crx-card-title" style={{ marginBottom: 12 }}>
          Till options
        </div>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 10 }}>
          Securelink terminal prefix
          <input
            className="crx-input"
            value={securelinkTerminalPrefix}
            onChange={(e) => setSecurelinkTerminalPrefix(e.target.value)}
            placeholder="POS-"
            style={{ marginTop: 6, width: "100%", maxWidth: 160 }}
          />
          <span style={{ display: "block", marginTop: 4, fontWeight: 500, color: "#6b7280" }}>
            Example: till 3 → {(String(securelinkTerminalPrefix || "POS-").trim() || "POS-") + "03"}
          </span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
          <input
            type="checkbox"
            checked={printMerchantCopy}
            onChange={(e) => setPrintMerchantCopy(e.target.checked)}
          />
          Print merchant copy for card payments
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", marginTop: 10 }}>
          <input
            type="checkbox"
            checked={collectSaleNotes}
            onChange={(e) => setCollectSaleNotes(e.target.checked)}
          />
          Show sale notes on the till
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", marginTop: 10 }}>
          <input
            type="checkbox"
            checked={promptForBag}
            onChange={(e) => setPromptForBag(e.target.checked)}
          />
          Show bag and bottle shortcut buttons
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(120px, 1fr))", gap: 10, marginTop: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
            Tax rate %
            <input
              className="crx-input"
              type="number"
              min="0"
              step="0.01"
              value={taxRatePercent}
              onChange={(e) => setTaxRatePercent(e.target.value)}
              style={{ marginTop: 6 }}
            />
          </label>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
            Default discount
            <select
              className="crx-select"
              value={defaultDiscountType}
              onChange={(e) => setDefaultDiscountType(e.target.value)}
              style={{ marginTop: 6 }}
            >
              <option value="none">None</option>
              <option value="percent">Percent</option>
              <option value="amount">Dollar</option>
            </select>
          </label>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
            Discount value
            <input
              className="crx-input"
              type="number"
              min="0"
              step="0.01"
              value={defaultDiscountValue}
              onChange={(e) => setDefaultDiscountValue(e.target.value)}
              style={{ marginTop: 6 }}
              disabled={defaultDiscountType === "none"}
            />
          </label>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
            Cash buttons
            <input
              className="crx-input"
              value={quickTenderText}
              onChange={(e) => setQuickTenderText(e.target.value)}
              placeholder="10, 20, 50, 100"
              style={{ marginTop: 6 }}
            />
          </label>
        </div>
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
