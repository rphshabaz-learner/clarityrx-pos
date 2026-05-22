import { AGE_RESTRICTION_NONE, normalizeAgeRestrictionClass } from "../compliance/ageRestrictedProducts";

/** Front-shop / OTC inventory departments (pharmacy retail categories). */
export const FRONT_STORE_DEPARTMENTS = [
  { id: "otc", label: "OTC" },
  { id: "cosmetics", label: "Cosmetics" },
  { id: "convenience", label: "Convenience" },
  { id: "seasonal", label: "Seasonal" },
  { id: "home_healthcare", label: "Home healthcare" },
  { id: "vitamins", label: "Vitamins" },
  { id: "snacks", label: "Snacks" },
  { id: "front_shop", label: "Front shop" },
];

export const PRODUCT_STATUS = {
  ACTIVE: "active",
  DISCONTINUED: "discontinued",
  SEASONAL_HOLD: "seasonal_hold",
};

export const PRODUCT_STATUS_OPTIONS = [
  { id: PRODUCT_STATUS.ACTIVE, label: "Active" },
  { id: PRODUCT_STATUS.DISCONTINUED, label: "Discontinued" },
  { id: PRODUCT_STATUS.SEASONAL_HOLD, label: "Seasonal hold" },
];

export function generateProductId() {
  return `fs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateLotId() {
  return `lot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function generateCycleCountId() {
  return `cc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function departmentLabel(id) {
  return FRONT_STORE_DEPARTMENTS.find((row) => row.id === id)?.label || id || "—";
}

export function productStatusLabel(status) {
  return PRODUCT_STATUS_OPTIONS.find((row) => row.id === status)?.label || status || "—";
}

export function productDisplayName(product) {
  if (!product) return "—";
  return product.name || product.sku || "Product";
}

/** Till-facing row shape derived from maintained product. */
export function productToCatalogItem(product) {
  const primaryUpc = product.upc || product.barcodes?.[0] || "";
  return {
    sku: product.sku,
    barcode: primaryUpc,
    name: product.name,
    category: product.category || departmentLabel(product.departmentId),
    stock: Number(product.onHand) || 0,
    price: Number(product.retail) || 0,
    controlled: Boolean(product.controlled || product.controlledSale),
    ageRestrictionClass: normalizeAgeRestrictionClass(product.ageRestrictionClass),
  };
}

export function emptyProduct() {
  const stamp = new Date().toISOString();
  return {
    id: generateProductId(),
    sku: "",
    name: "",
    upc: "",
    barcodes: [],
    departmentId: "otc",
    category: "",
    cost: 0,
    retail: 0,
    targetMarginPercent: null,
    onHand: 0,
    vendorId: "",
    status: PRODUCT_STATUS.ACTIVE,
    ageRestrictionClass: AGE_RESTRICTION_NONE,
    trackExpiry: false,
    lots: [],
    notes: "",
    createdAt: stamp,
    updatedAt: stamp,
  };
}

export function emptyLot() {
  return {
    id: generateLotId(),
    lotNumber: "",
    expiryDate: "",
    qty: 0,
  };
}

export function emptyCycleCountSession() {
  return {
    id: generateCycleCountId(),
    name: "",
    status: "draft",
    blindCount: true,
    lines: [],
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
}
