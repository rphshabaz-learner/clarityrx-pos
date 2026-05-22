import React from "react";
import { BalanceBanner, FieldLabel, SectionIntro } from "./GiftCardShared";

export default function GiftCardBalanceSection({ gc }) {
  const lookup = gc.balanceLookup;

  return (
    <div>
      <SectionIntro
        title="Balance check"
        description="Scan or type a gift card number to view the current balance and status without changing the card."
      />
      <div className="crx-card" style={{ padding: 16, maxWidth: 480 }}>
        <FieldLabel>Card number</FieldLabel>
        <input
          className="crx-input"
          placeholder="GC-1000-0001"
          value={gc.lookupNumber}
          onChange={(e) => gc.setLookupNumber(e.target.value)}
          autoFocus
          style={{ marginTop: 8, width: "100%", fontSize: 16 }}
        />
        <div style={{ marginTop: 16 }}>
          {gc.lookupNumber.trim() ? (
            <BalanceBanner lookup={lookup} large />
          ) : (
            <p style={{ fontSize: 13, color: "#9ca3af" }}>Enter a card number to check balance.</p>
          )}
        </div>
        {lookup.found && lookup.card?.transactions?.length ? (
          <div style={{ marginTop: 20 }}>
            <div className="crx-card-title" style={{ fontSize: 13, marginBottom: 8 }}>
              Recent activity
            </div>
            <div style={{ fontSize: 12, color: "#475569" }}>
              {lookup.card.transactions.slice(0, 5).map((txn) => (
                <div
                  key={txn.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span>
                    {txn.type} {txn.amount >= 0 ? "+" : ""}${Number(txn.amount).toFixed(2)}
                  </span>
                  <span style={{ color: "#94a3b8" }}>${Number(txn.balanceAfter).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <p style={{ fontSize: 12, color: "#6b7280", marginTop: 12 }}>
        Demo cards: <strong>GC-1000-0001</strong> ($25 active), <strong>GC-1000-0002</strong> (inactive),{" "}
        <strong>GC-1000-0003</strong> ($50 active).
      </p>
    </div>
  );
}
