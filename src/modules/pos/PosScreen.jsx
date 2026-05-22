import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../AuthContext";
import { usePosWorkspaceData } from "../../hooks/usePosWorkspaceData";
import PosDemographicBar from "../../components/pos/PosDemographicBar";
import PosFavoritesPanel from "../../components/pos/PosFavoritesPanel";
import PosManagePanel from "../../components/pos/PosManagePanel";
import { usePosPickups } from "../../hooks/usePosPickups";
import {
  favoriteItemToCartLine,
  loadPosDemographicConfig,
  loadPosFavoritesConfig,
  savePosDemographicConfig,
  savePosFavoritesConfig,
  serviceItemToCartLine,
} from "../../lib/posFavorites";
import { completePosSale, lookupPosPickup } from "../../services/posApi";
import { PickupQueue } from "./PickupQueue";
import { POS_DEFAULT_CART, POS_FRONT_STORE_ITEMS } from "./posCatalog";

const POS_WORKSPACE_TABS = [
  { id: "till", label: "Till" },
  { id: "favorites", label: "Favorites" },
  { id: "manage", label: "Manage" },
];

const QUICK_SERVICE_ITEMS = [
  { sku: "SVC-BAG", name: "Reusable bag", price: 0.25 },
  { sku: "SVC-BOTTLE-RETURN", name: "Bottle deposit return", price: -0.1 },
  { sku: "SVC-DELIVERY", name: "Local delivery", price: 6.99 },
];

function clampMoney(value) {
  return Math.max(0, Number(value) || 0);
}

function PosToast({ message, type = "info", duration = 3000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  const colors = {
    success: { bg: "#ecfdf5", border: "#bbf7d0", text: "#166534" },
    error: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" },
    warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
    info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  };
  const tone = colors[type] || colors.info;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.text,
        padding: "12px 16px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
      }}
    >
      {message}
    </div>
  );
}

export default function PosScreen() {
  const { accessToken } = useAuth();
  const { logActivity, runAutosave } = usePosWorkspaceData();
  const { pickups, isLoading, error, reload } = usePosPickups();

  const [workspaceTab, setWorkspaceTab] = useState("till");
  const [favoritesConfig, setFavoritesConfig] = useState(loadPosFavoritesConfig);
  const [demographicConfig, setDemographicConfig] = useState(loadPosDemographicConfig);
  const [selectedDemographicId, setSelectedDemographicId] = useState(
    () => loadPosDemographicConfig().defaultId
  );
  const [showDemographicPrompt, setShowDemographicPrompt] = useState(false);

  const [cart, setCart] = useState(POS_DEFAULT_CART);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [payMethod, setPayMethod] = useState("Credit Card");
  const [search, setSearch] = useState("");
  const [bagScan, setBagScan] = useState("");
  const [saleNote, setSaleNote] = useState("");
  const [taxExempt, setTaxExempt] = useState(false);
  const [discountType, setDiscountType] = useState(() => loadPosDemographicConfig().defaultDiscountType || "none");
  const [discountValue, setDiscountValue] = useState(() => loadPosDemographicConfig().defaultDiscountValue || 0);
  const [tenderedAmount, setTenderedAmount] = useState("");
  const [toast, setToast] = useState(null);
  const [charging, setCharging] = useState(false);
  const lastAutoAddIdentifier = useRef("");

  const effectiveDemographicId = demographicConfig.skipPrompt
    ? demographicConfig.defaultId
    : selectedDemographicId;
  const demographicLabel =
    demographicConfig.options.find((o) => o.id === effectiveDemographicId)?.label || "General Customer";

  const normalizedSearch = search.trim().toLowerCase();
  const normalizedBagScan = bagScan.trim();

  const filteredStoreItems = useMemo(() => {
    if (!normalizedSearch) return POS_FRONT_STORE_ITEMS;
    return POS_FRONT_STORE_ITEMS.filter((item) =>
      [item.sku, item.barcode, item.name, item.category].some((value) =>
        String(value).toLowerCase().includes(normalizedSearch)
      )
    );
  }, [normalizedSearch]);

  const exactPosIdentifierMatch = useMemo(() => {
    if (!normalizedSearch) return null;
    return (
      POS_FRONT_STORE_ITEMS.find((item) =>
        [item.sku, item.barcode].some((value) => String(value).toLowerCase() === normalizedSearch)
      ) ?? null
    );
  }, [normalizedSearch]);

  const rxCopay = selectedPickup ? Number(selectedPickup.totalCopay || 0) : 0;

  const addToCart = useCallback((item) => {
    setCart((prev) => {
      const existing = prev.find((row) => row.sku === item.sku);
      if (existing) {
        return prev.map((row) => (row.sku === item.sku ? { ...row, qty: row.qty + 1 } : row));
      }
      return [
        ...prev,
        {
          sku: item.sku,
          name: item.name,
          category: item.category || "OTC",
          qty: 1,
          price: item.price,
        },
      ];
    });
    setToast({ message: `${item.name} added to cart`, type: "success" });
  }, []);

  const addServiceItem = useCallback(
    (item) => {
      addToCart(serviceItemToCartLine(item));
    },
    [addToCart]
  );

  const addFavoriteToCart = useCallback(
    (favoriteItem) => {
      addToCart(favoriteItemToCartLine(favoriteItem));
      setWorkspaceTab("till");
    },
    [addToCart]
  );

  const handleBagScan = useCallback(
    async (barcode) => {
      const value = String(barcode || "").trim();
      if (!value || !accessToken) return;
      try {
        const pickup = await lookupPosPickup(value, accessToken);
        if (!pickup) {
          setToast({ message: "No pickup found for this barcode.", type: "warning" });
          return;
        }
        setSelectedPickup(pickup);
        setToast({
          message: `${pickup.patientName} — ${pickup.rxCount} Rx ($${Number(pickup.totalCopay || 0).toFixed(2)})`,
          type: "success",
        });
        setBagScan("");
      } catch (cause) {
        setToast({ message: cause?.message || "Bag lookup failed.", type: "error" });
      }
    },
    [accessToken]
  );

  const handleSearchKeyDown = useCallback(
    (e) => {
      if (e.key !== "Enter") return;
      if (!filteredStoreItems[0]) return;
      e.preventDefault();
      addToCart(filteredStoreItems[0]);
    },
    [addToCart, filteredStoreItems]
  );

  const handleBagScanKeyDown = useCallback(
    (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      handleBagScan(normalizedBagScan);
    },
    [handleBagScan, normalizedBagScan]
  );

  useEffect(() => {
    if (!normalizedSearch || !exactPosIdentifierMatch) {
      lastAutoAddIdentifier.current = "";
      return;
    }
    if (lastAutoAddIdentifier.current === normalizedSearch) return;
    lastAutoAddIdentifier.current = normalizedSearch;
    addToCart(exactPosIdentifierMatch);
    setSearch("");
  }, [addToCart, exactPosIdentifierMatch, normalizedSearch]);

  const removeFromCart = useCallback((sku) => {
    setCart((prev) => prev.filter((row) => row.sku !== sku));
  }, []);

  const updateCartQty = useCallback((sku, nextQty) => {
    setCart((prev) =>
      prev
        .map((row) => (row.sku === sku ? { ...row, qty: Math.max(0, Number(nextQty) || 0) } : row))
        .filter((row) => row.qty > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedPickup(null);
    setSearch("");
    setBagScan("");
    setSaleNote("");
    setTenderedAmount("");
    setToast({ message: "Till cleared.", type: "info" });
  }, []);

  const otcSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountBase = Math.max(0, otcSubtotal);
  const discount =
    discountType === "percent"
      ? Math.min(discountBase, discountBase * (clampMoney(discountValue) / 100))
      : discountType === "amount"
        ? Math.min(discountBase, clampMoney(discountValue))
        : 0;
  const taxableSubtotal = Math.max(0, otcSubtotal - discount);
  const taxRate = Number(demographicConfig.taxRate) || 0;
  const tax = taxExempt ? 0 : taxableSubtotal * taxRate;
  const total = taxableSubtotal + tax + rxCopay;
  const numericTenderedAmount = Number(tenderedAmount);
  const changeDue = payMethod === "Cash" && Number.isFinite(numericTenderedAmount)
    ? Math.max(0, numericTenderedAmount - total)
    : 0;

  const persistDemographics = useCallback((next) => {
    setDemographicConfig(next);
    savePosDemographicConfig(next);
  }, []);

  const runCharge = async () => {
    if (!accessToken) {
      setToast({ message: "Sign in required to complete sale.", type: "error" });
      return;
    }

    setCharging(true);
    try {
      const result = await completePosSale(
        {
          pickupId: selectedPickup?.id || null,
          cart,
          payMethod,
          tillNumber: null,
          rxCopay,
          demographic: demographicLabel,
          printMerchantCopy: demographicConfig.printMerchantCopy,
          saleNote: saleNote.trim(),
          discount: {
            type: discountType,
            value: clampMoney(discountValue),
            amount: Number(discount.toFixed(2)),
          },
          taxExempt,
          tenderedAmount: Number.isFinite(numericTenderedAmount) ? numericTenderedAmount : null,
          changeDue: Number(changeDue.toFixed(2)),
        },
        accessToken
      );

      const merchantNote =
        payMethod !== "Cash" && !demographicConfig.printMerchantCopy ? " Merchant copy skipped." : "";

      setToast({
        message: result.writebackWarning
          ? `Charged $${total.toFixed(2)}. ${result.writebackWarning}${merchantNote}`
          : `Charged $${total.toFixed(2)} via ${payMethod} · ${demographicLabel}${merchantNote}`,
        type: result.writebackWarning ? "warning" : "success",
      });
      logActivity("pos", "POS charge completed", {
        total: Number(total.toFixed(2)),
        subtotal: Number(otcSubtotal.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        payMethod,
        demographic: demographicLabel,
        lineItems: cart.length,
        pickupId: selectedPickup?.id || null,
        invoiceNumber: result.invoiceNumber,
      });
      runAutosave();
      setCart([]);
      setSearch("");
      setSaleNote("");
      setTenderedAmount("");
      setSelectedPickup(null);
      setSelectedDemographicId(demographicConfig.defaultId);
      reload();
    } catch (cause) {
      setToast({ message: cause?.message || "Payment error", type: "error" });
    } finally {
      setCharging(false);
      setShowDemographicPrompt(false);
    }
  };

  const handleCharge = async () => {
    if (cart.length === 0 && !selectedPickup) {
      setToast({ message: "Cart is empty", type: "warning" });
      return;
    }

    if (!demographicConfig.skipPrompt && !showDemographicPrompt) {
      setShowDemographicPrompt(true);
      return;
    }

    await runCharge();
  };

  const handleSaveFavorites = ({ tabs, items }) => {
    savePosFavoritesConfig({ tabs, items });
    setFavoritesConfig({ tabs, items });
    setToast({ message: "Favorites saved for this till.", type: "success" });
  };

  const handleSaveDemographics = (next) => {
    persistDemographics(next);
    setDiscountType(next.defaultDiscountType || "none");
    setDiscountValue(next.defaultDiscountValue || 0);
    setToast({ message: "Till options saved.", type: "success" });
  };

  return (
    <div className="crx-content screen-enter">
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>Point of Sale</div>
      </div>

      <PosDemographicBar
        options={demographicConfig.options}
        selectedId={selectedDemographicId}
        defaultId={demographicConfig.defaultId}
        onSelect={setSelectedDemographicId}
        onSetDefault={(id) => persistDemographics({ ...demographicConfig, defaultId: id })}
      />

      <div className="crx-tabs" style={{ marginBottom: 16 }}>
        {POS_WORKSPACE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`crx-tab${workspaceTab === tab.id ? " active" : ""}`}
            onClick={() => setWorkspaceTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {workspaceTab === "favorites" ? (
        <PosFavoritesPanel
          tabs={favoritesConfig.tabs}
          items={favoritesConfig.items}
          onAddItem={addFavoriteToCart}
        />
      ) : null}

      {workspaceTab === "manage" ? (
        <PosManagePanel
          tabs={favoritesConfig.tabs}
          items={favoritesConfig.items}
          demographicConfig={demographicConfig}
          onSaveFavorites={handleSaveFavorites}
          onSaveDemographics={handleSaveDemographics}
        />
      ) : null}

      {workspaceTab === "till" ? (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 320px", gap: 16 }}>
          <div>
            <div className="crx-card-header" style={{ marginBottom: 8 }}>
              <span className="crx-card-title">Ready for pickup</span>
            </div>
            <PickupQueue
              pickups={pickups}
              selectedPickupId={selectedPickup?.id}
              onSelect={setSelectedPickup}
              isLoading={isLoading}
              error={error}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="crx-card" style={{ padding: "12px 18px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 8, textTransform: "uppercase" }}>
                Scan Rx bag
              </div>
              <input
                className="crx-input"
                placeholder="Scan bag barcode"
                value={bagScan}
                onChange={(e) => setBagScan(e.target.value)}
                onKeyDown={handleBagScanKeyDown}
                style={{ width: "100%" }}
              />
              {selectedPickup ? (
                <div style={{ marginTop: 10, fontSize: 13, color: "#15803d", fontWeight: 600 }}>
                  Attached: {selectedPickup.patientName} — copay ${rxCopay.toFixed(2)}
                </div>
              ) : null}
              <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                Customer: <strong>{demographicLabel}</strong>
              </div>
              {demographicConfig.promptForBag ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {QUICK_SERVICE_ITEMS.map((item) => (
                    <button
                      key={item.sku}
                      type="button"
                      className="btn-secondary"
                      style={{ padding: "6px 10px", fontSize: 12 }}
                      onClick={() => addServiceItem(item)}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="crx-card">
              <div className="crx-card-header">
                <span className="crx-card-title">POS Cart</span>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>{cart.length} line(s)</div>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: "4px 10px", fontSize: 11, marginLeft: 8 }}
                  onClick={() => setWorkspaceTab("favorites")}
                >
                  Favorites
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: "4px 10px", fontSize: 11 }}
                  onClick={clearCart}
                  disabled={cart.length === 0 && !selectedPickup}
                >
                  Clear
                </button>
              </div>
              <div style={{ padding: "0 18px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 132px 80px 80px 44px",
                    gap: 8,
                    padding: "8px 0",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  {["Item", "Qty", "Price", "Total", ""].map((h) => (
                    <div
                      key={h}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#9ca3af",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {h}
                    </div>
                  ))}
                </div>
                {cart.length > 0 ? (
                  cart.map((item) => (
                    <div
                      key={item.sku}
                      className="pos-item"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 132px 80px 80px 44px",
                        gap: 8,
                        alignItems: "center",
                        borderBottom: "1px solid #f3f4f6",
                        padding: "12px 0",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{item.category}</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "44px 52px 44px", gap: 4, alignItems: "center" }}>
                        <button
                          type="button"
                          className="btn-secondary crx-qty-btn"
                          onClick={() => updateCartQty(item.sku, item.qty - 1)}
                          title="Decrease quantity"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <input
                          className="crx-input"
                          type="number"
                          min="0"
                          value={item.qty}
                          onChange={(e) => updateCartQty(item.sku, e.target.value)}
                          style={{ padding: "4px 6px", textAlign: "center" }}
                          title="Quantity"
                        />
                        <button
                          type="button"
                          className="btn-secondary crx-qty-btn"
                          onClick={() => updateCartQty(item.sku, item.qty + 1)}
                          title="Increase quantity"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>${item.price.toFixed(2)}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                        ${(item.price * item.qty).toFixed(2)}
                      </div>
                      <button
                        type="button"
                        className="crx-icon-btn"
                        onClick={() => removeFromCart(item.sku)}
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>Cart is empty</div>
                )}
              </div>
            </div>

            <div className="crx-card">
              <div className="crx-card-header">
                <span className="crx-card-title">POS Inventory</span>
                <div style={{ position: "relative", flex: 1, maxWidth: 300, marginLeft: 16 }}>
                  <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 12 }}>
                    ⌕
                  </span>
                  <input
                    className="crx-input"
                    placeholder="Search or scan SKU, barcode, or item"
                    style={{ paddingLeft: 28, height: 32, fontSize: 12 }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                  />
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: "6px 12px", fontSize: 12, marginLeft: 8, opacity: filteredStoreItems[0] ? 1 : 0.6 }}
                  disabled={!filteredStoreItems[0]}
                  onClick={() => filteredStoreItems[0] && addToCart(filteredStoreItems[0])}
                >
                  + Add first
                </button>
              </div>
              <div style={{ padding: "0 18px 10px" }}>
                {filteredStoreItems.slice(0, 8).map((item) => (
                  <div
                    key={item.sku}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "140px 1fr 100px 90px 90px",
                      gap: 8,
                      alignItems: "center",
                      padding: "12px 0",
                      borderBottom: "1px solid #f9fafb",
                    }}
                  >
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#6b7280" }}>{item.sku}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>${item.price.toFixed(2)}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{item.category}</div>
                    <div style={{ fontSize: 12, color: "#374151" }}>{item.stock}</div>
                    <button type="button" className="btn-secondary" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => addToCart(item)}>
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="crx-card" style={{ height: "fit-content" }}>
            <div className="crx-card-header">
              <span className="crx-card-title">Payment</span>
            </div>
            <div style={{ padding: "16px 18px" }}>
              {showDemographicPrompt && !demographicConfig.skipPrompt ? (
                <div
                  style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 14,
                    fontSize: 13,
                    color: "#92400e",
                  }}
                >
                  Confirm customer: <strong>{demographicLabel}</strong>. Tap Charge again or change customer above.
                </div>
              ) : null}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                {["Cash", "Debit", "Credit Card", "Insurance", "Other"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`pay-opt${payMethod === m ? " active" : ""}`}
                    onClick={() => setPayMethod(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {payMethod === "Cash" ? (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 8, textTransform: "uppercase" }}>
                    Cash tendered
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {(demographicConfig.quickTenderAmounts || [10, 20, 50, 100]).map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        className="btn-secondary"
                        style={{ padding: "5px 10px", fontSize: 12, minHeight: 30 }}
                        onClick={() => setTenderedAmount(String(amount))}
                      >
                        ${Number(amount).toFixed(0)}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: "5px 10px", fontSize: 12, minHeight: 30 }}
                      onClick={() => setTenderedAmount(total.toFixed(2))}
                    >
                      Exact
                    </button>
                  </div>
                  <input
                    className="crx-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount received"
                    value={tenderedAmount}
                    onChange={(e) => setTenderedAmount(e.target.value)}
                  />
                  {tenderedAmount ? (
                    <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#166534" }}>
                      <span>Change due</span>
                      <span>${changeDue.toFixed(2)}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 92px", gap: 8, marginBottom: 12 }}>
                <select
                  className="crx-select"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  title="Discount type"
                >
                  <option value="none">No discount</option>
                  <option value="percent">Percent discount</option>
                  <option value="amount">Dollar discount</option>
                </select>
                <input
                  className="crx-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  disabled={discountType === "none"}
                  title="Discount value"
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", marginBottom: 12 }}>
                <input
                  type="checkbox"
                  checked={taxExempt}
                  onChange={(e) => setTaxExempt(e.target.checked)}
                />
                Tax exempt sale
              </label>
              {demographicConfig.collectSaleNotes ? (
                <textarea
                  className="crx-input"
                  rows={3}
                  placeholder="Sale note, delivery instruction, or manual reference"
                  value={saleNote}
                  onChange={(e) => setSaleNote(e.target.value)}
                  style={{ resize: "vertical", marginBottom: 16 }}
                />
              ) : null}
              <div style={{ background: "#f9fafb", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                {selectedPickup ? (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
                    <span>Rx copay</span>
                    <span>${rxCopay.toFixed(2)}</span>
                  </div>
                ) : null}
                {[
                  ["OTC subtotal", `$${otcSubtotal.toFixed(2)}`],
                  ...(discount > 0 ? [["Discount", `-$${discount.toFixed(2)}`]] : []),
                  [`Tax (${taxExempt ? "exempt" : `${(taxRate * 100).toFixed(2)}% on OTC`})`, `$${tax.toFixed(2)}`],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
                    <span>{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#111827",
                    paddingTop: 10,
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: "#1447e6" }}>${total.toFixed(2)}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn-primary crx-charge-btn"
                onClick={handleCharge}
                disabled={(cart.length === 0 && !selectedPickup) || charging}
              >
                {charging ? "Processing…" : `Charge $${total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <PosToast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null}
    </div>
  );
}
