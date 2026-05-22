import { buildBackendHttpErrorMessage, fetchBackend, resolveApiBaseUrl } from "../lib/apiConfig";
import { buildSessionHeaders, resolveWorkspaceSession } from "../session/workspaceSession";

const API_BASE = resolveApiBaseUrl();

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
    throw new Error(message);
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

export async function fetchPosPickups(accessToken) {
  const response = await fetchBackend(
    `${API_BASE}/pos/pickups`,
    { headers: authHeaders(accessToken) },
    API_BASE
  );
  const payload = await parseJson(response);
  return payload?.pickups || [];
}

export async function lookupPosPickup(barcode, accessToken) {
  const encoded = encodeURIComponent(String(barcode || "").trim());
  const response = await fetchBackend(
    `${API_BASE}/pos/pickups/lookup?barcode=${encoded}`,
    { headers: authHeaders(accessToken) },
    API_BASE
  );
  const payload = await parseJson(response);
  return payload?.pickup || null;
}

export async function completePosSale(body, accessToken) {
  const response = await fetchBackend(
    `${API_BASE}/pos/complete-sale`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify(body),
    },
    API_BASE
  );
  return parseJson(response);
}

export async function fetchPosHealth(accessToken) {
  const response = await fetchBackend(
    `${API_BASE}/pos/health`,
    { headers: authHeaders(accessToken) },
    API_BASE
  );
  return parseJson(response);
}
