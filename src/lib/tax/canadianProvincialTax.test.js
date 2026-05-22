import {
  TAX_PRICING_MODES,
  applyTaxComponentsToBase,
  computeCanadianSaleTax,
  computeRefundTaxReversal,
  legacyTaxRateToProvince,
  splitInclusiveLineTotal,
} from "./canadianProvincialTax";

describe("canadianProvincialTax", () => {
  it("applies BC GST + PST on exclusive base", () => {
    const { components, totalTax } = applyTaxComponentsToBase(100, "BC");
    expect(totalTax).toBe(12);
    expect(components.find((c) => c.id === "GST")?.amount).toBe(5);
    expect(components.find((c) => c.id === "PST")?.amount).toBe(7);
  });

  it("applies Ontario HST", () => {
    const result = computeCanadianSaleTax({
      taxableAmount: 100,
      provinceCode: "ON",
      pricingMode: TAX_PRICING_MODES.EXCLUSIVE,
    });
    expect(result.HST).toBe(13);
    expect(result.totalTax).toBe(13);
  });

  it("applies Quebec GST + QST compound", () => {
    const result = computeCanadianSaleTax({
      taxableAmount: 100,
      provinceCode: "QC",
      pricingMode: TAX_PRICING_MODES.EXCLUSIVE,
    });
    expect(result.GST).toBe(5);
    expect(result.QST).toBe(10.47);
    expect(result.totalTax).toBe(15.47);
  });

  it("splits inclusive BC shelf price", () => {
    const split = splitInclusiveLineTotal(112, "BC");
    expect(split.net).toBe(100);
    expect(split.totalTax).toBe(12);
  });

  it("returns zero tax when exempt", () => {
    const result = computeCanadianSaleTax({
      taxableAmount: 50,
      provinceCode: "ON",
      taxExempt: true,
    });
    expect(result.totalTax).toBe(0);
    expect(result.netSubtotal).toBe(50);
  });

  it("reverses refund tax proportionally", () => {
    const original = computeCanadianSaleTax({
      taxableAmount: 100,
      provinceCode: "BC",
    });
    const reversal = computeRefundTaxReversal({
      originalTaxBreakdown: original,
      refundTaxableAmount: 50,
      originalTaxableAmount: 100,
    });
    expect(reversal.totalTax).toBe(6);
    expect(reversal.GST).toBe(2.5);
    expect(reversal.PST).toBe(3.5);
  });

  it("maps legacy single tax rate to province", () => {
    expect(legacyTaxRateToProvince(0.13)).toBe("ON");
    expect(legacyTaxRateToProvince(0.05)).toBe("AB");
    expect(legacyTaxRateToProvince(0.12)).toBe("BC");
  });
});
