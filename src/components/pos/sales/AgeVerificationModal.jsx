import React, { useState } from "react";
import { ageRestrictionLabel } from "../../../lib/compliance/ageRestrictedProducts";

export default function AgeVerificationModal({
  open,
  classId,
  minAge,
  itemName,
  managerOverrideActive,
  onVerifyDob,
  onManagerOverride,
  onCancel,
}) {
  const [dob, setDob] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open || !classId) return null;

  const label = ageRestrictionLabel(classId);

  const handleVerify = async () => {
    setBusy(true);
    try {
      const result = await onVerifyDob?.(dob);
      if (result?.ok) {
        setDob("");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleOverride = async () => {
    setBusy(true);
    try {
      await onManagerOverride?.(overrideReason);
      setOverrideReason("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="crx-pos-header__modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Age verification"
      onClick={onCancel}
    >
      <div
        className="crx-pos-header__modal"
        style={{ maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Age verification required</div>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
          {itemName ? (
            <>
              <strong>{itemName}</strong> is classified as <strong>{label}</strong>. Confirm the customer
              is at least <strong>{minAge}</strong> before adding to the sale.
            </>
          ) : (
            <>
              This item is <strong>{label}</strong>. Minimum age <strong>{minAge}</strong>.
            </>
          )}
        </p>
        <label className="crx-sales-options-modal__field" style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Date of birth</span>
          <input
            className="crx-input"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            style={{ marginTop: 6, width: "100%" }}
            autoFocus
          />
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <button type="button" className="btn-primary" disabled={busy || !dob} onClick={handleVerify}>
            Verify age
          </button>
          <button type="button" className="btn-secondary" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        </div>
        {managerOverrideActive ? (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: "var(--crx-override-bg)",
              border: "1px solid var(--crx-override-border)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--crx-override)", marginBottom: 8 }}>
              Manager override
            </div>
            <input
              className="crx-input"
              placeholder="Reason (required)"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              style={{ width: "100%", marginBottom: 8 }}
            />
            <button
              type="button"
              className="btn-tone-override"
              disabled={busy || !overrideReason.trim()}
              onClick={handleOverride}
            >
              Approve without DOB
            </button>
          </div>
        ) : (
          <p style={{ fontSize: 12, color: "#6b7280" }}>
            Failed verification requires <strong>Mgr override</strong> in the header and a documented reason.
          </p>
        )}
      </div>
    </div>
  );
}
