export const SELF_CHECKOUT_STEPS = {
  WELCOME: "welcome",
  SCAN: "scan",
  LOYALTY: "loyalty",
  PAYMENT: "payment",
  RECEIPT: "receipt",
  DONE: "done",
};

export const RECEIPT_DELIVERY = {
  PRINT: "print",
  EMAIL: "email",
  SMS: "sms",
  NONE: "none",
};

export const RECEIPT_DELIVERY_OPTIONS = [
  { id: RECEIPT_DELIVERY.PRINT, label: "Print receipt" },
  { id: RECEIPT_DELIVERY.EMAIL, label: "Email receipt" },
  { id: RECEIPT_DELIVERY.SMS, label: "Text receipt" },
  { id: RECEIPT_DELIVERY.NONE, label: "No receipt" },
];

export const SELF_CHECKOUT_PAY_METHODS = ["Debit", "Credit Card"];

export function formatSelfCheckoutMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
}

export function selfCheckoutStepLabel(step) {
  const labels = {
    [SELF_CHECKOUT_STEPS.WELCOME]: "Welcome",
    [SELF_CHECKOUT_STEPS.SCAN]: "Scan items",
    [SELF_CHECKOUT_STEPS.LOYALTY]: "Loyalty",
    [SELF_CHECKOUT_STEPS.PAYMENT]: "Payment",
    [SELF_CHECKOUT_STEPS.RECEIPT]: "Receipt",
    [SELF_CHECKOUT_STEPS.DONE]: "Complete",
  };
  return labels[step] || step;
}

export function emptySelfCheckoutConfig() {
  return {
    enabled: true,
    kioskTillNumber: 99,
    welcomeMessage: "Scan items below. Pay at the pinpad when ready.",
    allowLoyaltySkip: true,
    defaultReceiptDelivery: RECEIPT_DELIVERY.PRINT,
    offeredReceiptOptions: [
      RECEIPT_DELIVERY.PRINT,
      RECEIPT_DELIVERY.EMAIL,
      RECEIPT_DELIVERY.SMS,
      RECEIPT_DELIVERY.NONE,
    ],
    loyaltyPrompt: "Enter phone or loyalty member ID (optional)",
    paymentPrompt: "Follow instructions on the card reader",
    terminalId: "",
    requireEmailForEmailReceipt: true,
    idleTimeoutSec: 120,
    maxLoyaltyRedeemPoints: null,
  };
}

export function emptyKioskSession() {
  return {
    id: `kiosk-${Date.now()}`,
    startedAt: Date.now(),
    completedAt: null,
    step: SELF_CHECKOUT_STEPS.WELCOME,
    cart: [],
    loyaltyCustomerId: null,
    loyaltyMemberId: "",
    loyaltyPointsRedeemed: 0,
    loyaltyRedemption: 0,
    payMethod: "Debit",
    receiptDelivery: RECEIPT_DELIVERY.PRINT,
    receiptContact: "",
    subtotal: 0,
    tax: 0,
    total: 0,
    invoiceNumber: null,
    status: "active",
  };
}
