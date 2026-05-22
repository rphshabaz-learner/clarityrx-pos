# POS accessibility

Workstation-level options live under **Manage → Accessibility** and persist in browser storage for this register.

| Setting | What it does |
|--------|----------------|
| **Large font mode** | Scales typography and control sizes (~18%). |
| **High contrast mode** | WCAG-oriented palette: black text, strong borders, higher-contrast status colors. |
| **Enhanced keyboard navigation** | Visible `:focus-visible` rings; workspace tabs support Arrow, Home, and End. Cashier F1–F7 shortcuts unchanged. |
| **Screen reader compatibility** | Disables enter animations; toasts use `aria-live`; decorative emoji hidden from the accessibility tree. |
| **Touchscreen accessibility** | Minimum 48×48 px targets on buttons, tabs, and tiles (in addition to coarse-pointer rules). |

## Keyboard reference (Sales / cashier)

| Key | Action |
|-----|--------|
| F1 | Focus product scan |
| F2 | Focus bag scan |
| F3 / Ctrl+Enter | Charge |
| F4 | Suspend sale |
| F5 | Resume suspended sale |
| F6 | Rx pickup queue |
| F7 | Manager override |
| Esc | Close modals / panels |
| Tab | Move focus (enhanced rings when keyboard navigation is on) |
| Arrow / Home / End | Move between workspace tabs (when keyboard navigation is on) |

## Skip link

At sign-in, **Skip to main content** appears when focused (Tab from the top of the page) and jumps to the workspace area.

## Implementation

- Config: `src/lib/accessibility/posAccessibilityConfig.js`
- Provider: `src/context/PosAccessibilityContext.jsx`
- Global CSS: `src/PosGlobalStyles.jsx` (`crx-a11y-*` classes on `<html>`)
