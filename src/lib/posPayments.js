export const CARD_PAY_METHODS = ["Debit", "Credit Card"];

export function isCardPayMethod(payMethod) {
  return CARD_PAY_METHODS.includes(payMethod);
}

export function cardPayMethodToSecurelinkType(payMethod) {
  if (payMethod === "Debit") return "debit";
  if (payMethod === "Credit Card") return "credit";
  return "credit";
}
