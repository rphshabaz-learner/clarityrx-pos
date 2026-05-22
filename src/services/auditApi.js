import { buildBackendHttpErrorMessage, fetchBackend, resolvePackagingApiBaseUrl } from "../lib/apiConfig";
import { buildSessionHeaders, resolveWorkspaceSession } from "../session/workspaceSession";

const API_BASE = resolvePackagingApiBaseUrl();

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

export async function recordDurableAuditEvent(accessToken, event) {
  if (!accessToken || !event) return null;
  const sessionContext = resolveWorkspaceSession();
  const res = await fetchBackend(`${API_BASE}/audit/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...buildSessionHeaders(sessionContext),
    },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      ...event,
    }),
  }, API_BASE);
  return parseJson(res);
}
