import React from "react";
import { giftCardDisplayBalance } from "../../../lib/giftCards/giftCardTypes";
import { SectionIntro } from "./GiftCardShared";

export default function GiftCardRegistrySection({ gc }) {
  return (
    <div>
      <SectionIntro title="Card registry" description="All gift cards stored on this till workstation." />
      <div className="crx-card" style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left" }}>
              <th style={{ padding: 10 }}>Card</th>
              <th style={{ padding: 10 }}>Status</th>
              <th style={{ padding: 10 }}>Balance</th>
              <th style={{ padding: 10 }}>Purchaser</th>
              <th style={{ padding: 10 }}>Last activity</th>
            </tr>
          </thead>
          <tbody>
            {gc.cards.map((row) => (
              <tr
                key={row.id}
                style={{ borderTop: "1px solid #f1f5f9", cursor: "pointer" }}
                onClick={() => gc.setLookupNumber(row.cardNumber)}
              >
                <td style={{ padding: 10, fontWeight: 700 }}>{row.cardNumber}</td>
                <td style={{ padding: 10 }}>{row.status}</td>
                <td style={{ padding: 10 }}>${giftCardDisplayBalance(row).toFixed(2)}</td>
                <td style={{ padding: 10 }}>{row.purchaserName || "—"}</td>
                <td style={{ padding: 10, color: "#64748b" }}>
                  {row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!gc.cards.length ? (
          <div style={{ padding: 24, textAlign: "center", color: "#9ca3af" }}>No gift cards yet.</div>
        ) : null}
      </div>
    </div>
  );
}
