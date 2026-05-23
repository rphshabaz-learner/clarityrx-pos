import type { ReactNode } from "react";

export function GridBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 opacity-[0.22]"
      style={{
        backgroundImage:
          "linear-gradient(#1e2733 1px, transparent 1px), linear-gradient(90deg, #1e2733 1px, transparent 1px)",
        backgroundSize: "44px 44px",
      }}
      aria-hidden
    />
  );
}

export function NovaLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const cls = size === "sm" ? "px-2.5 py-0.5 text-base" : "px-3.5 py-1 text-xl";
  return (
    <span
      className={`font-condensed inline-block rounded-md bg-nova-accent font-bold tracking-[0.2em] text-nova-bg ${cls}`}
    >
      NOVA
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[10px] border border-nova-border bg-nova-card ${className}`}>
      {children}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-nova-border bg-nova-bg px-1.5 py-0.5 font-mono text-[10px] text-nova-dim">
      {children}
    </kbd>
  );
}

export function ShortcutBar({ items }: { items: { keys: string; label: string }[] }) {
  return (
    <footer className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-nova-border bg-nova-card px-3 py-1.5 text-[11px] text-nova-dim">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1">
          <Kbd>{item.keys}</Kbd>
          <span>{item.label}</span>
        </span>
      ))}
    </footer>
  );
}
