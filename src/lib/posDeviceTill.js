import { getRolesForPermission } from "../RoleAccessContext";
import { normalizeTillNumber, POS_TILL_OPTIONS, loadSelectedTillNumber, saveSelectedTillNumber } from "./posTill";

export const POS_DEVICE_TILL_STORAGE_KEY = "clarityrx.pos.deviceTill";

const SECURE_STORAGE_KEY = "pos-device-till";

function readEnvTill() {
  const raw = String(process.env.REACT_APP_POS_DEVICE_TILL || "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return POS_TILL_OPTIONS.includes(parsed) ? parsed : null;
}

function envTillLocked() {
  if (readEnvTill() == null) return false;
  const flag = String(process.env.REACT_APP_POS_DEVICE_TILL_LOCK || "").trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "no") return false;
  if (flag === "1" || flag === "true" || flag === "yes") return true;
  return true;
}

function normalizeConfig(raw) {
  if (!raw || typeof raw !== "object") return null;
  const tillNumber = normalizeTillNumber(raw.tillNumber);
  return {
    tillNumber,
    locked: Boolean(raw.locked),
    source: raw.source || "local",
    configuredAt: raw.configuredAt || null,
    configuredBy: raw.configuredBy || null,
  };
}

export function readDeviceTillConfigFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(POS_DEVICE_TILL_STORAGE_KEY);
    if (!raw) return null;
    return normalizeConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeDeviceTillConfigToStorage(config) {
  if (typeof window === "undefined") return null;
  const normalized = normalizeConfig(config);
  if (!normalized) return null;
  try {
    window.localStorage.setItem(POS_DEVICE_TILL_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // In-memory till still applies for this session.
  }
  return normalized;
}

export function clearDeviceTillConfigFromStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(POS_DEVICE_TILL_STORAGE_KEY);
  } catch {
    // Ignore.
  }
}

async function readSecureDeviceTillConfig() {
  if (typeof window === "undefined") return null;
  try {
    const raw = await window.clarityRxElectron?.secureStorage?.get?.(SECURE_STORAGE_KEY);
    if (!raw) return null;
    return normalizeConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function writeSecureDeviceTillConfig(config) {
  if (typeof window === "undefined") return;
  const normalized = normalizeConfig(config);
  if (!normalized) return;
  try {
    await window.clarityRxElectron?.secureStorage?.set?.(
      SECURE_STORAGE_KEY,
      JSON.stringify(normalized)
    );
  } catch {
    // localStorage copy still applies.
  }
}

async function removeSecureDeviceTillConfig() {
  if (typeof window === "undefined") return;
  try {
    await window.clarityRxElectron?.secureStorage?.remove?.(SECURE_STORAGE_KEY);
  } catch {
    // Ignore.
  }
}

/**
 * Synchronous resolution for first paint: deploy env, then workstation local config, then legacy till picker.
 */
export function resolveInitialTillNumber() {
  const envTill = readEnvTill();
  if (envTill != null) return envTill;

  const device = readDeviceTillConfigFromStorage();
  if (device?.tillNumber != null) return device.tillNumber;

  return loadSelectedTillNumber();
}

export function getDeviceTillBindingSync() {
  const envTill = readEnvTill();
  if (envTill != null) {
    return {
      tillNumber: envTill,
      locked: envTillLocked(),
      source: "env",
      configuredAt: null,
      configuredBy: null,
    };
  }

  const device = readDeviceTillConfigFromStorage();
  if (device) {
    return {
      tillNumber: device.tillNumber,
      locked: Boolean(device.locked),
      source: device.source || "local",
      configuredAt: device.configuredAt,
      configuredBy: device.configuredBy,
    };
  }

  return {
    tillNumber: loadSelectedTillNumber(),
    locked: false,
    source: "session",
    configuredAt: null,
    configuredBy: null,
  };
}

export function isDeviceTillLocked(binding = getDeviceTillBindingSync()) {
  return Boolean(binding?.locked);
}

export function canConfigureDeviceTill(activeRole) {
  return getRolesForPermission("pos.configure").includes(activeRole);
}

/**
 * Prefer Electron secure storage when available (survives cache clears better on packaged tills).
 */
export async function hydrateDeviceTillBinding() {
  const envTill = readEnvTill();
  if (envTill != null) {
    return getDeviceTillBindingSync();
  }

  const secure = await readSecureDeviceTillConfig();
  if (secure) {
    writeDeviceTillConfigToStorage(secure);
    return {
      tillNumber: secure.tillNumber,
      locked: Boolean(secure.locked),
      source: "secure",
      configuredAt: secure.configuredAt,
      configuredBy: secure.configuredBy,
    };
  }

  return getDeviceTillBindingSync();
}

export async function saveDeviceTillBinding({ tillNumber, locked, configuredBy } = {}) {
  if (readEnvTill() != null && envTillLocked()) {
    throw new Error("Till number is fixed by deployment configuration on this device.");
  }

  const config = {
    tillNumber: normalizeTillNumber(tillNumber),
    locked: Boolean(locked),
    source: typeof window !== "undefined" && window.clarityRxElectron ? "secure" : "local",
    configuredAt: new Date().toISOString(),
    configuredBy: configuredBy || null,
  };

  writeDeviceTillConfigToStorage(config);
  await writeSecureDeviceTillConfig(config);
  saveSelectedTillNumber(config.tillNumber);
  return config;
}

export async function clearDeviceTillBinding() {
  if (readEnvTill() != null && envTillLocked()) {
    throw new Error("Till number is fixed by deployment configuration on this device.");
  }
  clearDeviceTillConfigFromStorage();
  await removeSecureDeviceTillConfig();
}

export function deviceTillBindingLabel(binding = getDeviceTillBindingSync()) {
  if (binding.source === "env") return "Set by deployment";
  if (binding.source === "secure" || binding.source === "local") return "Set for this workstation";
  return "Session till";
}
