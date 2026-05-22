import React from "react";
import { CustomerListSidebar, EmptyState, FieldLabel, SectionIntro } from "./CustomersShared";

export default function CustomersAccountsSection({
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
  const updateNested = (key, patch) => {
    if (!selectedCustomer) return;
    onSaveCustomer({ ...selectedCustomer, [key]: { ...selectedCustomer[key], ...patch } });
  };

  return (
    <div>
      <SectionIntro
        title="Loyalty & billing accounts"
        description="Loyalty balances, store charge limits, and LTC billing account numbers for facility invoicing."
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
            <EmptyState message="Select a customer to edit accounts." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div className="crx-card-title" style={{ marginBottom: 12, fontSize: 14 }}>
                  Loyalty account
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  <div>
                    <FieldLabel>Member ID</FieldLabel>
                    <input
                      className="crx-input"
                      value={selectedCustomer.loyalty?.memberId || ""}
                      onChange={(e) => updateNested("loyalty", { memberId: e.target.value })}
                      style={{ marginTop: 6, width: "100%" }}
                    />
                  </div>
                  <div>
                    <FieldLabel>Points balance</FieldLabel>
                    <input
                      className="crx-input"
                      type="number"
                      min="0"
                      value={selectedCustomer.loyalty?.pointsBalance ?? 0}
                      onChange={(e) =>
                        updateNested("loyalty", { pointsBalance: Math.max(0, Number(e.target.value) || 0) })
                      }
                      style={{ marginTop: 6, width: "100%" }}
                    />
                  </div>
                  <div>
                    <FieldLabel>Tier</FieldLabel>
                    <select
                      className="crx-select"
                      value={selectedCustomer.loyalty?.tier || "standard"}
                      onChange={(e) => updateNested("loyalty", { tier: e.target.value })}
                      style={{ marginTop: 6, width: "100%" }}
                    >
                      <option value="standard">Standard</option>
                      <option value="silver">Silver</option>
                      <option value="gold">Gold</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className="crx-card-title" style={{ marginBottom: 12, fontSize: 14 }}>
                  Store charge account
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  <div>
                    <FieldLabel>Credit limit ($)</FieldLabel>
                    <input
                      className="crx-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={selectedCustomer.storeCharge?.creditLimit ?? 0}
                      onChange={(e) =>
                        updateNested("storeCharge", { creditLimit: Math.max(0, Number(e.target.value) || 0) })
                      }
                      style={{ marginTop: 6, width: "100%" }}
                    />
                  </div>
                  <div>
                    <FieldLabel>Current balance ($)</FieldLabel>
                    <input
                      className="crx-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={selectedCustomer.storeCharge?.balance ?? 0}
                      onChange={(e) =>
                        updateNested("storeCharge", { balance: Math.max(0, Number(e.target.value) || 0) })
                      }
                      style={{ marginTop: 6, width: "100%" }}
                    />
                  </div>
                  <div>
                    <FieldLabel>Payment terms</FieldLabel>
                    <select
                      className="crx-select"
                      value={selectedCustomer.storeCharge?.paymentTerms || "net-30"}
                      onChange={(e) => updateNested("storeCharge", { paymentTerms: e.target.value })}
                      style={{ marginTop: 6, width: "100%" }}
                    >
                      <option value="net-15">Net 15</option>
                      <option value="net-30">Net 30</option>
                      <option value="cod">COD</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <FieldLabel>Authorized users (comma-separated)</FieldLabel>
                    <input
                      className="crx-input"
                      value={(selectedCustomer.storeCharge?.authorizedUsers || []).join(", ")}
                      onChange={(e) =>
                        updateNested("storeCharge", {
                          authorizedUsers: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      style={{ marginTop: 6, width: "100%" }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="crx-card-title" style={{ marginBottom: 12, fontSize: 14 }}>
                  LTC billing account
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  <div>
                    <FieldLabel>Facility ID</FieldLabel>
                    <input
                      className="crx-input"
                      value={selectedCustomer.ltc?.facilityId || ""}
                      onChange={(e) => updateNested("ltc", { facilityId: e.target.value })}
                      style={{ marginTop: 6, width: "100%" }}
                    />
                  </div>
                  <div>
                    <FieldLabel>Billing account #</FieldLabel>
                    <input
                      className="crx-input"
                      value={selectedCustomer.ltc?.billingAccount || ""}
                      onChange={(e) => updateNested("ltc", { billingAccount: e.target.value })}
                      style={{ marginTop: 6, width: "100%" }}
                    />
                  </div>
                  <div>
                    <FieldLabel>Invoice cycle</FieldLabel>
                    <select
                      className="crx-select"
                      value={selectedCustomer.ltc?.invoiceCycle || "monthly"}
                      onChange={(e) => updateNested("ltc", { invoiceCycle: e.target.value })}
                      style={{ marginTop: 6, width: "100%" }}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Biweekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              </div>

              <button type="button" className="btn-primary" disabled={busy} onClick={() => onSaveCustomer(selectedCustomer)}>
                Save accounts
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
