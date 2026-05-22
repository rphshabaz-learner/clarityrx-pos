export const CUSTOMER_TYPE = {
  INDIVIDUAL: "individual",
  LOYALTY: "loyalty",
  STORE_CHARGE: "store_charge",
  CARE_HOME: "care_home",
  LTC: "ltc",
};

export const CUSTOMER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  HOLD: "hold",
};

export const CUSTOMER_TYPE_OPTIONS = [
  { id: CUSTOMER_TYPE.INDIVIDUAL, label: "Individual" },
  { id: CUSTOMER_TYPE.LOYALTY, label: "Loyalty member" },
  { id: CUSTOMER_TYPE.STORE_CHARGE, label: "Store charge" },
  { id: CUSTOMER_TYPE.CARE_HOME, label: "Care / group home" },
  { id: CUSTOMER_TYPE.LTC, label: "LTC billing" },
];

export function generateCustomerId() {
  return `cust-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateCustomerNoteId() {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function generateCustomerLineId() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function customerTypeLabel(type) {
  return CUSTOMER_TYPE_OPTIONS.find((row) => row.id === type)?.label || type || "—";
}

export function customerStatusLabel(status) {
  if (status === CUSTOMER_STATUS.ACTIVE) return "Active";
  if (status === CUSTOMER_STATUS.INACTIVE) return "Inactive";
  if (status === CUSTOMER_STATUS.HOLD) return "On hold";
  return status || "—";
}

export function customerStatusBadgeClass(status) {
  if (status === CUSTOMER_STATUS.ACTIVE) return "badge-green";
  if (status === CUSTOMER_STATUS.HOLD) return "badge-amber";
  return "badge-gray";
}

export function customerDisplayName(customer) {
  if (!customer) return "—";
  const profile = customer.profile || {};
  if (profile.displayName) return profile.displayName;
  const parts = [profile.firstName, profile.lastName].filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (customer.facility?.name) return customer.facility.name;
  return customer.accountNumber || "Customer";
}

export function emptyCustomer(type = CUSTOMER_TYPE.INDIVIDUAL) {
  const stamp = new Date().toISOString();
  return {
    id: generateCustomerId(),
    accountNumber: "",
    type,
    status: CUSTOMER_STATUS.ACTIVE,
    profile: {
      firstName: "",
      lastName: "",
      displayName: "",
      phone: "",
      email: "",
      address: "",
      dateOfBirth: "",
    },
    loyalty: { memberId: "", pointsBalance: 0, tier: "standard", enrolledAt: null },
    storeCharge: { creditLimit: 0, balance: 0, paymentTerms: "net-30", authorizedUsers: [] },
    seniorDiscount: { enabled: false, percent: 10, verifiedAt: null },
    specialPricing: [],
    taxExempt: { enabled: false, certificateNumber: "", expiryAt: null, regions: [] },
    ltc: { facilityId: "", billingAccount: "", invoiceCycle: "monthly" },
    rxProfile: { krollPatientId: "", linkedAt: null },
    pickups: [],
    notes: [],
    pointsHistory: [],
    purchaseHistory: [],
    facility: { name: "", beds: 0, contactName: "", billingContact: "" },
    createdAt: stamp,
    updatedAt: stamp,
  };
}
