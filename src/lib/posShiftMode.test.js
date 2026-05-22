import { usesTransactionShiftMode } from "./posShiftMode";

describe("usesTransactionShiftMode", () => {
  it("uses transaction mode when till header is not locked (auto)", () => {
    expect(
      usesTransactionShiftMode({ tillNumber: 2, locked: false, source: "session" }, { cashShiftMode: "auto" })
    ).toBe(true);
  });

  it("uses session mode on locked workstation (auto)", () => {
    expect(
      usesTransactionShiftMode({ tillNumber: 2, locked: true, source: "local" }, { cashShiftMode: "auto" })
    ).toBe(false);
  });

  it("honours explicit session override on unlocked till", () => {
    expect(
      usesTransactionShiftMode({ tillNumber: 2, locked: false, source: "session" }, { cashShiftMode: "session" })
    ).toBe(false);
  });

  it("honours explicit transaction override on locked till", () => {
    expect(
      usesTransactionShiftMode({ tillNumber: 2, locked: true, source: "env" }, { cashShiftMode: "transaction" })
    ).toBe(true);
  });
});
