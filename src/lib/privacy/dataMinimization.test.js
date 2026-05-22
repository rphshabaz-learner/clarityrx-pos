import {
  canViewSensitiveCustomerProfile,
  maskCustomerProfileForDisplay,
  NECESSARY_PAYMENT_STORAGE_FIELDS,
} from "./dataMinimization";

describe("dataMinimization", () => {
  it("allows only admin to view sensitive profile fields", () => {
    expect(canViewSensitiveCustomerProfile("admin")).toBe(true);
    expect(canViewSensitiveCustomerProfile("pharmacist")).toBe(false);
    expect(canViewSensitiveCustomerProfile("store_manager")).toBe(false);
    expect(canViewSensitiveCustomerProfile("supervisor")).toBe(false);
    expect(canViewSensitiveCustomerProfile("cashier")).toBe(false);
    expect(canViewSensitiveCustomerProfile("technician")).toBe(false);
  });

  it("masks optional profile fields for restricted roles", () => {
    const masked = maskCustomerProfileForDisplay(
      { firstName: "A", email: "a@b.c", address: "1 Main", dateOfBirth: "1990-01-01" },
      "cashier"
    );
    expect(masked.email).toBe("••••••••");
    expect(masked.address).toBe("••••••••");
    expect(masked.dateOfBirth).toBe("••••-••-••");
    expect(masked.firstName).toBe("A");
  });

  it("documents necessary payment storage fields", () => {
    expect(NECESSARY_PAYMENT_STORAGE_FIELDS).toContain("last4");
    expect(NECESSARY_PAYMENT_STORAGE_FIELDS).not.toContain("pan");
  });
});
