/**
 * Age-restricted front-store product classes (nicotine, lottery, alcohol, etc.).
 * Verification is required per class per cart session before add-to-cart and again at checkout.
 */

export const AGE_RESTRICTION_NONE = "none";

/** @typedef {keyof typeof AGE_RESTRICTION_CLASSES} AgeRestrictionClassId */

export const AGE_RESTRICTION_CLASSES = {
  none: {
    id: "none",
    label: "Not age-restricted",
    minAge: 0,
    useStoreMinimum: false,
    receiptTag: null,
  },
  nicotine: {
    id: "nicotine",
    label: "Nicotine / tobacco",
    minAge: null,
    useStoreMinimum: true,
    receiptTag: "AGE-TOBACCO",
  },
  vaping: {
    id: "vaping",
    label: "Vaping products",
    minAge: null,
    useStoreMinimum: true,
    receiptTag: "AGE-VAPE",
  },
  lottery: {
    id: "lottery",
    label: "Lottery",
    minAge: null,
    useStoreMinimum: true,
    receiptTag: "AGE-LOTTERY",
  },
  alcohol: {
    id: "alcohol",
    label: "Alcohol",
    minAge: null,
    useStoreMinimum: true,
    receiptTag: "AGE-ALCOHOL",
  },
  cannabis: {
    id: "cannabis",
    label: "Cannabis",
    minAge: null,
    useStoreMinimum: true,
    receiptTag: "AGE-CANNABIS",
  },
  fireworks: {
    id: "fireworks",
    label: "Fireworks",
    minAge: 18,
    useStoreMinimum: false,
    receiptTag: "AGE-FIREWORKS",
  },
  energy_drink: {
    id: "energy_drink",
    label: "High-caffeine energy drink",
    minAge: null,
    useStoreMinimum: true,
    receiptTag: "AGE-ENERGY",
  },
};

export const AGE_RESTRICTION_CLASS_OPTIONS = Object.values(AGE_RESTRICTION_CLASSES).filter(
  (row) => row.id !== AGE_RESTRICTION_NONE
);

const CATEGORY_HINTS = [
  { re: /nicotine|tobacco|cigarette|cigar|smok/i, classId: "nicotine" },
  { re: /vape|vaping|e-cig|ecig/i, classId: "vaping" },
  { re: /lottery|lotto|scratch|649|maxmillions/i, classId: "lottery" },
  { re: /beer|wine|spirit|alcohol|liquor|cooler/i, classId: "alcohol" },
  { re: /cannabis|cbd(?!.*cream)|thc/i, classId: "cannabis" },
  { re: /firework/i, classId: "fireworks" },
  { re: /energy drink|high.?caffeine/i, classId: "energy_drink" },
];

export function normalizeAgeRestrictionClass(value) {
  const id = String(value || AGE_RESTRICTION_NONE).trim().toLowerCase();
  return AGE_RESTRICTION_CLASSES[id] ? id : AGE_RESTRICTION_NONE;
}

export function ageRestrictionLabel(classId) {
  const id = normalizeAgeRestrictionClass(classId);
  return AGE_RESTRICTION_CLASSES[id]?.label || "Age-restricted";
}

/**
 * Resolve restriction class from catalog row, inventory product, or category text.
 */
export function resolveAgeRestrictionClass(item) {
  if (!item) return AGE_RESTRICTION_NONE;
  const explicit = normalizeAgeRestrictionClass(item.ageRestrictionClass);
  if (explicit !== AGE_RESTRICTION_NONE) return explicit;
  const hay = [item.category, item.name, item.sku].filter(Boolean).join(" ");
  for (const hint of CATEGORY_HINTS) {
    if (hint.re.test(hay)) return hint.classId;
  }
  return AGE_RESTRICTION_NONE;
}

export function isAgeRestrictedItem(item) {
  return resolveAgeRestrictionClass(item) !== AGE_RESTRICTION_NONE;
}

export function resolveMinimumPurchaseAge(classId, config = {}) {
  const id = normalizeAgeRestrictionClass(classId);
  if (id === AGE_RESTRICTION_NONE) return 0;
  const def = AGE_RESTRICTION_CLASSES[id];
  const storeMin = Math.max(0, Number(config.storeMinimumAge) || 19);
  if (def.useStoreMinimum) return storeMin;
  return Math.max(storeMin, Number(def.minAge) || storeMin);
}

/** @param {string} dateIso YYYY-MM-DD */
export function parseDateOnly(dateIso) {
  const raw = String(dateIso || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  date.setHours(12, 0, 0, 0);
  return date;
}

export function yearsBetween(birthDate, asOf = new Date()) {
  const at = new Date(asOf);
  at.setHours(12, 0, 0, 0);
  let years = at.getFullYear() - birthDate.getFullYear();
  const monthDelta = at.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && at.getDate() < birthDate.getDate())) {
    years -= 1;
  }
  return years;
}

/**
 * @returns {{ ok: boolean, age?: number, reason?: string }}
 */
export function verifyPurchaserAge(dateOfBirth, classId, config = {}) {
  const minAge = resolveMinimumPurchaseAge(classId, config);
  if (!minAge) return { ok: true };
  const birth = parseDateOnly(dateOfBirth);
  if (!birth) {
    return { ok: false, reason: "Enter a valid date of birth (YYYY-MM-DD)." };
  }
  const age = yearsBetween(birth);
  if (age < minAge) {
    return {
      ok: false,
      age,
      reason: `Customer must be at least ${minAge} for ${ageRestrictionLabel(classId)} (entered age ${age}).`,
    };
  }
  return { ok: true, age };
}

/** Unique restricted classes present on cart lines. */
export function cartAgeRestrictionClasses(cart, config = {}) {
  const enabled = config.enabledClasses;
  const classes = new Set();
  for (const line of cart || []) {
    const classId = resolveAgeRestrictionClass(line);
    if (classId === AGE_RESTRICTION_NONE) continue;
    if (Array.isArray(enabled) && !enabled.includes(classId)) continue;
    classes.add(classId);
  }
  return [...classes];
}

/**
 * @param {Record<string, object>} verifications — classId → verification record
 */
export function missingAgeVerifications(cart, verifications = {}, config = {}) {
  const required = cartAgeRestrictionClasses(cart, config);
  return required.filter((classId) => {
    const row = verifications[classId];
    return !row || row.status !== "verified";
  });
}

export function cartLineWithAgeRestriction(item) {
  const ageRestrictionClass = resolveAgeRestrictionClass(item);
  return {
    sku: item.sku,
    name: item.name,
    category: item.category || "OTC",
    qty: 1,
    price: item.price,
    ageRestrictionClass,
  };
}

export function mergeCartLineWithRestriction(existingLine, item) {
  const ageRestrictionClass = resolveAgeRestrictionClass(item);
  return { ...existingLine, ageRestrictionClass };
}

export function buildAgeVerificationRecord({
  classId,
  method = "dob",
  purchaserAge,
  managerOverride = false,
  operatorId,
  tillNumber,
}) {
  return {
    classId: normalizeAgeRestrictionClass(classId),
    status: "verified",
    method,
    verifiedAt: Date.now(),
    purchaserAge: purchaserAge != null ? Number(purchaserAge) : null,
    managerOverride: Boolean(managerOverride),
    operatorId: operatorId || null,
    tillNumber: tillNumber != null ? Number(tillNumber) : null,
  };
}

export function summarizeAgeComplianceForSale(cart, verifications = {}, config = {}) {
  const classes = cartAgeRestrictionClasses(cart, config);
  return {
    restrictedClasses: classes,
    verifications: classes.map((classId) => {
      const v = verifications[classId] || {};
      return {
        classId,
        label: ageRestrictionLabel(classId),
        minAge: resolveMinimumPurchaseAge(classId, config),
        verifiedAt: v.verifiedAt || null,
        purchaserAge: v.purchaserAge ?? null,
        managerOverride: Boolean(v.managerOverride),
        method: v.method || null,
      };
    }),
  };
}
