import { scopedStorageKey } from "../../session/scopedStorage";
import { TAX_PRICING_MODES, normalizeProvinceCode } from "./canadianProvincialTax";

export const POS_TAX_CONFIG_STORAGE_KEY = "clarityrx-pos-tax-v1";

export const DEFAULT_POS_TAX_CONFIG = {
  /** Canadian province/territory code for register tax */
  provinceCode: "BC",
  /** GST/HST registration (business) number — shown on receipts */
  businessNumber: "",
  /** `exclusive` = tax added at till; `inclusive` = shelf prices include tax */
  pricingMode: TAX_PRICING_MODES.EXCLUSIVE,
  storeName: "ClarityRx Pharmacy",
  storeAddressLine1: "",
  storeAddressLine2: "",
  storePhone: "",
};

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function loadPosTaxConfig() {
  const raw = localStorage.getItem(scopedStorageKey(POS_TAX_CONFIG_STORAGE_KEY));
  const parsed = safeParse(raw, null);
  const pricingMode =
    parsed?.pricingMode === TAX_PRICING_MODES.INCLUSIVE
      ? TAX_PRICING_MODES.INCLUSIVE
      : TAX_PRICING_MODES.EXCLUSIVE;

  return {
    provinceCode: normalizeProvinceCode(parsed?.provinceCode || DEFAULT_POS_TAX_CONFIG.provinceCode),
    businessNumber: String(parsed?.businessNumber || "").trim(),
    pricingMode,
    storeName: String(parsed?.storeName || DEFAULT_POS_TAX_CONFIG.storeName).trim(),
    storeAddressLine1: String(parsed?.storeAddressLine1 || "").trim(),
    storeAddressLine2: String(parsed?.storeAddressLine2 || "").trim(),
    storePhone: String(parsed?.storePhone || "").trim(),
  };
}

export function savePosTaxConfig(config) {
  const payload = {
    provinceCode: normalizeProvinceCode(config?.provinceCode),
    businessNumber: String(config?.businessNumber || "").trim(),
    pricingMode:
      config?.pricingMode === TAX_PRICING_MODES.INCLUSIVE
        ? TAX_PRICING_MODES.INCLUSIVE
        : TAX_PRICING_MODES.EXCLUSIVE,
    storeName: String(config?.storeName || DEFAULT_POS_TAX_CONFIG.storeName).trim(),
    storeAddressLine1: String(config?.storeAddressLine1 || "").trim(),
    storeAddressLine2: String(config?.storeAddressLine2 || "").trim(),
    storePhone: String(config?.storePhone || "").trim(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(scopedStorageKey(POS_TAX_CONFIG_STORAGE_KEY), JSON.stringify(payload));
  return payload;
}
