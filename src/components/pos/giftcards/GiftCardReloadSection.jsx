import React, { useState } from "react";
import { SALES_PAYMENT_METHODS } from "../../../lib/posSalesRegister";
import { BalanceBanner, FieldLabel, ManagerOverrideNotice, SectionIntro } from "./GiftCardShared";

const RELOAD_PRESETS = [10, 25, 50];

export default function GiftCardReloadSection({ gc }) {
  const [cardNumber, setCardNumber] = useState(gc.lookupNumber || "");
  const [amount, setAmount] = useState("25");
  const [tenderMethod, setTenderMethod] = useState("Cash");
  const [note, setNote] = useState("");

  const lookup = gc.lookupBalance(cardNumber);

  const handleReload = async () => {
    const card = await gc.reloadCardByNumber({
      cardNumber,
      amount: Number(amount),
      tenderMethod,
      note: note.trim(),
    });
    if (card) {
      gc.setLookupNumber(card.cardNumber);
      setCardNumber(card.cardNumber);
    }
  };

  return (
    <div>
      <SectionIntro
        title="Reload"
        description="Add funds to an activated gift card. Scan or enter the card number, confirm balance, then apply the reload amount."
      />
      <div className="crx-card" style={{ padding: 16, maxWidth: 520 }}>
        <ManagerOverrideNotice gate={gc.reloadGate} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <FieldLabel>Card number</FieldLabel>
            <input
              className="crx-input"
              placeholder="GC-1000-0001"
              value={cardNumber}
              onChange={(e) => {
                setCardNumber(e.target.value);
                gc.setLookupNumber(e.target.value);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleReload()}
              style={{ marginTop: 6, width: "100%" }}
            />
          </div>
          {cardNumber.trim() ? <BalanceBanner lookup={lookup} /> : null}
          <div>
            <FieldLabel>Reload amount ($)</FieldLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {RELOAD_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="btn-secondary"
                  onClick={() => setAmount(String(preset))}
                >
                  +${preset}
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
            disabled={gc.busy || !gc.reloadGate?.allowed || !lookup.found || lookup.status === "inactive"}
            onClick={handleReload}
          >
            Reload card
          </button>
        </div>
      </div>
    </div>
  );
}
