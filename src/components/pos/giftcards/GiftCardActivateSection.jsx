import React, { useState } from "react";
import { SALES_PAYMENT_METHODS } from "../../../lib/posSalesRegister";
import { BalanceBanner, FieldLabel, ManagerOverrideNotice, SectionIntro } from "./GiftCardShared";

const ACTIVATION_PRESETS = [10, 25, 50, 100];

export default function GiftCardActivateSection({ gc }) {
  const [amount, setAmount] = useState("25");
  const [cardNumber, setCardNumber] = useState("");
  const [purchaserName, setPurchaserName] = useState("");
  const [tenderMethod, setTenderMethod] = useState("Cash");
  const [note, setNote] = useState("");
  const [previewLookup, setPreviewLookup] = useState(null);

  const handlePreview = () => {
    if (!cardNumber.trim()) {
      setPreviewLookup(null);
      return;
    }
    setPreviewLookup(gc.lookupBalance(cardNumber));
  };

  const handleActivate = async () => {
    const card = await gc.activateNewCard({
      amount: Number(amount),
      cardNumber: cardNumber.trim() || undefined,
      purchaserName: purchaserName.trim(),
      tenderMethod,
      note: note.trim(),
    });
    if (card) {
      setCardNumber("");
      setNote("");
      setPreviewLookup(gc.lookupBalance(card.cardNumber));
      gc.setLookupNumber(card.cardNumber);
    }
  };

  return (
    <div>
      <SectionIntro
        title="Activation"
        description="Issue a new gift card and load the opening balance. Payment is recorded by tender type; use Sales for integrated checkout when needed."
      />
      <div className="crx-card" style={{ padding: 16, maxWidth: 520 }}>
        <ManagerOverrideNotice gate={gc.activateGate} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <FieldLabel>Opening balance ($)</FieldLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {ACTIVATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`btn-secondary${amount === String(preset) ? " active" : ""}`}
                  onClick={() => setAmount(String(preset))}
                >
                  ${preset}
                </button>
              ))}
            </div>
            <input
              className="crx-input"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ marginTop: 8, width: "100%" }}
            />
          </div>
          <div>
            <FieldLabel>Card number (optional — auto-issue if blank)</FieldLabel>
            <input
              className="crx-input"
              placeholder="GC-1000-0004 or scan barcode"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              onBlur={handlePreview}
              onKeyDown={(e) => e.key === "Enter" && handlePreview()}
              style={{ marginTop: 6, width: "100%" }}
            />
          </div>
          {previewLookup ? <BalanceBanner lookup={previewLookup} /> : null}
          <div>
            <FieldLabel>Purchaser name (optional)</FieldLabel>
            <input
              className="crx-input"
              value={purchaserName}
              onChange={(e) => setPurchaserName(e.target.value)}
              style={{ marginTop: 6, width: "100%" }}
            />
          </div>
          <div>
            <FieldLabel>Payment collected</FieldLabel>
            <select
              className="crx-select"
              value={tenderMethod}
              onChange={(e) => setTenderMethod(e.target.value)}
              style={{ marginTop: 6, width: "100%" }}
            >
              {SALES_PAYMENT_METHODS.filter((m) => m !== "Gift Card" && m !== "Insurance").map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Note</FieldLabel>
            <input
              className="crx-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ marginTop: 6, width: "100%" }}
            />
          </div>
          <button
            type="button"
            className="btn-primary"
            disabled={gc.busy || !gc.activateGate?.allowed}
            onClick={handleActivate}
          >
            Activate gift card
          </button>
        </div>
      </div>
    </div>
  );
}
