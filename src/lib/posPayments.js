export const CARD_PAY_METHODS = ["Debit", "Credit Card"];

export function isCardPayMethod(payMethod) {
  return CARD_PAY_METHODS.includes(payMethod);
}

export function cardPayMethodToSecurelinkType(payMethod) {
  if (payMethod === "Debit") return "debit";
  if (payMethod === "Credit Card") return "credit";
  return "credit";
}

export function giftCardTenderAmount(payMethod, splitEnabled, splitPayments, total) {
  if (splitEnabled) {
    return (splitPayments || [])
      .filter((row) => row.method === "Gift Card")
      .reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  }
  if (payMethod === "Gift Card") return Number(total) || 0;
  return 0;
}

export function requiresGiftCardNumber(payMethod, splitEnabled, splitPayments) {
  return giftCardTenderAmount(payMethod, splitEnabled, splitPayments, 1) > 0;
}
