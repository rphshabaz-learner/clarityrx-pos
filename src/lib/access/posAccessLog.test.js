import {
  ACCESS_LOG_TYPES,
  classifyAccessLogActivity,
  filterAccessLogActivities,
} from "./posAccessLog";

describe("posAccessLog", () => {
  test("classifies profile view by message", () => {
    expect(
      classifyAccessLogActivity({
        message: "Customer profile viewed",
        detail: { customerId: "c1" },
      })
    ).toBe("profile_view");
  });

  test("classifies by accessLogType on detail", () => {
    expect(
      classifyAccessLogActivity({
        message: "Custom",
        detail: { accessLogType: "void", voidKind: "line" },
      })
    ).toBe("void");
  });

  test("classifies rx-linked by pickupId", () => {
    expect(
      classifyAccessLogActivity({
        message: "POS charge completed",
        detail: { pickupId: "p-1", total: 12 },
      })
    ).toBe("rx_transaction");
  });

  test("filterAccessLogActivities respects type filter", () => {
    const rows = filterAccessLogActivities(
      [
        { message: "Customer profile viewed", detail: { customerId: "a" } },
        { message: "Sale line voided", detail: { accessLogType: "void" } },
      ],
      { type: "void", limit: 10 }
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].accessLogType).toBe("void");
  });

  test("ACCESS_LOG_TYPES covers all tracked categories", () => {
    expect(Object.keys(ACCESS_LOG_TYPES).sort()).toEqual(
      ["age_verification", "discount_override", "profile_view", "refund_override", "rx_transaction", "void"].sort()
    );
  });
});
