import type { Product } from "@/types";

/** Mock pharmacy front-store + OTC catalog for NOVA POS demos. */
export const PRODUCTS: Product[] = [
  // OTC — analgesics, cold, allergy
  { id: 1, name: "Acetaminophen 500mg 100ct", price: 8.99, category: "OTC", sku: "OTC001", stock: 42 },
  { id: 2, name: "Ibuprofen 200mg 50ct", price: 7.49, category: "OTC", sku: "OTC002", stock: 38 },
  { id: 3, name: "Extra Strength Headache Relief 24ct", price: 6.29, category: "OTC", sku: "OTC003", stock: 55 },
  { id: 4, name: "All-Day Allergy Relief 30ct", price: 14.99, category: "OTC", sku: "OTC004", stock: 28 },
  { id: 5, name: "Nasal Decongestant Spray 15ml", price: 9.49, category: "OTC", sku: "OTC005", stock: 22 },
  { id: 6, name: "Daytime Cold & Flu 16ct", price: 11.99, category: "OTC", sku: "OTC006", stock: 31 },
  { id: 7, name: "Nighttime Cough Syrup 120ml", price: 10.49, category: "OTC", sku: "OTC007", stock: 19 },
  { id: 8, name: "Antacid Chewable 72ct", price: 5.99, category: "OTC", sku: "OTC008", stock: 44 },

  // Vitamins & supplements
  { id: 9, name: "Vitamin D3 1000 IU 120ct", price: 12.99, category: "Vitamins", sku: "VIT001", stock: 36 },
  { id: 10, name: "Multivitamin Adult 90ct", price: 16.49, category: "Vitamins", sku: "VIT002", stock: 27 },
  { id: 11, name: "Omega-3 Fish Oil 60ct", price: 18.99, category: "Vitamins", sku: "VIT003", stock: 24 },
  { id: 12, name: "Vitamin C 500mg 100ct", price: 9.99, category: "Vitamins", sku: "VIT004", stock: 40 },

  // First aid
  { id: 13, name: "Adhesive Bandages Assorted 80ct", price: 4.49, category: "First Aid", sku: "FA001", stock: 52 },
  { id: 14, name: "Hydrogen Peroxide 473ml", price: 3.29, category: "First Aid", sku: "FA002", stock: 30 },
  { id: 15, name: "Instant Cold Pack Twin", price: 5.49, category: "First Aid", sku: "FA003", stock: 18 },
  { id: 16, name: "Elastic Wrist Support", price: 11.99, category: "First Aid", sku: "FA004", stock: 14 },

  // Personal care
  { id: 17, name: "Sensitive Skin Body Lotion 532ml", price: 8.49, category: "Personal Care", sku: "PC001", stock: 26 },
  { id: 18, name: "Fluoride Toothpaste 135ml", price: 4.99, category: "Personal Care", sku: "PC002", stock: 48 },
  { id: 19, name: "Soft Bristle Toothbrush", price: 3.49, category: "Personal Care", sku: "PC003", stock: 60 },
  { id: 20, name: "Alcohol-Free Mouthwash 500ml", price: 6.99, category: "Personal Care", sku: "PC004", stock: 33 },

  // Baby & child
  { id: 21, name: "Infant Pain & Fever Drops 30ml", price: 9.99, category: "Baby", sku: "BAB001", stock: 20 },
  { id: 22, name: "Diaper Rash Ointment 113g", price: 7.49, category: "Baby", sku: "BAB002", stock: 25 },
  { id: 23, name: "Children's Chewable Vitamins 60ct", price: 11.49, category: "Baby", sku: "BAB003", stock: 17 },

  // Digestive
  { id: 24, name: "Probiotic Daily 30ct", price: 19.99, category: "Digestive", sku: "DIG001", stock: 21 },
  { id: 25, name: "Fiber Supplement Powder 114g", price: 13.49, category: "Digestive", sku: "DIG002", stock: 16 },
  { id: 26, name: "Anti-Diarrheal 12ct", price: 8.29, category: "Digestive", sku: "DIG003", stock: 29 },

  // Skin care
  { id: 27, name: "SPF 50 Face Sunscreen 88ml", price: 15.99, category: "Skin Care", sku: "SK001", stock: 23 },
  { id: 28, name: "Hydrocortisone Cream 1% 30g", price: 6.49, category: "Skin Care", sku: "SK002", stock: 34 },
  { id: 29, name: "Acne Spot Treatment 28g", price: 9.49, category: "Skin Care", sku: "SK003", stock: 12 },

  // Front store (convenience at register)
  { id: 30, name: "Bottled Water 500ml", price: 1.49, category: "Front Store", sku: "FS001", stock: 72 },
  { id: 31, name: "Protein Bar Chocolate", price: 2.99, category: "Front Store", sku: "FS002", stock: 45 },
  { id: 32, name: "Hand Sanitizer 236ml", price: 4.29, category: "Front Store", sku: "FS003", stock: 58 },
  { id: 33, name: "Travel Tissue Pack 10ct", price: 2.49, category: "Front Store", sku: "FS004", stock: 64 },
  { id: 34, name: "Sugar-Free Mints 50ct", price: 2.29, category: "Front Store", sku: "FS005", stock: 41 },
];

export const CATEGORIES = ["All", ...new Set(PRODUCTS.map((p) => p.category))];

export function findProductBySkuOrId(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return (
    PRODUCTS.find((p) => p.sku.toLowerCase() === q) ??
    PRODUCTS.find((p) => String(p.id) === q) ??
    null
  );
}
