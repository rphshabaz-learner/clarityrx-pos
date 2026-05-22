import { classifyCardPaymentError } from "./cardPaymentAudit";

describe("classifyCardPaymentError", () => {
  it("classifies declined and timeout messages", () => {
    expect(classifyCardPaymentError(new Error("Card payment declined."))).toBe("declined");
    expect(classifyCardPaymentError(new Error("Pinpad timed out."))).toBe("timeout");
    expect(classifyCardPaymentError(new Error("User cancelled"))).toBe("cancelled");
    expect(classifyCardPaymentError(new Error("Network error"))).toBe("error");
  });
});
