const DEFAULT_TERMINAL_PREFIX = "POS-";

export function isSecurelinkEnabled() {
  return process.env.REACT_APP_SECURELINK_ENABLED === "1";
}

/** Local/dev only — simulates pinpad approval without backend routes. */
export function isSecurelinkMock() {
  return process.env.REACT_APP_SECURELINK_MOCK === "1";
}

export function resolveSecurelinkTerminalId(tillNumber, config = {}) {
  const prefix = String(config.securelinkTerminalPrefix || DEFAULT_TERMINAL_PREFIX).trim() || DEFAULT_TERMINAL_PREFIX;
  const padded = String(tillNumber || 1).padStart(2, "0");
  return `${prefix}${padded}`;
}
