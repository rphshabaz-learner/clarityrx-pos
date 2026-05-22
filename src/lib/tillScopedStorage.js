import { scopedStorageKey } from "../session/scopedStorage";
import { normalizeTillNumber } from "./posTill";

/** Workspace + browser window + till — isolates register-local state across concurrent tills. */
export function tillScopedStorageKey(baseKey, tillNumber = 1) {
  const till = normalizeTillNumber(tillNumber);
  return `${scopedStorageKey(baseKey)}::till-${till}`;
}

export function readTillScopedJson(baseKey, tillNumber, fallback = null) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(tillScopedStorageKey(baseKey, tillNumber));
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeTillScopedJson(baseKey, tillNumber, value) {
  if (typeof window === "undefined") return;
  const key = tillScopedStorageKey(baseKey, tillNumber);
  try {
    if (value == null) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Session-only state still works in memory.
  }
}

export function removeTillScopedKey(baseKey, tillNumber) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(tillScopedStorageKey(baseKey, tillNumber));
  } catch {
    // Ignore.
  }
}
