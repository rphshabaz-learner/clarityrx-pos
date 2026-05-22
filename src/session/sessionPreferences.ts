import { scopedStorageKey } from "./scopedStorage";

export const SESSION_PREFS_STORAGE_KEY = "clarityrx-session-preferences-v1";

export const SESSION_TIMEOUT_CHOICES_MIN = [5, 10, 15, 30, 60] as const;

export type SessionPreferences = {
  /** null = use server/site default from security bootstrap */
  idleTimeoutMinutes: number | null;
  /** When true, activity resets idle timer and periodically refreshes tokens while in use */
  extendSessionWhileActive: boolean;
};

export const DEFAULT_SESSION_PREFERENCES: SessionPreferences = {
  idleTimeoutMinutes: null,
  extendSessionWhileActive: true,
};

export function loadSessionPreferences(): SessionPreferences {
  if (typeof window === "undefined") return { ...DEFAULT_SESSION_PREFERENCES };
  try {
    const raw = localStorage.getItem(scopedStorageKey(SESSION_PREFS_STORAGE_KEY));
    if (!raw) return { ...DEFAULT_SESSION_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<SessionPreferences>;
    return {
      idleTimeoutMinutes:
        parsed.idleTimeoutMinutes == null
          ? null
          : Number(parsed.idleTimeoutMinutes) || null,
      extendSessionWhileActive: parsed.extendSessionWhileActive !== false,
    };
  } catch {
    return { ...DEFAULT_SESSION_PREFERENCES };
  }
}

export function saveSessionPreferences(prefs: SessionPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(scopedStorageKey(SESSION_PREFS_STORAGE_KEY), JSON.stringify(prefs));
}

export function allowedIdleTimeoutChoices(serverMaxMinutes: number): number[] {
  const max = Math.max(1, Number(serverMaxMinutes) || 15);
  const choices: number[] = [...SESSION_TIMEOUT_CHOICES_MIN.filter((m) => m <= max)];
  if (!choices.includes(max) && max <= 120) {
    choices.push(max);
    choices.sort((a, b) => a - b);
  }
  return choices.length ? choices : [max];
}

export function resolveEffectiveIdleTimeoutMinutes(
  prefs: SessionPreferences,
  serverDefaultMinutes: number
): number {
  const serverMax = Math.max(1, Number(serverDefaultMinutes) || 15);
  const chosen = prefs.idleTimeoutMinutes == null ? serverMax : Number(prefs.idleTimeoutMinutes);
  const normalized = Math.max(1, chosen || serverMax);
  return Math.min(normalized, serverMax);
}
