const SHIFTS_STORAGE_KEY = "clarityrx.pos.tillShifts";
const LEGACY_SHIFT_STORAGE_KEY = "clarityrx.pos.activeShift";

function formatShiftDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function normalizeTillNumber(tillNumber) {
  const parsed = Number(tillNumber);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function tillKey(tillNumber) {
  return String(normalizeTillNumber(tillNumber));
}

function readAllTillShifts() {
  try {
    const raw = window.localStorage.getItem(SHIFTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Fall through to legacy migration.
  }

  try {
    const legacyRaw = window.localStorage.getItem(LEGACY_SHIFT_STORAGE_KEY);
    if (!legacyRaw) return {};
    const legacy = JSON.parse(legacyRaw);
    if (!legacy || typeof legacy !== "object") return {};
    const key = tillKey(legacy.tillNumber);
    const migrated = { [key]: legacy };
    writeAllTillShifts(migrated);
    window.localStorage.removeItem(LEGACY_SHIFT_STORAGE_KEY);
    return migrated;
  } catch {
    return {};
  }
}

function writeAllTillShifts(map) {
  try {
    window.localStorage.setItem(SHIFTS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage failures; in-memory shift still works for the session.
  }
}

function readTillShift(tillNumber) {
  const map = readAllTillShifts();
  return map[tillKey(tillNumber)] || null;
}

function writeTillShift(tillNumber, shift) {
  const map = readAllTillShifts();
  if (shift) {
    map[tillKey(tillNumber)] = shift;
  } else {
    delete map[tillKey(tillNumber)];
  }
  writeAllTillShifts(map);
}

function nextSequenceForTill(map, businessDate, tillNumber) {
  let sequence = 1;
  Object.values(map).forEach((row) => {
    if (row?.businessDate === businessDate && normalizeTillNumber(row.tillNumber) === normalizeTillNumber(tillNumber)) {
      sequence = Math.max(sequence, (row.sequence || 0) + 1);
    }
  });
  return sequence;
}

function buildShiftId(businessDate, tillNumber, sequence) {
  const tillLabel = String(normalizeTillNumber(tillNumber)).padStart(2, "0");
  const sequenceLabel = String(sequence).padStart(2, "0");
  return `S-${businessDate}-T${tillLabel}-${sequenceLabel}`;
}

/** Active cash drawer session for a specific till (register). */
export function getActiveShift(tillNumber = 1) {
  return readTillShift(tillNumber);
}

/** All till shifts stored locally (open or closed). */
export function listTillShifts() {
  const map = readAllTillShifts();
  return Object.values(map).sort((a, b) => {
    const tillDelta = normalizeTillNumber(a?.tillNumber) - normalizeTillNumber(b?.tillNumber);
    if (tillDelta !== 0) return tillDelta;
    return (b?.openedAt || 0) - (a?.openedAt || 0);
  });
}

/** Shifts for a business date (YYYYMMDD), optionally filtered to one till. */
export function listTillShiftsForBusinessDate(businessDate, { tillNumber = null } = {}) {
  const date = businessDate || formatShiftDate();
  let rows = listTillShifts().filter((row) => row?.businessDate === date);
  if (tillNumber != null) {
    rows = rows.filter((row) => normalizeTillNumber(row.tillNumber) === normalizeTillNumber(tillNumber));
  }
  return rows;
}

export function isShiftOpenForTill(tillNumber = 1) {
  const shift = getActiveShift(tillNumber);
  const today = formatShiftDate();
  return shift?.status === "open" && shift?.businessDate === today;
}

/** Open a new shift on this till for today (or return the existing open shift). */
export function openTillShift({ tillNumber = 1, openedBy = "" } = {}) {
  const till = normalizeTillNumber(tillNumber);
  const today = formatShiftDate();
  const existing = readTillShift(till);
  if (existing?.businessDate === today && existing.status === "open") {
    return existing;
  }

  const map = readAllTillShifts();
  const sequence = nextSequenceForTill(map, today, till);
  const shift = {
    id: buildShiftId(today, till, sequence),
    businessDate: today,
    sequence,
    status: "open",
    openedAt: Date.now(),
    openedBy: openedBy || null,
    closedAt: null,
    closedBy: null,
    tillNumber: till,
  };
  writeTillShift(till, shift);
  return shift;
}

/** @deprecated Use openTillShift — kept for callers that auto-open on till mount. */
export function ensureOpenShift({ tillNumber = 1, openedBy = "", cashierId = "" } = {}) {
  return openTillShift({ tillNumber, openedBy: openedBy || cashierId });
}

export function closeActiveShift(tillNumber = 1, { closedBy = "" } = {}) {
  const till = normalizeTillNumber(tillNumber);
  const existing = readTillShift(till);
  if (!existing || existing.status !== "open") return existing;
  const closed = {
    ...existing,
    status: "closed",
    closedAt: Date.now(),
    closedBy: closedBy || null,
  };
  writeTillShift(till, closed);
  return closed;
}

export function shiftStatusLabel(shift) {
  if (!shift) return "No shift";
  const till = shift.tillNumber != null ? `Till ${shift.tillNumber}` : "Till";
  if (shift.status === "open") return `${till} · Shift open`;
  return `${till} · Shift closed`;
}
