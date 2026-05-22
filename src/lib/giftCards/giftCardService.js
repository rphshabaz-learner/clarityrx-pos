import {
  GIFT_CARD_STATUS,
  GIFT_CARD_TX_TYPES,
  generateGiftCardTxnId,
  giftCardDisplayBalance,
  normalizeGiftCardNumber,
} from "./giftCardTypes";

function clampMoney(value) {
  return Math.max(0, Math.round((Number(value) || 0) * 100) / 100);
}

function appendTransaction(card, txn) {
  const transactions = [txn, ...(card.transactions || [])].slice(0, 50);
  return { ...card, transactions, lastActivityAt: txn.at, updatedAt: txn.at };
}

export function findGiftCardByNumber(cards, cardNumber) {
  const normalized = normalizeGiftCardNumber(cardNumber);
  if (!normalized) return null;
  return (cards || []).find((row) => normalizeGiftCardNumber(row.cardNumber) === normalized) || null;
}

export function lookupGiftCardBalance(cards, cardNumber) {
  const card = findGiftCardByNumber(cards, cardNumber);
  if (!card) {
    return { found: false, card: null, balance: 0, status: null, message: "Gift card not found." };
  }
  if (card.status === GIFT_CARD_STATUS.SUSPENDED) {
    return {
      found: true,
      card,
      balance: giftCardDisplayBalance(card),
      status: card.status,
      message: "This gift card is suspended.",
    };
  }
  if (card.status === GIFT_CARD_STATUS.INACTIVE) {
    return {
      found: true,
      card,
      balance: 0,
      status: card.status,
      message: "Card is not activated.",
    };
  }
  return {
    found: true,
    card,
    balance: giftCardDisplayBalance(card),
    status: card.status,
    message: null,
  };
}

export function activateGiftCard(card, amount, meta = {}) {
  const loadAmount = clampMoney(amount);
  if (loadAmount <= 0) {
    throw new Error("Activation amount must be greater than zero.");
  }
  if (card.status === GIFT_CARD_STATUS.SUSPENDED) {
    throw new Error("Cannot activate a suspended card.");
  }
  const at = new Date().toISOString();
  const txn = {
    id: generateGiftCardTxnId(),
    type: GIFT_CARD_TX_TYPES.ACTIVATION,
    amount: loadAmount,
    balanceAfter: loadAmount,
    tillNumber: meta.tillNumber ?? null,
    operatorId: meta.operatorId || null,
    managerOverride: Boolean(meta.managerOverride),
    tenderMethod: meta.tenderMethod || null,
    invoiceNumber: meta.invoiceNumber || null,
    note: meta.note || null,
    at,
  };
  const next = appendTransaction(
    {
      ...card,
      balance: loadAmount,
      status: GIFT_CARD_STATUS.ACTIVE,
      activatedAt: card.activatedAt || at,
      purchaserName: meta.purchaserName || card.purchaserName || "",
    },
    txn
  );
  return next;
}

export function reloadGiftCard(card, amount, meta = {}) {
  const loadAmount = clampMoney(amount);
  if (loadAmount <= 0) {
    throw new Error("Reload amount must be greater than zero.");
  }
  if (card.status === GIFT_CARD_STATUS.SUSPENDED) {
    throw new Error("Cannot reload a suspended card.");
  }
  if (card.status === GIFT_CARD_STATUS.INACTIVE) {
    throw new Error("Activate this card before reloading.");
  }
  const at = new Date().toISOString();
  const balanceAfter = clampMoney(giftCardDisplayBalance(card) + loadAmount);
  const txn = {
    id: generateGiftCardTxnId(),
    type: GIFT_CARD_TX_TYPES.RELOAD,
    amount: loadAmount,
    balanceAfter,
    tillNumber: meta.tillNumber ?? null,
    operatorId: meta.operatorId || null,
    managerOverride: Boolean(meta.managerOverride),
    tenderMethod: meta.tenderMethod || null,
    invoiceNumber: meta.invoiceNumber || null,
    note: meta.note || null,
    at,
  };
  return appendTransaction({ ...card, balance: balanceAfter, status: GIFT_CARD_STATUS.ACTIVE }, txn);
}

export function redeemGiftCard(card, amount, meta = {}) {
  const redeemAmount = clampMoney(amount);
  if (redeemAmount <= 0) {
    throw new Error("Redemption amount must be greater than zero.");
  }
  if (card.status === GIFT_CARD_STATUS.INACTIVE) {
    throw new Error("Gift card is not activated.");
  }
  if (card.status === GIFT_CARD_STATUS.SUSPENDED) {
    throw new Error("Gift card is suspended.");
  }
  const available = giftCardDisplayBalance(card);
  if (available < redeemAmount) {
    throw new Error(`Insufficient balance ($${available.toFixed(2)} available).`);
  }
  const at = new Date().toISOString();
  const balanceAfter = clampMoney(available - redeemAmount);
  const txn = {
    id: generateGiftCardTxnId(),
    type: GIFT_CARD_TX_TYPES.REDEMPTION,
    amount: -redeemAmount,
    balanceAfter,
    tillNumber: meta.tillNumber ?? null,
    operatorId: meta.operatorId || null,
    invoiceNumber: meta.invoiceNumber || null,
    note: meta.note || null,
    at,
  };
  return appendTransaction({ ...card, balance: balanceAfter }, txn);
}
