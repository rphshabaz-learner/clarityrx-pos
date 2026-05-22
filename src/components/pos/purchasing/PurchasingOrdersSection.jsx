import React, { useMemo, useState } from "react";
import { PO_STATUS } from "../../../lib/purchasing/orderStatus";
import { WHOLESALERS } from "../../../lib/purchasing/wholesalers";
import { EmptyState, SectionIntro, StatusBadge, WholesalerName } from "./PurchasingShared";

export default function PurchasingOrdersSection({
  orders,
  selectedOrder,
  selectedOrderNumber,
  setSelectedOrderNumber,
  busy,
  onCreateDraft,
  onSaveOrder,
  onSubmitEdi,
  onCancelOrder,
  emptyDraftLine,
  searchCatalog,
}) {
  const [supplier, setSupplier] = useState("mckesson");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogHits, setCatalogHits] = useState([]);

  const openOrders = useMemo(
    () => orders.filter((o) => o.status !== PO_STATUS.CANCELLED && o.status !== PO_STATUS.RECEIVED),
    [orders]
  );

  const handleCatalogSearch = async (value) => {
    setCatalogQuery(value);
    if (!value.trim()) {
      setCatalogHits([]);
      return;
    }
    const hits = await searchCatalog(value);
    setCatalogHits(hits);
  };

  const updateSelectedLines = (updater) => {
    if (!selectedOrder) return;
    onSaveOrder({ ...selectedOrder, lines: updater(selectedOrder.lines || []) });
  };

  const addLine = () => {
    updateSelectedLines((lines) => [...lines, emptyDraftLine()]);
  };

  const addFromCatalog = (item) => {
    updateSelectedLines((lines) => [
      ...lines,
      {
        ...emptyDraftLine(),
        sku: item.inventoryKey || item.mckessonItemNumber || "",
        wholesalerItemNumber: item.mckessonItemNumber || "",
        din: item.din || "",
        description: item.brandName || item.descriptor || "Catalog item",
        unitCost: Number(item.unitCost) || 0,
        lastCost: Number(item.unitCost) || 0,
      },
    ]);
    setCatalogHits([]);
    setCatalogQuery("");
  };

  return (
    <div>
      <SectionIntro
        title="Purchase orders"
        description="Create draft POs, submit via EDI/API to the wholesaler, and track status until received."
      />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <select className="crx-select" value={supplier} onChange={(e) => setSupplier(e.target.value)} style={{ maxWidth: 220 }}>
          {WHOLESALERS.map((w) => (
            <option key={w.id} value={w.id}>
              {w.label}
            </option>
          ))}
        </select>
        <button type="button" className="btn-primary" disabled={busy} onClick={() => onCreateDraft(supplier)}>
          New PO
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 1fr) minmax(0, 2fr)", gap: 16 }}>
        <div className="crx-card" style={{ padding: 12, maxHeight: 420, overflow: "auto" }}>
          <div className="crx-card-title" style={{ marginBottom: 10, fontSize: 13 }}>
            Open orders ({openOrders.length})
          </div>
          {openOrders.length === 0 ? (
            <EmptyState message="No open purchase orders." />
          ) : (
            openOrders.map((order) => (
              <button
                key={order.orderNumber}
                type="button"
                onClick={() => setSelectedOrderNumber(order.orderNumber)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border:
                    selectedOrderNumber === order.orderNumber ? "2px solid #1447e6" : "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 10,
                  marginBottom: 8,
                  background: selectedOrderNumber === order.orderNumber ? "#eff6ff" : "#fff",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13 }}>{order.orderNumber}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                  <WholesalerName id={order.supplier} /> · <StatusBadge status={order.status} />
                </div>
              </button>
            ))
          )}
        </div>

        <div className="crx-card" style={{ padding: 16 }}>
          {!selectedOrder ? (
            <EmptyState message="Select or create a purchase order." />
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{selectedOrder.orderNumber}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                    <WholesalerName id={selectedOrder.supplier} /> · <StatusBadge status={selectedOrder.status} />
                    {selectedOrder.edi?.reference ? ` · EDI ${selectedOrder.edi.reference}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {selectedOrder.status === PO_STATUS.DRAFT ? (
                    <>
                      <button type="button" className="btn-primary" disabled={busy} onClick={() => onSubmitEdi(selectedOrder.orderNumber)}>
                        Submit EDI
                      </button>
                      <button type="button" className="btn-secondary" disabled={busy} onClick={() => onCancelOrder(selectedOrder.orderNumber)}>
                        Delete draft
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {selectedOrder.status === PO_STATUS.DRAFT ? (
                <div style={{ marginTop: 12 }}>
                  <input
                    className="crx-input"
                    placeholder="Search catalog (DIN, item #, brand)"
                    value={catalogQuery}
                    onChange={(e) => handleCatalogSearch(e.target.value)}
                  />
                  {catalogHits.length > 0 ? (
                    <div style={{ marginTop: 8, border: "1px solid #e5e7eb", borderRadius: 8, maxHeight: 140, overflow: "auto" }}>
                      {catalogHits.map((item) => (
                        <button
                          key={item.inventoryKey || item.mckessonItemNumber}
                          type="button"
                          className="btn-secondary"
                          style={{
                            width: "100%",
                            justifyContent: "flex-start",
                            borderRadius: 0,
                            border: "none",
                            borderBottom: "1px solid #f3f4f6",
                            fontSize: 12,
                          }}
                          onClick={() => addFromCatalog(item)}
                        >
                          {item.brandName} · {item.mckessonItemNumber || item.din}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                {(selectedOrder.lines || []).map((line) => (
                  <div
                    key={line.lineId}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 72px 72px 80px 44px",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <input
                      className="crx-input"
                      value={line.description}
                      onChange={(e) =>
                        updateSelectedLines((lines) =>
                          lines.map((row) => (row.lineId === line.lineId ? { ...row, description: e.target.value } : row))
                        )
                      }
                      disabled={selectedOrder.status !== PO_STATUS.DRAFT}
                    />
                    <input
                      className="crx-input"
                      type="number"
                      min="0"
                      value={line.qtyOrdered}
                      onChange={(e) =>
                        updateSelectedLines((lines) =>
                          lines.map((row) =>
                            row.lineId === line.lineId ? { ...row, qtyOrdered: Number(e.target.value) || 0 } : row
                          )
                        )
                      }
                      disabled={selectedOrder.status !== PO_STATUS.DRAFT}
                      title="Qty ordered"
                    />
                    <input
                      className="crx-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitCost}
                      onChange={(e) =>
                        updateSelectedLines((lines) =>
                          lines.map((row) =>
                            row.lineId === line.lineId ? { ...row, unitCost: Number(e.target.value) || 0 } : row
                          )
                        )
                      }
                      title="Unit cost"
                    />
                    <input
                      className="crx-input"
                      value={line.sku}
                      onChange={(e) =>
                        updateSelectedLines((lines) =>
                          lines.map((row) => (row.lineId === line.lineId ? { ...row, sku: e.target.value } : row))
                        )
                      }
                      placeholder="SKU"
                    />
                    {selectedOrder.status === PO_STATUS.DRAFT ? (
                      <button
                        type="button"
                        className="crx-icon-btn"
                        onClick={() => updateSelectedLines((lines) => lines.filter((row) => row.lineId !== line.lineId))}
                      >
                        ×
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: "#6b7280" }}>Rcvd {line.qtyReceived || 0}</span>
                    )}
                  </div>
                ))}
              </div>
              {selectedOrder.status === PO_STATUS.DRAFT ? (
                <button type="button" className="btn-secondary" style={{ marginTop: 10 }} onClick={addLine}>
                  + Line
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
