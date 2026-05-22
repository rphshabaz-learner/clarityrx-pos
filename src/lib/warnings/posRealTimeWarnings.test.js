import {
  cartHasControlledProduct,
  countRecentVoids,
  evaluatePosRealTimeWarnings,
  findPriceOverrideRangeIssue,
  POS_REALTIME_WARNING_IDS,
  sumRecentRefunds,
} from "./posRealTimeWarnings";

describe("posRealTimeWarnings", () => {
  const now = Date.parse("2026-05-22T12:00:00.000Z");

  test("warns when refund total exceeds threshold", () => {
    const warnings = evaluatePosRealTimeWarnings({
      now,
      tillNumber: 1,
      config: { refundManagerThreshold: 25, refundLookbackMinutes: 60 },
      immutableAudit: [
        {
          timestamp: now - 5 * 60 * 1000,
          action: "refund",
          terminal: 1,
          newValue: 30,
        },
      ],
    });
    expect(warnings.map((row) => row.id)).toContain(POS_REALTIME_WARNING_IDS.refundThreshold);
    expect(warnings.find((row) => row.id === POS_REALTIME_WARNING_IDS.refundThreshold).message).toMatch(
      /Refund exceeds manager threshold/
    );
  });

  test("warns on multiple voids for the till", () => {
    const activities = [1, 2, 3].map((i) => ({
      ts: now - i * 60 * 1000,
      message: "Sale line voided",
      detail: { tillNumber: 2, accessLogType: "void", voidKind: "line" },
    }));
    expect(
      countRecentVoids(activities, { tillNumber: 2, lookbackMinutes: 30, now })
    ).toBe(3);
    const warnings = evaluatePosRealTimeWarnings({
      now,
      tillNumber: 2,
      activities,
      config: { voidCountThreshold: 3, voidLookbackMinutes: 30 },
    });
    expect(warnings.map((row) => row.id)).toContain(POS_REALTIME_WARNING_IDS.multipleVoids);
  });

  test("warns when controlled product needs pharmacist", () => {
    const warnings = evaluatePosRealTimeWarnings({
      cart: [{ sku: "CTRL-1", name: "Test", qty: 1, price: 9.99, controlled: true }],
      activeRole: "cashier",
      managerOverrideActive: false,
    });
    expect(warnings.map((row) => row.id)).toContain(POS_REALTIME_WARNING_IDS.controlledPharmacist);
  });

  test("does not warn for pharmacist on controlled cart", () => {
    const warnings = evaluatePosRealTimeWarnings({
      cart: [{ sku: "CTRL-1", controlled: true }],
      activeRole: "pharmacist",
    });
    expect(warnings.map((row) => row.id)).not.toContain(POS_REALTIME_WARNING_IDS.controlledPharmacist);
  });

  test("warns on session timeout flag", () => {
    const warnings = evaluatePosRealTimeWarnings({
      sessionWarning: true,
      sessionTimeoutMinutes: 15,
    });
    expect(warnings.map((row) => row.id)).toContain(POS_REALTIME_WARNING_IDS.sessionTimeout);
  });

  test("detects price override outside allowed range", () => {
    const catalogBySku = new Map([["sku-a", { sku: "sku-a", price: 10 }]]);
    const issue = findPriceOverrideRangeIssue(
      [{ sku: "sku-a", name: "Item", price: 5 }],
      catalogBySku,
      { priceOverrideMaxPercentDown: 20, priceOverrideMaxPercentUp: 50 },
      { activeRole: "cashier", managerOverrideActive: false }
    );
    expect(issue).not.toBeNull();
    const warnings = evaluatePosRealTimeWarnings({
      cart: [{ sku: "sku-a", name: "Item", price: 5 }],
      catalogItems: [{ sku: "sku-a", price: 10 }],
      activeRole: "cashier",
    });
    expect(warnings.map((row) => row.id)).toContain(POS_REALTIME_WARNING_IDS.priceOverrideRange);
  });

  test("sumRecentRefunds includes access log refunds", () => {
    const total = sumRecentRefunds(
      [
        {
          ts: now - 1000,
          message: "Refund override",
          detail: { tillNumber: 1, accessLogType: "refund_override", amount: 12.5 },
        },
      ],
      [],
      { tillNumber: 1, lookbackMinutes: 60, now }
    );
    expect(total).toBe(12.5);
  });

  test("cartHasControlledProduct respects controlled flag", () => {
    expect(cartHasControlledProduct([{ sku: "x", controlled: true }])).toBe(true);
    expect(cartHasControlledProduct([{ sku: "x" }])).toBe(false);
  });
});
