import { scopedStorageKey } from "../session/scopedStorage";

export const POS_FAVORITES_STORAGE_KEY = "clarityrx-pos-favorites-v1";
export const POS_DEMOGRAPHICS_STORAGE_KEY = "clarityrx-pos-demographics-v1";

/** Finestra-style customer types (default skips till prompt when enabled). */
export const DEFAULT_DEMOGRAPHICS = [
  { id: "general", label: "General Customer" },
  { id: "senior", label: "Senior" },
  { id: "employee", label: "Staff" },
  { id: "delivery", label: "Delivery" },
];

/** Quick-access tabs for non-barcoded front-store items (Finestra Favorites). */
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
  const options = Array.isArray(parsed?.options) && parsed.options.length ? parsed.options : DEFAULT_DEMOGRAPHICS;
  const defaultId = parsed?.defaultId || options[0]?.id || "general";
  const skipPrompt = Boolean(parsed?.skipPrompt ?? true);
  const printMerchantCopy = parsed?.printMerchantCopy !== false;
  return { options, defaultId, skipPrompt, printMerchantCopy };
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

export function groupFavoritesByTab(tabs, items) {
  const byTab = new Map(tabs.map((tab) => [tab.id, []]));
  for (const item of items) {
    if (!byTab.has(item.tabId)) byTab.set(item.tabId, []);
    byTab.get(item.tabId).push(item);
  }
  return tabs.map((tab) => ({ tab, items: byTab.get(tab.id) || [] }));
}
