import { kvGet, kvPut } from "../clarityIndexedDb";

const SESSIONS_KEY = "pos_self_checkout_sessions";
const MAX_SESSIONS = 80;

export async function listSelfCheckoutSessions() {
  const rows = (await kvGet(SESSIONS_KEY)) || [];
  return Array.isArray(rows) ? rows : [];
}

export async function appendSelfCheckoutSession(session) {
  const rows = await listSelfCheckoutSessions();
  const next = [{ ...session, loggedAt: Date.now() }, ...rows].slice(0, MAX_SESSIONS);
  await kvPut(SESSIONS_KEY, next);
  return next;
}

export async function clearSelfCheckoutSessions() {
  await kvPut(SESSIONS_KEY, []);
}
