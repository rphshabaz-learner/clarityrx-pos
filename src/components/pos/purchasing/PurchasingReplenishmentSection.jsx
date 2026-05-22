import React, { useState } from "react";
import { WHOLESALERS } from "../../../lib/purchasing/wholesalers";
import { EmptyState, SectionIntro, WholesalerName } from "./PurchasingShared";

export default function PurchasingReplenishmentSection({
  rules,
  busy,
  onSaveRule,
  onRemoveRule,
  onBuildOrder,
}) {
  const [supplier, setSupplier] = useState("mckesson");
  const [draft, setDraft] = useState({
    sku: "",
    description: "",
    minQty: 5,
    reorderQty: 10,
    currentQty: 0,
    unitCost: 0,
  });

  const handleAdd = () => {
    if (!draft.sku.trim()) return;
    onSaveRule({
      supplier,
      sku: draft.sku.trim(),
      description: draft.description.trim() || draft.sku.trim(),
      minQty: Number(draft.minQty) || 0,
      reorderQty: Number(draft.reorderQty) || 1,
      currentQty: Number(draft.currentQty) || 0,
      unitCost: Number(draft.unitCost) || 0,
      enabled: true,
    });
    setDraft({ sku: "", description: "", minQty: 5, reorderQty: 10, currentQty: 0, unitCost: 0 });
  };

  return (
    <div>
      <SectionIntro
        title="Automatic replenishment"
        description="Min/max rules per SKU. When on-hand (manual count) is at or below minimum, generate a draft PO for the wholesaler."
      />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <select className="crx-select" value={supplier} onChange={(e) => setSupplier(e.target.value)} style={{ maxWidth: 240 }}>
          {WHOLESALERS.filter((w) => w.supportsEdi).map((w) => (
            <option key={w.id} value={w.id}>
              {w.label}
            </option>
          ))}
        </select>
        <button type="button" className="btn-primary" disabled={busy} onClick={() => onBuildOrder(supplier)}>
          Build replenishment PO
        </button>
      </div>

      <div className="crx-card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Add rule</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(100px, 1fr)) auto", gap: 8 }}>
          <input className="crx-input" placeholder="SKU" value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} />
          <input
            className="crx-input"
            placeholder="Description"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
          <input
            className="crx-input"
            type="number"
            placeholder="Min"
            value={draft.minQty}
            onChange={(e) => setDraft({ ...draft, minQty: e.target.value })}
          />
          <input
            className="crx-input"
            type="number"
            placeholder="Reorder qty"
            value={draft.reorderQty}
            onChange={(e) => setDraft({ ...draft, reorderQty: e.target.value })}
          />
          <input
            className="crx-input"
            type="number"
            placeholder="On hand"
            value={draft.currentQty}
            onChange={(e) => setDraft({ ...draft, currentQty: e.target.value })}
          />
          <button type="button" className="btn-secondary" onClick={handleAdd}>
            Save
          </button>
        </div>
      </div>

      <div className="crx-card" style={{ padding: 16 }}>
        {rules.length === 0 ? (
          <EmptyState message="No replenishment rules yet." />
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 80px 80px 80px 60px",
                gap: 8,
                padding: "10px 0",
                borderBottom: "1px solid #f3f4f6",
                fontSize: 13,
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{rule.description || rule.sku}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  <WholesalerName id={rule.supplier} /> · {rule.sku}
                </div>
              </div>
              <span>Min {rule.minQty}</span>
              <span>Reorder {rule.reorderQty}</span>
              <span>On hand {rule.currentQty}</span>
              <span>{rule.enabled === false ? "Off" : "On"}</span>
              <button type="button" className="btn-secondary" style={{ fontSize: 11 }} onClick={() => onRemoveRule(rule.id)}>
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
