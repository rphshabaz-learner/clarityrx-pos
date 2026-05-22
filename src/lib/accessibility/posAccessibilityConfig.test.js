import {
  DEFAULT_POS_ACCESSIBILITY_CONFIG,
  accessibilityRootClassList,
  normalizePosAccessibilityConfig,
} from "./posAccessibilityConfig";

describe("posAccessibilityConfig", () => {
  it("normalizes partial payloads with defaults", () => {
    expect(normalizePosAccessibilityConfig({ largeFont: true })).toEqual({
      largeFont: true,
      highContrast: false,
      keyboardNavigation: true,
      screenReaderOptimized: false,
      touchscreenTargets: false,
    });
  });

  it("ignores non-boolean flags", () => {
    expect(
      normalizePosAccessibilityConfig({
        highContrast: "yes",
        touchscreenTargets: 1,
      })
    ).toEqual(DEFAULT_POS_ACCESSIBILITY_CONFIG);
  });

  it("builds root class list for enabled modes", () => {
    expect(
      accessibilityRootClassList({
        largeFont: true,
        highContrast: true,
        keyboardNavigation: false,
        screenReaderOptimized: true,
        touchscreenTargets: true,
      })
    ).toEqual([
      "crx-a11y-large-font",
      "crx-a11y-high-contrast",
      "crx-a11y-screen-reader",
      "crx-a11y-touch-targets",
    ]);
  });
});
