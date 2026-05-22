import React, { useState } from "react";
import {
  AGE_RESTRICTION_CLASS_OPTIONS,
  AGE_RESTRICTION_CLASSES,
} from "../../lib/compliance/ageRestrictedProducts";
import {
  DEFAULT_AGE_COMPLIANCE_CONFIG,
  savePosAgeComplianceConfig,
} from "../../lib/compliance/posAgeComplianceConfig";

export default function ManageAgeComplianceSection({ config, onSaved, onNotify, logActivity }) {
  const [storeMinimumAge, setStoreMinimumAge] = useState(() => config?.storeMinimumAge ?? 19);
  const [enforcementEnabled, setEnforcementEnabled] = useState(
    () => config?.enforcementEnabled !== false
  );
  const [blockSelfCheckout, setBlockSelfCheckout] = useState(
    () => config?.blockSelfCheckout !== false
  );
  const [enabledClasses, setEnabledClasses] = useState(
    () => config?.enabledClasses || DEFAULT_AGE_COMPLIANCE_CONFIG.enabledClasses
  );

  const toggleClass = (classId) => {
    setEnabledClasses((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleSave = () => {
    const saved = savePosAgeComplianceConfig({
      storeMinimumAge: Number(storeMinimumAge) || 19,
      enforcementEnabled,
      blockSelfCheckout,
      enabledClasses,
    });
    onSaved?.(saved);
    onNotify?.("Age-restricted product settings saved.", "success");
    logActivity?.("pos", "Age compliance configuration updated", {
      storeMinimumAge: saved.storeMinimumAge,
      enforcementEnabled: saved.enforcementEnabled,
      enabledCount: saved.enabledClasses.length,
    });
  };

  return (
    <div className="crx-card" style={{ padding: 18, marginTop: 16 }}>
      <div className="crx-card-title" style={{ marginBottom: 8 }}>
        Age-restricted products
      </div>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 14 }}>
        Nicotine, lottery, alcohol, cannabis, and similar classes require date-of-birth verification (or
        manager override) before scan and again at checkout. Assign classes on each SKU under Inventory →
        Products.
      </p>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 10 }}>
        <input
          type="checkbox"
          checked={enforcementEnabled}
          onChange={(e) => setEnforcementEnabled(e.target.checked)}
        />
        Enforce age verification on the till
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 10 }}>
        <input
          type="checkbox"
          checked={blockSelfCheckout}
          onChange={(e) => setBlockSelfCheckout(e.target.checked)}
        />
        Block self-checkout when cart contains restricted items
      </label>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 12 }}>
        Store minimum purchase age
        <input
          className="crx-input"
          type="number"
          min="0"
          max="99"
          value={storeMinimumAge}
          onChange={(e) => setStoreMinimumAge(e.target.value)}
          style={{ marginTop: 6, maxWidth: 120 }}
        />
      </label>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
        Enabled restriction classes
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {AGE_RESTRICTION_CLASS_OPTIONS.map((row) => (
          <label key={row.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={enabledClasses.includes(row.id)}
              onChange={() => toggleClass(row.id)}
            />
            {row.label}
          </label>
        ))}
      </div>
      <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 12 }}>
        Products with class “{AGE_RESTRICTION_CLASSES.none.label}” are never prompted.
      </p>
      <button type="button" className="btn-primary" onClick={handleSave}>
        Save age compliance
      </button>
    </div>
  );
}
