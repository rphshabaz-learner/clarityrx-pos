export const GIFT_CARD_STATUS = {
  INACTIVE: "inactive",
  ACTIVE: "active",
  SUSPENDED: "suspended",
};

export const GIFT_CARD_TX_TYPES = {
  ACTIVATION: "activation",
  RELOAD: "reload",
  REDEMPTION: "redemption",
  ADJUSTMENT: "adjustment",
};

export function generateGiftCardId() {
  return `gc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function generateGiftCardTxnId() {
  return `gctx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Normalize scan or typed input to GC-####-#### */
export function normalizeGiftCardNumber(input) {
  const raw = String(input || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!raw) return "";
  if (/^GC-\d{4}-\d{4}$/.test(raw)) return raw;
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 8) {
    const padded = digits.slice(-8).padStart(8, "0");
    return `GC-${padded.slice(0, 4)}-${padded.slice(4)}`;
  }
  if (raw.startsWith("GC")) {
    const rest = raw.replace(/^GC-?/, "").replace(/\D/g, "").padStart(8, "0").slice(-8);
    return `GC-${rest.slice(0, 4)}-${rest.slice(4)}`;
  }
  return "";
}

export function formatGiftCardNumberFromSequence(seq) {
  const padded = String(Math.max(0, Number(seq) || 0)).padStart(8, "0").slice(-8);
  return `GC-${padded.slice(0, 4)}-${padded.slice(4)}`;
}

export function nextGiftCardNumber(existingCards) {
  const nums = (existingCards || [])
    .map((row) => String(row.cardNumber || "").match(/GC-(\d{4})-(\d{4})/))
    .filter(Boolean)
    .map((match) => Number(`${match[1]}${match[2]}`) || 0);
  const next = (nums.length ? Math.max(...nums) : 10000000) + 1;
  return formatGiftCardNumberFromSequence(next);
}

export function emptyGiftCard(cardNumber = "") {
  const now = new Date().toISOString();
  return {
    id: generateGiftCardId(),
    cardNumber: cardNumber || "",
    balance: 0,
    status: GIFT_CARD_STATUS.INACTIVE,
    issuedAt: now,
    activatedAt: null,
    lastActivityAt: null,
    purchaserName: "",
    note: "",
    transactions: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function giftCardDisplayBalance(card) {
  return Math.max(0, Number(card?.balance) || 0);
}

export function isGiftCardRedeemable(card) {
  if (!card) return false;
  if (card.status === GIFT_CARD_STATUS.SUSPENDED) return false;
  if (card.status === GIFT_CARD_STATUS.INACTIVE) return false;
  return giftCardDisplayBalance(card) > 0 || card.status === GIFT_CARD_STATUS.ACTIVE;
}
