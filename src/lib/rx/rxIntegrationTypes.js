/** Rx integration queue row — posted back to Kroll via transmit API when online. */
export const RX_PAYMENT_STATUS = {
  PENDING: "pending",
  POSTED: "posted",
  FAILED: "failed",
};

export const RX_DELIVERY_MATCH_STATUS = {
  UNMATCHED: "unmatched",
  MATCHED: "matched",
  WRITTEN_OFF: "written_off",
};

export function generateRxPaymentId() {
  return `rxpay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateDeliveryMatchId() {
  return `rxdel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatRxMoney(value) {
  return `$${(Number(value) || 0).toFixed(2)}`;
}

export function rxStatusLabel(stage) {
  const map = {
    intake: "Intake",
    data_entry: "Data entry",
    adjudication: "Adjudication",
    dispensing: "Dispensing",
    verification: "Verification",
    ready: "Ready for pickup",
    picked_up: "Picked up",
    cancelled: "Cancelled",
  };
  return map[stage] || stage || "Unknown";
}
