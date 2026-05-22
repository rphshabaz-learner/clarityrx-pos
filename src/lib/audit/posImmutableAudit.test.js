import {
  IMMUTABLE_AUDIT_ACTION_ORDER,
  buildImmutableAuditRow,
  filterImmutableAuditRows,
  isControlledSaleItem,
} from "./posImmutableAudit";

describe("posImmutableAudit", () => {
  it("buildImmutableAuditRow uses required schema fields", () => {
    const row = buildImmutableAuditRow({
      user: "cashier-1",
      action: "price_override",
      terminal: 2,
      oldValue: 9.99,
      newValue: 7.5,
      reason: "price match",
      detail: { sku: "ABC" },
    });
    expect(row.user).toBe("cashier-1");
    expect(row.action).toBe("price_override");
    expect(row.terminal).toBe("2");
    expect(row.old_value).toBe("9.99");
    expect(row.new_value).toBe("7.5");
    expect(row.reason).toBe("price match");
    expect(row.immutable).toBe(true);
    expect(row.detail.sku).toBe("ABC");
  });

  it("isControlledSaleItem detects flags", () => {
    expect(isControlledSaleItem({ controlled: true })).toBe(true);
    expect(isControlledSaleItem({ sku: "x" })).toBe(false);
  });

  it("filterImmutableAuditRows by action and query", () => {
    const rows = [
      buildImmutableAuditRow({ user: "a", action: "void", reason: "line" }),
      buildImmutableAuditRow({ user: "b", action: "cash_drop", newValue: 100 }),
    ];
    expect(filterImmutableAuditRows(rows, { action: "void" })).toHaveLength(1);
    expect(filterImmutableAuditRows(rows, { query: "cash" })).toHaveLength(1);
  });

  it("must-log action registry is complete", () => {
    expect(IMMUTABLE_AUDIT_ACTION_ORDER).toContain("user_login");
    expect(IMMUTABLE_AUDIT_ACTION_ORDER).toContain("sale_deleted");
  });
});
