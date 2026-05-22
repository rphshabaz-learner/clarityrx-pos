import React from "react";
import {
  CUSTOMER_STATUS,
  CUSTOMER_TYPE_OPTIONS,
  customerDisplayName,
} from "../../../lib/customers/customerTypes";
import {
  CustomerListSidebar,
  CustomerStatusBadge,
  CustomerTypeLabel,
  EmptyState,
  FieldLabel,
  SectionIntro,
} from "./CustomersShared";

export default function CustomersProfilesSection({
  customers,
  filteredCustomers,
  selectedCustomer,
  selectedCustomerId,
  setSelectedCustomerId,
  listQuery,
  setListQuery,
  busy,
  onCreateCustomer,
  onSaveCustomer,
  onRemoveCustomer,
  onAttachToTill,
}) {
  const update = (patch) => {
    if (!selectedCustomer) return;
    onSaveCustomer({ ...selectedCustomer, ...patch });
  };

  const updateProfile = (patch) => {
    if (!selectedCustomer) return;
    onSaveCustomer({ ...selectedCustomer, profile: { ...selectedCustomer.profile, ...patch } });
  };

  return (
    <div>
      <SectionIntro
        title="Customer profiles"
        description="Search and maintain individual shoppers, loyalty members, store charge accounts, and facility billing contacts."
      />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) minmax(0, 2fr)", gap: 16 }}>
        <CustomerListSidebar
          customers={filteredCustomers}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          listQuery={listQuery}
          setListQuery={setListQuery}
          onCreate={() => onCreateCustomer()}
          busy={busy}
        />

        <div className="crx-card" style={{ padding: 16 }}>
          {!selectedCustomer ? (
            <EmptyState message="Select a customer or create a new profile." />
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
                    {customerDisplayName(selectedCustomer)}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                    {selectedCustomer.accountNumber} · <CustomerTypeLabel type={selectedCustomer.type} />
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <CustomerStatusBadge status={selectedCustomer.status} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="btn-primary" disabled={busy} onClick={() => onAttachToTill?.(selectedCustomer)}>
                    Attach to till
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm("Remove this customer profile?")) onRemoveCustomer(selectedCustomer.id);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
                <div>
                  <FieldLabel>Account #</FieldLabel>
                  <input
                    className="crx-input"
                    value={selectedCustomer.accountNumber || ""}
                    onChange={(e) => update({ accountNumber: e.target.value })}
                    style={{ marginTop: 6, width: "100%" }}
                  />
                </div>
                <div>
                  <FieldLabel>Account type</FieldLabel>
                  <select
                    className="crx-select"
                    value={selectedCustomer.type}
                    onChange={(e) => update({ type: e.target.value })}
                    style={{ marginTop: 6, width: "100%" }}
                  >
                    {CUSTOMER_TYPE_OPTIONS.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <select
                    className="crx-select"
                    value={selectedCustomer.status}
                    onChange={(e) => update({ status: e.target.value })}
                    style={{ marginTop: 6, width: "100%" }}
                  >
                    <option value={CUSTOMER_STATUS.ACTIVE}>Active</option>
                    <option value={CUSTOMER_STATUS.HOLD}>On hold</option>
                    <option value={CUSTOMER_STATUS.INACTIVE}>Inactive</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Display name</FieldLabel>
                  <input
                    className="crx-input"
                    value={selectedCustomer.profile?.displayName || ""}
                    onChange={(e) => updateProfile({ displayName: e.target.value })}
                    style={{ marginTop: 6, width: "100%" }}
                  />
                </div>
                <div>
                  <FieldLabel>First name</FieldLabel>
                  <input
                    className="crx-input"
                    value={selectedCustomer.profile?.firstName || ""}
                    onChange={(e) => updateProfile({ firstName: e.target.value })}
                    style={{ marginTop: 6, width: "100%" }}
                  />
                </div>
                <div>
                  <FieldLabel>Last name</FieldLabel>
                  <input
                    className="crx-input"
                    value={selectedCustomer.profile?.lastName || ""}
                    onChange={(e) => updateProfile({ lastName: e.target.value })}
                    style={{ marginTop: 6, width: "100%" }}
                  />
                </div>
                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <input
                    className="crx-input"
                    value={selectedCustomer.profile?.phone || ""}
                    onChange={(e) => updateProfile({ phone: e.target.value })}
                    style={{ marginTop: 6, width: "100%" }}
                  />
                </div>
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <input
                    className="crx-input"
                    value={selectedCustomer.profile?.email || ""}
                    onChange={(e) => updateProfile({ email: e.target.value })}
                    style={{ marginTop: 6, width: "100%" }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <FieldLabel>Address</FieldLabel>
                  <input
                    className="crx-input"
                    value={selectedCustomer.profile?.address || ""}
                    onChange={(e) => updateProfile({ address: e.target.value })}
                    style={{ marginTop: 6, width: "100%" }}
                  />
                </div>
                <div>
                  <FieldLabel>Date of birth</FieldLabel>
                  <input
                    className="crx-input"
                    type="date"
                    value={selectedCustomer.profile?.dateOfBirth || ""}
                    onChange={(e) => updateProfile({ dateOfBirth: e.target.value })}
                    style={{ marginTop: 6, width: "100%" }}
                  />
                </div>
              </div>

              <button type="button" className="btn-primary" disabled={busy} onClick={() => onSaveCustomer(selectedCustomer)}>
                Save profile
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
