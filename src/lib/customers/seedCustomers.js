import {
  applyConsentChange,
  CONSENT_CHANNEL,
  DEFAULT_PRIVACY_NOTICE_VERSION,
} from "./customerConsent";
import {
  CUSTOMER_STATUS,
  CUSTOMER_TYPE,
  generateCustomerId,
  generateCustomerLineId,
  generateCustomerNoteId,
  emptyCustomer,
} from "./customerTypes";

const now = new Date();
const daysAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString();

function withSeedConsent(customer, grants) {
  let row = {
    ...emptyCustomer(customer.type),
    ...customer,
    privacyNoticeVersion: DEFAULT_PRIVACY_NOTICE_VERSION,
  };
  delete row.id;
  row.id = customer.id;
  for (const [channel, granted] of Object.entries(grants)) {
    row = applyConsentChange(row, channel, granted, { source: "seed" });
  }
  return row;
}

export function buildSeedCustomers() {
  const stamp = now.toISOString();
  return [
    withSeedConsent(
    {
      id: generateCustomerId(),
      accountNumber: "C-10042",
      type: CUSTOMER_TYPE.LOYALTY,
      status: CUSTOMER_STATUS.ACTIVE,
      profile: {
        firstName: "Maria",
        lastName: "Chen",
        displayName: "",
        phone: "416-555-0142",
        email: "maria.chen@example.com",
        address: "42 Maple St, Toronto ON",
        dateOfBirth: "1978-03-12",
      },
      loyalty: { memberId: "LY-884201", pointsBalance: 1240, tier: "gold", enrolledAt: daysAgo(400) },
      storeCharge: { creditLimit: 0, balance: 0, paymentTerms: "net-30", authorizedUsers: [] },
      seniorDiscount: { enabled: false, percent: 10, verifiedAt: null },
      specialPricing: [{ id: generateCustomerLineId(), sku: "OTC-VIT-D3", price: 8.99, note: "Loyalty vitamin shelf" }],
      taxExempt: { enabled: false, certificateNumber: "", expiryAt: null, regions: [] },
      ltc: { facilityId: "", billingAccount: "", invoiceCycle: "monthly" },
      rxProfile: { krollPatientId: "K-442901", linkedAt: daysAgo(120) },
      pickups: [
        {
          id: generateCustomerLineId(),
          bagBarcode: "BAG-8842-A",
          rxNumbers: ["RX-901122", "RX-901123"],
          status: "ready",
          copay: 12.5,
          updatedAt: daysAgo(0),
        },
      ],
      notes: [
        {
          id: generateCustomerNoteId(),
          text: "Prefers paper bags; allergy alert on penicillin.",
          severity: "alert",
          createdAt: daysAgo(30),
        },
      ],
      pointsHistory: [
        { id: generateCustomerLineId(), at: daysAgo(2), delta: 45, reason: "Purchase", balanceAfter: 1240 },
        { id: generateCustomerLineId(), at: daysAgo(14), delta: -200, reason: "Redemption", balanceAfter: 1195 },
      ],
      purchaseHistory: [
        {
          id: generateCustomerLineId(),
          at: daysAgo(2),
          invoiceNumber: "INV-240501",
          total: 34.18,
          items: ["OTC-VIT-D3", "SVC-BAG"],
        },
      ],
      facility: { name: "", beds: 0, contactName: "", billingContact: "" },
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      [CONSENT_CHANNEL.LOYALTY]: true,
      [CONSENT_CHANNEL.MARKETING]: true,
      [CONSENT_CHANNEL.SMS]: true,
      [CONSENT_CHANNEL.EMAIL]: true,
      [CONSENT_CHANNEL.E_RECEIPTS]: true,
    }),
    withSeedConsent(
    {
      id: generateCustomerId(),
      accountNumber: "C-20018",
      type: CUSTOMER_TYPE.STORE_CHARGE,
      status: CUSTOMER_STATUS.ACTIVE,
      profile: {
        firstName: "James",
        lastName: "Whitfield",
        displayName: "Whitfield Family Account",
        phone: "905-555-2001",
        email: "j.whitfield@example.com",
        address: "18 Oak Lane, Mississauga ON",
        dateOfBirth: "",
      },
      loyalty: { memberId: "", pointsBalance: 0, tier: "standard", enrolledAt: null },
      storeCharge: {
        creditLimit: 500,
        balance: 127.45,
        paymentTerms: "net-30",
        authorizedUsers: ["James Whitfield", "Sarah Whitfield"],
      },
      seniorDiscount: { enabled: true, percent: 10, verifiedAt: daysAgo(200) },
      specialPricing: [],
      taxExempt: { enabled: false, certificateNumber: "", expiryAt: null, regions: [] },
      ltc: { facilityId: "", billingAccount: "", invoiceCycle: "monthly" },
      rxProfile: { krollPatientId: "K-118902", linkedAt: daysAgo(90) },
      pickups: [],
      notes: [
        {
          id: generateCustomerNoteId(),
          text: "Charge account — statement on the 1st.",
          severity: "info",
          createdAt: daysAgo(60),
        },
      ],
      pointsHistory: [],
      purchaseHistory: [
        {
          id: generateCustomerLineId(),
          at: daysAgo(5),
          invoiceNumber: "INV-240488",
          total: 67.22,
          items: ["Front-store misc"],
        },
      ],
      facility: { name: "", beds: 0, contactName: "", billingContact: "" },
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      [CONSENT_CHANNEL.LOYALTY]: false,
      [CONSENT_CHANNEL.MARKETING]: false,
      [CONSENT_CHANNEL.SMS]: false,
      [CONSENT_CHANNEL.EMAIL]: true,
      [CONSENT_CHANNEL.E_RECEIPTS]: true,
    }),
    withSeedConsent(
    {
      id: generateCustomerId(),
      accountNumber: "FAC-SUNRISE",
      type: CUSTOMER_TYPE.CARE_HOME,
      status: CUSTOMER_STATUS.ACTIVE,
      profile: {
        firstName: "",
        lastName: "",
        displayName: "Sunrise Care Home",
        phone: "416-555-8800",
        email: "billing@sunrisecare.example",
        address: "900 Lakeshore Blvd, Toronto ON",
        dateOfBirth: "",
      },
      loyalty: { memberId: "", pointsBalance: 0, tier: "standard", enrolledAt: null },
      storeCharge: { creditLimit: 2500, balance: 412.8, paymentTerms: "net-15", authorizedUsers: ["Donna Miles — DON"] },
      seniorDiscount: { enabled: false, percent: 10, verifiedAt: null },
      specialPricing: [
        { id: generateCustomerLineId(), sku: "OTC-GLOVES-100", price: 11.49, note: "Facility contract" },
      ],
      taxExempt: { enabled: true, certificateNumber: "TE-ON-44102", expiryAt: daysAgo(-180), regions: ["ON"] },
      ltc: { facilityId: "", billingAccount: "", invoiceCycle: "monthly" },
      rxProfile: { krollPatientId: "", linkedAt: null },
      pickups: [
        {
          id: generateCustomerLineId(),
          bagBarcode: "BAG-SUN-12",
          rxNumbers: ["RX-880011", "RX-880012", "RX-880013"],
          status: "in_prep",
          copay: 0,
          updatedAt: daysAgo(0),
        },
      ],
      notes: [
        {
          id: generateCustomerNoteId(),
          text: "Delivery window 2–4 PM weekdays. MAR sheet in Kroll.",
          severity: "alert",
          createdAt: daysAgo(10),
        },
      ],
      pointsHistory: [],
      purchaseHistory: [],
      facility: {
        name: "Sunrise Care Home",
        beds: 48,
        contactName: "Donna Miles",
        billingContact: "AP — billing@sunrisecare.example",
      },
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      [CONSENT_CHANNEL.MARKETING]: false,
      [CONSENT_CHANNEL.SMS]: false,
      [CONSENT_CHANNEL.EMAIL]: true,
      [CONSENT_CHANNEL.E_RECEIPTS]: false,
    }),
    withSeedConsent(
    {
      id: generateCustomerId(),
      accountNumber: "LTC-NORTH-09",
      type: CUSTOMER_TYPE.LTC,
      status: CUSTOMER_STATUS.ACTIVE,
      profile: {
        firstName: "",
        lastName: "",
        displayName: "Northview LTC — Ward 9",
        phone: "647-555-0909",
        email: "pharmacy@northviewltc.example",
        address: "Northview LTC, Unit 9",
        dateOfBirth: "",
      },
      loyalty: { memberId: "", pointsBalance: 0, tier: "standard", enrolledAt: null },
      storeCharge: { creditLimit: 10000, balance: 2184.5, paymentTerms: "net-30", authorizedUsers: ["Pharmacy coordinator"] },
      seniorDiscount: { enabled: false, percent: 10, verifiedAt: null },
      specialPricing: [],
      taxExempt: { enabled: false, certificateNumber: "", expiryAt: null, regions: [] },
      ltc: {
        facilityId: "NV-LTC-09",
        billingAccount: "LTC-INV-NV09",
        invoiceCycle: "biweekly",
      },
      rxProfile: { krollPatientId: "K-LTC-BULK", linkedAt: daysAgo(365) },
      pickups: [],
      notes: [
        {
          id: generateCustomerNoteId(),
          text: "Blister pack cycle Thursday; separate delivery manifest.",
          severity: "info",
          createdAt: daysAgo(45),
        },
      ],
      pointsHistory: [],
      purchaseHistory: [
        {
          id: generateCustomerLineId(),
          at: daysAgo(7),
          invoiceNumber: "INV-LTC-2404",
          total: 1842.0,
          items: ["Blister cycle", "OTC floor stock"],
        },
      ],
      facility: {
        name: "Northview LTC",
        beds: 120,
        contactName: "Ward 9 nursing station",
        billingContact: "Corporate AP",
      },
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      [CONSENT_CHANNEL.MARKETING]: false,
      [CONSENT_CHANNEL.SMS]: false,
      [CONSENT_CHANNEL.EMAIL]: true,
      [CONSENT_CHANNEL.E_RECEIPTS]: false,
    }),
  ];
}
