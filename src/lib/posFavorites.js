import { scopedStorageKey } from "../session/scopedStorage";

export const POS_FAVORITES_STORAGE_KEY = "clarityrx-pos-favorites-v1";
export const POS_DEMOGRAPHICS_STORAGE_KEY = "clarityrx-pos-demographics-v1";

export const DEFAULT_TILL_OPTIONS = {
  securelinkTerminalPrefix: "POS-",
  printMerchantCopy: true,
  taxRate: 0.05,
  defaultDiscountType: "none",
  defaultDiscountValue: 0,
  collectSaleNotes: true,
  promptForBag: true,
  quickTenderAmounts: [10, 20, 50, 100],
};

/** Customer types (default skips till prompt when enabled). */
export const DEFAULT_DEMOGRAPHICS = [
  { id: "male-teen", label: "Male Teen" },
  { id: "male-adult", label: "Male Adult" },
  { id: "male-senior", label: "Male Senior" },
  { id: "female-teen", label: "Female Teen" },
  { id: "female-adult", label: "Female Adult" },
  { id: "female-senior", label: "Female Senior" },
];

const LEGACY_DEMOGRAPHIC_IDS = new Set(["general", "senior", "employee", "delivery"]);

function isLegacyDemographicOptions(options) {
  return (
    options.length === LEGACY_DEMOGRAPHIC_IDS.size &&
    options.every((option) => LEGACY_DEMOGRAPHIC_IDS.has(option.id))
  );
}

function resolveDemographicOptions(parsed) {
  const saved = Array.isArray(parsed?.options) ? parsed.options : [];
  if (!saved.length) return DEFAULT_DEMOGRAPHICS;
  if (isLegacyDemographicOptions(saved)) return DEFAULT_DEMOGRAPHICS;
  return saved;
}

/** Quick-access tabs for non-barcoded front-store items. */
export const DEFAULT_FAVORITE_TABS = [
  { id: "newspapers", label: "Newspapers" },
  { id: "local", label: "Local" },
  { id: "seasonal", label: "Seasonal" },
  { id: "services", label: "Services" },
];

export const DEFAULT_FAVORITE_ITEMS = [
  { id: "np-tribune", tabId: "newspapers", name: "Daily Tribune", price: 2.5, emoji: "📰", sku: "NP-TRIBUNE" },
  { id: "np-globe", tabId: "newspapers", name: "National Post", price: 3.25, emoji: "📰", sku: "NP-GLOBE" },
  { id: "loc-honey", tabId: "local", name: "Local Honey 500g", price: 14.99, emoji: "🍯", sku: "LOC-HONEY" },
  { id: "loc-soap", tabId: "local", name: "Artisan Soap", price: 8.5, emoji: "🧼", sku: "LOC-SOAP" },
  { id: "sea-gift", tabId: "seasonal", name: "Gift Card $25", price: 25, emoji: "🎁", sku: "GC-25" },
  { id: "sea-basket", tabId: "seasonal", name: "Wellness Basket", price: 39.99, emoji: "🧺", sku: "BASKET-WELL" },
  { id: "svc-bottle", tabId: "services", name: "Bottle Deposit Return", price: -0.1, emoji: "♻️", sku: "DEP-RETURN" },
  { id: "svc-bag", tabId: "services", name: "Reusable Bag", price: 0.25, emoji: "🛍️", sku: "BAG-REUSE" },
];

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function loadPosFavoritesConfig() {
  const raw = localStorage.getItem(scopedStorageKey(POS_FAVORITES_STORAGE_KEY));
  const parsed = safeParse(raw, null);
  const tabs = Array.isArray(parsed?.tabs) && parsed.tabs.length ? parsed.tabs : DEFAULT_FAVORITE_TABS;
  const items = Array.isArray(parsed?.items) && parsed.items.length ? parsed.items : DEFAULT_FAVORITE_ITEMS;
  return { tabs, items };
}

export function savePosFavoritesConfig({ tabs, items }) {
  localStorage.setItem(
    scopedStorageKey(POS_FAVORITES_STORAGE_KEY),
    JSON.stringify({ tabs, items, updatedAt: new Date().toISOString() })
  );
}

export function loadPosDemographicConfig() {
  const raw = localStorage.getItem(scopedStorageKey(POS_DEMOGRAPHICS_STORAGE_KEY));
  const parsed = safeParse(raw, null);
  const options = resolveDemographicOptions(parsed);
  const fallbackDefaultId = options.some((o) => o.id === "male-adult") ? "male-adult" : options[0]?.id;
  const defaultId = options.some((o) => o.id === parsed?.defaultId)
    ? parsed.defaultId
    : fallbackDefaultId;
  const skipPrompt = Boolean(parsed?.skipPrompt ?? true);
  const quickTenderAmounts = Array.isArray(parsed?.quickTenderAmounts) && parsed.quickTenderAmounts.length
    ? parsed.quickTenderAmounts.map((amount) => Number(amount)).filter((amount) => Number.isFinite(amount) && amount > 0)
    : DEFAULT_TILL_OPTIONS.quickTenderAmounts;
  const taxRate = Number.isFinite(Number(parsed?.taxRate)) ? Number(parsed.taxRate) : DEFAULT_TILL_OPTIONS.taxRate;
  const defaultDiscountValue = Number.isFinite(Number(parsed?.defaultDiscountValue))
    ? Math.max(0, Number(parsed.defaultDiscountValue))
    : DEFAULT_TILL_OPTIONS.defaultDiscountValue;
  const defaultDiscountType = ["none", "percent", "amount"].includes(parsed?.defaultDiscountType)
    ? parsed.defaultDiscountType
    : DEFAULT_TILL_OPTIONS.defaultDiscountType;

  const securelinkTerminalPrefix =
    typeof parsed?.securelinkTerminalPrefix === "string" && parsed.securelinkTerminalPrefix.trim()
      ? parsed.securelinkTerminalPrefix.trim()
      : DEFAULT_TILL_OPTIONS.securelinkTerminalPrefix;

  return {
    options,
    defaultId,
    skipPrompt,
    securelinkTerminalPrefix,
    printMerchantCopy: parsed?.printMerchantCopy !== false,
    taxRate: Math.max(0, taxRate),
    defaultDiscountType,
    defaultDiscountValue,
    collectSaleNotes: parsed?.collectSaleNotes !== false,
    promptForBag: parsed?.promptForBag !== false,
    quickTenderAmounts,
  };
}

export function savePosDemographicConfig(config) {
  localStorage.setItem(scopedStorageKey(POS_DEMOGRAPHICS_STORAGE_KEY), JSON.stringify(config));
}

export function favoriteItemToCartLine(item) {
  return {
    sku: item.sku || `FAV-${item.id}`,
    name: item.name,
    category: "Favorites",
    qty: 1,
    price: Number(item.price) || 0,
    source: "favorites",
  };
}

export function serviceItemToCartLine({ sku, name, price }) {
  return {
    sku,
    name,
    category: "Services",
    qty: 1,
    price: Number(price) || 0,
    source: "service",
  };
}

export function groupFavoritesByTab(tabs, items) {
  const byTab = new Map(tabs.map((tab) => [tab.id, []]));
  for (const item of items) {
    if (!byTab.has(item.tabId)) byTab.set(item.tabId, []);
    byTab.get(item.tabId).push(item);
  }
  return tabs.map((tab) => ({ tab, items: byTab.get(tab.id) || [] }));
}
