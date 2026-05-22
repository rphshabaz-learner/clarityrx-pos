import { scopedStorageKey } from "../../session/scopedStorage";

export const POS_ACCESSIBILITY_CONFIG_STORAGE_KEY = "clarityrx-pos-accessibility-v1";

/** Workstation-level display and interaction preferences (not till-scoped). */
export const DEFAULT_POS_ACCESSIBILITY_CONFIG = {
  largeFont: false,
  highContrast: false,
  /** Strong :focus-visible rings and roving tabindex on workspace tabs. */
  keyboardNavigation: true,
  /** Reduces motion and improves live-region / landmark behavior for AT. */
  screenReaderOptimized: false,
  /** Enlarges tap targets on touch and mouse (48px minimum). */
  touchscreenTargets: false,
};

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function normalizeFlag(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizePosAccessibilityConfig(raw) {
  const parsed = raw && typeof raw === "object" ? raw : {};
  return {
    largeFont: normalizeFlag(parsed.largeFont, DEFAULT_POS_ACCESSIBILITY_CONFIG.largeFont),
    highContrast: normalizeFlag(parsed.highContrast, DEFAULT_POS_ACCESSIBILITY_CONFIG.highContrast),
    keyboardNavigation: normalizeFlag(
      parsed.keyboardNavigation,
      DEFAULT_POS_ACCESSIBILITY_CONFIG.keyboardNavigation
    ),
    screenReaderOptimized: normalizeFlag(
      parsed.screenReaderOptimized,
      DEFAULT_POS_ACCESSIBILITY_CONFIG.screenReaderOptimized
    ),
    touchscreenTargets: normalizeFlag(
      parsed.touchscreenTargets,
      DEFAULT_POS_ACCESSIBILITY_CONFIG.touchscreenTargets
    ),
  };
}

export function loadPosAccessibilityConfig() {
  if (typeof window === "undefined") return { ...DEFAULT_POS_ACCESSIBILITY_CONFIG };
  const raw = window.localStorage.getItem(scopedStorageKey(POS_ACCESSIBILITY_CONFIG_STORAGE_KEY));
  return normalizePosAccessibilityConfig(safeParse(raw, null));
}

export function savePosAccessibilityConfig(config) {
  const payload = {
    ...normalizePosAccessibilityConfig(config),
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      scopedStorageKey(POS_ACCESSIBILITY_CONFIG_STORAGE_KEY),
      JSON.stringify(payload)
    );
  }
  return payload;
}

/** CSS class names applied on `document.documentElement` when each mode is on. */
export const POS_ACCESSIBILITY_ROOT_CLASSES = {
  largeFont: "crx-a11y-large-font",
  highContrast: "crx-a11y-high-contrast",
  keyboardNavigation: "crx-a11y-keyboard-nav",
  screenReaderOptimized: "crx-a11y-screen-reader",
  touchscreenTargets: "crx-a11y-touch-targets",
};

export function accessibilityRootClassList(config = DEFAULT_POS_ACCESSIBILITY_CONFIG) {
  const normalized = normalizePosAccessibilityConfig(config);
  const classes = [];
  if (normalized.largeFont) classes.push(POS_ACCESSIBILITY_ROOT_CLASSES.largeFont);
  if (normalized.highContrast) classes.push(POS_ACCESSIBILITY_ROOT_CLASSES.highContrast);
  if (normalized.keyboardNavigation) classes.push(POS_ACCESSIBILITY_ROOT_CLASSES.keyboardNavigation);
  if (normalized.screenReaderOptimized) classes.push(POS_ACCESSIBILITY_ROOT_CLASSES.screenReaderOptimized);
  if (normalized.touchscreenTargets) classes.push(POS_ACCESSIBILITY_ROOT_CLASSES.touchscreenTargets);
  return classes;
}

export function applyAccessibilityRootClasses(config = loadPosAccessibilityConfig()) {
  if (typeof document === "undefined") return config;
  const root = document.documentElement;
  const desired = new Set(accessibilityRootClassList(config));
  Object.values(POS_ACCESSIBILITY_ROOT_CLASSES).forEach((className) => {
    root.classList.toggle(className, desired.has(className));
  });
  root.setAttribute("data-crx-reduced-motion", config.screenReaderOptimized ? "true" : "false");
  return normalizePosAccessibilityConfig(config);
}
