import React from "react";
import { formatRxMoney } from "../../../lib/rx/rxIntegrationTypes";
import { EmptyState, SectionIntro } from "./RxShared";

export default function RxReceiptsSection({ rx }) {
  return (
    <div>
      <SectionIntro
        title="Combined Rx + retail receipts"
        description="Recent charges that included Rx copay and/or front-store lines. Receipt layout separates RX ITEMS and FRONT STORE ITEMS per store template."
      />
      <div className="crx-card" style={{ overflow: "auto" }}>
        {rx.combinedReceipts.length === 0 ? (
          <EmptyState message="No combined receipts on file yet." />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                <th style={{ padding: 10 }}>Invoice</th>
                <th style={{ padding: 10 }}>Time</th>
                <th style={{ padding: 10 }}>OTC</th>
                <th style={{ padding: 10 }}>Rx copay</th>
                <th style={{ padding: 10 }}>Total</th>
                <th style={{ padding: 10 }}>Payment</th>
              </tr>
            </thead>
            <tbody>
              {rx.combinedReceipts.slice(0, 50).map((sale) => (
                <tr key={sale.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td style={{ padding: 10, fontWeight: 700 }}>{sale.invoiceNumber || sale.id}</td>
                  <td style={{ padding: 10 }}>
                    {sale.chargedAt ? new Date(sale.chargedAt).toLocaleString() : "—"}
                  </td>
                  <td style={{ padding: 10 }}>{formatRxMoney(sale.subtotal)}</td>
                  <td style={{ padding: 10 }}>{formatRxMoney(sale.rxCopay)}</td>
                  <td style={{ padding: 10 }}>{formatRxMoney(sale.total)}</td>
                  <td style={{ padding: 10 }}>{sale.payMethod || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
