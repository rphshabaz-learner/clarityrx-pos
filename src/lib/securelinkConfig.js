import { POS_TILL_OPTIONS } from "./posTill";

const DEFAULT_TERMINAL_PREFIX = "POS-";

export function isSecurelinkEnabled() {
  return process.env.REACT_APP_SECURELINK_ENABLED === "1";
}

/** Local/dev only — simulates pinpad approval without backend routes. */
export function isSecurelinkMock() {
  return process.env.REACT_APP_SECURELINK_MOCK === "1";
}

export function formatSecurelinkTerminalIdFromTill(tillNumber, prefix = DEFAULT_TERMINAL_PREFIX) {
  const normalizedPrefix =
    String(prefix || DEFAULT_TERMINAL_PREFIX).trim() || DEFAULT_TERMINAL_PREFIX;
  const padded = String(tillNumber || 1).padStart(2, "0");
  return `${normalizedPrefix}${padded}`;
}

/** Default pinpad terminal ids: till 1 → POS-01, till 10 → POS-10, etc. */
export function buildDefaultSecurelinkTerminalMappings(
  prefix = DEFAULT_TERMINAL_PREFIX,
  tillNumbers = POS_TILL_OPTIONS
) {
  const mappings = {};
  for (const till of tillNumbers) {
    mappings[String(till)] = formatSecurelinkTerminalIdFromTill(till, prefix);
  }
  return mappings;
}

export function normalizeSecurelinkTerminalMappings(raw, prefix = DEFAULT_TERMINAL_PREFIX) {
  const normalizedPrefix =
    String(prefix || DEFAULT_TERMINAL_PREFIX).trim() || DEFAULT_TERMINAL_PREFIX;
  const source = raw && typeof raw === "object" ? raw : {};
  const mappings = buildDefaultSecurelinkTerminalMappings(normalizedPrefix);
  for (const till of POS_TILL_OPTIONS) {
    const key = String(till);
    const value = source[key] ?? source[till];
    if (typeof value === "string" && value.trim()) {
      mappings[key] = value.trim();
    }
  }
  return mappings;
}

export function resolveSecurelinkTerminalId(tillNumber, config = {}) {
  const explicitTerminalId = String(config.securelinkTerminalId || "").trim();
  if (explicitTerminalId) return explicitTerminalId;

  const prefix =
    String(config.securelinkTerminalPrefix || DEFAULT_TERMINAL_PREFIX).trim() ||
    DEFAULT_TERMINAL_PREFIX;
  const mappings = normalizeSecurelinkTerminalMappings(config.securelinkTerminalMappings, prefix);
  const key = String(tillNumber || 1);
  if (mappings[key]) return mappings[key];

  return formatSecurelinkTerminalIdFromTill(tillNumber, prefix);
}
