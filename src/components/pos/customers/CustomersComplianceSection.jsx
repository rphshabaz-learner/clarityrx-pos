import React from "react";
import { generateCustomerNoteId } from "../../../lib/customers/customerTypes";
import { CustomerListSidebar, EmptyState, FieldLabel, formatCustomerDate, SectionIntro } from "./CustomersShared";

export default function CustomersComplianceSection({
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
  const addNote = () => {
    if (!selectedCustomer) return;
    onSaveCustomer({
      ...selectedCustomer,
      notes: [
        {
          id: generateCustomerNoteId(),
          text: "",
          severity: "info",
          createdAt: new Date().toISOString(),
        },
        ...(selectedCustomer.notes || []),
      ],
    });
  };

  const updateNote = (id, patch) => {
    if (!selectedCustomer) return;
    const notes = (selectedCustomer.notes || []).map((row) => (row.id === id ? { ...row, ...patch } : row));
    onSaveCustomer({ ...selectedCustomer, notes });
  };

  const removeNote = (id) => {
    if (!selectedCustomer) return;
    onSaveCustomer({
      ...selectedCustomer,
      notes: (selectedCustomer.notes || []).filter((row) => row.id !== id),
    });
  };

  return (
    <div>
      <SectionIntro
        title="Notes, alerts & tax exemption"
        description="Cashier-facing alerts (allergies, delivery windows) and tax-exempt certificate tracking for eligible accounts."
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
            <EmptyState message="Select a customer." />
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div className="crx-card-title" style={{ fontSize: 14 }}>
                    Notes &amp; alerts
                  </div>
                  <button type="button" className="btn-secondary" style={{ fontSize: 12 }} disabled={busy} onClick={addNote}>
                    + Note
                  </button>
                </div>
                {(selectedCustomer.notes || []).length === 0 ? (
                  <EmptyState message="No notes on file." />
                ) : (
                  (selectedCustomer.notes || []).map((note) => {
                    const tone =
                      note.severity === "alert"
                        ? { bg: "#fef2f2", border: "#fecaca" }
                        : { bg: "#f9fafb", border: "#e5e7eb" };
                    return (
                      <div
                        key={note.id}
                        style={{
                          border: `1px solid ${tone.border}`,
                          background: tone.bg,
                          borderRadius: 8,
                          padding: 12,
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                          <select
                            className="crx-select"
                            value={note.severity}
                            onChange={(e) => updateNote(note.id, { severity: e.target.value })}
                            style={{ maxWidth: 120 }}
                          >
                            <option value="info">Info</option>
                            <option value="alert">Alert</option>
                          </select>
                          <span style={{ fontSize: 11, color: "#6b7280", alignSelf: "center" }}>
                            {formatCustomerDate(note.createdAt)}
                          </span>
                          <button type="button" className="btn-secondary" style={{ fontSize: 11, marginLeft: "auto" }} onClick={() => removeNote(note.id)}>
                            Remove
                          </button>
                        </div>
                        <textarea
                          className="crx-input"
                          rows={2}
                          value={note.text}
                          onChange={(e) => updateNote(note.id, { text: e.target.value })}
                          style={{ width: "100%", resize: "vertical" }}
                        />
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ padding: 14, background: "#f9fafb", borderRadius: 10 }}>
                <div className="crx-card-title" style={{ marginBottom: 10, fontSize: 14 }}>
                  Tax exemption
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    checked={selectedCustomer.taxExempt?.enabled === true}
                    onChange={(e) =>
                      onSaveCustomer({
                        ...selectedCustomer,
                        taxExempt: { ...selectedCustomer.taxExempt, enabled: e.target.checked },
                      })
                    }
                  />
                  Tax exempt account
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  <div>
                    <FieldLabel>Certificate #</FieldLabel>
                    <input
                      className="crx-input"
                      value={selectedCustomer.taxExempt?.certificateNumber || ""}
                      onChange={(e) =>
                        onSaveCustomer({
                          ...selectedCustomer,
                          taxExempt: { ...selectedCustomer.taxExempt, certificateNumber: e.target.value },
                        })
                      }
                      style={{ marginTop: 6, width: "100%" }}
                    />
                  </div>
                  <div>
                    <FieldLabel>Expiry</FieldLabel>
                    <input
                      className="crx-input"
                      type="date"
                      value={selectedCustomer.taxExempt?.expiryAt?.slice(0, 10) || ""}
                      onChange={(e) =>
                        onSaveCustomer({
                          ...selectedCustomer,
                          taxExempt: {
                            ...selectedCustomer.taxExempt,
                            expiryAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                          },
                        })
                      }
                      style={{ marginTop: 6, width: "100%" }}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <FieldLabel>Regions (comma-separated)</FieldLabel>
                    <input
                      className="crx-input"
                      value={(selectedCustomer.taxExempt?.regions || []).join(", ")}
                      onChange={(e) =>
                        onSaveCustomer({
                          ...selectedCustomer,
                          taxExempt: {
                            ...selectedCustomer.taxExempt,
                            regions: e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          },
                        })
                      }
                      style={{ marginTop: 6, width: "100%" }}
                    />
                  </div>
                </div>
              </div>

              <button type="button" className="btn-primary" disabled={busy} style={{ marginTop: 16 }} onClick={() => onSaveCustomer(selectedCustomer)}>
                Save notes &amp; tax
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
