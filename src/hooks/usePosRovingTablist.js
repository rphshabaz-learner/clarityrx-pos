import { useCallback, useEffect, useRef } from "react";

/**
 * WAI-ARIA tabs pattern: Arrow/Home/End move focus; Enter/Space activate.
 */
export function usePosRovingTablist({ enabled, tabIds, activeId, onActivate }) {
  const tablistRef = useRef(null);

  const focusTabButton = useCallback(
    (id) => {
      const root = tablistRef.current;
      if (!root || !id) return;
      const button = root.querySelector(`[data-tab-id="${id}"]`);
      button?.focus();
    },
    []
  );

  const moveFocus = useCallback(
    (direction) => {
      if (!enabled || !tabIds?.length) return;
      const currentIndex = tabIds.indexOf(activeId);
      const start = currentIndex >= 0 ? currentIndex : 0;
      let nextIndex = start;
      if (direction === "home") nextIndex = 0;
      else if (direction === "end") nextIndex = tabIds.length - 1;
      else if (direction === "next") nextIndex = (start + 1) % tabIds.length;
      else if (direction === "prev") nextIndex = (start - 1 + tabIds.length) % tabIds.length;
      const nextId = tabIds[nextIndex];
      focusTabButton(nextId);
    },
    [activeId, enabled, focusTabButton, tabIds]
  );

  const onKeyDown = useCallback(
    (event) => {
      if (!enabled) return;
      const key = event.key;
      if (key === "ArrowRight" || key === "ArrowDown") {
        event.preventDefault();
        moveFocus("next");
        return;
      }
      if (key === "ArrowLeft" || key === "ArrowUp") {
        event.preventDefault();
        moveFocus("prev");
        return;
      }
      if (key === "Home") {
        event.preventDefault();
        moveFocus("home");
        return;
      }
      if (key === "End") {
        event.preventDefault();
        moveFocus("end");
        return;
      }
      if (key === "Enter" || key === " ") {
        const target = event.target;
        const tabId = target?.dataset?.tabId;
        if (tabId && tabId !== activeId) {
          event.preventDefault();
          onActivate?.(tabId);
        }
      }
    },
    [activeId, enabled, moveFocus, onActivate]
  );

  useEffect(() => {
    if (!enabled) return undefined;
    const root = tablistRef.current;
    if (!root) return undefined;
    root.addEventListener("keydown", onKeyDown);
    return () => root.removeEventListener("keydown", onKeyDown);
  }, [enabled, onKeyDown]);

  return { tablistRef, focusTabButton };
}
