import React from "react";
import { generateCustomerLineId } from "../../../lib/customers/customerTypes";
import { CustomerListSidebar, EmptyState, FieldLabel, formatCustomerDate, SectionIntro } from "./CustomersShared";

const PICKUP_STATUS_OPTIONS = [
  { id: "in_prep", label: "In prep" },
  { id: "ready", label: "Ready" },
  { id: "picked_up", label: "Picked up" },
];

export default function CustomersPharmacySection({
  filteredCustomers,
  selectedCustomer,
  selectedCustomerId,
  setSelectedCustomerId,
  listQuery,
  setListQuery,
  busy,
  onCreateCustomer,
  onSaveCustomer,
  onAttachPickup,
}) {
  const updateRx = (patch) => {
    if (!selectedCustomer) return;
    onSaveCustomer({
      ...selectedCustomer,
      rxProfile: { ...selectedCustomer.rxProfile, ...patch },
    });
  };

  const linkRxNow = () => {
    if (!selectedCustomer) return;
    updateRx({ linkedAt: new Date().toISOString() });
  };

  const addPickup = () => {
    if (!selectedCustomer) return;
    onSaveCustomer({
      ...selectedCustomer,
      pickups: [
        {
          id: generateCustomerLineId(),
          bagBarcode: "",
          rxNumbers: [],
          status: "in_prep",
          copay: 0,
          updatedAt: new Date().toISOString(),
        },
        ...(selectedCustomer.pickups || []),
      ],
    });
  };

  const updatePickup = (id, patch) => {
    if (!selectedCustomer) return;
    const pickups = (selectedCustomer.pickups || []).map((row) =>
      row.id === id ? { ...row, ...patch, updatedAt: new Date().toISOString() } : row
    );
    onSaveCustomer({ ...selectedCustomer, pickups });
  };

  const updateFacility = (patch) => {
    if (!selectedCustomer) return;
    onSaveCustomer({
      ...selectedCustomer,
      facility: { ...selectedCustomer.facility, ...patch },
    });
  };

  return (
    <div>
      <SectionIntro
        title="Rx profile, pickups & care homes"
        description="Link the POS customer to a Kroll patient ID, track Rx bag pickup status, and manage group-home / LTC facility details."
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
            <EmptyState message="Select a customer for pharmacy links." />
          ) : (
            <>
              <div style={{ marginBottom: 20, padding: 14, background: "#eff6ff", borderRadius: 10, border: "1px solid #bfdbfe" }}>
                <div className="crx-card-title" style={{ marginBottom: 10, fontSize: 14 }}>
                  Kroll / Rx profile
                </div>
                <FieldLabel>Kroll patient ID</FieldLabel>
                <input
                  className="crx-input"
                  value={selectedCustomer.rxProfile?.krollPatientId || ""}
                  onChange={(e) => updateRx({ krollPatientId: e.target.value })}
                  placeholder="K-123456"
                  style={{ marginTop: 6, width: "100%", maxWidth: 280 }}
                />
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>
                  Linked:{" "}
                  {selectedCustomer.rxProfile?.linkedAt
                    ? formatCustomerDate(selectedCustomer.rxProfile.linkedAt)
                    : "Not linked"}
                </div>
                <button type="button" className="btn-secondary" style={{ marginTop: 10, fontSize: 12 }} disabled={busy} onClick={linkRxNow}>
                  Mark linked now
                </button>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div className="crx-card-title" style={{ fontSize: 14 }}>
                    Pickup tracking
                  </div>
                  <button type="button" className="btn-secondary" style={{ fontSize: 12 }} disabled={busy} onClick={addPickup}>
                    + Pickup
                  </button>
                </div>
                {(selectedCustomer.pickups || []).length === 0 ? (
                  <EmptyState message="No Rx pickups on file." />
                ) : (
                  (selectedCustomer.pickups || []).map((pickup) => (
                    <div
                      key={pickup.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                        <div>
                          <FieldLabel>Bag barcode</FieldLabel>
                          <input
                            className="crx-input"
                            value={pickup.bagBarcode || ""}
                            onChange={(e) => updatePickup(pickup.id, { bagBarcode: e.target.value })}
                            style={{ marginTop: 4, width: "100%" }}
                          />
                        </div>
                        <div>
                          <FieldLabel>Status</FieldLabel>
                          <select
                            className="crx-select"
                            value={pickup.status}
                            onChange={(e) => updatePickup(pickup.id, { status: e.target.value })}
                            style={{ marginTop: 4, width: "100%" }}
                          >
                            {PICKUP_STATUS_OPTIONS.map((row) => (
                              <option key={row.id} value={row.id}>
                                {row.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <FieldLabel>Rx numbers (comma-separated)</FieldLabel>
                          <input
                            className="crx-input"
                            value={(pickup.rxNumbers || []).join(", ")}
                            onChange={(e) =>
                              updatePickup(pickup.id, {
                                rxNumbers: e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                            style={{ marginTop: 4, width: "100%" }}
                          />
                        </div>
                        <div>
                          <FieldLabel>Copay ($)</FieldLabel>
                          <input
                            className="crx-input"
                            type="number"
                            step="0.01"
                            value={pickup.copay ?? 0}
                            onChange={(e) => updatePickup(pickup.id, { copay: Number(e.target.value) || 0 })}
                            style={{ marginTop: 4, width: "100%" }}
                          />
                        </div>
                      </div>
                      {pickup.status === "ready" && pickup.bagBarcode ? (
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ marginTop: 10, fontSize: 12 }}
                          disabled={busy}
                          onClick={() =>
                            onAttachPickup?.({
                              barcode: pickup.bagBarcode,
                              rxCount: (pickup.rxNumbers || []).length || 1,
                              totalCopay: pickup.copay,
                              rxNumbers: pickup.rxNumbers,
                              customerId: selectedCustomer.id,
                            })
                          }
                        >
                          Attach pickup to till
                        </button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              <div style={{ padding: 14, background: "#f9fafb", borderRadius: 10 }}>
                <div className="crx-card-title" style={{ marginBottom: 10, fontSize: 14 }}>
                  Care home / group home
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <FieldLabel>Facility name</FieldLabel>
                    <input
                      className="crx-input"
                      value={selectedCustomer.facility?.name || ""}
                      onChange={(e) => updateFacility({ name: e.target.value })}
                      style={{ marginTop: 6, width: "100%" }}
                    />
                  </div>
                  <div>
                    <FieldLabel>Beds</FieldLabel>
                    <input
                      className="crx-input"
                      type="number"
                      min="0"
                      value={selectedCustomer.facility?.beds ?? 0}
                      onChange={(e) => updateFacility({ beds: Math.max(0, Number(e.target.value) || 0) })}
                      style={{ marginTop: 6, width: "100%" }}
                    />
                  </div>
                  <div>
                    <FieldLabel>Contact</FieldLabel>
                    <input
                      className="crx-input"
                      value={selectedCustomer.facility?.contactName || ""}
                      onChange={(e) => updateFacility({ contactName: e.target.value })}
                      style={{ marginTop: 6, width: "100%" }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <FieldLabel>Billing contact</FieldLabel>
                    <input
                      className="crx-input"
                      value={selectedCustomer.facility?.billingContact || ""}
                      onChange={(e) => updateFacility({ billingContact: e.target.value })}
                      style={{ marginTop: 6, width: "100%" }}
                    />
                  </div>
                </div>
              </div>

              <button type="button" className="btn-primary" disabled={busy} style={{ marginTop: 16 }} onClick={() => onSaveCustomer(selectedCustomer)}>
                Save pharmacy links
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
