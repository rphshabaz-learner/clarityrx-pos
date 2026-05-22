import React from "react";
import { formatRxMoney } from "../../../lib/rx/rxIntegrationTypes";
import { EmptyState, SectionIntro } from "./RxShared";

export default function RxAccountChargeSection({ rx, onAttachCustomer, onOpenCustomers }) {
  return (
    <div>
      <SectionIntro
        title="Patient account charging"
        description="Customers with Kroll links or store charge balances. Attach to the till for account billing, or open the customer profile."
      />
      <div style={{ marginBottom: 12 }}>
        <button type="button" className="btn-secondary" onClick={onOpenCustomers}>
          Open customers
        </button>
      </div>
      <div className="crx-card" style={{ padding: 12, maxHeight: 480, overflow: "auto" }}>
        {rx.accountCustomers.length === 0 ? (
          <EmptyState message="No linked patient accounts." />
        ) : (
          rx.accountCustomers.map((row) => (
            <div
              key={row.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{row.label}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                  {row.accountNumber}
                  {row.krollPatientId ? ` · Kroll ${row.krollPatientId}` : ""}
                </div>
                <div style={{ fontSize: 11, color: "#374151", marginTop: 4 }}>
                  Balance {formatRxMoney(row.balance)} / limit {formatRxMoney(row.creditLimit)}
                  {row.readyPickups ? ` · ${row.readyPickups} ready pickup(s)` : ""}
                </div>
              </div>
              <button type="button" className="btn-primary" style={{ fontSize: 12 }} onClick={() => onAttachCustomer?.(row.id)}>
                Attach to till
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
