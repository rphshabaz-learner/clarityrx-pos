import { tillScopedStorageKey } from "./tillScopedStorage";
import { normalizeTillNumber } from "./posTill";

jest.mock("../session/scopedStorage", () => ({
  scopedStorageKey: (baseKey) => `${baseKey}::ws-test::win-test`,
}));

describe("tillScopedStorageKey", () => {
  it("scopes keys by workspace window and till number", () => {
    expect(tillScopedStorageKey("clarityrx.pos.cart", 1)).toBe(
      "clarityrx.pos.cart::ws-test::win-test::till-1"
    );
    expect(tillScopedStorageKey("clarityrx.pos.cart", 2)).toBe(
      "clarityrx.pos.cart::ws-test::win-test::till-2"
    );
  });

  it("normalizes invalid till numbers to till 1", () => {
    expect(tillScopedStorageKey("clarityrx.pos.cart", 99)).toContain("::till-1");
    expect(normalizeTillNumber(99)).toBe(1);
  });
});
