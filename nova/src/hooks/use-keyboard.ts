"use client";

import { useEffect } from "react";

type KeyHandler = (e: KeyboardEvent) => void;

export function useKeyboard(handler: KeyHandler, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (typing && !e.key.startsWith("F") && e.key !== "Escape") return;
      handler(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handler, enabled]);
}
