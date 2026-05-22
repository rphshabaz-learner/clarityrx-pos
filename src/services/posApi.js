import { buildBackendHttpErrorMessage, fetchBackend, resolvePosTransmitApiBaseUrl } from "../lib/apiConfig";
import { buildSessionHeaders, resolveWorkspaceSession } from "../session/workspaceSession";

const TRANSMIT_API_BASE = resolvePosTransmitApiBaseUrl();

async function parseJson(response) {
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && (payload.error || payload.message)) ||
      buildBackendHttpErrorMessage(TRANSMIT_API_BASE, response) ||
      `Request failed with HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

function transmitHeaders(accessToken) {
  const sessionContext = resolveWorkspaceSession();
  const headers = {
    "Content-Type": "application/json",
    ...buildSessionHeaders(sessionContext),
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

/** Completed sale — primary transaction transmit to pharmacy. */
export async function completePosSale(body, accessToken) {
  const response = await fetchBackend(
    `${TRANSMIT_API_BASE}/pos/complete-sale`,
    {
      method: "POST",
      headers: transmitHeaders(accessToken),
      body: JSON.stringify(body),
    },
    TRANSMIT_API_BASE
  );
  return parseJson(response);
}

/**
 * Stock deltas after a sale (SKU qty sold). Pharmacy receives inventory adjustments only.
 * @param {{ sku: string, quantityDelta: number, tillNumber?: number, invoiceNumber?: string }[]} adjustments
 */
export async function transmitInventoryAdjustments(adjustments, accessToken, meta = {}) {
  if (!Array.isArray(adjustments) || adjustments.length === 0) {
    return null;
  }
  const response = await fetchBackend(
    `${TRANSMIT_API_BASE}/pos/inventory/adjustments`,
    {
      method: "POST",
      headers: transmitHeaders(accessToken),
      body: JSON.stringify({
        adjustments,
        ...meta,
      }),
    },
    TRANSMIT_API_BASE
  );
  return parseJson(response);
}

export async function lookupPosPickup(barcode, accessToken) {
  const encoded = encodeURIComponent(String(barcode || "").trim());
  const response = await fetchBackend(
    `${TRANSMIT_API_BASE}/pos/pickups/lookup?barcode=${encoded}`,
    { headers: transmitHeaders(accessToken) },
    TRANSMIT_API_BASE
  );
  const payload = await parseJson(response);
  return payload?.pickup || null;
}

export async function fetchPosPickups(accessToken) {
  const response = await fetchBackend(
    `${TRANSMIT_API_BASE}/pos/pickups`,
    { headers: transmitHeaders(accessToken) },
    TRANSMIT_API_BASE
  );
  const payload = await parseJson(response);
  return payload?.pickups || [];
}

export async function fetchPosHealth(accessToken) {
  const response = await fetchBackend(
    `${TRANSMIT_API_BASE}/pos/health`,
    { headers: transmitHeaders(accessToken) },
    TRANSMIT_API_BASE
  );
  return parseJson(response);
}

/** Prescription status from Kroll / pharmacy transmit (falls back to local cache in UI). */
export async function lookupRxStatus(query, accessToken) {
  const encoded = encodeURIComponent(String(query || "").trim());
  if (!encoded) return null;
  const response = await fetchBackend(
    `${TRANSMIT_API_BASE}/pos/rx/lookup?query=${encoded}`,
    { headers: transmitHeaders(accessToken) },
    TRANSMIT_API_BASE
  );
  const payload = await parseJson(response);
  return payload?.rx || payload?.prescription || payload || null;
}

/** Post Rx copay / pickup payment back to Kroll after POS charge. */
export async function postRxPayment(body, accessToken) {
  const response = await fetchBackend(
    `${TRANSMIT_API_BASE}/pos/rx/post-payment`,
    {
      method: "POST",
      headers: transmitHeaders(accessToken),
      body: JSON.stringify(body),
    },
    TRANSMIT_API_BASE
  );
  return parseJson(response);
}

/** Request pickup queue refresh from pharmacy packaging / Kroll bridge. */
export async function syncPosPickups(accessToken) {
  const response = await fetchBackend(
    `${TRANSMIT_API_BASE}/pos/pickups/sync`,
    {
      method: "POST",
      headers: transmitHeaders(accessToken),
      body: JSON.stringify({}),
    },
    TRANSMIT_API_BASE
  );
  return parseJson(response);
}
