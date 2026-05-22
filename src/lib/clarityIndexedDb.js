/**
 * Local IndexedDB for ClarityRx:
 * - KV store (autosave, backup config, import metadata)
 * - activity audit log
 * - imported Health Canada DPD product catalog
 * - McKesson inventory catalog
 * - Rx workflow items and stage events
 * - purchase orders (drug ordering)
 * - patient follow-up reminders (phone or in-person)
 */

import { scopedIndexedDbName } from "../session/scopedStorage";

const BASE_DB_NAME = "clarityrx-local-v1";
const DB_VERSION = 10;
const STORE_KV = "kv";
const STORE_ACTIVITIES = "activities";
const STORE_DPD_PRODUCTS = "dpd_products";
const STORE_INVENTORY_ITEMS = "inventory_items";
const STORE_RX_WORK_ITEMS = "rx_work_items";
const STORE_RX_STAGE_EVENTS = "rx_stage_events";
const STORE_RX_ATTACHMENTS = "rx_attachments";
const STORE_PURCHASE_ORDERS = "purchase_orders";
const STORE_REPLENISHMENT_RULES = "replenishment_rules";
const STORE_VENDOR_RETURNS = "vendor_returns";
const STORE_DAMAGED_GOODS = "damaged_goods";
const STORE_FOLLOWUPS = "follow_ups";
const STORE_POS_PROMOTIONS = "pos_promotions";

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function nextTick() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

export function openClarityDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(getClarityDbName(), DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = (ev) => {
      const db = ev.target.result;
      const tx = ev.target.transaction;
      if (!db.objectStoreNames.contains(STORE_KV)) {
        db.createObjectStore(STORE_KV, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORE_ACTIVITIES)) {
        db.createObjectStore(STORE_ACTIVITIES, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_DPD_PRODUCTS)) {
        const store = db.createObjectStore(STORE_DPD_PRODUCTS, { keyPath: "drugCode" });
        store.createIndex("din", "din", { unique: false });
        store.createIndex("brandName", "brandName", { unique: false });
        store.createIndex("status", "status", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_INVENTORY_ITEMS)) {
        const store = db.createObjectStore(STORE_INVENTORY_ITEMS, { keyPath: "inventoryKey" });
        store.createIndex("mckessonItemNumber", "mckessonItemNumber", { unique: false });
        store.createIndex("din", "din", { unique: false });
        store.createIndex("brandName", "brandName", { unique: false });
        store.createIndex("lastUpdated", "lastUpdated", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_RX_WORK_ITEMS)) {
        const store = db.createObjectStore(STORE_RX_WORK_ITEMS, { keyPath: "id" });
        store.createIndex("stage", "stage", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
        store.createIndex("rxNumber", "rxNumber", { unique: false });
        store.createIndex("assignedRole", "assignedRole", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_RX_STAGE_EVENTS)) {
        const store = db.createObjectStore(STORE_RX_STAGE_EVENTS, { keyPath: "id" });
        store.createIndex("rxId", "rxId", { unique: false });
        store.createIndex("at", "at", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_RX_ATTACHMENTS)) {
        const store = db.createObjectStore(STORE_RX_ATTACHMENTS, { keyPath: "id" });
        store.createIndex("rxId", "rxId", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_PURCHASE_ORDERS)) {
        const store = db.createObjectStore(STORE_PURCHASE_ORDERS, { keyPath: "orderNumber" });
        store.createIndex("date", "date", { unique: false });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("supplier", "supplier", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_REPLENISHMENT_RULES)) {
        const store = db.createObjectStore(STORE_REPLENISHMENT_RULES, { keyPath: "id" });
        store.createIndex("supplier", "supplier", { unique: false });
        store.createIndex("sku", "sku", { unique: false });
        store.createIndex("enabled", "enabled", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_VENDOR_RETURNS)) {
        const store = db.createObjectStore(STORE_VENDOR_RETURNS, { keyPath: "id" });
        store.createIndex("supplier", "supplier", { unique: false });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_DAMAGED_GOODS)) {
        const store = db.createObjectStore(STORE_DAMAGED_GOODS, { keyPath: "id" });
        store.createIndex("supplier", "supplier", { unique: false });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_FOLLOWUPS)) {
        const store = db.createObjectStore(STORE_FOLLOWUPS, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("dueAt", "dueAt", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("rxId", "rxId", { unique: false });
      } else {
        const fuStore = tx.objectStore(STORE_FOLLOWUPS);
        if (!fuStore.indexNames.contains("rxId")) {
          fuStore.createIndex("rxId", "rxId", { unique: false });
        }
      }
      if (!db.objectStoreNames.contains(STORE_POS_PROMOTIONS)) {
        const store = db.createObjectStore(STORE_POS_PROMOTIONS, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("type", "type", { unique: false });
        store.createIndex("source", "source", { unique: false });
        store.createIndex("startAt", "startAt", { unique: false });
        store.createIndex("endAt", "endAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

let dbPromise;
let activeWorkspaceContext = null;

export function getClarityDbName() {
  if (!activeWorkspaceContext || activeWorkspaceContext.workspaceId === "default-workspace") {
    return BASE_DB_NAME;
  }
  return scopedIndexedDbName(BASE_DB_NAME, activeWorkspaceContext);
}

export async function setClarityDbWorkspace(context) {
  const nextWorkspaceId = context?.workspaceId || "default-workspace";
  if (activeWorkspaceContext?.workspaceId === nextWorkspaceId) return;
  const currentDbPromise = dbPromise;
  activeWorkspaceContext = { ...context, workspaceId: nextWorkspaceId };
  dbPromise = null;
  if (!currentDbPromise) return;
  try {
    const db = await currentDbPromise;
    db.close();
  } catch {
    // Ignore failed opens while swapping workspace-local databases.
  }
}

/**
 * Jest runs multiple tests in one JS realm; `indexedDB.deleteDatabase` does not reset our cached
 * open promise. Call this after deleting the DB (see setupTests) so the next `getClarityDb()`
 * opens a fresh connection.
 */
export async function resetClarityDbForTests() {
  const currentDbPromise = dbPromise;
  dbPromise = null;
  if (!currentDbPromise) return;
  try {
    const db = await currentDbPromise;
    db.close();
  } catch {
    // Ignore failed opens during Jest cleanup; the next test will create a fresh DB.
  }
}

export function getClarityDb() {
  if (!dbPromise) dbPromise = openClarityDb();
  return dbPromise;
}

export async function kvGet(key) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_KV], "readonly");
  const row = await promisifyRequest(tx.objectStore(STORE_KV).get(key));
  return row ? row.value : undefined;
}

export async function kvPut(key, value) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_KV], "readwrite");
  tx.objectStore(STORE_KV).put({ key, value, updatedAt: Date.now() });
  await txDone(tx);
}

export async function activityAppend(row) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_ACTIVITIES], "readwrite");
  tx.objectStore(STORE_ACTIVITIES).put(row);
  await txDone(tx);
  await activityTrimIfNeeded();
}

async function activityTrimIfNeeded() {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_ACTIVITIES], "readonly");
  const all = await promisifyRequest(tx.objectStore(STORE_ACTIVITIES).getAll());
  await txDone(tx);
  const MAX = 4000;
  const KEEP = 3000;
  if (all.length <= MAX) return;
  all.sort((a, b) => a.ts - b.ts);
  const drop = all.slice(0, all.length - KEEP);
  const txw = db.transaction([STORE_ACTIVITIES], "readwrite");
  const st = txw.objectStore(STORE_ACTIVITIES);
  drop.forEach((r) => st.delete(r.id));
  await txDone(txw);
}

/** Newest first */
export async function activityList(limit = 200) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_ACTIVITIES], "readonly");
  const all = await promisifyRequest(tx.objectStore(STORE_ACTIVITIES).getAll());
  await txDone(tx);
  all.sort((a, b) => b.ts - a.ts);
  return all.slice(0, limit);
}

export async function getAutosaveRecord() {
  return kvGet("autosave");
}

export async function putAutosaveRecord(value) {
  return kvPut("autosave", value);
}

export async function getBackupConfig() {
  const v = await kvGet("backupConfig");
  return (
    v || {
      url: "",
      token: "",
      intervalSec: 45,
    }
  );
}

export async function putBackupConfig(value) {
  return kvPut("backupConfig", value);
}

export async function getRxWorkItemCount() {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_RX_WORK_ITEMS], "readonly");
  const count = await promisifyRequest(tx.objectStore(STORE_RX_WORK_ITEMS).count());
  await txDone(tx);
  return count;
}

export async function listRxWorkItems(limit = 500) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_RX_WORK_ITEMS], "readonly");
  const rows = await promisifyRequest(tx.objectStore(STORE_RX_WORK_ITEMS).getAll());
  await txDone(tx);
  return rows
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))
    .slice(0, limit);
}

export async function getRxWorkItem(id) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_RX_WORK_ITEMS], "readonly");
  const row = await promisifyRequest(tx.objectStore(STORE_RX_WORK_ITEMS).get(id));
  await txDone(tx);
  return row || null;
}

export async function putRxWorkItem(value) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_RX_WORK_ITEMS], "readwrite");
  tx.objectStore(STORE_RX_WORK_ITEMS).put(value);
  await txDone(tx);
}

export async function putRxAttachment(value) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_RX_ATTACHMENTS], "readwrite");
  tx.objectStore(STORE_RX_ATTACHMENTS).put(value);
  await txDone(tx);
}

export async function listRxAttachments(rxId) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_RX_ATTACHMENTS], "readonly");
  const rows = await promisifyRequest(tx.objectStore(STORE_RX_ATTACHMENTS).index("rxId").getAll(rxId));
  await txDone(tx);
  return rows.sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
}

export async function deleteRxAttachment(id) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_RX_ATTACHMENTS], "readwrite");
  tx.objectStore(STORE_RX_ATTACHMENTS).delete(id);
  await txDone(tx);
}

export async function replaceRxWorkItems(items) {
  const db = await getClarityDb();
  const clearTx = db.transaction([STORE_RX_WORK_ITEMS], "readwrite");
  clearTx.objectStore(STORE_RX_WORK_ITEMS).clear();
  await txDone(clearTx);
  const tx = db.transaction([STORE_RX_WORK_ITEMS], "readwrite");
  const store = tx.objectStore(STORE_RX_WORK_ITEMS);
  items.forEach((row) => store.put(row));
  await txDone(tx);
}

function scoreRxWorkItem(item, query) {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const searchableText = String(item.searchableText || "").toLowerCase();
  const patientName = String(item.patient?.name || "").toLowerCase();
  const rxNumber = String(item.rxNumber || "").toLowerCase();
  const din = String(item.medication?.din || "").toLowerCase();
  let score = 0;
  if (rxNumber === q) score += 1200;
  else if (rxNumber.includes(q)) score += 500;
  if (din === q) score += 1000;
  else if (din.includes(q)) score += 380;
  if (patientName.startsWith(q)) score += 800;
  else if (patientName.includes(q)) score += 320;
  if (searchableText.includes(q)) score += 120;
  return score;
}

export async function searchRxWorkItems(query, limit = 100) {
  const q = String(query || "").trim();
  if (!q) return [];
  const db = await getClarityDb();
  const tx = db.transaction([STORE_RX_WORK_ITEMS], "readonly");
  const rows = await promisifyRequest(tx.objectStore(STORE_RX_WORK_ITEMS).getAll());
  await txDone(tx);
  return rows
    .map((item) => ({ item, score: scoreRxWorkItem(item, q) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(b.item.updatedAt || "").localeCompare(String(a.item.updatedAt || ""));
    })
    .slice(0, limit)
    .map((row) => row.item);
}

export async function appendRxStageEvent(value) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_RX_STAGE_EVENTS], "readwrite");
  tx.objectStore(STORE_RX_STAGE_EVENTS).put(value);
  await txDone(tx);
}

export async function listRxStageEvents(rxId, limit = 100) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_RX_STAGE_EVENTS], "readonly");
  const rows = await promisifyRequest(tx.objectStore(STORE_RX_STAGE_EVENTS).getAll());
  await txDone(tx);
  return rows
    .filter((row) => row.rxId === rxId)
    .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")))
    .slice(0, limit);
}

function drugProfileKey(din) {
  return `drugProfile:${String(din || "").trim()}`;
}

export async function getDrugProfileRecord(din) {
  if (!String(din || "").trim()) return null;
  return (await kvGet(drugProfileKey(din))) || null;
}

export async function putDrugProfileRecord(din, value) {
  if (!String(din || "").trim()) {
    throw new Error("DIN is required to store a drug profile record");
  }
  return kvPut(drugProfileKey(din), value);
}

export async function listDrugProfileRecords() {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_KV], "readonly");
  const rows = await promisifyRequest(tx.objectStore(STORE_KV).getAll());
  await txDone(tx);
  return rows
    .filter((row) => String(row?.key || "").startsWith("drugProfile:") && row?.value)
    .map((row) => row.value)
    .sort((a, b) => String(a.brandName || "").localeCompare(String(b.brandName || "")));
}

export async function getDpdImportMeta() {
  return kvGet("dpdImportMeta");
}

export async function putDpdImportMeta(value) {
  return kvPut("dpdImportMeta", value);
}

export async function clearDpdImportMeta() {
  return kvPut("dpdImportMeta", null);
}

export async function getMckessonCatalogMeta() {
  return kvGet("mckessonCatalogMeta");
}

export async function putMckessonCatalogMeta(value) {
  return kvPut("mckessonCatalogMeta", value);
}

export async function clearMckessonCatalogMeta() {
  return kvPut("mckessonCatalogMeta", null);
}

export async function replaceDpdProducts(products, meta) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_DPD_PRODUCTS], "readwrite");
  const store = tx.objectStore(STORE_DPD_PRODUCTS);
  store.clear();
  products.forEach((row) => store.put(row));
  await txDone(tx);
  await putDpdImportMeta(meta);
}

export async function clearDpdProducts() {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_DPD_PRODUCTS], "readwrite");
  tx.objectStore(STORE_DPD_PRODUCTS).clear();
  await txDone(tx);
  await clearDpdImportMeta();
}

export async function getDpdProductCount() {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_DPD_PRODUCTS], "readonly");
  const count = await promisifyRequest(tx.objectStore(STORE_DPD_PRODUCTS).count());
  await txDone(tx);
  return count;
}

export async function replaceInventoryItems(items, meta) {
  const db = await getClarityDb();
  const clearTx = db.transaction([STORE_INVENTORY_ITEMS], "readwrite");
  clearTx.objectStore(STORE_INVENTORY_ITEMS).clear();
  await txDone(clearTx);

  const BATCH_SIZE = 1000;
  for (let offset = 0; offset < items.length; offset += BATCH_SIZE) {
    const tx = db.transaction([STORE_INVENTORY_ITEMS], "readwrite");
    const store = tx.objectStore(STORE_INVENTORY_ITEMS);
    items.slice(offset, offset + BATCH_SIZE).forEach((row) => store.put(row));
    await txDone(tx);
    await nextTick();
  }

  await putMckessonCatalogMeta(meta);
}

export async function clearInventoryItems() {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_INVENTORY_ITEMS], "readwrite");
  tx.objectStore(STORE_INVENTORY_ITEMS).clear();
  await txDone(tx);
  await clearMckessonCatalogMeta();
}

export async function getInventoryItemCount() {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_INVENTORY_ITEMS], "readonly");
  const count = await promisifyRequest(tx.objectStore(STORE_INVENTORY_ITEMS).count());
  await txDone(tx);
  return count;
}

export async function listInventoryItems(limit = 200) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_INVENTORY_ITEMS], "readonly");
  const all = await promisifyRequest(tx.objectStore(STORE_INVENTORY_ITEMS).getAll());
  await txDone(tx);
  return all
    .sort((a, b) => String(a.brandName || "").localeCompare(String(b.brandName || "")))
    .slice(0, limit);
}

function scoreDpdProduct(product, query) {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  let score = 0;
  const brand = String(product.brandName || "").toLowerCase();
  const descriptor = String(product.descriptor || "").toLowerCase();
  const din = String(product.din || "").toLowerCase();
  const ingredients = Array.isArray(product.ingredients) ? product.ingredients.join(" ").toLowerCase() : "";
  const searchable = String(product.searchableText || "").toLowerCase();

  if (din === q) score += 1000;
  else if (din.startsWith(q)) score += 700;
  else if (din.includes(q)) score += 300;

  if (brand === q) score += 900;
  else if (brand.startsWith(q)) score += 600;
  else if (brand.includes(q)) score += 240;

  if (descriptor.startsWith(q)) score += 160;
  else if (descriptor.includes(q)) score += 80;

  if (ingredients.includes(q)) score += 140;
  if (searchable.includes(q)) score += 60;

  return score;
}

export async function searchDpdProducts(query, limit = 8) {
  const q = String(query || "").trim();
  if (!q) return [];

  const db = await getClarityDb();
  const tx = db.transaction([STORE_DPD_PRODUCTS], "readonly");
  const all = await promisifyRequest(tx.objectStore(STORE_DPD_PRODUCTS).getAll());
  await txDone(tx);

  return all
    .map((product) => ({
      product,
      score: scoreDpdProduct(product, q),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.product.brandName || "").localeCompare(String(b.product.brandName || ""));
    })
    .slice(0, limit)
    .map((row) => row.product);
}

function scoreInventoryItem(item, query) {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const itemNumber = String(item.mckessonItemNumber || "").toLowerCase();
  const din = String(item.din || "").toLowerCase();
  const brandName = String(item.brandName || "").toLowerCase();
  const packSize = String(item.packSize || "").toLowerCase();
  const searchableText = String(item.searchableText || "").toLowerCase();

  let score = 0;
  if (itemNumber === q) score += 1000;
  else if (itemNumber.startsWith(q)) score += 700;
  else if (itemNumber.includes(q)) score += 300;

  if (din === q) score += 850;
  else if (din.startsWith(q)) score += 600;
  else if (din.includes(q)) score += 260;

  if (brandName === q) score += 900;
  else if (brandName.startsWith(q)) score += 650;
  else if (brandName.includes(q)) score += 240;

  if (packSize.includes(q)) score += 120;
  if (searchableText.includes(q)) score += 60;

  return score;
}

export async function searchInventoryItems(query, limit = 50) {
  const q = String(query || "").trim();
  if (!q) return [];

  const db = await getClarityDb();
  const tx = db.transaction([STORE_INVENTORY_ITEMS], "readonly");
  const all = await promisifyRequest(tx.objectStore(STORE_INVENTORY_ITEMS).getAll());
  await txDone(tx);

  return all
    .map((item) => ({ item, score: scoreInventoryItem(item, q) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.item.brandName || "").localeCompare(String(b.item.brandName || ""));
    })
    .slice(0, limit)
    .map((row) => row.item);
}

// ─── PURCHASE ORDERS ─────────────────────────────────────────────────────────

export async function savePurchaseOrder(order) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_PURCHASE_ORDERS], "readwrite");
  tx.objectStore(STORE_PURCHASE_ORDERS).put(order);
  await txDone(tx);
}

export async function getAllPurchaseOrders() {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_PURCHASE_ORDERS], "readonly");
  const all = await promisifyRequest(tx.objectStore(STORE_PURCHASE_ORDERS).getAll());
  await txDone(tx);
  return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function updatePurchaseOrderStatus(orderNumber, status) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_PURCHASE_ORDERS], "readwrite");
  const store = tx.objectStore(STORE_PURCHASE_ORDERS);
  const order = await promisifyRequest(store.get(orderNumber));
  if (order) {
    store.put({ ...order, status, updatedAt: new Date().toISOString() });
  }
  await txDone(tx);
}

export async function getPurchaseOrder(orderNumber) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_PURCHASE_ORDERS], "readonly");
  const order = await promisifyRequest(tx.objectStore(STORE_PURCHASE_ORDERS).get(orderNumber));
  await txDone(tx);
  return order || null;
}

export async function deletePurchaseOrder(orderNumber) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_PURCHASE_ORDERS], "readwrite");
  tx.objectStore(STORE_PURCHASE_ORDERS).delete(orderNumber);
  await txDone(tx);
}

// ─── REPLENISHMENT RULES ───────────────────────────────────────────────────

export async function listReplenishmentRules() {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_REPLENISHMENT_RULES], "readonly");
  const all = await promisifyRequest(tx.objectStore(STORE_REPLENISHMENT_RULES).getAll());
  await txDone(tx);
  return all.sort((a, b) => String(a.sku || "").localeCompare(String(b.sku || "")));
}

export async function saveReplenishmentRule(rule) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_REPLENISHMENT_RULES], "readwrite");
  tx.objectStore(STORE_REPLENISHMENT_RULES).put(rule);
  await txDone(tx);
}

export async function deleteReplenishmentRule(id) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_REPLENISHMENT_RULES], "readwrite");
  tx.objectStore(STORE_REPLENISHMENT_RULES).delete(id);
  await txDone(tx);
}

// ─── VENDOR RETURNS (RTV) ──────────────────────────────────────────────────

export async function listVendorReturns() {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_VENDOR_RETURNS], "readonly");
  const all = await promisifyRequest(tx.objectStore(STORE_VENDOR_RETURNS).getAll());
  await txDone(tx);
  return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function saveVendorReturn(row) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_VENDOR_RETURNS], "readwrite");
  tx.objectStore(STORE_VENDOR_RETURNS).put(row);
  await txDone(tx);
}

export async function getVendorReturn(id) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_VENDOR_RETURNS], "readonly");
  const row = await promisifyRequest(tx.objectStore(STORE_VENDOR_RETURNS).get(id));
  await txDone(tx);
  return row || null;
}

// ─── DAMAGED GOODS ───────────────────────────────────────────────────────────

export async function listDamagedGoods() {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_DAMAGED_GOODS], "readonly");
  const all = await promisifyRequest(tx.objectStore(STORE_DAMAGED_GOODS).getAll());
  await txDone(tx);
  return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function saveDamagedGoods(row) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_DAMAGED_GOODS], "readwrite");
  tx.objectStore(STORE_DAMAGED_GOODS).put(row);
  await txDone(tx);
}

// ─── PATIENT FOLLOW-UPS (reminders for phone or in-person contact) ─────────

export async function putFollowUp(row) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_FOLLOWUPS], "readwrite");
  tx.objectStore(STORE_FOLLOWUPS).put(row);
  await txDone(tx);
}

export async function getFollowUp(id) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_FOLLOWUPS], "readonly");
  const row = await promisifyRequest(tx.objectStore(STORE_FOLLOWUPS).get(id));
  await txDone(tx);
  return row || null;
}

export async function listFollowUps() {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_FOLLOWUPS], "readonly");
  const all = await promisifyRequest(tx.objectStore(STORE_FOLLOWUPS).getAll());
  await txDone(tx);
  return all.sort((a, b) => {
    const openA = a.status === "open" ? 0 : 1;
    const openB = b.status === "open" ? 0 : 1;
    if (openA !== openB) return openA - openB;
    const dueA = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
    const dueB = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
    if (dueA !== dueB) return dueA - dueB;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
}

export async function deleteFollowUp(id) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_FOLLOWUPS], "readwrite");
  tx.objectStore(STORE_FOLLOWUPS).delete(id);
  await txDone(tx);
}

// ─── POS PROMOTIONS ──────────────────────────────────────────────────────────

const PROMO_SYNC_KV_KEY = "pos.promotions.sync";

export async function listPosPromotions() {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_POS_PROMOTIONS], "readonly");
  const all = await promisifyRequest(tx.objectStore(STORE_POS_PROMOTIONS).getAll());
  await txDone(tx);
  return all.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
}

export async function savePosPromotion(campaign) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_POS_PROMOTIONS], "readwrite");
  tx.objectStore(STORE_POS_PROMOTIONS).put(campaign);
  await txDone(tx);
}

export async function deletePosPromotion(id) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_POS_PROMOTIONS], "readwrite");
  tx.objectStore(STORE_POS_PROMOTIONS).delete(id);
  await txDone(tx);
}

export async function getPosPromotionSyncMeta() {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_KV], "readonly");
  const row = await promisifyRequest(tx.objectStore(STORE_KV).get(PROMO_SYNC_KV_KEY));
  await txDone(tx);
  return row?.value || { lastSyncAt: null, lastSource: null, pendingCount: 0 };
}

export async function savePosPromotionSyncMeta(meta) {
  const db = await getClarityDb();
  const tx = db.transaction([STORE_KV], "readwrite");
  tx.objectStore(STORE_KV).put({ key: PROMO_SYNC_KV_KEY, value: meta, updatedAt: new Date().toISOString() });
  await txDone(tx);
}
