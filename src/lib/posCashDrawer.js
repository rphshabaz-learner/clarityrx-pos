/** Whether this sale includes a cash tender (full or split). */
export function saleIncludesCashTender(payMethod, splitEnabled, splitPayments) {
  if (splitEnabled) {
    return (splitPayments || []).some(
      (row) => row.method === "Cash" && Number(row.amount) > 0
    );
  }
  return payMethod === "Cash";
}

/**
 * Signal the physical cash drawer to open (Electron hook when present, else DOM event for integrations).
 */
export async function signalCashDrawerOpen({ tillNumber, reason = "sale", detail = {} } = {}) {
  const payload = {
    tillNumber: Number(tillNumber) || 1,
    reason,
    at: Date.now(),
    ...detail,
  };

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("clarityrx:cash-drawer-open", { detail: payload })
    );
  }

  try {
    await window.clarityRxElectron?.openCashDrawer?.(payload);
  } catch {
    // Drawer hardware optional; event still fired for listeners.
  }

  return payload;
}
