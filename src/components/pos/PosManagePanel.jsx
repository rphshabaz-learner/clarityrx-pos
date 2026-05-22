import React, { useMemo, useState } from "react";
import { deviceTillBindingLabel } from "../../lib/posDeviceTill";
import { POS_TILL_OPTIONS } from "../../lib/posTill";
import { buildDefaultSecurelinkTerminalMappings } from "../../lib/securelinkConfig";
import {
  CA_PROVINCE_CODES,
  PROVINCE_TAX_REGIMES,
  TAX_PRICING_MODES,
} from "../../lib/tax/canadianProvincialTax";
import ManageAgeComplianceSection from "./ManageAgeComplianceSection";
import ManagePrivacySection from "./ManagePrivacySection";
import ManageAccessibilitySection from "./ManageAccessibilitySection";

export default function PosManagePanel({
  tabs,
  items,
  demographicConfig,
  taxConfig,
  onSaveTaxConfig,
  privacyConfig,
  canConfigurePrivacy,
  canConfigure = false,
  canTax = false,
  canSecurity = false,
  deviceTillBinding,
  deviceTillLocked,
  canConfigureDeviceTill,
  onSaveDeviceTill,
  onSaveFavorites,
  onSaveDemographics,
  onSavePrivacy,
  ageComplianceConfig,
  onSaveAgeCompliance,
  onNotify,
  logActivity,
}) {
  const [draftTabs, setDraftTabs] = useState(tabs);
  const [draftItems, setDraftItems] = useState(items);
  const [newTabLabel, setNewTabLabel] = useState("");
  const [printMerchantCopy, setPrintMerchantCopy] = useState(demographicConfig.printMerchantCopy);
  const [taxProvince, setTaxProvince] = useState(() => taxConfig?.provinceCode || "BC");
  const [taxBusinessNumber, setTaxBusinessNumber] = useState(() => taxConfig?.businessNumber || "");
  const [taxPricingMode, setTaxPricingMode] = useState(
    () => taxConfig?.pricingMode || TAX_PRICING_MODES.EXCLUSIVE
  );
  const [taxStoreName, setTaxStoreName] = useState(() => taxConfig?.storeName || "ClarityRx Pharmacy");
  const [taxStoreAddress1, setTaxStoreAddress1] = useState(() => taxConfig?.storeAddressLine1 || "");
  const [taxStoreAddress2, setTaxStoreAddress2] = useState(() => taxConfig?.storeAddressLine2 || "");
  const [taxStorePhone, setTaxStorePhone] = useState(() => taxConfig?.storePhone || "");
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
  const [securelinkTerminalMappings, setSecurelinkTerminalMappings] = useState(
    () =>
      demographicConfig.securelinkTerminalMappings ||
      buildDefaultSecurelinkTerminalMappings(demographicConfig.securelinkTerminalPrefix || "POS-")
  );
  const [deviceTillNumber, setDeviceTillNumber] = useState(() => deviceTillBinding?.tillNumber || 1);
  const [lockDeviceTill, setLockDeviceTill] = useState(() => Boolean(deviceTillBinding?.locked));
  const [cashShiftMode, setCashShiftMode] = useState(
    () => demographicConfig.cashShiftMode || "auto"
  );
  const [deviceTillSaving, setDeviceTillSaving] = useState(false);
  const [deviceTillError, setDeviceTillError] = useState("");

  const defaultTerminalMappings = useMemo(
    () => buildDefaultSecurelinkTerminalMappings(securelinkTerminalPrefix),
    [securelinkTerminalPrefix]
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

    if (canConfigure) {
      onSaveFavorites({ tabs: draftTabs, items: draftItems });
    }

    if (canTax && onSaveTaxConfig) {
      onSaveTaxConfig({
        provinceCode: taxProvince,
        businessNumber: taxBusinessNumber,
        pricingMode: taxPricingMode,
        storeName: taxStoreName,
        storeAddressLine1: taxStoreAddress1,
        storeAddressLine2: taxStoreAddress2,
        storePhone: taxStorePhone,
      });
    }

    if (!canConfigure) return;

    const normalizedPrefix = securelinkTerminalPrefix.trim() || "POS-";
    const trimmedMappings = {};
    for (const till of POS_TILL_OPTIONS) {
      const key = String(till);
      const value = String(securelinkTerminalMappings[key] || "").trim();
      trimmedMappings[key] = value || defaultTerminalMappings[key];
    }

    onSaveDemographics({
      ...demographicConfig,
      securelinkTerminalPrefix: normalizedPrefix,
      securelinkTerminalMappings: trimmedMappings,
      printMerchantCopy,
      defaultDiscountType,
      defaultDiscountValue: Math.max(0, Number(defaultDiscountValue) || 0),
      collectSaleNotes,
      promptForBag,
      quickTenderAmounts: quickTenderAmounts.length ? quickTenderAmounts : [10, 20, 50, 100],
      cashShiftMode,
    });
  };

  const saveDeviceTill = async () => {
    if (!onSaveDeviceTill) return;
    setDeviceTillSaving(true);
    setDeviceTillError("");
    try {
      await onSaveDeviceTill({ tillNumber: deviceTillNumber, locked: lockDeviceTill });
    } catch (error) {
      setDeviceTillError(error?.message || "Unable to save workstation till.");
    } finally {
      setDeviceTillSaving(false);
    }
  };

  const canEditManage = canConfigure || canTax || canSecurity || canConfigurePrivacy;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ManageAccessibilitySection onNotify={onNotify} logActivity={logActivity} />
      {canSecurity ? (
        <ManagePrivacySection
          privacyConfig={privacyConfig}
          canConfigure={canConfigurePrivacy}
          onSavePrivacy={onSavePrivacy}
          onNotify={onNotify}
          logActivity={logActivity}
        />
      ) : (
        <div className="crx-card" style={{ padding: 18 }}>
          <div className="crx-card-title" style={{ marginBottom: 8 }}>
            Security & privacy
          </div>
          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
            Admin role required to change privacy retention and security settings.
          </p>
        </div>
      )}
      <div className="crx-card" style={{ padding: 18 }}>
        <div className="crx-card-title" style={{ marginBottom: 12 }}>
          Till options
        </div>
        <div
          style={{
            marginBottom: 20,
            padding: 14,
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
            This workstation
          </div>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 12px" }}>
            Assign a till number to this physical register so cashiers do not pick the wrong till in the
            header. Locking hides the till dropdown for all users on this device.
          </p>
          {deviceTillBinding?.source === "env" ? (
            <p style={{ fontSize: 12, color: "#92400e", margin: 0 }}>
              Till {deviceTillBinding.tillNumber} is fixed by deployment (
              <code>REACT_APP_POS_DEVICE_TILL</code>
              {deviceTillLocked ? ", locked" : ""}). Change it in the device build or launcher environment,
              not from Manage.
            </p>
          ) : canConfigure && canConfigureDeviceTill ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                Till number
                <select
                  className="crx-select"
                  value={deviceTillNumber}
                  onChange={(e) => setDeviceTillNumber(Number(e.target.value))}
                  style={{ display: "block", marginTop: 6, minWidth: 96 }}
                  disabled={deviceTillSaving}
                >
                  {POS_TILL_OPTIONS.map((till) => (
                    <option key={till} value={till}>
                      {till}
                    </option>
                  ))}
                </select>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "#374151",
                  paddingBottom: 4,
                }}
              >
                <input
                  type="checkbox"
                  checked={lockDeviceTill}
                  onChange={(e) => setLockDeviceTill(e.target.checked)}
                  disabled={deviceTillSaving}
                />
                Lock till on this workstation
              </label>
              <button
                type="button"
                className="btn-primary"
                style={{ fontSize: 12 }}
                disabled={deviceTillSaving}
                onClick={saveDeviceTill}
              >
                {deviceTillSaving ? "Saving…" : "Save workstation till"}
              </button>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
              Till {deviceTillBinding?.tillNumber ?? "—"}
              {deviceTillLocked ? " (locked)" : ""} — {deviceTillBindingLabel(deviceTillBinding)}. Ask a
              manager or pharmacist to change workstation till settings.
            </p>
          )}
          {deviceTillError ? (
            <p style={{ fontSize: 12, color: "#b91c1c", margin: "10px 0 0" }}>{deviceTillError}</p>
          ) : null}
        </div>
        {canConfigure ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
            Pinpad terminal mapping
          </div>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 12px" }}>
            Each till must map to the terminal ID registered with your card processor (for example till 1 →
            POS-01, till 10 → POS-10).
          </p>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 10 }}>
            Default prefix (fills empty rows)
            <input
              className="crx-input"
              value={securelinkTerminalPrefix}
              onChange={(e) => setSecurelinkTerminalPrefix(e.target.value)}
              placeholder="POS-"
              style={{ marginTop: 6, width: "100%", maxWidth: 160 }}
            />
          </label>
          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: 12, marginBottom: 12 }}
            onClick={() => setSecurelinkTerminalMappings(defaultTerminalMappings)}
          >
            Reset all tills from prefix
          </button>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "72px 1fr",
              gap: 8,
              maxWidth: 360,
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase" }}>
              Till
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase" }}>
              Terminal ID
            </span>
            {POS_TILL_OPTIONS.map((till) => {
              const key = String(till);
              return (
                <React.Fragment key={till}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{till}</span>
                  <input
                    className="crx-input"
                    value={securelinkTerminalMappings[key] || ""}
                    onChange={(e) =>
                      setSecurelinkTerminalMappings((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    placeholder={defaultTerminalMappings[key]}
                    aria-label={`Terminal ID for till ${till}`}
                  />
                </React.Fragment>
              );
            })}
          </div>
        </div>
        ) : (
          <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 12px" }}>
            Terminal mapping and till options require an admin role.
          </p>
        )}
        {canConfigure ? (
        <>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 12 }}>
          Cash shift mode
          <select
            className="crx-select"
            value={cashShiftMode}
            onChange={(e) => setCashShiftMode(e.target.value)}
            style={{ display: "block", marginTop: 6, maxWidth: 420 }}
          >
            <option value="auto">Auto — per sale when till is not locked on this workstation</option>
            <option value="session">Session — cashier opens and closes shift in the header</option>
            <option value="transaction">Transaction — open shift and cash drawer per cash sale</option>
          </select>
        </label>
        <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 12px" }}>
          Transaction mode opens the cash drawer on each cash sale and starts a new shift record for that sale.
          Locked workstation tills use session mode unless you choose transaction here.
        </p>
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
        </>
        ) : null}
        {canTax ? (
        <div
          style={{
            marginTop: 20,
            marginBottom: 16,
            padding: 14,
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
            Canadian tax (GST / HST / PST / QST)
          </div>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 12px" }}>
            Province determines tax components. Business number (BN) prints on receipts for audit. Choose
            exclusive when tax is added at the till, or inclusive when shelf prices already include tax.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(140px, 1fr))", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
              Province
              <select
                className="crx-select"
                value={taxProvince}
                onChange={(e) => setTaxProvince(e.target.value)}
                style={{ marginTop: 6, display: "block", width: "100%" }}
              >
                {CA_PROVINCE_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code} — {PROVINCE_TAX_REGIMES[code]?.label || code}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
              GST/HST business number
              <input
                className="crx-input"
                type="text"
                placeholder="123456789 RT0001"
                value={taxBusinessNumber}
                onChange={(e) => setTaxBusinessNumber(e.target.value)}
                style={{ marginTop: 6 }}
              />
            </label>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
              Shelf pricing
              <select
                className="crx-select"
                value={taxPricingMode}
                onChange={(e) => setTaxPricingMode(e.target.value)}
                style={{ marginTop: 6, display: "block", width: "100%" }}
              >
                <option value={TAX_PRICING_MODES.EXCLUSIVE}>Tax exclusive (add at till)</option>
                <option value={TAX_PRICING_MODES.INCLUSIVE}>Tax inclusive (on shelf)</option>
              </select>
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(140px, 1fr))", gap: 10, marginTop: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
              Receipt store name
              <input
                className="crx-input"
                value={taxStoreName}
                onChange={(e) => setTaxStoreName(e.target.value)}
                style={{ marginTop: 6 }}
              />
            </label>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
              Receipt phone
              <input
                className="crx-input"
                value={taxStorePhone}
                onChange={(e) => setTaxStorePhone(e.target.value)}
                style={{ marginTop: 6 }}
              />
            </label>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
              Address line 1
              <input
                className="crx-input"
                value={taxStoreAddress1}
                onChange={(e) => setTaxStoreAddress1(e.target.value)}
                style={{ marginTop: 6 }}
              />
            </label>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
              Address line 2
              <input
                className="crx-input"
                value={taxStoreAddress2}
                onChange={(e) => setTaxStoreAddress2(e.target.value)}
                style={{ marginTop: 6 }}
              />
            </label>
          </div>
        </div>
        ) : (
          <p style={{ fontSize: 12, color: "#6b7280", margin: "16px 0 0" }}>
            Tax settings require an admin role.
          </p>
        )}
        {canConfigure ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(120px, 1fr))", gap: 10, marginTop: 16 }}>
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
        ) : null}
      </div>

      {canConfigure ? (
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

        {canEditManage ? (
          <button type="button" className="btn-primary" onClick={handleSave}>
            Save changes
          </button>
        ) : null}
      </div>
      ) : (
        <div className="crx-card" style={{ padding: 18 }}>
          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
            Favorite tabs and till configuration require an admin role.
          </p>
        </div>
      )}

      {canConfigure ? (
        <ManageAgeComplianceSection
          config={ageComplianceConfig}
          onSaved={onSaveAgeCompliance}
          onNotify={onNotify}
          logActivity={logActivity}
        />
      ) : null}
    </div>
  );
}
