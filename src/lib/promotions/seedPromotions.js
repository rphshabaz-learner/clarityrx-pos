import {
  PROMO_SOURCE,
  PROMO_STATUS,
  PROMO_TYPE,
  generatePromoId,
  generateRuleId,
} from "./promotionTypes";

const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

export function buildSeedPromotions() {
  const stamp = now.toISOString();
  return [
    {
      id: generatePromoId(),
      name: "Weekly flyer — vitamins",
      type: PROMO_TYPE.FLYER,
      status: PROMO_STATUS.ACTIVE,
      source: PROMO_SOURCE.STORE,
      startAt: startOfMonth,
      endAt: endOfMonth,
      config: { flyerWeek: "W12", pageRef: "p4" },
      rules: [
        {
          id: generateRuleId(),
          priority: 10,
          enabled: true,
          stackable: false,
          conditions: [{ field: "category", operator: "eq", value: "vitamins" }],
          action: { type: "percent_off", value: 20 },
        },
      ],
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: generatePromoId(),
      name: "2 for $10 — snacks mix",
      type: PROMO_TYPE.MIX_MATCH,
      status: PROMO_STATUS.ACTIVE,
      source: PROMO_SOURCE.STORE,
      startAt: startOfMonth,
      endAt: endOfMonth,
      config: { buyQty: 2, payQty: 1, mixGroup: "SNACK-A" },
      rules: [
        {
          id: generateRuleId(),
          priority: 10,
          enabled: true,
          stackable: false,
          conditions: [{ field: "minQty", operator: "gte", value: 2 }],
          action: { type: "mix_match_price", value: 10 },
        },
      ],
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: generatePromoId(),
      name: "BOGO — hand sanitizer",
      type: PROMO_TYPE.BOGO,
      status: PROMO_STATUS.SCHEDULED,
      source: PROMO_SOURCE.BANNER,
      headOfficeId: "HO-BOGO-4412",
      startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3).toISOString(),
      endAt: endOfMonth,
      config: { buyQty: 1, freeQty: 1, sameSku: true },
      rules: [
        {
          id: generateRuleId(),
          priority: 10,
          enabled: true,
          stackable: false,
          conditions: [{ field: "sku", operator: "eq", value: "OTC-SAN-500" }],
          action: { type: "bogo_free", value: 1 },
        },
      ],
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: generatePromoId(),
      name: "Loyalty — earn & redeem",
      type: PROMO_TYPE.LOYALTY,
      status: PROMO_STATUS.ACTIVE,
      source: PROMO_SOURCE.STORE,
      startAt: startOfMonth,
      endAt: null,
      config: { pointsPerDollar: 1, redeemThreshold: 100, redeemValue: 5 },
      rules: [
        {
          id: generateRuleId(),
          priority: 5,
          enabled: true,
          stackable: true,
          conditions: [{ field: "minSubtotal", operator: "gte", value: 1 }],
          action: { type: "amount_off", value: 0 },
        },
      ],
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: generatePromoId(),
      name: "SAVE10 coupon",
      type: PROMO_TYPE.COUPON,
      status: PROMO_STATUS.ACTIVE,
      source: PROMO_SOURCE.STORE,
      startAt: startOfMonth,
      endAt: endOfMonth,
      config: { code: "SAVE10", maxRedemptions: 500, onePerCustomer: true },
      rules: [
        {
          id: generateRuleId(),
          priority: 15,
          enabled: true,
          stackable: false,
          conditions: [{ field: "couponCode", operator: "eq", value: "SAVE10" }],
          action: { type: "percent_off", value: 10 },
        },
      ],
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: generatePromoId(),
      name: "Senior Wednesday — 10% OTC",
      type: PROMO_TYPE.SENIOR_DAY,
      status: PROMO_STATUS.ACTIVE,
      source: PROMO_SOURCE.STORE,
      startAt: startOfMonth,
      endAt: null,
      config: { demographicIds: ["senior"], dayOfWeek: [3] },
      rules: [
        {
          id: generateRuleId(),
          priority: 5,
          enabled: true,
          stackable: true,
          conditions: [
            { field: "demographic", operator: "in", value: ["senior"] },
            { field: "dayOfWeek", operator: "in", value: [3] },
          ],
          action: { type: "percent_off", value: 10 },
        },
      ],
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: generatePromoId(),
      name: "Afternoon happy hour",
      type: PROMO_TYPE.TIME_BASED,
      status: PROMO_STATUS.ACTIVE,
      source: PROMO_SOURCE.STORE,
      startAt: startOfMonth,
      endAt: endOfMonth,
      config: { dayOfWeek: [1, 2, 3, 4, 5], startHour: 14, endHour: 17 },
      rules: [
        {
          id: generateRuleId(),
          priority: 8,
          enabled: true,
          stackable: false,
          conditions: [{ field: "hour", operator: "between", value: [14, 17] }],
          action: { type: "percent_off", value: 15 },
        },
      ],
      createdAt: stamp,
      updatedAt: stamp,
    },
  ];
}

export function buildHeadOfficeSyncBatch() {
  const stamp = new Date().toISOString();
  return [
    {
      id: generatePromoId(),
      name: "HO — front store feature endcap",
      type: PROMO_TYPE.FLYER,
      status: PROMO_STATUS.SCHEDULED,
      source: PROMO_SOURCE.HEAD_OFFICE,
      headOfficeId: "HO-FLYER-8821",
      startAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      endAt: new Date(Date.now() + 86400000 * 16).toISOString(),
      config: { flyerWeek: "HO-W12", pageRef: "national" },
      rules: [
        {
          id: generateRuleId(),
          priority: 10,
          enabled: true,
          stackable: false,
          conditions: [{ field: "category", operator: "eq", value: "front_store" }],
          action: { type: "percent_off", value: 12 },
        },
      ],
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: generatePromoId(),
      name: "Banner — allergy season bundle",
      type: PROMO_TYPE.MIX_MATCH,
      status: PROMO_STATUS.DRAFT,
      source: PROMO_SOURCE.BANNER,
      headOfficeId: "BNR-MIX-3301",
      startAt: new Date(Date.now() + 86400000 * 7).toISOString(),
      endAt: new Date(Date.now() + 86400000 * 35).toISOString(),
      config: { buyQty: 2, payQty: 1, mixGroup: "ALLERGY" },
      rules: [
        {
          id: generateRuleId(),
          priority: 10,
          enabled: true,
          stackable: false,
          conditions: [{ field: "category", operator: "eq", value: "allergy" }],
          action: { type: "mix_match_price", value: 19.99 },
        },
      ],
      createdAt: stamp,
      updatedAt: stamp,
    },
  ];
}
