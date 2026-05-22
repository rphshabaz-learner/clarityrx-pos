import React, { useMemo, useRef, useState } from "react";
import { usePosKeyboardShortcuts } from "../../../hooks/usePosKeyboardShortcuts";
import { POS_FRONT_STORE_ITEMS } from "../../../modules/pos/posCatalog";
import {
  filterCatalogByDepartment,
  listPosDepartments,
  POS_CHECKOUT_COUPONS,
  SALES_PAYMENT_METHODS,
} from "../../../lib/posSalesRegister";
import { isCardPayMethod } from "../../../lib/posPayments";
import { BalanceBanner } from "../giftcards/GiftCardShared";
import { resolveSecurelinkTerminalId } from "../../../lib/securelinkConfig";
import { formatTaxReceiptLines } from "../../../lib/receipt/saleReceiptFormat";
import {
  ageRestrictionLabel,
  resolveAgeRestrictionClass,
} from "../../../lib/compliance/ageRestrictedProducts";

function TouchTile({ label, sublabel, onClick, disabled, emoji }) {
  const ariaLabel = sublabel ? `${label}, ${sublabel}` : label;
  return (
    <button
      type="button"
      className="crx-sales-tile"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={ariaLabel}
    >
      {emoji ? (
        <span className="crx-sales-tile__emoji" aria-hidden>
          {emoji}
        </span>
      ) : null}
      <span className="crx-sales-tile__label">{label}</span>
      {sublabel ? <span className="crx-sales-tile__sublabel">{sublabel}</span> : null}
    </button>
  );
}

function SaleOptionsModal({
  canDiscount,
  discountType,
  discountValue,
  onDiscountTypeChange,
  onDiscountValueChange,
  couponCode,
  onCouponCodeChange,
  onApplyCoupon,
  couponHint,
  loyaltyPoints,
  onLoyaltyPointsChange,
  taxExempt,
  onTaxExemptChange,
  saleNote,
  onSaleNoteChange,
  collectSaleNotes,
  onClose,
}) {
  return (
    <div
      className="crx-pos-header__modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Sale options"
      onClick={onClose}
    >
      <div
        className="crx-pos-header__modal crx-sales-options-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Sale options</div>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
          Discounts, coupons, loyalty, tax, and notes for this transaction.
        </p>
        <div className="crx-sales-options-modal__grid">
          <label className="crx-sales-options-modal__field">
            <span>Cart discount</span>
            {canDiscount ? (
              <div className="crx-sales-options-modal__pair">
                <select className="crx-select" value={discountType} onChange={(e) => onDiscountTypeChange(e.target.value)}>
                  <option value="none">None</option>
                  <option value="percent">%</option>
                  <option value="amount">$</option>
                </select>
                <input
                  className="crx-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountValue}
                  disabled={discountType === "none"}
                  onChange={(e) => onDiscountValueChange(e.target.value)}
                />
              </div>
            ) : (
              <span className="crx-sales-totals__hint">Supervisor or manager override required.</span>
            )}
          </label>
          <label className="crx-sales-options-modal__field">
            <span>Coupon</span>
            <div className="crx-sales-options-modal__pair">
              <input
                className="crx-input"
                placeholder="e.g. SAVE10"
                value={couponCode}
                onChange={(e) => onCouponCodeChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onApplyCoupon?.()}
              />
              <button type="button" className="btn-secondary" onClick={onApplyCoupon}>
                Apply
              </button>
            </div>
            {couponHint ? <span className="crx-sales-totals__hint">{couponHint}</span> : null}
          </label>
          <label className="crx-sales-options-modal__field crx-sales-options-modal__field--loyalty">
            <span>Loyalty points</span>
            <input
              className="crx-input"
              type="number"
              min="0"
              step="1"
              placeholder="Points to redeem"
              value={loyaltyPoints}
              onChange={(e) => onLoyaltyPointsChange(e.target.value)}
            />
          </label>
          <label className="crx-sales-totals__exempt" style={{ marginTop: 0 }}>
            <input type="checkbox" checked={taxExempt} onChange={(e) => onTaxExemptChange(e.target.checked)} />
            Tax exempt
          </label>
          {collectSaleNotes ? (
            <label className="crx-sales-options-modal__field">
              <span>Sale note</span>
              <textarea
                className="crx-input"
                rows={3}
                placeholder="Note for this sale"
                value={saleNote}
                onChange={(e) => onSaleNoteChange(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </label>
          ) : null}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function SignaturePad({ onAccept, onCancel }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const source = event.touches?.[0] || event;
    return {
      x: (source.clientX - rect.left) * scaleX,
      y: (source.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (event) => {
    event.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    const point = getPoint(event);
    if (!ctx || !point) return;
    drawingRef.current = true;
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (event) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    const point = getPoint(event);
    if (!ctx || !point) return;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const endDraw = () => {
    drawingRef.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const accept = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onAccept(canvas.toDataURL("image/png"));
  };

  return (
    <div className="crx-pos-header__modal-backdrop" role="dialog" aria-modal="true" aria-label="Signature capture">
      <div className="crx-pos-header__modal" style={{ maxWidth: 520 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Customer signature</div>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
          Ask the customer to sign on screen to complete card or high-value sales.
        </p>
        <canvas
          ref={(node) => {
            canvasRef.current = node;
            if (node && !node.dataset.ready) {
              node.dataset.ready = "1";
              const ctx = node.getContext("2d");
              ctx.fillStyle = "#fff";
              ctx.fillRect(0, 0, node.width, node.height);
            }
          }}
          width={480}
          height={160}
          className="crx-sales-signature"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <button type="button" className="btn-secondary" onClick={clear}>
            Clear
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-primary" style={{ marginLeft: "auto" }} onClick={accept}>
            Accept signature
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PosSalesRegisterPanel({
  cart,
  selectedPickup,
  rxCopay,
  demographicLabel,
  accountCustomerLabel,
  onClearAccountCustomer,
  search,
  bagScan,
  onSearchChange,
  onSearchKeyDown,
  onBagScanChange,
  onBagScanKeyDown,
  onClearCart,
  onRemoveLine,
  onUpdateQty,
  onUpdatePrice,
  onUpdateLineDiscount,
  canVoid = true,
  canDiscount = true,
  managerOverrideActive,
  favoritesItems,
  onAddCatalogItem,
  onAddFavorite,
  onFilterDepartment,
  activeDepartment,
  discountType,
  discountValue,
  onDiscountTypeChange,
  onDiscountValueChange,
  couponCode,
  onCouponCodeChange,
  onApplyCoupon,
  loyaltyPoints,
  onLoyaltyPointsChange,
  taxExempt,
  onTaxExemptChange,
  saleNote,
  onSaleNoteChange,
  collectSaleNotes,
  otcSubtotal,
  cartDiscount,
  couponDiscount,
  loyaltyRedemption,
  tax,
  taxRate,
  taxBreakdown,
  provinceLabel,
  taxPricingMode,
  total,
  payMethod,
  onPayMethodChange,
  splitEnabled,
  onSplitEnabledChange,
  splitPayments,
  onSplitPaymentChange,
  tenderedAmount,
  onTenderedAmountChange,
  quickTenderAmounts,
  changeDue,
  securelinkActive,
  demographicConfig,
  selectedTillNumber,
  charging,
  cardPaymentStatus,
  onCancelCardPayment,
  showDemographicPrompt,
  onCharge,
  onOpenFavorites,
  showSignatureModal,
  onSignatureAccept,
  onSignatureCancel,
  promptForBag,
  quickServiceItems,
  onAddServiceItem,
  giftCardNumber,
  onGiftCardNumberChange,
  giftCardLookup,
  giftCardRedeemAmount,
  showGiftCardTender,
  onOpenGiftCards,
  onSuspendSale,
  ageCheckoutBlocked,
  ageCheckoutMessage,
  pendingAgeVerification,
  onResumeSale,
  showKeyboardHints = false,
}) {
  const [showSaleOptions, setShowSaleOptions] = useState(false);
  const scanInputRef = useRef(null);
  const bagScanInputRef = useRef(null);

  usePosKeyboardShortcuts({
    enabled: showKeyboardHints && !showSaleOptions && !showSignatureModal,
    handlers: {
      focusScan: () => scanInputRef.current?.focus(),
      focusBagScan: () => bagScanInputRef.current?.focus(),
      charge: onCharge,
      suspend: onSuspendSale,
      resume: onResumeSale,
      escape: () => {
        if (showSaleOptions) setShowSaleOptions(false);
      },
    },
  });
  const departments = useMemo(() => listPosDepartments(), []);
  const hotProducts = useMemo(() => (favoritesItems || []).slice(0, 8), [favoritesItems]);
  const departmentItems = useMemo(
    () => (activeDepartment ? filterCatalogByDepartment(activeDepartment).slice(0, 6) : []),
    [activeDepartment]
  );

  const canPriceOverride = canDiscount || managerOverrideActive;

  const couponHint = POS_CHECKOUT_COUPONS[couponCode.trim().toUpperCase()]?.label;
  const hasSaleOptions =
    discountType !== "none" ||
    Number(discountValue) > 0 ||
    Boolean(couponCode.trim()) ||
    Number(loyaltyPoints) > 0 ||
    taxExempt ||
    Boolean(saleNote?.trim());

  return (
    <div className="crx-sales-register crx-sales-register--fit">
      <div className="crx-sales-register__left">
        <div className="crx-card crx-sales-scan crx-sales-scan--rx">
          <div className="crx-sales-scan__row">
            <label className="crx-sales-scan__field">
              <span className="crx-sales-scan__label">Barcode / SKU scan</span>
              <input
                ref={scanInputRef}
                className="crx-input"
                placeholder="Scan or type SKU, UPC, or item name"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={onSearchKeyDown}
                autoComplete="off"
              />
            </label>
            <label className="crx-sales-scan__field crx-field-rx">
              <span className="crx-sales-scan__label">Rx bag / pickup</span>
              <input
                ref={bagScanInputRef}
                className="crx-input"
                placeholder="Scan prescription bag barcode"
                value={bagScan}
                onChange={(e) => onBagScanChange(e.target.value)}
                onKeyDown={onBagScanKeyDown}
                autoComplete="off"
              />
            </label>
          </div>
          <div className="crx-sales-scan__meta">
            <span>
              Customer: <strong>{demographicLabel}</strong>
            </span>
            {accountCustomerLabel ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                Account: <strong>{accountCustomerLabel}</strong>
                {onClearAccountCustomer ? (
                  <button type="button" className="btn-secondary" style={{ padding: "2px 8px", fontSize: 11 }} onClick={onClearAccountCustomer}>
                    Clear
                  </button>
                ) : null}
              </span>
            ) : null}
            {selectedPickup ? (
              <span className="crx-sales-scan__rx">
                Rx pickup · {selectedPickup.rxCount || 1} script(s) · copay ${rxCopay.toFixed(2)}
              </span>
            ) : (
              <span className="crx-sales-scan__rx crx-sales-scan__rx--idle">OTC + Rx combined billing ready</span>
            )}
          </div>
          {promptForBag && quickServiceItems?.length ? (
            <div className="crx-sales-scan__services">
              {quickServiceItems.map((item) => (
                <button
                  key={item.sku}
                  type="button"
                  className="btn-secondary"
                  style={{ padding: "6px 10px", fontSize: 12 }}
                  onClick={() => onAddServiceItem(item)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="crx-card crx-sales-cart crx-sales-cart--fill">
          <div className="crx-card-header">
            <span className="crx-card-title">Sale lines</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn-secondary" style={{ padding: "4px 10px", fontSize: 11 }} onClick={onOpenFavorites}>
                Quick SKUs
              </button>
              {canVoid ? (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: "4px 10px", fontSize: 11 }}
                  onClick={onClearCart}
                  disabled={cart.length === 0 && !selectedPickup}
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
          <div className="crx-sales-cart__scroll">
            <div className="crx-sales-cart__table">
              <div className="crx-sales-cart__head">
                {["Item", "Qty", "Price", "Disc.", "Total", ""].map((h) => (
                  <div key={h}>{h}</div>
                ))}
              </div>
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div
                    key={item.sku}
                    className={`crx-sales-cart__row${canPriceOverride ? " crx-sales-cart__row--override" : ""}`}
                  >
                    <div>
                      <div className="crx-sales-cart__name">{item.name}</div>
                      <div className="crx-sales-cart__sku">
                        {item.category}
                        {resolveAgeRestrictionClass(item) !== "none" ? (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              fontWeight: 800,
                              color: "#b45309",
                            }}
                          >
                            {ageRestrictionLabel(resolveAgeRestrictionClass(item))}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="crx-sales-cart__qty">
                      <button
                        type="button"
                        className="btn-secondary crx-qty-btn"
                        onClick={() => onUpdateQty(item.sku, item.qty - 1)}
                        aria-label="Decrease quantity"
                        disabled={!canVoid && item.qty <= 1}
                      >
                        -
                      </button>
                      <input
                        className="crx-input"
                        type="number"
                        min="0"
                        value={item.qty}
                        onChange={(e) => onUpdateQty(item.sku, e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-secondary crx-qty-btn"
                        onClick={() => onUpdateQty(item.sku, item.qty + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    {canPriceOverride ? (
                      <input
                        className="crx-input crx-sales-cart__price-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => onUpdatePrice(item.sku, e.target.value)}
                        title="Price override"
                      />
                    ) : (
                      <div className="crx-sales-cart__money">${Number(item.price).toFixed(2)}</div>
                    )}
                    {canDiscount ? (
                      <input
                        className="crx-input crx-sales-cart__disc-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.lineDiscount || 0}
                        onChange={(e) => onUpdateLineDiscount(item.sku, e.target.value)}
                        title="Line discount"
                      />
                    ) : (
                      <div className="crx-sales-cart__money">—</div>
                    )}
                    <div className="crx-sales-cart__money crx-sales-cart__money--strong">
                      $
                      {(
                        Math.max(0, item.price * item.qty - (Number(item.lineDiscount) || 0))
                      ).toFixed(2)}
                    </div>
                    {canVoid ? (
                      <button
                        type="button"
                        className="crx-icon-btn"
                        onClick={() => onRemoveLine(item.sku)}
                        aria-label="Remove line"
                      >
                        ×
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                ))
              ) : (
                <div className="crx-sales-cart__empty">Scan a product or use hot keys on the right</div>
              )}
            </div>
          </div>
        </div>

        <div className="crx-card crx-sales-totals crx-sales-totals--compact">
          <div className="crx-card-header">
            <span className="crx-card-title">Totals</span>
            <div className="crx-sales-totals__actions">
              {hasSaleOptions ? <span className="crx-sales-totals__badge">Options applied</span> : null}
              <button type="button" className="btn-secondary" onClick={() => setShowSaleOptions(true)}>
                Options
              </button>
            </div>
          </div>
          <div className="crx-sales-totals__breakdown" style={{ padding: "0 18px 14px" }}>
            {selectedPickup ? (
              <div className="crx-sales-totals__line">
                <span>Rx copay</span>
                <span>${rxCopay.toFixed(2)}</span>
              </div>
            ) : null}
            <div className="crx-sales-totals__line">
              <span>OTC subtotal</span>
              <span>${otcSubtotal.toFixed(2)}</span>
            </div>
            {cartDiscount > 0 ? (
              <div className="crx-sales-totals__line">
                <span>Discount</span>
                <span>-${cartDiscount.toFixed(2)}</span>
              </div>
            ) : null}
            {couponDiscount > 0 ? (
              <div className="crx-sales-totals__line">
                <span>Coupon</span>
                <span>-${couponDiscount.toFixed(2)}</span>
              </div>
            ) : null}
            {loyaltyRedemption > 0 ? (
              <div className="crx-sales-totals__line crx-sales-totals__line--loyalty">
                <span>Loyalty</span>
                <span>-${loyaltyRedemption.toFixed(2)}</span>
              </div>
            ) : null}
            {taxExempt ? (
              <div className="crx-sales-totals__line">
                <span>Tax (exempt)</span>
                <span>$0.00</span>
              </div>
            ) : formatTaxReceiptLines(taxBreakdown).length ? (
              formatTaxReceiptLines(taxBreakdown).map((row) => (
                <div key={row.label} className="crx-sales-totals__line">
                  <span>
                    {row.label}
                    {provinceLabel ? ` · ${provinceLabel}` : ""}
                    {taxPricingMode === "inclusive" ? " (incl.)" : ""}
                  </span>
                  <span>${row.amount.toFixed(2)}</span>
                </div>
              ))
            ) : (
              <div className="crx-sales-totals__line">
                <span>Tax ({(taxRate * 100).toFixed(2)}%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            )}
            <div className="crx-sales-totals__grand">
              <span>Total due</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="crx-sales-register__right">
        <div className="crx-card crx-sales-pay crx-sales-pay--panel crx-tone-pay">
          <div className="crx-card-header">
            <span className="crx-card-title">Payment</span>
          </div>
          <div className="crx-sales-pay__body">
            {showKeyboardHints ? (
              <div className="crx-shortcuts-hint" aria-label="Keyboard shortcuts">
                <span><kbd className="crx-kbd">F1</kbd> Scan</span>
                <span><kbd className="crx-kbd">F2</kbd> Rx bag</span>
                <span><kbd className="crx-kbd">F3</kbd> Charge</span>
                <span><kbd className="crx-kbd">F4</kbd> Suspend</span>
                <span><kbd className="crx-kbd">F5</kbd> Resume</span>
              </div>
            ) : null}
            {showDemographicPrompt ? (
              <div className="crx-sales-pay__banner">
                Confirm customer: <strong>{demographicLabel}</strong>. Tap Charge again to complete.
              </div>
            ) : null}
            {pendingAgeVerification ? (
              <div className="crx-sales-pay__banner" style={{ borderColor: "#f59e0b", background: "#fffbeb" }}>
                Complete age verification for <strong>{pendingAgeVerification}</strong> before charging.
              </div>
            ) : null}
            {ageCheckoutBlocked && ageCheckoutMessage ? (
              <div className="crx-sales-pay__banner" style={{ borderColor: "#dc2626", background: "#fef2f2" }}>
                {ageCheckoutMessage}
              </div>
            ) : null}
            <div className="crx-sales-pay__methods">
              {SALES_PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  className={`pay-opt crx-sales-pay__method${payMethod === method ? " active" : ""}`}
                  onClick={() => onPayMethodChange(method)}
                >
                  {method}
                </button>
              ))}
            </div>
            <label className="crx-sales-split">
              <input
                type="checkbox"
                checked={splitEnabled}
                onChange={(e) => onSplitEnabledChange(e.target.checked)}
              />
              Split payment
            </label>
            {splitEnabled ? (
              <div className="crx-sales-split__rows">
                {splitPayments.map((row, index) => (
                  <div key={index} className="crx-sales-split__row">
                    <select
                      className="crx-select"
                      value={row.method}
                      onChange={(e) => onSplitPaymentChange(index, "method", e.target.value)}
                    >
                      {SALES_PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                    <input
                      className="crx-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Amount"
                      value={row.amount}
                      onChange={(e) => onSplitPaymentChange(index, "amount", e.target.value)}
                    />
                  </div>
                ))}
              </div>
            ) : null}
            {showGiftCardTender ? (
              <div className="crx-sales-giftcard" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                  Gift card {giftCardRedeemAmount > 0 ? `· $${giftCardRedeemAmount.toFixed(2)} to redeem` : ""}
                </label>
                <input
                  className="crx-input"
                  placeholder="GC-1000-0001 or scan"
                  value={giftCardNumber || ""}
                  onChange={(e) => onGiftCardNumberChange?.(e.target.value)}
                  autoComplete="off"
                />
                {giftCardNumber?.trim() && giftCardLookup ? <BalanceBanner lookup={giftCardLookup} /> : null}
                {onOpenGiftCards ? (
                  <button type="button" className="btn-secondary" style={{ width: "100%" }} onClick={onOpenGiftCards}>
                    Gift card tools (activate / reload)
                  </button>
                ) : null}
              </div>
            ) : null}
            {payMethod === "Cash" && !splitEnabled ? (
              <div className="crx-sales-cash">
                <div className="crx-sales-cash__quick">
                  {(quickTenderAmounts || [10, 20, 50, 100]).map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className="btn-secondary"
                      onClick={() => onTenderedAmountChange(String(amount))}
                    >
                      ${Number(amount).toFixed(0)}
                    </button>
                  ))}
                  <button type="button" className="btn-secondary" onClick={() => onTenderedAmountChange(total.toFixed(2))}>
                    Exact
                  </button>
                </div>
                <input
                  className="crx-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Cash tendered"
                  value={tenderedAmount}
                  onChange={(e) => onTenderedAmountChange(e.target.value)}
                />
                {tenderedAmount ? (
                  <div className="crx-sales-cash__change">
                    <span>Change due</span>
                    <span>${changeDue.toFixed(2)}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
            {securelinkActive && isCardPayMethod(payMethod) ? (
              <div className="crx-sales-pay__securelink">
                <strong>Securelink</strong> — terminal {resolveSecurelinkTerminalId(selectedTillNumber, demographicConfig)}
              </div>
            ) : null}
            {charging && cardPaymentStatus ? (
              <div className="crx-sales-pay__status">
                {cardPaymentStatus.message || "Waiting for pinpad…"}
                <button type="button" className="btn-secondary" style={{ width: "100%", marginTop: 8 }} onClick={onCancelCardPayment}>
                  Cancel card payment
                </button>
              </div>
            ) : null}
            <button
              type="button"
              className="btn-tone-pay crx-charge-btn"
              onClick={onCharge}
              disabled={(cart.length === 0 && !selectedPickup) || charging || ageCheckoutBlocked}
            >
              {charging
                ? securelinkActive && isCardPayMethod(payMethod)
                  ? "Pinpad…"
                  : "Processing…"
                : `Charge $${total.toFixed(2)}`}
            </button>
          </div>
        </div>

        <div className="crx-sales-register__right-scroll">
          <div className="crx-card crx-sales-hot">
            <div className="crx-card-header">
              <span className="crx-card-title">Hot products</span>
            </div>
            <div className="crx-sales-hot__grid">
              {hotProducts.map((item) => (
                <TouchTile
                  key={item.id}
                  emoji={item.emoji}
                  label={item.name}
                  sublabel={`$${Number(item.price).toFixed(2)}`}
                  onClick={() => onAddFavorite(item)}
                />
              ))}
            </div>
          </div>

          <div className="crx-card crx-sales-dept">
            <div className="crx-card-header">
              <span className="crx-card-title">Departments</span>
            </div>
            <div className="crx-sales-dept__shortcuts">
              {departments.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  className={`crx-sales-dept__btn${activeDepartment === dept ? " active" : ""}`}
                  onClick={() => onFilterDepartment(activeDepartment === dept ? null : dept)}
                >
                  {dept}
                </button>
              ))}
            </div>
            {activeDepartment ? (
              <div className="crx-sales-dept__items">
                {departmentItems.map((item) => (
                  <TouchTile
                    key={item.sku}
                    label={item.name}
                    sublabel={`$${item.price.toFixed(2)}`}
                    onClick={() => onAddCatalogItem(item)}
                  />
                ))}
                {!departmentItems.length ? (
                  <div style={{ fontSize: 12, color: "#9ca3af", padding: 8 }}>No items in this department.</div>
                ) : null}
              </div>
            ) : (
              <div className="crx-sales-dept__browse">
                {POS_FRONT_STORE_ITEMS.slice(0, 4).map((item) => (
                  <TouchTile
                    key={item.sku}
                    label={item.name}
                    sublabel={item.category}
                    onClick={() => onAddCatalogItem(item)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showSaleOptions ? (
        <SaleOptionsModal
          canDiscount={canDiscount}
          discountType={discountType}
          discountValue={discountValue}
          onDiscountTypeChange={onDiscountTypeChange}
          onDiscountValueChange={onDiscountValueChange}
          couponCode={couponCode}
          onCouponCodeChange={onCouponCodeChange}
          onApplyCoupon={onApplyCoupon}
          couponHint={couponHint}
          loyaltyPoints={loyaltyPoints}
          onLoyaltyPointsChange={onLoyaltyPointsChange}
          taxExempt={taxExempt}
          onTaxExemptChange={onTaxExemptChange}
          saleNote={saleNote}
          onSaleNoteChange={onSaleNoteChange}
          collectSaleNotes={collectSaleNotes}
          onClose={() => setShowSaleOptions(false)}
        />
      ) : null}

      {showSignatureModal ? (
        <SignaturePad onAccept={onSignatureAccept} onCancel={onSignatureCancel} />
      ) : null}
    </div>
  );
}
