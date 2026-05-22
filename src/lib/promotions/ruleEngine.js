import { PROMO_TYPE } from "./promotionTypes";

const CONDITION_FIELDS = {
  sku: "SKU",
  category: "Category",
  minQty: "Minimum quantity",
  minSubtotal: "Minimum subtotal",
  demographic: "Customer demographic",
  dayOfWeek: "Day of week",
  hour: "Hour of day",
  couponCode: "Coupon code",
};

const ACTION_TYPES = {
  percent_off: "Percent off",
  amount_off: "Dollar off",
  fixed_price: "Fixed price",
  bogo_free: "BOGO free item",
  mix_match_price: "Mix-and-match price",
};

export function conditionFieldLabel(field) {
  return CONDITION_FIELDS[field] || field;
}

export function actionTypeLabel(type) {
  return ACTION_TYPES[type] || type;
}

function matchCondition(condition, context) {
  const { field, operator, value } = condition || {};
  const ctxValue = context[field];
  if (field === "dayOfWeek") {
    const day = context.at ? new Date(context.at).getDay() : new Date().getDay();
    const allowed = Array.isArray(value) ? value : [value];
    return operator === "in" ? allowed.includes(day) : allowed.includes(Number(value));
  }
  if (field === "hour") {
    const hour = context.at ? new Date(context.at).getHours() : new Date().getHours();
    if (operator === "between" && Array.isArray(value)) {
      return hour >= value[0] && hour < value[1];
    }
    return operator === "gte" ? hour >= Number(value) : hour === Number(value);
  }
  if (operator === "eq") return String(ctxValue) === String(value);
  if (operator === "in") {
    const list = Array.isArray(value) ? value : String(value).split(",").map((s) => s.trim());
    return list.includes(String(ctxValue));
  }
  if (operator === "gte") return Number(ctxValue) >= Number(value);
  if (operator === "lte") return Number(ctxValue) <= Number(value);
  return false;
}

function allConditionsPass(conditions, context) {
  const rows = Array.isArray(conditions) ? conditions : [];
  if (!rows.length) return true;
  return rows.every((row) => matchCondition(row, context));
}

export function evaluatePromoRules(campaign, cartContext) {
  const rules = Array.isArray(campaign?.rules) ? [...campaign.rules] : [];
  rules.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  const applied = [];
  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (!allConditionsPass(rule.conditions, cartContext)) continue;
    applied.push({
      ruleId: rule.id,
      campaignId: campaign.id,
      campaignName: campaign.name,
      action: rule.action,
      description: describeRule(rule),
    });
    if (!rule.stackable) break;
  }
  return applied;
}

export function describeRule(rule) {
  const action = rule?.action || {};
  const condCount = Array.isArray(rule?.conditions) ? rule.conditions.length : 0;
  const actionText =
    action.type === "percent_off"
      ? `${action.value}% off`
      : action.type === "amount_off"
        ? `$${Number(action.value || 0).toFixed(2)} off`
        : action.type === "fixed_price"
          ? `Price $${Number(action.value || 0).toFixed(2)}`
          : action.type === "bogo_free"
            ? "BOGO free item"
            : action.type === "mix_match_price"
              ? `Mix price $${Number(action.value || 0).toFixed(2)}`
              : action.type || "Discount";
  return condCount ? `${actionText} (${condCount} condition${condCount === 1 ? "" : "s"})` : actionText;
}

export function buildDefaultRulesForType(type) {
  if (type === PROMO_TYPE.BOGO) {
    return [
      {
        id: `rule-bogo-${Date.now()}`,
        priority: 10,
        enabled: true,
        stackable: false,
        conditions: [{ field: "minQty", operator: "gte", value: 2 }],
        action: { type: "bogo_free", value: 1 },
      },
    ];
  }
  if (type === PROMO_TYPE.MIX_MATCH) {
    return [
      {
        id: `rule-mix-${Date.now()}`,
        priority: 10,
        enabled: true,
        stackable: false,
        conditions: [{ field: "minQty", operator: "gte", value: 2 }],
        action: { type: "mix_match_price", value: 0 },
      },
    ];
  }
  if (type === PROMO_TYPE.SENIOR_DAY) {
    return [
      {
        id: `rule-senior-${Date.now()}`,
        priority: 5,
        enabled: true,
        stackable: true,
        conditions: [
          { field: "demographic", operator: "in", value: ["senior"] },
          { field: "dayOfWeek", operator: "in", value: [3] },
        ],
        action: { type: "percent_off", value: 10 },
      },
    ];
  }
  if (type === PROMO_TYPE.TIME_BASED) {
    return [
      {
        id: `rule-time-${Date.now()}`,
        priority: 8,
        enabled: true,
        stackable: false,
        conditions: [{ field: "hour", operator: "between", value: [14, 17] }],
        action: { type: "percent_off", value: 15 },
      },
    ];
  }
  return [
    {
      id: `rule-default-${Date.now()}`,
      priority: 10,
      enabled: true,
      stackable: false,
      conditions: [{ field: "minSubtotal", operator: "gte", value: 10 }],
      action: { type: "percent_off", value: 5 },
    },
  ];
}

export function previewCartContext(overrides = {}) {
  return {
    sku: "OTC-001",
    category: "front_store",
    minQty: 2,
    minSubtotal: 24.99,
    demographic: "general",
    couponCode: "",
    at: new Date().toISOString(),
    ...overrides,
  };
}
