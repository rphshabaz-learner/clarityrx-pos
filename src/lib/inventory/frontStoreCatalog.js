import {
  listFrontStoreProducts,
  saveFrontStoreProduct,
} from "../clarityIndexedDb";
import { buildSeedFrontStoreProducts } from "./seedFrontStore";
import { productToCatalogItem } from "./frontStoreTypes";
import { searchFrontStoreProducts } from "./frontStoreSearch";

let catalogCache = null;
let catalogPromise = null;

export async function ensureFrontStoreCatalogSeeded() {
  let rows = await listFrontStoreProducts();
  if (!rows.length) {
    const seed = buildSeedFrontStoreProducts();
    await Promise.all(seed.map((row) => saveFrontStoreProduct(row)));
    rows = seed;
  }
  return rows;
}

export async function loadSellableCatalog({ force = false } = {}) {
  if (!force && catalogCache) return catalogCache;
  if (!force && catalogPromise) return catalogPromise;
  catalogPromise = (async () => {
    const products = await ensureFrontStoreCatalogSeeded();
    const items = products
      .filter((p) => p.status !== "discontinued")
      .map(productToCatalogItem);
    catalogCache = items;
    return items;
  })();
  try {
    return await catalogPromise;
  } finally {
    catalogPromise = null;
  }
}

export function invalidateSellableCatalogCache() {
  catalogCache = null;
}

export async function searchSellableProducts(query) {
  const products = await ensureFrontStoreCatalogSeeded();
  const active = products.filter((p) => p.status !== "discontinued");
  const hits = searchFrontStoreProducts(active, query);
  return hits.map(productToCatalogItem);
}

export function listDepartmentsFromProducts(products) {
  const seen = new Set();
  const rows = [];
  for (const product of products) {
    const label = product.category || product.departmentId || "General";
    if (seen.has(label)) continue;
    seen.add(label);
    rows.push(label);
  }
  return rows.sort((a, b) => a.localeCompare(b));
}
