import React, { useState } from "react";
import { usePosAccessibility } from "../../context/PosAccessibilityContext";
import { DEFAULT_POS_ACCESSIBILITY_CONFIG } from "../../lib/accessibility/posAccessibilityConfig";

function ToggleRow({ id, label, description, checked, onChange }) {
  return (
    <label
      htmlFor={id}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px solid #f1f5f9",
        cursor: "pointer",
      }}
    >
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#111827" }}>{label}</span>
        {description ? (
          <span style={{ display: "block", fontSize: 12, color: "#6b7280", marginTop: 4, lineHeight: 1.45 }}>
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export default function ManageAccessibilitySection({ onNotify, logActivity }) {
  const { config, saveConfig } = usePosAccessibility();
  const [largeFont, setLargeFont] = useState(config.largeFont);
  const [highContrast, setHighContrast] = useState(config.highContrast);
  const [keyboardNavigation, setKeyboardNavigation] = useState(config.keyboardNavigation);
  const [screenReaderOptimized, setScreenReaderOptimized] = useState(config.screenReaderOptimized);
  const [touchscreenTargets, setTouchscreenTargets] = useState(config.touchscreenTargets);

  const handleSave = () => {
    const saved = saveConfig({
      largeFont,
      highContrast,
      keyboardNavigation,
      screenReaderOptimized,
      touchscreenTargets,
    });
    onNotify?.("Accessibility settings saved for this workstation.", "success");
    logActivity?.("pos", "Accessibility settings updated", {
      largeFont: saved.largeFont,
      highContrast: saved.highContrast,
      keyboardNavigation: saved.keyboardNavigation,
      screenReaderOptimized: saved.screenReaderOptimized,
      touchscreenTargets: saved.touchscreenTargets,
    });
  };

  const handleReset = () => {
    setLargeFont(DEFAULT_POS_ACCESSIBILITY_CONFIG.largeFont);
    setHighContrast(DEFAULT_POS_ACCESSIBILITY_CONFIG.highContrast);
    setKeyboardNavigation(DEFAULT_POS_ACCESSIBILITY_CONFIG.keyboardNavigation);
    setScreenReaderOptimized(DEFAULT_POS_ACCESSIBILITY_CONFIG.screenReaderOptimized);
    setTouchscreenTargets(DEFAULT_POS_ACCESSIBILITY_CONFIG.touchscreenTargets);
  };

  return (
    <div className="crx-card" style={{ padding: 18 }}>
      <div className="crx-card-title" style={{ marginBottom: 8 }}>
        Accessibility
      </div>
      <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 14px", lineHeight: 1.5 }}>
        Display and interaction options for this register. Saved per workstation — use large text and high contrast
        for low vision, keyboard navigation for hands-free operation, and larger touch targets on touchscreen
        tills.
      </p>

      <ToggleRow
        id="a11y-large-font"
        label="Large font mode"
        description="Increases text and control sizes across the POS (about 18% larger)."
        checked={largeFont}
        onChange={setLargeFont}
      />
      <ToggleRow
        id="a11y-high-contrast"
        label="High contrast mode"
        description="Stronger text and border contrast (WCAG-friendly palette) for readability under bright pharmacy lighting."
        checked={highContrast}
        onChange={setHighContrast}
      />
      <ToggleRow
        id="a11y-keyboard-nav"
        label="Enhanced keyboard navigation"
        description="Visible focus rings on all controls; workspace tabs support Arrow keys, Home, and End. Cashier shortcuts (F1–F7) remain available."
        checked={keyboardNavigation}
        onChange={setKeyboardNavigation}
      />
      <ToggleRow
        id="a11y-screen-reader"
        label="Screen reader compatibility"
        description="Reduces motion, improves live regions for toasts and status, and keeps decorative icons out of the accessibility tree."
        checked={screenReaderOptimized}
        onChange={setScreenReaderOptimized}
      />
      <ToggleRow
        id="a11y-touch-targets"
        label="Touchscreen accessibility"
        description="Minimum 48×48 px tap targets on buttons, tabs, and tiles — recommended for finger touch registers."
        checked={touchscreenTargets}
        onChange={setTouchscreenTargets}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
        <button type="button" className="btn-primary" onClick={handleSave}>
          Save accessibility settings
        </button>
        <button type="button" className="btn-secondary" onClick={handleReset}>
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
