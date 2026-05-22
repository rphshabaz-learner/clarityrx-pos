import React from "react";
import { computeLineTotal } from "../../../lib/posSalesRegister";
import { SELF_CHECKOUT_STEPS } from "../../../lib/selfCheckout/selfCheckoutTypes";
import { EmptyState, KioskMoneyRow, KioskTouchButton, SectionIntro } from "./SelfCheckoutShared";

export default function SelfCheckoutScanPaySection({ sc }) {
  const kioskActive = Boolean(sc.kiosk);

  return (
    <div>
      <SectionIntro
        title="Scan-and-pay"
        description="Customer-facing kiosk: scan barcodes, optional loyalty, card payment on the pinpad, then receipt choice. Staff can start or reset a session from here."
      />

      {!kioskActive ? (
        <div className="crx-card" style={{ padding: 24, maxWidth: 520 }}>
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginBottom: 16 }}>
            {sc.config?.welcomeMessage || "Welcome — scan items to begin."}
          </p>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
            Kiosk till #{sc.tillNumber}
            {sc.securelinkActive ? " · Card reader enabled" : " · Card reader offline (mock or staff till)"}
          </p>
          <KioskTouchButton disabled={sc.busy || !sc.featureEnabled} onClick={() => sc.startKiosk()}>
            Start kiosk session
          </KioskTouchButton>
          {!sc.featureEnabled ? (
            <p style={{ fontSize: 11, color: "#b45309", marginTop: 10 }}>
              Set REACT_APP_POS_SELF_CHECKOUT=1 to enable at this store.
            </p>
          ) : null}
        </div>
      ) : (
        <div
          className="crx-card"
          style={{
            padding: 20,
            maxWidth: 720,
            margin: "0 auto",
            background: "#f8fafc",
            border: "2px solid #e2e8f0",
          }}
        >
          {sc.kiosk.step === SELF_CHECKOUT_STEPS.SCAN ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Scan your items</div>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>{sc.config?.welcomeMessage}</p>
              <input
                className="crx-input"
                autoFocus
                placeholder="Scan barcode or enter SKU / UPC"
                value={sc.scanBuffer}
                onChange={(e) => sc.setScanBuffer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void sc.scanItem(sc.scanBuffer);
                  }
                }}
                style={{ fontSize: 18, padding: "14px 16px", marginBottom: 16 }}
              />
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <KioskTouchButton
                  disabled={sc.busy || !sc.scanBuffer.trim()}
                  onClick={() => void sc.scanItem(sc.scanBuffer)}
                  style={{ flex: 1 }}
                >
                  Add item
                </KioskTouchButton>
                <KioskTouchButton
                  variant="secondary"
                  disabled={!sc.kiosk.cart?.length}
                  onClick={() => sc.setKioskStep(SELF_CHECKOUT_STEPS.LOYALTY)}
                  style={{ flex: 1 }}
                >
                  Checkout
                </KioskTouchButton>
              </div>
              {sc.kiosk.cart?.length ? (
                <div style={{ marginBottom: 16 }}>
                  {sc.kiosk.cart.map((line) => (
                    <div
                      key={line.sku}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 0",
                        borderTop: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{line.name}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{line.sku}</div>
                      </div>
                      <input
                        className="crx-input"
                        type="number"
                        min={0}
                        value={line.qty}
                        onChange={(e) => sc.updateCartQty(line.sku, e.target.value)}
                        style={{ width: 64, textAlign: "center" }}
                      />
                      <div style={{ fontWeight: 700, minWidth: 72, textAlign: "right" }}>
                        ${computeLineTotal(line).toFixed(2)}
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: 11 }}
                        onClick={() => sc.removeCartLine(line.sku)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <KioskMoneyRow label="Subtotal" value={sc.kioskTotals.subtotal} strong />
                </div>
              ) : (
                <EmptyState message="Cart is empty — scan a product to begin." />
              )}
              <KioskTouchButton variant="danger" onClick={() => sc.endKiosk()}>
                Cancel session
              </KioskTouchButton>
            </>
          ) : null}

          {sc.kiosk.step === SELF_CHECKOUT_STEPS.LOYALTY ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Loyalty</div>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>{sc.config?.loyaltyPrompt}</p>
              <input
                className="crx-input"
                placeholder="Phone or member ID"
                value={sc.loyaltyQuery}
                onChange={(e) => sc.setLoyaltyQuery(e.target.value)}
                style={{ fontSize: 16, marginBottom: 12 }}
              />
              {sc.loyaltyMatches.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => {
                    sc.attachLoyaltyCustomer(customer);
                    sc.setKioskStep(SELF_CHECKOUT_STEPS.PAYMENT);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{customer.profile?.firstName} {customer.profile?.lastName}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>
                    {customer.loyalty?.memberId || "—"} · {customer.loyalty?.pointsBalance || 0} pts
                  </div>
                </button>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                {sc.config?.allowLoyaltySkip ? (
                  <KioskTouchButton variant="secondary" onClick={() => sc.skipLoyalty()}>
                    Skip loyalty
                  </KioskTouchButton>
                ) : null}
                <KioskTouchButton onClick={() => sc.setKioskStep(SELF_CHECKOUT_STEPS.PAYMENT)}>Continue</KioskTouchButton>
              </div>
              <button type="button" className="btn-secondary" style={{ marginTop: 12 }} onClick={() => sc.setKioskStep(SELF_CHECKOUT_STEPS.SCAN)}>
                Back to scan
              </button>
            </>
          ) : null}

          {sc.kiosk.step === SELF_CHECKOUT_STEPS.PAYMENT ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Payment</div>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>{sc.config?.paymentPrompt}</p>
              <KioskMoneyRow label="Subtotal" value={sc.kioskTotals.subtotal} />
              {sc.kioskTotals.loyaltyRedemption > 0 ? (
                <KioskMoneyRow label="Loyalty" value={-sc.kioskTotals.loyaltyRedemption} />
              ) : null}
              <KioskMoneyRow label="Tax" value={sc.kioskTotals.tax} />
              <KioskMoneyRow label="Total due" value={sc.kioskTotals.total} strong />
              <div style={{ display: "flex", gap: 10, margin: "16px 0" }}>
                {["Debit", "Credit Card"].map((method) => (
                  <KioskTouchButton
                    key={method}
                    variant={sc.kiosk.payMethod === method ? "primary" : "secondary"}
                    onClick={() => sc.setKioskPatch({ payMethod: method })}
                    style={{ flex: 1 }}
                  >
                    {method}
                  </KioskTouchButton>
                ))}
              </div>
              {sc.cardPaymentStatus?.message || sc.cardPaymentStatus?.state ? (
                <p style={{ fontSize: 12, color: "#1d4ed8", marginBottom: 12 }}>
                  {sc.cardPaymentStatus.message || sc.cardPaymentStatus.state}
                </p>
              ) : null}
              <KioskTouchButton disabled={sc.busy} onClick={() => sc.setKioskStep(SELF_CHECKOUT_STEPS.RECEIPT)}>
                Continue to receipt
              </KioskTouchButton>
              <button type="button" className="btn-secondary" style={{ marginTop: 12 }} onClick={() => sc.setKioskStep(SELF_CHECKOUT_STEPS.LOYALTY)}>
                Back
              </button>
            </>
          ) : null}

          {sc.kiosk.step === SELF_CHECKOUT_STEPS.RECEIPT ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Receipt</div>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>How would you like your receipt?</p>
              <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                {(sc.config?.offeredReceiptOptions || []).map((id) => {
                  const label =
                    id === "print"
                      ? "Print"
                      : id === "email"
                        ? "Email"
                        : id === "sms"
                          ? "Text message"
                          : "No receipt";
                  return (
                    <KioskTouchButton
                      key={id}
                      variant={sc.kiosk.receiptDelivery === id ? "primary" : "secondary"}
                      onClick={() => sc.setKioskPatch({ receiptDelivery: id })}
                    >
                      {label}
                    </KioskTouchButton>
                  );
                })}
              </div>
              {sc.kiosk.receiptDelivery === "email" || sc.kiosk.receiptDelivery === "sms" ? (
                <input
                  className="crx-input"
                  placeholder={sc.kiosk.receiptDelivery === "email" ? "Email address" : "Mobile number"}
                  value={sc.kiosk.receiptContact || ""}
                  onChange={(e) => sc.setKioskPatch({ receiptContact: e.target.value })}
                  style={{ marginBottom: 16 }}
                />
              ) : null}
              <KioskTouchButton disabled={sc.busy} onClick={() => void sc.completeKioskSale()}>
                Pay ${sc.kioskTotals.total.toFixed(2)} & finish
              </KioskTouchButton>
              <button type="button" className="btn-secondary" style={{ marginTop: 12 }} onClick={() => sc.setKioskStep(SELF_CHECKOUT_STEPS.PAYMENT)}>
                Back
              </button>
            </>
          ) : null}

          {sc.kiosk.step === SELF_CHECKOUT_STEPS.DONE ? (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#166534", marginBottom: 8 }}>Thank you!</div>
              <p style={{ fontSize: 14, color: "#374151" }}>
                Invoice {sc.kiosk.invoiceNumber || "—"} · ${Number(sc.kiosk.total || 0).toFixed(2)}
              </p>
              <KioskTouchButton style={{ marginTop: 20 }} onClick={() => sc.endKiosk()}>
                Done — start next customer
              </KioskTouchButton>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
