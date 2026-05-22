import React from "react";
import { generateCustomerLineId } from "../../../lib/customers/customerTypes";
import { CustomerListSidebar, EmptyState, formatCustomerDate, SectionIntro } from "./CustomersShared";

export default function CustomersHistorySection({
  mode = "all",
  filteredCustomers,
  selectedCustomer,
  selectedCustomerId,
  setSelectedCustomerId,
  listQuery,
  setListQuery,
  busy,
  onCreateCustomer,
  onSaveCustomer,
}) {
  const showPoints = mode === "all" || mode === "points";
  const showPurchases = mode === "all" || mode === "purchases";
  const addPointsEntry = () => {
    if (!selectedCustomer) return;
    const balance = Number(selectedCustomer.loyalty?.pointsBalance) || 0;
    const entry = {
      id: generateCustomerLineId(),
      at: new Date().toISOString(),
      delta: 0,
      reason: "Adjustment",
      balanceAfter: balance,
    };
    onSaveCustomer({
      ...selectedCustomer,
      pointsHistory: [entry, ...(selectedCustomer.pointsHistory || [])],
    });
  };

  const addPurchaseEntry = () => {
    if (!selectedCustomer) return;
    const entry = {
      id: generateCustomerLineId(),
      at: new Date().toISOString(),
      invoiceNumber: "",
      total: 0,
      items: [],
    };
    onSaveCustomer({
      ...selectedCustomer,
      purchaseHistory: [entry, ...(selectedCustomer.purchaseHistory || [])],
    });
  };

  return (
    <div>
      <SectionIntro
        title={showPoints && !showPurchases ? "Points history" : showPurchases && !showPoints ? "Purchase history" : "Points & purchase history"}
        description={
          showPoints && !showPurchases
            ? "Loyalty earn, redemption, and adjustment events for this account."
            : showPurchases && !showPoints
              ? "Front-store and OTC purchase history linked to the customer."
              : "Review loyalty earn/redemption events and front-store purchase history linked to the customer account."
        }
      />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) minmax(0, 2fr)", gap: 16 }}>
        <CustomerListSidebar
          customers={filteredCustomers}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          listQuery={listQuery}
          setListQuery={setListQuery}
          onCreate={onCreateCustomer}
          busy={busy}
        />
        <div className="crx-card" style={{ padding: 16 }}>
          {!selectedCustomer ? (
            <EmptyState message="Select a customer to view history." />
          ) : (
            <>
              {showPoints ? (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div className="crx-card-title" style={{ fontSize: 14 }}>
                    Points history
                  </div>
                  <button type="button" className="btn-secondary" style={{ fontSize: 12 }} disabled={busy} onClick={addPointsEntry}>
                    + Entry
                  </button>
                </div>
                {(selectedCustomer.pointsHistory || []).length === 0 ? (
                  <EmptyState message="No points activity yet." />
                ) : (
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: "#6b7280" }}>
                        <th style={{ padding: "6px 8px" }}>Date</th>
                        <th style={{ padding: "6px 8px" }}>Δ</th>
                        <th style={{ padding: "6px 8px" }}>Reason</th>
                        <th style={{ padding: "6px 8px" }}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedCustomer.pointsHistory || []).map((row) => (
                        <tr key={row.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "8px" }}>{formatCustomerDate(row.at)}</td>
                          <td style={{ padding: "8px", fontWeight: 700, color: row.delta >= 0 ? "#15803d" : "#b91c1c" }}>
                            {row.delta >= 0 ? "+" : ""}
                            {row.delta}
                          </td>
                          <td style={{ padding: "8px" }}>{row.reason}</td>
                          <td style={{ padding: "8px" }}>{row.balanceAfter}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              ) : null}

              {showPurchases ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div className="crx-card-title" style={{ fontSize: 14 }}>
                    Purchase history
                  </div>
                  <button type="button" className="btn-secondary" style={{ fontSize: 12 }} disabled={busy} onClick={addPurchaseEntry}>
                    + Purchase
                  </button>
                </div>
                {(selectedCustomer.purchaseHistory || []).length === 0 ? (
                  <EmptyState message="No purchases on file." />
                ) : (
                  (selectedCustomer.purchaseHistory || []).map((row) => (
                    <div
                      key={row.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13 }}>
                        {row.invoiceNumber || "Invoice"} — ${Number(row.total || 0).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                        {formatCustomerDate(row.at)} · {(row.items || []).join(", ") || "—"}
                      </div>
                    </div>
                  ))
                )}
              </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
