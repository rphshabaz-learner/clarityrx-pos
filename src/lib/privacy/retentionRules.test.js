import { CUSTOMER_STATUS, CUSTOMER_TYPE } from "../customers/customerTypes";
import {
  isInactiveLoyaltyCustomer,
  resolveRetentionPolicy,
  secureReceiptArchiveOnSale,
} from "./retentionRules";
import { DEFAULT_POS_PRIVACY_CONFIG } from "./posPrivacyConfig";

describe("retentionRules", () => {
  it("resolves three retention windows with legacy localRetentionDays fallback", () => {
    const policy = resolveRetentionPolicy({ localRetentionDays: 400 });
    expect(policy.financialRetentionDays).toBe(400);
    expect(policy.receiptArchiveRetentionDays).toBe(
      DEFAULT_POS_PRIVACY_CONFIG.receiptArchiveRetentionDays
    );
    expect(policy.loyaltyInactiveRetentionDays).toBe(
      DEFAULT_POS_PRIVACY_CONFIG.loyaltyInactiveRetentionDays
    );
  });

  it("flags inactive loyalty by status or last activity", () => {
    const cutoff = Date.now();
    expect(
      isInactiveLoyaltyCustomer(
        { type: CUSTOMER_TYPE.LOYALTY, status: CUSTOMER_STATUS.INACTIVE, loyalty: { memberId: "LY-1" } },
        cutoff
      )
    ).toBe(true);
    expect(
      isInactiveLoyaltyCustomer(
        {
          type: CUSTOMER_TYPE.LOYALTY,
          status: CUSTOMER_STATUS.ACTIVE,
          loyalty: { memberId: "LY-2" },
          updatedAt: new Date(0).toISOString(),
        },
        cutoff
      )
    ).toBe(true);
    expect(
      isInactiveLoyaltyCustomer(
        {
          type: CUSTOMER_TYPE.INDIVIDUAL,
          status: CUSTOMER_STATUS.ACTIVE,
          loyalty: { memberId: "" },
          updatedAt: new Date().toISOString(),
        },
        0
      )
    ).toBe(false);
  });

  it("strips receipt detail but keeps financial totals on archived sales", () => {
    const old = Date.now() - 120 * 86400000;
    const { sale, changed } = secureReceiptArchiveOnSale(
      {
        chargedAt: old,
        total: 42.5,
        tax: 2.5,
        invoiceNumber: "INV-1",
        receiptContact: "a@b.c",
        lines: [{ sku: "A", qty: 1, lineTotal: 40 }],
        cardPayment: { last4: "4242", authCode: "ABC" },
      },
      Date.now() - 90 * 86400000
    );
    expect(changed).toBe(true);
    expect(sale.receiptArchived).toBe(true);
    expect(sale.total).toBe(42.5);
    expect(sale.invoiceNumber).toBe("INV-1");
    expect(sale.receiptContact).toBeUndefined();
    expect(sale.lines).toEqual([]);
    expect(sale.cardPayment).toBeUndefined();
  });
});
