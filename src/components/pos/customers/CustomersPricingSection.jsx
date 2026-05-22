import React from "react";
import { generateCustomerLineId } from "../../../lib/customers/customerTypes";
import { CustomerListSidebar, EmptyState, FieldLabel, SectionIntro } from "./CustomersShared";

export default function CustomersPricingSection({
  filteredCustomers,
  selectedCustomer,
  selectedCustomerId,
  setSelectedCustomerId,
  listQuery,
  setListQuery,
  busy,
  onCreateCustomer,
  onSaveCustomer,
}) {
  const addSpecialPrice = () => {
    if (!selectedCustomer) return;
    onSaveCustomer({
      ...selectedCustomer,
      specialPricing: [
        ...(selectedCustomer.specialPricing || []),
        { id: generateCustomerLineId(), sku: "", price: 0, note: "" },
      ],
    });
  };

  const updateSpecial = (id, patch) => {
    if (!selectedCustomer) return;
    const specialPricing = (selectedCustomer.specialPricing || []).map((row) =>
      row.id === id ? { ...row, ...patch } : row
    );
    onSaveCustomer({ ...selectedCustomer, specialPricing });
  };

  const removeSpecial = (id) => {
    if (!selectedCustomer) return;
    onSaveCustomer({
      ...selectedCustomer,
      specialPricing: (selectedCustomer.specialPricing || []).filter((row) => row.id !== id),
    });
  };

  return (
    <div>
      <SectionIntro
        title="Special pricing & senior discounts"
        description="Contract pricing by SKU and verified senior discount eligibility for OTC and front-store items."
      />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) minmax(0, 2fr)", gap: 16 }}>
        <CustomerListSidebar
          customers={filteredCustomers}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          listQuery={listQuery}
          setListQuery={setListQuery}
          onCreate={onCreateCustomer}
          busy={busy}
        />
        <div className="crx-card" style={{ padding: 16 }}>
          {!selectedCustomer ? (
            <EmptyState message="Select a customer for pricing rules." />
          ) : (
            <>
              <div style={{ marginBottom: 20, padding: 14, background: "#f9fafb", borderRadius: 10 }}>
                <div className="crx-card-title" style={{ marginBottom: 10, fontSize: 14 }}>
                  Senior discount
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 10 }}>
                  <input
                    type="checkbox"
                    checked={selectedCustomer.seniorDiscount?.enabled === true}
                    onChange={(e) =>
                      onSaveCustomer({
                        ...selectedCustomer,
                        seniorDiscount: {
                          ...selectedCustomer.seniorDiscount,
                          enabled: e.target.checked,
                          verifiedAt: e.target.checked
                            ? selectedCustomer.seniorDiscount?.verifiedAt || new Date().toISOString()
                            : null,
                        },
                      })
                    }
                  />
                  Senior discount verified
                </label>
                <FieldLabel>Discount percent</FieldLabel>
                <input
                  className="crx-input"
                  type="number"
                  min="0"
                  max="100"
                  value={selectedCustomer.seniorDiscount?.percent ?? 10}
                  onChange={(e) =>
                    onSaveCustomer({
                      ...selectedCustomer,
                      seniorDiscount: {
                        ...selectedCustomer.seniorDiscount,
                        percent: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                      },
                    })
                  }
                  style={{ marginTop: 6, maxWidth: 120 }}
                  disabled={!selectedCustomer.seniorDiscount?.enabled}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div className="crx-card-title" style={{ fontSize: 14 }}>
                  Special pricing
                </div>
                <button type="button" className="btn-secondary" style={{ fontSize: 12 }} disabled={busy} onClick={addSpecialPrice}>
                  + SKU price
                </button>
              </div>
              {(selectedCustomer.specialPricing || []).length === 0 ? (
                <EmptyState message="No contract prices configured." />
              ) : (
                (selectedCustomer.specialPricing || []).map((row) => (
                  <div
                    key={row.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 100px 1fr 60px",
                      gap: 8,
                      marginBottom: 8,
                      alignItems: "end",
                    }}
                  >
                    <div>
                      <FieldLabel>SKU</FieldLabel>
                      <input
                        className="crx-input"
                        value={row.sku}
                        onChange={(e) => updateSpecial(row.id, { sku: e.target.value })}
                        style={{ marginTop: 4, width: "100%" }}
                      />
                    </div>
                    <div>
                      <FieldLabel>Price</FieldLabel>
                      <input
                        className="crx-input"
                        type="number"
                        step="0.01"
                        value={row.price}
                        onChange={(e) => updateSpecial(row.id, { price: Number(e.target.value) || 0 })}
                        style={{ marginTop: 4, width: "100%" }}
                      />
                    </div>
                    <div>
                      <FieldLabel>Note</FieldLabel>
                      <input
                        className="crx-input"
                        value={row.note}
                        onChange={(e) => updateSpecial(row.id, { note: e.target.value })}
                        style={{ marginTop: 4, width: "100%" }}
                      />
                    </div>
                    <button type="button" className="btn-secondary" style={{ fontSize: 11 }} onClick={() => removeSpecial(row.id)}>
                      Remove
                    </button>
                  </div>
                ))
              )}
              <button type="button" className="btn-primary" disabled={busy} style={{ marginTop: 12 }} onClick={() => onSaveCustomer(selectedCustomer)}>
                Save pricing
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
