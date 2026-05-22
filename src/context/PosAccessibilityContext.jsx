import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  applyAccessibilityRootClasses,
  loadPosAccessibilityConfig,
  normalizePosAccessibilityConfig,
  savePosAccessibilityConfig,
} from "../lib/accessibility/posAccessibilityConfig";

export const PosAccessibilityContext = createContext(null);

export function PosAccessibilityProvider({ children }) {
  const [config, setConfig] = useState(() => {
    const loaded = loadPosAccessibilityConfig();
    applyAccessibilityRootClasses(loaded);
    return loaded;
  });

  useEffect(() => {
    applyAccessibilityRootClasses(config);
  }, [config]);

  const saveConfig = useCallback((next) => {
    const saved = savePosAccessibilityConfig(next);
    const normalized = normalizePosAccessibilityConfig(saved);
    setConfig(normalized);
    return normalized;
  }, []);

  const value = useMemo(
    () => ({
      config,
      saveConfig,
      largeFont: config.largeFont,
      highContrast: config.highContrast,
      keyboardNavigation: config.keyboardNavigation,
      screenReaderOptimized: config.screenReaderOptimized,
      touchscreenTargets: config.touchscreenTargets,
    }),
    [config, saveConfig]
  );

  return (
    <PosAccessibilityContext.Provider value={value}>{children}</PosAccessibilityContext.Provider>
  );
}

export function usePosAccessibility() {
  const ctx = useContext(PosAccessibilityContext);
  if (!ctx) {
    throw new Error("usePosAccessibility requires PosAccessibilityProvider");
  }
  return ctx;
}
