import {
  cartAgeRestrictionClasses,
  missingAgeVerifications,
  parseDateOnly,
  resolveAgeRestrictionClass,
  verifyPurchaserAge,
  yearsBetween,
} from "./ageRestrictedProducts";

describe("ageRestrictedProducts", () => {
  it("detects explicit and category-hinted classes", () => {
    expect(resolveAgeRestrictionClass({ ageRestrictionClass: "lottery" })).toBe("lottery");
    expect(resolveAgeRestrictionClass({ name: "Players Extra 649", category: "Lottery" })).toBe(
      "lottery"
    );
    expect(resolveAgeRestrictionClass({ name: "Tylenol", category: "Pain relief" })).toBe("none");
  });

  it("validates DOB against minimum age", () => {
    const config = { storeMinimumAge: 19 };
    const young = verifyPurchaserAge("2010-05-01", "nicotine", config);
    expect(young.ok).toBe(false);
    const adult = verifyPurchaserAge("1990-05-01", "nicotine", config);
    expect(adult.ok).toBe(true);
    expect(adult.age).toBeGreaterThanOrEqual(19);
  });

  it("lists missing verifications for cart classes", () => {
    const cart = [{ sku: "LOT-1", name: "Lotto", ageRestrictionClass: "lottery", qty: 1, price: 5 }];
    const classes = cartAgeRestrictionClasses(cart, { enabledClasses: ["lottery"] });
    expect(classes).toEqual(["lottery"]);
    expect(missingAgeVerifications(cart, {}, { enabledClasses: ["lottery"] })).toEqual(["lottery"]);
  });

  it("parses date-only strings", () => {
    const d = parseDateOnly("2001-02-03");
    expect(d).not.toBeNull();
    expect(yearsBetween(d, new Date("2020-02-02"))).toBe(18);
    expect(yearsBetween(d, new Date("2020-02-04"))).toBe(19);
  });
});
