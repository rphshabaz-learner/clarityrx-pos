import {
  formatCardReceiptLines,
  isSensitivePaymentField,
  maskCardLast4,
  maskPanValue,
  redactSensitivePaymentFields,
  sanitizeCardPaymentForStorage,
} from "./paymentReceiptRules";

describe("paymentReceiptRules", () => {
  it("masks last four as **** **** **** 1234", () => {
    expect(maskCardLast4("1234")).toBe("**** **** **** 1234");
    expect(maskCardLast4("4242")).toBe("**** **** **** 4242");
  });

  it("masks full PAN input to last four only", () => {
    expect(maskPanValue("4111111111111111")).toBe("**** **** **** 1111");
  });

  it("redacts sensitive keys and PAN-like strings in logs", () => {
    const detail = {
      payMethod: "Credit Card",
      cvv: "999",
      pan: "4111111111111111",
      note: "card 4242424242424242 used",
      nested: { expiry: "12/29", authCode: "OK01" },
    };
    const redacted = redactSensitivePaymentFields(detail);
    expect(redacted.cvv).toBe("[REDACTED]");
    expect(redacted.pan).toBe("[REDACTED]");
    expect(redacted.nested.expiry).toBe("[REDACTED]");
    expect(redacted.note).toBe("**** **** **** 4242");
    expect(redacted.payMethod).toBe("Credit Card");
    expect(redacted.nested.authCode).toBe("OK01");
  });

  it("flags sensitive field names", () => {
    expect(isSensitivePaymentField("cvv")).toBe(true);
    expect(isSensitivePaymentField("cardExpiry")).toBe(true);
    expect(isSensitivePaymentField("authCode")).toBe(false);
  });

  it("formats receipt lines without PAN or CVV", () => {
    const lines = formatCardReceiptLines({
      cardBrand: "Visa",
      last4: "4242",
      authCode: "A1B2C3",
      reference: "REF-9",
      entryMethod: "chip",
      cvv: "should-not-appear",
      pan: "4111111111111111",
    });
    expect(lines[0]).toBe("VISA **** **** **** 4242");
    expect(lines.join("\n")).not.toMatch(/4111|999|12\/29/i);
  });

  it("sanitizes card payment for storage", () => {
    const stored = sanitizeCardPaymentForStorage({
      last4: "1234",
      authCode: "OK",
      cardBrand: "Mastercard",
      cvv: "123",
      pan: "5500000000000004",
      expiry: "05/28",
    });
    expect(stored.maskedPan).toBe("**** **** **** 1234");
    expect(stored.cvv).toBeUndefined();
    expect(stored.pan).toBeUndefined();
    expect(stored.expiry).toBeUndefined();
  });
});
