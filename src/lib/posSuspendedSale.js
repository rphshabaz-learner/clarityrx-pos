import { normalizeTillNumber } from "./posTill";
import {
  readTillScopedJson,
  removeTillScopedKey,
  tillScopedStorageKey,
  writeTillScopedJson,
} from "./tillScopedStorage";

const SUSPENDED_SALE_BASE_KEY = "clarityrx.pos.suspendedSale";
const LEGACY_SUSPENDED_SALE_KEY = "clarityrx.pos.suspendedSale";

function readLegacySuspendedSale() {
  try {
    const raw = window.localStorage.getItem(LEGACY_SUSPENDED_SALE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function migrateLegacySuspendedSale(tillNumber) {
  const legacy = readLegacySuspendedSale();
  if (!legacy) return null;
  const legacyTill = legacy.tillNumber != null ? normalizeTillNumber(legacy.tillNumber) : 1;
  if (legacyTill !== normalizeTillNumber(tillNumber)) return null;
  writeTillScopedJson(SUSPENDED_SALE_BASE_KEY, tillNumber, legacy);
  try {
    window.localStorage.removeItem(LEGACY_SUSPENDED_SALE_KEY);
  } catch {
    // Ignore.
  }
  return legacy;
}

export function loadSuspendedSale(tillNumber = 1) {
  const till = normalizeTillNumber(tillNumber);
  const saved = readTillScopedJson(SUSPENDED_SALE_BASE_KEY, till, null);
  if (saved) return saved;
  return migrateLegacySuspendedSale(till);
}

export function saveSuspendedSale(snapshot, tillNumber = 1) {
  const till = normalizeTillNumber(tillNumber ?? snapshot?.tillNumber ?? 1);
  const payload = { ...snapshot, tillNumber: till };
  try {
    writeTillScopedJson(SUSPENDED_SALE_BASE_KEY, till, payload);
    return payload;
  } catch {
    return null;
  }
}

export function clearSuspendedSale(tillNumber = 1) {
  removeTillScopedKey(SUSPENDED_SALE_BASE_KEY, normalizeTillNumber(tillNumber));
}

export function suspendedSaleStorageKey(tillNumber) {
  return tillScopedStorageKey(SUSPENDED_SALE_BASE_KEY, tillNumber);
}
