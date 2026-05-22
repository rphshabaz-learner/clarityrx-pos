import { kvGet, kvPut } from "../clarityIndexedDb";
import { emptySelfCheckoutConfig } from "./selfCheckoutTypes";

const CONFIG_KEY = "pos_self_checkout_config";

export async function loadSelfCheckoutConfig() {
  const stored = await kvGet(CONFIG_KEY);
  return { ...emptySelfCheckoutConfig(), ...(stored || {}) };
}

export async function saveSelfCheckoutConfig(config) {
  const next = { ...emptySelfCheckoutConfig(), ...config };
  await kvPut(CONFIG_KEY, next);
  return next;
}

export function resolveSelfCheckoutTillNumber(config) {
  const fromEnv = Number(process.env.REACT_APP_POS_SELF_CHECKOUT_TILL);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  const fromConfig = Number(config?.kioskTillNumber);
  if (Number.isFinite(fromConfig) && fromConfig > 0) return fromConfig;
  return 99;
}

export function isSelfCheckoutFeatureEnabled() {
  const flag = String(process.env.REACT_APP_POS_SELF_CHECKOUT || "").trim();
  if (flag === "0" || flag.toLowerCase() === "false") return false;
  return true;
}
