import {
  readTillScopedJson,
  removeTillScopedKey,
  tillScopedStorageKey,
  writeTillScopedJson,
} from "./tillScopedStorage";
import { normalizeTillNumber } from "./posTill";

export const POS_TILL_REGISTER_STATE_KEY = "clarityrx.pos.tillRegister";

const DEFAULT_SPLIT_PAYMENTS = [
  { method: "Cash", amount: "" },
  { method: "Credit Card", amount: "" },
];

export function buildTillRegisterState({
  cart = [],
  activeCustomer = null,
  selectedPickup = null,
  payMethod = "Credit Card",
  saleNote = "",
  taxExempt = false,
  discountType = "none",
  discountValue = 0,
  tenderedAmount = "",
  appliedCouponCode = "",
  loyaltyPoints = "",
  splitEnabled = false,
  splitPayments = DEFAULT_SPLIT_PAYMENTS,
  selectedDemographicId = "",
} = {}) {
  return {
    updatedAt: Date.now(),
    cart: Array.isArray(cart) ? cart : [],
    activeCustomerId: activeCustomer?.id || null,
    selectedPickup: selectedPickup || null,
    payMethod,
    saleNote,
    taxExempt: Boolean(taxExempt),
    discountType,
    discountValue,
    tenderedAmount,
    appliedCouponCode,
    loyaltyPoints,
    splitEnabled: Boolean(splitEnabled),
    splitPayments: Array.isArray(splitPayments) && splitPayments.length ? splitPayments : DEFAULT_SPLIT_PAYMENTS,
    selectedDemographicId,
  };
}

export function loadTillRegisterState(tillNumber = 1) {
  const till = normalizeTillNumber(tillNumber);
  const saved = readTillScopedJson(POS_TILL_REGISTER_STATE_KEY, till, null);
  if (!saved || typeof saved !== "object") return null;
  return {
    ...saved,
    cart: Array.isArray(saved.cart) ? saved.cart : [],
    splitPayments:
      Array.isArray(saved.splitPayments) && saved.splitPayments.length
        ? saved.splitPayments
        : DEFAULT_SPLIT_PAYMENTS,
  };
}

export function saveTillRegisterState(tillNumber, state) {
  const till = normalizeTillNumber(tillNumber);
  if (!state) {
    removeTillScopedKey(POS_TILL_REGISTER_STATE_KEY, till);
    return null;
  }
  writeTillScopedJson(POS_TILL_REGISTER_STATE_KEY, till, state);
  return state;
}

export function clearTillRegisterState(tillNumber) {
  removeTillScopedKey(POS_TILL_REGISTER_STATE_KEY, normalizeTillNumber(tillNumber));
}

export function tillRegisterStorageKey(tillNumber) {
  return tillScopedStorageKey(POS_TILL_REGISTER_STATE_KEY, tillNumber);
}
