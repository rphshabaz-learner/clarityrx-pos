import { resolveWorkspaceSession, type WorkspaceSessionContext } from "./workspaceSession";

const LEGACY_AUTH_KEY = "clarityrx-auth-v1";

function scopeSuffix(context: WorkspaceSessionContext): string {
  return [context.workspaceId, context.windowId].map((part) => encodeURIComponent(part)).join("::");
}

export function scopedStorageKey(baseKey: string, context = resolveWorkspaceSession()): string {
  return `${baseKey}::${scopeSuffix(context)}`;
}

export function scopedIndexedDbName(baseName: string, context = resolveWorkspaceSession()): string {
  return `${baseName}-${context.workspaceId}`;
}

export function getScopedJson<T>(baseKey: string, fallback: T, context = resolveWorkspaceSession()): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.sessionStorage.getItem(scopedStorageKey(baseKey, context));
  if (!raw && baseKey === LEGACY_AUTH_KEY) {
    return getLegacyAuthJson(fallback);
  }
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function setScopedJson<T>(baseKey: string, value: T | null, context = resolveWorkspaceSession()): void {
  if (typeof window === "undefined") return;
  const key = scopedStorageKey(baseKey, context);
  if (value == null) {
    window.sessionStorage.removeItem(key);
    return;
  }
  window.sessionStorage.setItem(key, JSON.stringify(value));
}

export function getLegacyAuthJson<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(LEGACY_AUTH_KEY);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function removeLegacyAuth(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LEGACY_AUTH_KEY);
}
