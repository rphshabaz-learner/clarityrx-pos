export const POS_TILL_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);
export const POS_TILL_STORAGE_KEY = "clarityrx.pos.selectedTill";

export function normalizeTillNumber(tillNumber) {
  const parsed = Number(tillNumber);
  return POS_TILL_OPTIONS.includes(parsed) ? parsed : 1;
}

export function loadSelectedTillNumber() {
  try {
    const saved = Number(window.localStorage.getItem(POS_TILL_STORAGE_KEY));
    return POS_TILL_OPTIONS.includes(saved) ? saved : 1;
  } catch {
    return 1;
  }
}

export function saveSelectedTillNumber(tillNumber) {
  try {
    window.localStorage.setItem(POS_TILL_STORAGE_KEY, String(tillNumber));
  } catch {
    // Session-only till selection is still valid.
  }
}
