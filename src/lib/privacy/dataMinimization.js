/**
 * Minimum data collection — customer and payment fields the till may retain.
 * Aligns with PIPEDA "limiting collection" and PCI DSS (no PAN/CVV at till).
 */

import { getRolesForPermission } from "../../RoleAccessContext";

/** Roles that may view/edit full contact and verification fields on customer profiles. */
export const CUSTOMER_SENSITIVE_PROFILE_ROLES = getRolesForPermission("pos.security");

/**
 * Profile keys optional at the till — collect only when needed for the workflow.
 * Cashiers typically need name, phone, and account # for lookup and receipts.
 */
export const CUSTOMER_OPTIONAL_PROFILE_FIELDS = ["email", "address", "dateOfBirth"];

/** Allowed keys on cardPayment after pinpad approval (see paymentReceiptRules.sanitizeCardPaymentForStorage). */
export const NECESSARY_PAYMENT_STORAGE_FIELDS = [
  "reference",
  "authCode",
  "last4",
  "cardBrand",
  "entryMethod",
  "terminalId",
  "maskedPan",
];

export function canViewSensitiveCustomerProfile(activeRole) {
  return CUSTOMER_SENSITIVE_PROFILE_ROLES.includes(activeRole);
}

/** Mask optional profile fields for display when role lacks access. */
export function maskCustomerProfileForDisplay(profile, activeRole) {
  const base = profile || {};
  if (canViewSensitiveCustomerProfile(activeRole)) return base;
  return {
    ...base,
    email: base.email ? "••••••••" : "",
    address: base.address ? "••••••••" : "",
    dateOfBirth: base.dateOfBirth ? "••••-••-••" : "",
  };
}

export function canConfigurePosPrivacy(activeRole) {
  return getRolesForPermission("pos.security").includes(activeRole);
}
