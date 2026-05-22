export const PROMO_TYPE = {
  FLYER: "flyer",
  MIX_MATCH: "mix_match",
  BOGO: "bogo",
  LOYALTY: "loyalty",
  COUPON: "coupon",
  SENIOR_DAY: "senior_day",
  TIME_BASED: "time_based",
};

export const PROMO_TYPE_OPTIONS = [
  { id: PROMO_TYPE.FLYER, label: "Flyer promotion", emoji: "📰" },
  { id: PROMO_TYPE.MIX_MATCH, label: "Mix-and-match", emoji: "🧩" },
  { id: PROMO_TYPE.BOGO, label: "Buy one get one", emoji: "2️⃣" },
  { id: PROMO_TYPE.LOYALTY, label: "Loyalty rewards", emoji: "⭐" },
  { id: PROMO_TYPE.COUPON, label: "Coupon campaign", emoji: "🎟️" },
  { id: PROMO_TYPE.SENIOR_DAY, label: "Senior day pricing", emoji: "👴" },
  { id: PROMO_TYPE.TIME_BASED, label: "Time-based promotion", emoji: "⏰" },
];

export const PROMO_STATUS = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  ACTIVE: "active",
  PAUSED: "paused",
  ENDED: "ended",
};

export const PROMO_SOURCE = {
  STORE: "store",
  HEAD_OFFICE: "head_office",
  BANNER: "banner",
};

export function promoTypeLabel(type) {
  return PROMO_TYPE_OPTIONS.find((row) => row.id === type)?.label || type;
}

export function promoStatusLabel(status) {
  const map = {
    draft: "Draft",
    scheduled: "Scheduled",
    active: "Active",
    paused: "Paused",
    ended: "Ended",
  };
  return map[status] || status;
}

export function promoStatusBadgeClass(status) {
  if (status === PROMO_STATUS.ACTIVE) return "badge-green";
  if (status === PROMO_STATUS.SCHEDULED) return "badge-amber";
  if (status === PROMO_STATUS.PAUSED) return "badge-amber";
  if (status === PROMO_STATUS.ENDED) return "badge-gray";
  return "badge-gray";
}

export function promoSourceLabel(source) {
  const map = {
    store: "Store",
    head_office: "Head office",
    banner: "Banner",
  };
  return map[source] || source;
}

export function generatePromoId() {
  return `promo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateRuleId() {
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isPromoActiveNow(campaign, at = new Date()) {
  if (!campaign || campaign.status !== PROMO_STATUS.ACTIVE) return false;
  const start = campaign.startAt ? new Date(campaign.startAt) : null;
  const end = campaign.endAt ? new Date(campaign.endAt) : null;
  if (start && at < start) return false;
  if (end && at > end) return false;
  return true;
}

export function defaultTypeConfig(type) {
  switch (type) {
    case PROMO_TYPE.MIX_MATCH:
      return { buyQty: 2, payQty: 1, mixGroup: "A" };
    case PROMO_TYPE.BOGO:
      return { buyQty: 1, freeQty: 1, sameSku: true };
    case PROMO_TYPE.LOYALTY:
      return { pointsPerDollar: 1, redeemThreshold: 100, redeemValue: 5 };
    case PROMO_TYPE.COUPON:
      return { code: "", maxRedemptions: 0, onePerCustomer: true };
    case PROMO_TYPE.SENIOR_DAY:
      return { demographicIds: ["senior"], dayOfWeek: [3] };
    case PROMO_TYPE.TIME_BASED:
      return { dayOfWeek: [1, 2, 3, 4, 5], startHour: 14, endHour: 17 };
    case PROMO_TYPE.FLYER:
      return { flyerWeek: "", pageRef: "" };
    default:
      return {};
  }
}
