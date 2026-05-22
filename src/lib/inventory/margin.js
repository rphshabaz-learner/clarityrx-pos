export function computeMarginPercent(cost, retail) {
  const c = Number(cost) || 0;
  const r = Number(retail) || 0;
  if (r <= 0) return null;
  return ((r - c) / r) * 100;
}

export function retailFromCostAndMargin(cost, marginPercent) {
  const c = Number(cost) || 0;
  const m = Number(marginPercent);
  if (!Number.isFinite(m) || m >= 100) return null;
  return c / (1 - m / 100);
}

export function formatMarginPercent(cost, retail) {
  const value = computeMarginPercent(cost, retail);
  if (value == null) return "—";
  return `${value.toFixed(1)}%`;
}

export function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
}
