/**
 * Build inventory adjustment payloads after receiving stock on a PO.
 */
export function buildReceiveAdjustments(lines, meta = {}) {
  const adjustments = [];
  for (const line of lines || []) {
    const delta = Number(line.qtyReceivedThisPass);
    if (!Number.isFinite(delta) || delta <= 0) continue;
    const sku = String(line.sku || line.wholesalerItemNumber || "").trim();
    if (!sku) continue;
    adjustments.push({
      sku,
      quantityDelta: delta,
      ...meta,
      purchaseOrderNumber: meta.purchaseOrderNumber,
      invoiceNumber: meta.invoiceNumber,
      unitCost: line.unitCost != null ? Number(line.unitCost) : undefined,
    });
  }
  return adjustments;
}

export function applyReceiveToLines(lines, receiveDraft) {
  return (lines || []).map((line) => {
    const draft = receiveDraft[line.lineId];
    const qtyThisPass = Math.max(0, Number(draft?.qtyThisPass) || 0);
    const nextReceived = (Number(line.qtyReceived) || 0) + qtyThisPass;
    const ordered = Number(line.qtyOrdered) || 0;
    const qtyBackordered = Math.max(0, ordered - nextReceived);
    const unitCost =
      draft?.unitCost != null && draft.unitCost !== ""
        ? Number(draft.unitCost)
        : line.unitCost;
    return {
      ...line,
      qtyReceived: nextReceived,
      qtyBackordered,
      unitCost: Number.isFinite(unitCost) ? unitCost : line.unitCost,
      lastCost: Number.isFinite(unitCost) ? unitCost : line.lastCost,
    };
  });
}
