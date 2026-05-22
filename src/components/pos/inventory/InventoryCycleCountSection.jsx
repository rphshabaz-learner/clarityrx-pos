import React from "react";
import { EmptyState, SectionIntro } from "./InventoryShared";

export default function InventoryCycleCountSection({
  products,
  activeCycle,
  activeCycleId,
  setActiveCycleId,
  cycleSessions,
  busy,
  onCreateCycle,
  onUpdateCycle,
  onCompleteCycle,
}) {
  const addLine = (productId) => {
    if (!activeCycle) return;
    if ((activeCycle.lines || []).some((l) => l.productId === productId)) return;
    onUpdateCycle({
      ...activeCycle,
      lines: [
        ...(activeCycle.lines || []),
        { productId, sku: products.find((p) => p.id === productId)?.sku, countedQty: "" },
      ],
    });
  };

  const updateLineQty = (productId, countedQty) => {
    if (!activeCycle) return;
    onUpdateCycle({
      ...activeCycle,
      lines: (activeCycle.lines || []).map((line) =>
        line.productId === productId ? { ...line, countedQty } : line
      ),
    });
  };

  return (
    <div>
      <SectionIntro
        title="Cycle counts"
        description="Blind or open cycle count sessions. Review variances and post consolidated adjustments when the session is completed."
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button type="button" className="btn-primary" disabled={busy} onClick={onCreateCycle}>
          New cycle count
        </button>
        {activeCycle ? (
          <>
            <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={!!activeCycle.blindCount}
                onChange={(e) => onUpdateCycle({ ...activeCycle, blindCount: e.target.checked })}
              />
              Blind count (hide system qty)
            </label>
            <button
              type="button"
              className="btn-secondary"
              disabled={busy || !(activeCycle.lines || []).length}
              onClick={() => onCompleteCycle(activeCycle.id)}
            >
              Complete &amp; post variances
            </button>
          </>
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(200px, 1fr) minmax(0, 2fr)", gap: 16 }}>
        <div className="crx-card" style={{ padding: 12 }}>
          <div className="crx-card-title" style={{ marginBottom: 10, fontSize: 13 }}>
            Sessions
          </div>
          {cycleSessions.length === 0 ? (
            <EmptyState message="No cycle counts yet." />
          ) : (
            cycleSessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setActiveCycleId(session.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 8,
                  marginBottom: 6,
                  borderRadius: 8,
                  border: activeCycleId === session.id ? "2px solid #2563eb" : "1px solid #e5e7eb",
                  background: activeCycleId === session.id ? "#eff6ff" : "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                {session.name || session.id}
                <div style={{ color: "#6b7280", marginTop: 2 }}>
                  {session.status} · {(session.lines || []).length} lines
                </div>
              </button>
            ))
          )}
        </div>

        <div className="crx-card" style={{ padding: 16 }}>
          {!activeCycle ? (
            <EmptyState message="Create or select a cycle count session." />
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>{activeCycle.name}</div>
              <div style={{ marginBottom: 12, maxHeight: 120, overflow: "auto" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>Add SKU</div>
                {products.slice(0, 12).map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: 11, marginRight: 6, marginBottom: 6 }}
                    disabled={busy || (activeCycle.lines || []).some((l) => l.productId === row.id)}
                    onClick={() => addLine(row.id)}
                  >
                    + {row.sku}
                  </button>
                ))}
              </div>
              {(activeCycle.lines || []).length === 0 ? (
                <EmptyState message="Add products to this cycle count." />
              ) : (
                <table style={{ width: "100%", fontSize: 12 }}>
                  <thead>
                    <tr style={{ color: "#6b7280", textAlign: "left" }}>
                      <th>SKU</th>
                      {!activeCycle.blindCount ? <th>System</th> : null}
                      <th>Counted</th>
                      {!activeCycle.blindCount ? <th>Var</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {(activeCycle.lines || []).map((line) => {
                      const product = products.find((p) => p.id === line.productId);
                      const systemQty = Number(product?.onHand) || 0;
                      const counted = Number(line.countedQty);
                      const variance = Number.isFinite(counted) ? counted - systemQty : null;
                      return (
                        <tr key={line.productId} style={{ borderTop: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "8px 4px" }}>{line.sku || product?.sku}</td>
                          {!activeCycle.blindCount ? <td style={{ padding: "8px 4px" }}>{systemQty}</td> : null}
                          <td style={{ padding: "8px 4px" }}>
                            <input
                              className="crx-input"
                              type="number"
                              min="0"
                              value={line.countedQty}
                              onChange={(e) => updateLineQty(line.productId, e.target.value)}
                              style={{ width: 80 }}
                            />
                          </td>
                          {!activeCycle.blindCount ? (
                            <td style={{ padding: "8px 4px", fontWeight: 600 }}>
                              {variance != null ? (variance > 0 ? `+${variance}` : variance) : "—"}
                            </td>
                          ) : null}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
