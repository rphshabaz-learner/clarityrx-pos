import { kvGet, kvPut } from "../clarityIndexedDb";
import { RX_DELIVERY_MATCH_STATUS, generateDeliveryMatchId } from "./rxIntegrationTypes";

const KV_RX_DELIVERY_MATCHES = "pos_rx_delivery_matches";

export async function loadDeliveryMatches() {
  const rows = await kvGet(KV_RX_DELIVERY_MATCHES);
  return Array.isArray(rows) ? rows : [];
}

export async function saveDeliveryMatches(rows) {
  await kvPut(KV_RX_DELIVERY_MATCHES, rows);
}

export async function addDeliveryMatchDraft({ deliveryRef, amount, pickupBarcode, invoiceNumber, note }) {
  const rows = await loadDeliveryMatches();
  const row = {
    id: generateDeliveryMatchId(),
    status: RX_DELIVERY_MATCH_STATUS.UNMATCHED,
    createdAt: Date.now(),
    deliveryRef: String(deliveryRef || "").trim(),
    amount: Number(amount) || 0,
    pickupBarcode: String(pickupBarcode || "").trim(),
    invoiceNumber: String(invoiceNumber || "").trim(),
    note: String(note || "").trim(),
    matchedAt: null,
  };
  rows.unshift(row);
  await saveDeliveryMatches(rows.slice(0, 150));
  return row;
}

export async function updateDeliveryMatch(id, patch) {
  const rows = await loadDeliveryMatches();
  const next = rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
  await saveDeliveryMatches(next);
  return next.find((row) => row.id === id) || null;
}
