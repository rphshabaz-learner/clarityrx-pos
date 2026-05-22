const SHIFT_STORAGE_KEY = "clarityrx.pos.activeShift";

function formatShiftDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function readStoredShift() {
  try {
    const raw = window.localStorage.getItem(SHIFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredShift(shift) {
  try {
    window.localStorage.setItem(SHIFT_STORAGE_KEY, JSON.stringify(shift));
  } catch {
    // Ignore storage failures; in-memory shift still works for the session.
  }
}

/** Ensure an open shift exists for the current calendar day. */
export function ensureOpenShift({ cashierId = "", tillNumber = 1 } = {}) {
  const today = formatShiftDate();
  const existing = readStoredShift();
  if (existing?.businessDate === today && existing.status === "open") {
    return existing;
  }

  let sequence = 1;
  if (existing?.businessDate === today) {
    sequence = (existing.sequence || 0) + 1;
  }
  const sequenceLabel = String(sequence).padStart(2, "0");
  const shift = {
    id: `S-${today}-${sequenceLabel}`,
    businessDate: today,
    sequence,
    status: "open",
    openedAt: Date.now(),
    cashierId,
    tillNumber,
  };
  writeStoredShift(shift);
  return shift;
}

export function getActiveShift() {
  return readStoredShift();
}

export function closeActiveShift() {
  const existing = readStoredShift();
  if (!existing) return null;
  const closed = { ...existing, status: "closed", closedAt: Date.now() };
  writeStoredShift(closed);
  return closed;
}

export function shiftStatusLabel(shift) {
  if (!shift) return "No shift";
  return shift.status === "open" ? "Shift open" : "Shift closed";
}
