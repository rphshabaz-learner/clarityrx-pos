import { kvGet, kvPut } from "../clarityIndexedDb";
import { RX_PAYMENT_STATUS, generateRxPaymentId } from "./rxIntegrationTypes";

const KV_RX_PAYMENT_QUEUE = "pos_rx_payment_queue";

export async function loadRxPaymentQueue() {
  const rows = await kvGet(KV_RX_PAYMENT_QUEUE);
  return Array.isArray(rows) ? rows : [];
}

export async function saveRxPaymentQueue(rows) {
  await kvPut(KV_RX_PAYMENT_QUEUE, rows);
}

export async function enqueueRxPaymentFromSale({
  invoiceNumber,
  pickupId,
  rxCopay,
  otcTotal,
  payMethod,
  tillNumber,
  customerAccount,
  krollPatientId,
  rxNumbers,
}) {
  const copay = Number(rxCopay) || 0;
  if (copay <= 0 && !pickupId) return null;

  const queue = await loadRxPaymentQueue();
  const row = {
    id: generateRxPaymentId(),
    status: RX_PAYMENT_STATUS.PENDING,
    createdAt: Date.now(),
    invoiceNumber: invoiceNumber || null,
    pickupId: pickupId || null,
    rxCopay: copay,
    otcTotal: Number(otcTotal) || 0,
    payMethod: String(payMethod || ""),
    tillNumber: Number(tillNumber) || 1,
    customerAccount: customerAccount || null,
    krollPatientId: krollPatientId || null,
    rxNumbers: Array.isArray(rxNumbers) ? rxNumbers : [],
    postedAt: null,
    errorMessage: null,
  };
  queue.unshift(row);
  await saveRxPaymentQueue(queue.slice(0, 200));
  return row;
}

export async function updateRxPaymentRow(id, patch) {
  const queue = await loadRxPaymentQueue();
  const next = queue.map((row) => (row.id === id ? { ...row, ...patch } : row));
  await saveRxPaymentQueue(next);
  return next.find((row) => row.id === id) || null;
}
