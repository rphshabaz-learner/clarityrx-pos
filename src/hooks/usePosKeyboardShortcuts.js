import { useEffect } from "react";

/**
 * Cashier till keyboard shortcuts (ignored when typing in inputs/textareas).
 */
export function usePosKeyboardShortcuts({ enabled, handlers }) {
  useEffect(() => {
    if (!enabled || !handlers) return undefined;

    const onKeyDown = (event) => {
      const target = event.target;
      const tag = target?.tagName?.toLowerCase();
      const editable =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable;
      if (editable && !event.altKey) return;

      const key = event.key?.toLowerCase();
      const mod = event.metaKey || event.ctrlKey;

      if (key === "f1") {
        event.preventDefault();
        handlers.focusScan?.();
        return;
      }
      if (key === "f2") {
        event.preventDefault();
        handlers.focusBagScan?.();
        return;
      }
      if (key === "f3" || (mod && key === "enter")) {
        event.preventDefault();
        handlers.charge?.();
        return;
      }
      if (key === "f4") {
        event.preventDefault();
        handlers.suspend?.();
        return;
      }
      if (key === "f5") {
        event.preventDefault();
        handlers.resume?.();
        return;
      }
      if (key === "f6") {
        event.preventDefault();
        handlers.togglePickups?.();
        return;
      }
      if (key === "f7") {
        event.preventDefault();
        handlers.managerOverride?.();
        return;
      }
      if (key === "escape") {
        handlers.escape?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, handlers]);
}
