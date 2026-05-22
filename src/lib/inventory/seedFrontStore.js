import { POS_FRONT_STORE_ITEMS } from "../../modules/pos/posCatalog";
import { emptyProduct, generateProductId } from "./frontStoreTypes";

const CATEGORY_TO_DEPARTMENT = {
  "pain relief": "otc",
  "digestive health": "otc",
  "first aid": "otc",
  allergy: "otc",
  vitamins: "vitamins",
  "cold and flu": "otc",
};

function mapCategoryToDepartment(category) {
  const key = String(category || "").trim().toLowerCase();
  return CATEGORY_TO_DEPARTMENT[key] || "front_shop";
}

export function buildSeedFrontStoreProducts() {
  return POS_FRONT_STORE_ITEMS.map((row, index) => {
    const base = emptyProduct();
    const cost = Math.max(0, Number(row.price) * 0.55);
    return {
      ...base,
      id: generateProductId(),
      sku: row.sku,
      name: row.name,
      upc: row.barcode,
      barcodes: row.barcode ? [row.barcode] : [],
      departmentId: mapCategoryToDepartment(row.category),
      category: row.category || "",
      cost: Math.round(cost * 100) / 100,
      retail: Number(row.price) || 0,
      onHand: Number(row.stock) || 0,
      vendorId: index % 2 === 0 ? "mckesson" : "kohl_frisch",
      ageRestrictionClass: row.ageRestrictionClass || base.ageRestrictionClass,
      createdAt: base.createdAt,
      updatedAt: base.updatedAt,
    };
  });
}
