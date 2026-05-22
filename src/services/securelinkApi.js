import { buildBackendHttpErrorMessage, fetchBackend, resolvePosTransmitApiBaseUrl } from "../lib/apiConfig";
import { buildSessionHeaders, resolveWorkspaceSession } from "../session/workspaceSession";

const API_BASE = resolvePosTransmitApiBaseUrl();

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
      buildBackendHttpErrorMessage(API_BASE, response) ||
      `Request failed with HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function authHeaders(accessToken) {
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

/**
 * Start an integrated Securelink pinpad transaction (Moneris / TD / Global / Chase via backend).
 */
export async function initiatePosCardPayment(body, accessToken) {
  const response = await fetchBackend(
    `${API_BASE}/pos/securelink/initiate`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify(body),
    },
    API_BASE
  );
  return parseJson(response);
}

export async function fetchPosCardPayment(paymentId, accessToken) {
  const encoded = encodeURIComponent(String(paymentId || "").trim());
  const response = await fetchBackend(
    `${API_BASE}/pos/securelink/payments/${encoded}`,
    { headers: authHeaders(accessToken) },
    API_BASE
  );
  return parseJson(response);
}

export async function cancelPosCardPayment(paymentId, accessToken) {
  const encoded = encodeURIComponent(String(paymentId || "").trim());
  const response = await fetchBackend(
    `${API_BASE}/pos/securelink/payments/${encoded}/cancel`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
    },
    API_BASE
  );
  return parseJson(response);
}
