import { isDeviceTillLocked } from "./posDeviceTill";
import { closeActiveShift, getActiveShift, isShiftOpenForTill, openTillShift } from "./posShift";

/**
 * Transaction till: one cash shift per sale (auto open before charge, auto close after).
 * Session till: cashier opens/closes shift manually in the header (locked workstation default).
 */
export function usesTransactionShiftMode(deviceTillBinding, demographicConfig = {}) {
  const mode = demographicConfig?.cashShiftMode;
  if (mode === "transaction") return true;
  if (mode === "session") return false;
  return !isDeviceTillLocked(deviceTillBinding);
}

export function prepareShiftForCharge(tillNumber, { openedBy = "", transactionMode = false } = {}) {
  if (!transactionMode) {
    const shift = getActiveShift(tillNumber);
    return { shift, ready: isShiftOpenForTill(tillNumber) };
  }
  const shift = openTillShift({ tillNumber, openedBy });
  return { shift, ready: true };
}

export function finalizeShiftAfterCharge(tillNumber, { closedBy = "", transactionMode = false } = {}) {
  if (!transactionMode) return getActiveShift(tillNumber);
  return closeActiveShift(tillNumber, { closedBy });
}
