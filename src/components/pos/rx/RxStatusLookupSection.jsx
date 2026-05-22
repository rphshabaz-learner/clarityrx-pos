import React from "react";
import { RxStatusTable, SectionIntro } from "./RxShared";

export default function RxStatusLookupSection({ rx, busy, onLookup }) {
  return (
    <div>
      <SectionIntro
        title="Prescription status lookup"
        description="Search by Rx number, bag barcode, or Kroll patient ID. Uses transmit when online, with local workflow cache as fallback."
      />
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <input
          className="crx-input"
          placeholder="RX-884201, BAG-…, K-442901"
          value={rx.statusQuery}
          onChange={(e) => rx.setStatusQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void onLookup(rx.statusQuery);
          }}
          style={{ minWidth: 280, flex: 1 }}
        />
        <button type="button" className="btn-primary" disabled={busy} onClick={() => onLookup(rx.statusQuery)}>
          Look up
        </button>
      </div>
      {rx.statusSource ? (
        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 10 }}>{rx.statusSource}</div>
      ) : null}
      <RxStatusTable rows={rx.statusResults} />
    </div>
  );
}
