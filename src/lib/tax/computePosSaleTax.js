import {
  computeCanadianSaleTax,
  legacyTaxRateToProvince,
  taxBreakdownForStorage,
} from "./canadianProvincialTax";
import { loadPosTaxConfig } from "./posTaxConfig";

/**
 * Resolve province and pricing mode (tax config wins; legacy single rate maps to province).
 */
export function resolvePosTaxContext(taxConfig, demographicConfig) {
  const loaded = taxConfig || loadPosTaxConfig();
  const provinceCode =
    loaded.provinceCode ||
    legacyTaxRateToProvince(demographicConfig?.taxRate) ||
    "BC";
  return {
    ...loaded,
    provinceCode,
    pricingMode: loaded.pricingMode || "exclusive",
  };
}

/**
 * Compute register tax from cart lines and post-discount taxable subtotal.
 */
export function computePosSaleTaxTotals({
  cart,
  computeLineTotal,
  taxableSubtotal,
  taxExempt,
  taxConfig,
  demographicConfig,
}) {
  const ctx = resolvePosTaxContext(taxConfig, demographicConfig);
  const preDiscountSubtotal = (cart || []).reduce(
    (sum, line) => sum + (Number(computeLineTotal(line)) || 0),
    0
  );
  const scale =
    preDiscountSubtotal > 0
      ? Math.max(0, Number(taxableSubtotal) || 0) / preDiscountSubtotal
      : 0;

  const lines = (cart || [])
    .filter((line) => line && Number(line.qty) > 0)
    .map((line) => ({
      lineTotal: Math.round((Number(computeLineTotal(line)) || 0) * scale * 100) / 100,
      taxClass: line.taxClass || "standard",
    }));

  const breakdown = computeCanadianSaleTax({
    taxableAmount: Math.max(0, Number(taxableSubtotal) || 0),
    provinceCode: ctx.provinceCode,
    taxExempt,
    pricingMode: ctx.pricingMode,
    lines: lines.length ? lines : null,
  });

  const total =
    ctx.pricingMode === "inclusive"
      ? Math.max(0, Number(taxableSubtotal) || 0)
      : Math.max(0, (Number(taxableSubtotal) || 0) + breakdown.totalTax);

  return {
    tax: breakdown.totalTax,
    taxBreakdown: breakdown,
    taxBreakdownStored: taxBreakdownForStorage(breakdown),
    total,
    provinceCode: ctx.provinceCode,
    pricingMode: ctx.pricingMode,
    businessNumber: ctx.businessNumber,
  };
}
