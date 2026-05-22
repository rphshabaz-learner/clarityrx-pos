export const PO_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  PARTIAL: "partial",
  RECEIVED: "received",
  CANCELLED: "cancelled",
};

export const RTV_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  CREDITED: "credited",
};

export const DAMAGED_STATUS = {
  OPEN: "open",
  RESOLVED: "resolved",
};

export function poStatusLabel(status) {
  const map = {
    draft: "Draft",
    submitted: "Submitted",
    partial: "Partially received",
    received: "Received",
    cancelled: "Cancelled",
  };
  return map[status] || status;
}

export function poStatusBadgeClass(status) {
  if (status === PO_STATUS.RECEIVED) return "badge-green";
  if (status === PO_STATUS.SUBMITTED || status === PO_STATUS.PARTIAL) return "badge-amber";
  if (status === PO_STATUS.CANCELLED) return "badge-gray";
  return "badge-gray";
}

export function generateOrderNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PO-${stamp}-${suffix}`;
}

export function generateLineId() {
  return `ln-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateRecordId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function summarizePoBackorders(order) {
  const lines = Array.isArray(order?.lines) ? order.lines : [];
  return lines
    .filter((line) => (line.qtyBackordered || 0) > 0)
    .map((line) => ({
      orderNumber: order.orderNumber,
      supplier: order.supplier,
      ...line,
    }));
}

export function computePoReceiveStatus(lines) {
  const rows = Array.isArray(lines) ? lines : [];
  if (!rows.length) return PO_STATUS.DRAFT;
  const totalOrdered = rows.reduce((sum, line) => sum + (Number(line.qtyOrdered) || 0), 0);
  const totalReceived = rows.reduce((sum, line) => sum + (Number(line.qtyReceived) || 0), 0);
  if (totalReceived <= 0) return PO_STATUS.SUBMITTED;
  if (totalReceived >= totalOrdered) return PO_STATUS.RECEIVED;
  return PO_STATUS.PARTIAL;
}
