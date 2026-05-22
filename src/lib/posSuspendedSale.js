const SUSPENDED_SALE_KEY = "clarityrx.pos.suspendedSale";

export function loadSuspendedSale() {
  try {
    const raw = window.localStorage.getItem(SUSPENDED_SALE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSuspendedSale(snapshot) {
  try {
    window.localStorage.setItem(SUSPENDED_SALE_KEY, JSON.stringify(snapshot));
    return snapshot;
  } catch {
    return null;
  }
}

export function clearSuspendedSale() {
  try {
    window.localStorage.removeItem(SUSPENDED_SALE_KEY);
  } catch {
    // Ignore.
  }
}
