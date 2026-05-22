import React from "react";
import { RX_PAYMENT_STATUS, formatRxMoney } from "../../../lib/rx/rxIntegrationTypes";
import { EmptyState, SectionIntro, StatusBadge } from "./RxShared";

function paymentTone(status) {
  if (status === RX_PAYMENT_STATUS.POSTED) return "ok";
  if (status === RX_PAYMENT_STATUS.FAILED) return "error";
  return "warn";
}

export default function RxPaymentPostSection({ rx, busy, onPostRow, onPostAll }) {
  return (
    <div>
      <SectionIntro
        title="Rx payment posting"
        description="After a combined sale, copay and pickup payments queue here for Kroll write-back. Post individually or flush all pending rows."
      />
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button type="button" className="btn-primary" disabled={busy || !rx.pendingPayments.length} onClick={onPostAll}>
          Post all pending ({rx.pendingPayments.length})
        </button>
      </div>
      <div className="crx-card" style={{ padding: 12, maxHeight: 520, overflow: "auto" }}>
        {rx.paymentQueue.length === 0 ? (
          <EmptyState message="No Rx payments queued. Charge a sale with an Rx bag or copay to create a row." />
        ) : (
          rx.paymentQueue.map((row) => (
            <div
              key={row.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {row.invoiceNumber || row.id} · {formatRxMoney(row.rxCopay)}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                    Till {row.tillNumber} · {row.payMethod}
                    {row.krollPatientId ? ` · Kroll ${row.krollPatientId}` : ""}
                  </div>
                  {row.errorMessage ? (
                    <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 4 }}>{row.errorMessage}</div>
                  ) : null}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <StatusBadge tone={paymentTone(row.status)}>{row.status}</StatusBadge>
                  {row.status === RX_PAYMENT_STATUS.PENDING ? (
                    <button type="button" className="btn-secondary" style={{ fontSize: 12 }} disabled={busy} onClick={() => onPostRow(row)}>
                      Post to Kroll
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
