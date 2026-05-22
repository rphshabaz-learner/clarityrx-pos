import React, { useState } from "react";
import { useCustomers } from "../../../hooks/useCustomers";
import { CUSTOMER_TYPE } from "../../../lib/customers/customerTypes";
import CustomersAccountsSection from "./CustomersAccountsSection";
import CustomersComplianceSection from "./CustomersComplianceSection";
import CustomersConsentSection from "./CustomersConsentSection";
import CustomersHistorySection from "./CustomersHistorySection";
import CustomersPharmacySection from "./CustomersPharmacySection";
import CustomersPricingSection from "./CustomersPricingSection";
import CustomersProfilesSection from "./CustomersProfilesSection";

const CUSTOMER_SECTIONS = [
  { id: "profiles", label: "Profiles" },
  { id: "consent", label: "Privacy & consent" },
  { id: "accounts", label: "Loyalty & billing" },
  { id: "points", label: "Points history" },
  { id: "purchases", label: "Purchases" },
  { id: "pricing", label: "Special pricing" },
  { id: "compliance", label: "Notes & tax" },
  { id: "pharmacy", label: "Rx & pickups" },
];

export default function PosCustomersPanel({
  onNotify,
  logActivity,
  accessLogContext,
  onAttachToTill,
  onAttachPickup,
  initialSection,
  initialCustomerId,
  onSectionChange,
}) {
  const [section, setSection] = useState(initialSection || "profiles");
  const {
    loading,
    busy,
    customers: customerRows,
    filteredCustomers,
    selectedCustomer,
    selectedCustomerId,
    setSelectedCustomerId,
    listQuery,
    setListQuery,
    saveCustomer,
    createCustomer,
    removeCustomer,
    stats,
  } = useCustomers({ onNotify, logActivity, accessLogContext });

  const setSectionAndNotify = (next) => {
    setSection(next);
    onSectionChange?.(next);
  };

  React.useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId, setSelectedCustomerId]);

  if (loading) {
    return (
      <div className="crx-card" style={{ padding: 32, textAlign: "center", color: "#6b7280" }}>
        Loading customers…
      </div>
    );
  }

  const sidebarProps = {
    filteredCustomers,
    selectedCustomer,
    selectedCustomerId,
    setSelectedCustomerId,
    listQuery,
    setListQuery,
    busy,
    onCreateCustomer: () => createCustomer(CUSTOMER_TYPE.INDIVIDUAL),
    onSaveCustomer: saveCustomer,
    onRemoveCustomer: removeCustomer,
    onAttachToTill,
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>Customer management</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
          Profiles · loyalty · store charge · LTC · Rx link · pickup tracking · care homes
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 12, fontWeight: 600, color: "#374151", flexWrap: "wrap" }}>
          <span>Accounts: {customerRows.length}</span>
          <span>Loyalty: {stats.loyalty}</span>
          <span>Store charge: {stats.storeCharge}</span>
          <span>Facilities: {stats.facilities}</span>
          <span>Rx linked: {stats.rxLinked}</span>
          <span>Ready pickups: {stats.readyPickups}</span>
        </div>
      </div>

      <div className="crx-tabs" style={{ marginBottom: 16 }}>
        {CUSTOMER_SECTIONS.map((row) => (
          <button
            key={row.id}
            type="button"
            className={`crx-tab${section === row.id ? " active" : ""}`}
            onClick={() => setSectionAndNotify(row.id)}
          >
            {row.label}
          </button>
        ))}
      </div>

      {section === "profiles" ? <CustomersProfilesSection {...sidebarProps} /> : null}
      {section === "consent" ? <CustomersConsentSection {...sidebarProps} /> : null}
      {section === "accounts" ? <CustomersAccountsSection {...sidebarProps} /> : null}
      {section === "points" ? <CustomersHistorySection {...sidebarProps} mode="points" /> : null}
      {section === "purchases" ? <CustomersHistorySection {...sidebarProps} mode="purchases" /> : null}
      {section === "pricing" ? <CustomersPricingSection {...sidebarProps} /> : null}
      {section === "compliance" ? <CustomersComplianceSection {...sidebarProps} /> : null}
      {section === "pharmacy" ? (
        <CustomersPharmacySection {...sidebarProps} onAttachPickup={onAttachPickup} />
      ) : null}
    </div>
  );
}
