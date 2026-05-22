/** Calendar business date key (YYYYMMDD), aligned with shift storage. */
export function formatBusinessDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function formatBusinessDateLabel(businessDate) {
  const raw = String(businessDate || "");
  if (raw.length !== 8) return raw || "—";
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

export function todayBusinessDate() {
  return formatBusinessDate();
}
