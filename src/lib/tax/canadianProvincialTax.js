/**
 * Province-dependent GST / HST / PST / QST for Canadian retail POS.
 * Supports tax-exclusive and tax-inclusive shelf pricing, line exemptions, and refund reversal.
 */

export const CA_PROVINCE_CODES = [
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "NT",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
];

export const TAX_PRICING_MODES = {
  EXCLUSIVE: "exclusive",
  INCLUSIVE: "inclusive",
};

export const TAX_COMPONENT_IDS = {
  GST: "GST",
  HST: "HST",
  PST: "PST",
  QST: "QST",
};

/** @typedef {'base' | 'base_plus_gst'} TaxComponentBase */

/**
 * @typedef {Object} TaxComponentDef
 * @property {string} id
 * @property {string} label
 * @property {number} rate
 * @property {TaxComponentBase} [on]
 */

/** @type {Record<string, { label: string, components: TaxComponentDef[] }>} */
export const PROVINCE_TAX_REGIMES = {
  AB: { label: "Alberta", components: [{ id: TAX_COMPONENT_IDS.GST, label: "GST", rate: 0.05 }] },
  BC: {
    label: "British Columbia",
    components: [
      { id: TAX_COMPONENT_IDS.GST, label: "GST", rate: 0.05 },
      { id: TAX_COMPONENT_IDS.PST, label: "PST", rate: 0.07, on: "base" },
    ],
  },
  MB: {
    label: "Manitoba",
    components: [
      { id: TAX_COMPONENT_IDS.GST, label: "GST", rate: 0.05 },
      { id: TAX_COMPONENT_IDS.PST, label: "PST", rate: 0.07, on: "base" },
    ],
  },
  SK: {
    label: "Saskatchewan",
    components: [
      { id: TAX_COMPONENT_IDS.GST, label: "GST", rate: 0.05 },
      { id: TAX_COMPONENT_IDS.PST, label: "PST", rate: 0.06, on: "base" },
    ],
  },
  ON: { label: "Ontario", components: [{ id: TAX_COMPONENT_IDS.HST, label: "HST", rate: 0.13 }] },
  QC: {
    label: "Quebec",
    components: [
      { id: TAX_COMPONENT_IDS.GST, label: "GST", rate: 0.05 },
      { id: TAX_COMPONENT_IDS.QST, label: "QST", rate: 0.09975, on: "base_plus_gst" },
    ],
  },
  NB: { label: "New Brunswick", components: [{ id: TAX_COMPONENT_IDS.HST, label: "HST", rate: 0.15 }] },
  NL: { label: "Newfoundland and Labrador", components: [{ id: TAX_COMPONENT_IDS.HST, label: "HST", rate: 0.15 }] },
  NS: { label: "Nova Scotia", components: [{ id: TAX_COMPONENT_IDS.HST, label: "HST", rate: 0.14 }] },
  PE: { label: "Prince Edward Island", components: [{ id: TAX_COMPONENT_IDS.HST, label: "HST", rate: 0.15 }] },
  NT: { label: "Northwest Territories", components: [{ id: TAX_COMPONENT_IDS.GST, label: "GST", rate: 0.05 }] },
  NU: { label: "Nunavut", components: [{ id: TAX_COMPONENT_IDS.GST, label: "GST", rate: 0.05 }] },
  YT: { label: "Yukon", components: [{ id: TAX_COMPONENT_IDS.GST, label: "GST", rate: 0.05 }] },
};

export function normalizeProvinceCode(code) {
  const upper = String(code || "")
    .trim()
    .toUpperCase();
  return CA_PROVINCE_CODES.includes(upper) ? upper : "BC";
}

export function provinceTaxLabel(code) {
  return PROVINCE_TAX_REGIMES[normalizeProvinceCode(code)]?.label || "British Columbia";
}

export function roundMoney(amount) {
  return Math.round((Number(amount) || 0) * 100) / 100;
}

function emptyBreakdown(provinceCode) {
  return {
    provinceCode: normalizeProvinceCode(provinceCode),
    pricingMode: TAX_PRICING_MODES.EXCLUSIVE,
    taxableSubtotal: 0,
    netSubtotal: 0,
    totalTax: 0,
    GST: 0,
    HST: 0,
    PST: 0,
    QST: 0,
    components: [],
    lineTax: [],
  };
}

function isLineTaxable(line, taxExempt) {
  if (taxExempt) return false;
  const taxClass = String(line?.taxClass || "standard").toLowerCase();
  return taxClass !== "exempt" && taxClass !== "zero";
}

/**
 * Apply province component stack to a pre-tax base (exclusive mode).
 */
export function applyTaxComponentsToBase(base, provinceCode) {
  const regime = PROVINCE_TAX_REGIMES[normalizeProvinceCode(provinceCode)];
  if (!regime) return { net: base, components: [] };

  let gstAcc = 0;
  const components = [];
  for (const def of regime.components) {
    const basis =
      def.on === "base_plus_gst" ? roundMoney(base + gstAcc) : roundMoney(base);
    const amount = roundMoney(basis * def.rate);
    if (def.id === TAX_COMPONENT_IDS.GST) gstAcc = amount;
    components.push({ id: def.id, label: def.label, rate: def.rate, basis, amount });
  }
  const totalTax = roundMoney(components.reduce((sum, row) => sum + row.amount, 0));
  return { net: roundMoney(base), components, totalTax };
}

/**
 * Split tax-inclusive line total into net + per-component tax (inverse of exclusive stack).
 */
export function splitInclusiveLineTotal(inclusiveTotal, provinceCode) {
  const regime = PROVINCE_TAX_REGIMES[normalizeProvinceCode(provinceCode)];
  const inclusive = roundMoney(inclusiveTotal);
  if (!regime?.components?.length || inclusive <= 0) {
    return { net: inclusive, components: [], totalTax: 0 };
  }

  const hasCompoundQst = regime.components.some((def) => def.on === "base_plus_gst");
  let divisor = 1;
  if (hasCompoundQst) {
    const gstRate = regime.components.find((def) => def.id === TAX_COMPONENT_IDS.GST)?.rate || 0;
    const qstRate = regime.components.find((def) => def.id === TAX_COMPONENT_IDS.QST)?.rate || 0;
    divisor = (1 + gstRate) * (1 + qstRate);
  } else {
    const parallelRate = regime.components.reduce((sum, def) => sum + def.rate, 0);
    divisor = 1 + parallelRate;
  }

  const net = roundMoney(inclusive / divisor);
  const { components, totalTax } = applyTaxComponentsToBase(net, provinceCode);
  const adjustedTax = roundMoney(inclusive - net);
  if (Math.abs(adjustedTax - totalTax) > 0.02 && components.length) {
    const delta = roundMoney(adjustedTax - totalTax);
    components[components.length - 1].amount = roundMoney(components[components.length - 1].amount + delta);
  }
  return { net, components, totalTax: adjustedTax };
}

/**
 * @param {Object} params
 * @param {number} params.taxableAmount - Post-discount amount (exclusive: pre-tax; inclusive: tax-included)
 * @param {string} params.provinceCode
 * @param {boolean} [params.taxExempt]
 * @param {'exclusive'|'inclusive'} [params.pricingMode]
 * @param {{ lineTotal: number, taxClass?: string }[]} [params.lines]
 */
export function computeCanadianSaleTax({
  taxableAmount,
  provinceCode,
  taxExempt = false,
  pricingMode = TAX_PRICING_MODES.EXCLUSIVE,
  lines = null,
}) {
  const province = normalizeProvinceCode(provinceCode);
  const mode =
    pricingMode === TAX_PRICING_MODES.INCLUSIVE
      ? TAX_PRICING_MODES.INCLUSIVE
      : TAX_PRICING_MODES.EXCLUSIVE;

  if (taxExempt) {
    const subtotal = roundMoney(taxableAmount);
    return { ...emptyBreakdown(province), pricingMode: mode, taxableSubtotal: subtotal, netSubtotal: subtotal };
  }

  const cartLines = Array.isArray(lines) && lines.length ? lines : [{ lineTotal: taxableAmount, taxClass: "standard" }];

  let taxableSubtotal = 0;
  let netSubtotal = 0;
  const merged = { GST: 0, HST: 0, PST: 0, QST: 0 };
  const lineTax = [];
  const componentTotals = new Map();

  for (const line of cartLines) {
    const gross = roundMoney(line.lineTotal);
    if (!isLineTaxable(line, taxExempt)) {
      lineTax.push({ lineTotal: gross, taxable: false, net: gross, tax: 0, components: [] });
      netSubtotal = roundMoney(netSubtotal + gross);
      continue;
    }

    taxableSubtotal = roundMoney(taxableSubtotal + gross);
    if (mode === TAX_PRICING_MODES.INCLUSIVE) {
      const split = splitInclusiveLineTotal(gross, province);
      netSubtotal = roundMoney(netSubtotal + split.net);
      for (const comp of split.components) {
        merged[comp.id] = roundMoney((merged[comp.id] || 0) + comp.amount);
        const key = comp.id;
        const prev = componentTotals.get(key) || { ...comp, amount: 0 };
        componentTotals.set(key, { ...prev, amount: roundMoney(prev.amount + comp.amount) });
      }
      lineTax.push({
        lineTotal: gross,
        taxable: true,
        net: split.net,
        tax: split.totalTax,
        components: split.components,
      });
    } else {
      const { net, components, totalTax } = applyTaxComponentsToBase(gross, province);
      netSubtotal = roundMoney(netSubtotal + net);
      for (const comp of components) {
        merged[comp.id] = roundMoney((merged[comp.id] || 0) + comp.amount);
        const key = comp.id;
        const prev = componentTotals.get(key) || { ...comp, amount: 0 };
        componentTotals.set(key, { ...prev, amount: roundMoney(prev.amount + comp.amount) });
      }
      lineTax.push({ lineTotal: gross, taxable: true, net, tax: totalTax, components });
    }
  }

  const components = Array.from(componentTotals.values()).filter((row) => row.amount > 0);
  const totalTax = roundMoney((merged.GST || 0) + (merged.HST || 0) + (merged.PST || 0) + (merged.QST || 0));

  return {
    provinceCode: province,
    pricingMode: mode,
    taxableSubtotal,
    netSubtotal,
    totalTax,
    GST: merged.GST || 0,
    HST: merged.HST || 0,
    PST: merged.PST || 0,
    QST: merged.QST || 0,
    components,
    lineTax,
  };
}

/** Convenience: cart lines with computeLineTotal already applied. */
export function computeCanadianSaleTaxFromCartLines({
  cartLines,
  taxExempt,
  provinceCode,
  pricingMode,
}) {
  const lines = (cartLines || [])
    .filter((line) => line && Number(line.qty) > 0)
    .map((line) => ({
      lineTotal: roundMoney(Number(line.lineTotal) ?? 0),
      taxClass: line.taxClass || "standard",
    }));
  const taxableAmount = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  return computeCanadianSaleTax({
    taxableAmount,
    provinceCode,
    taxExempt,
    pricingMode,
    lines,
  });
}

/**
 * Proportional refund tax reversal for audit (matches original sale component split).
 */
export function computeRefundTaxReversal({
  originalTaxBreakdown,
  refundTaxableAmount,
  originalTaxableAmount,
}) {
  const refundBase = roundMoney(refundTaxableAmount);
  const originalBase = roundMoney(originalTaxableAmount);
  if (refundBase <= 0 || originalBase <= 0 || !originalTaxBreakdown) {
    return {
      refundTaxableAmount: refundBase,
      totalTax: 0,
      GST: 0,
      HST: 0,
      PST: 0,
      QST: 0,
      components: [],
      ratio: 0,
    };
  }

  const ratio = Math.min(1, refundBase / originalBase);
  const pick = (key) => roundMoney((Number(originalTaxBreakdown[key]) || 0) * ratio);
  const components = (originalTaxBreakdown.components || []).map((row) => ({
    ...row,
    amount: roundMoney((Number(row.amount) || 0) * ratio),
    basis: roundMoney((Number(row.basis) || 0) * ratio),
  }));

  return {
    refundTaxableAmount: refundBase,
    ratio: roundMoney(ratio),
    GST: pick("GST"),
    HST: pick("HST"),
    PST: pick("PST"),
    QST: pick("QST"),
    totalTax: pick("totalTax"),
    components,
    provinceCode: originalTaxBreakdown.provinceCode,
    pricingMode: originalTaxBreakdown.pricingMode,
  };
}

export function taxBreakdownForStorage(breakdown) {
  if (!breakdown) return null;
  return {
    provinceCode: breakdown.provinceCode,
    pricingMode: breakdown.pricingMode,
    taxableSubtotal: breakdown.taxableSubtotal,
    netSubtotal: breakdown.netSubtotal,
    totalTax: breakdown.totalTax,
    GST: breakdown.GST,
    HST: breakdown.HST,
    PST: breakdown.PST,
    QST: breakdown.QST,
    components: (breakdown.components || []).map((row) => ({
      id: row.id,
      label: row.label,
      rate: row.rate,
      basis: row.basis,
      amount: row.amount,
    })),
  };
}

export function legacyTaxRateToProvince(taxRate) {
  const rate = Number(taxRate) || 0;
  if (Math.abs(rate - 0.13) < 0.005) return "ON";
  if (Math.abs(rate - 0.15) < 0.005) return "NB";
  if (Math.abs(rate - 0.14) < 0.005) return "NS";
  if (Math.abs(rate - 0.12) < 0.008) return "BC";
  if (Math.abs(rate - 0.11) < 0.008) return "SK";
  if (Math.abs(rate - 0.14975) < 0.003) return "QC";
  if (rate > 0 && rate < 0.06) return "AB";
  return "BC";
}
