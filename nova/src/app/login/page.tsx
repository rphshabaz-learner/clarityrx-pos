"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Card, GridBackdrop, NovaLogo } from "@/components/ui/nova-shell";
import { USERS } from "@/lib/data/users";
import { useKeyboard } from "@/hooks/use-keyboard";
import { useNovaStore } from "@/store/nova-store";
import type { NovaUser } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useNovaStore((s) => s.setUser);
  const existing = useNovaStore((s) => s.user);

  const [selected, setSelected] = useState<NovaUser | null>(null);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState(false);
  const [focusIdx, setFocusIdx] = useState(0);

  useEffect(() => {
    if (existing) {
      router.replace(existing.role === "admin" ? "/till" : "/till");
    }
  }, [existing, router]);

  const tryLogin = useCallback(
    (user: NovaUser, code: string) => {
      if (code === user.pin) {
        setUser(user);
        router.push("/till");
      } else {
        setPinErr(true);
        setPin("");
        window.setTimeout(() => setPinErr(false), 700);
      }
    },
    [router, setUser]
  );

  const tapPin = useCallback(
    (key: string) => {
      if (!selected) return;
      if (key === "⌫") {
        setPin((p) => p.slice(0, -1));
        return;
      }
      if (key === "↵") {
        if (pin.length === 4) tryLogin(selected, pin);
        return;
      }
      const next = pin + key;
      setPin(next);
      if (next.length === 4) tryLogin(selected, next);
    },
    [pin, selected, tryLogin]
  );

  useKeyboard(
    useCallback(
      (e) => {
        if (!selected) {
          if (e.key === "ArrowRight") setFocusIdx((i) => Math.min(USERS.length - 1, i + 1));
          if (e.key === "ArrowLeft") setFocusIdx((i) => Math.max(0, i - 1));
          if (e.key === "ArrowDown") setFocusIdx((i) => Math.min(USERS.length - 1, i + 2));
          if (e.key === "ArrowUp") setFocusIdx((i) => Math.max(0, i - 2));
          if (e.key === "Enter") setSelected(USERS[focusIdx]);
          if (/^[1-6]$/.test(e.key)) setSelected(USERS[Number(e.key) - 1]);
          return;
        }
        if (e.key === "Escape") {
          setSelected(null);
          setPin("");
          return;
        }
        if (/^[0-9]$/.test(e.key)) tapPin(e.key);
        if (e.key === "Backspace") tapPin("⌫");
        if (e.key === "Enter") tapPin("↵");
      },
      [focusIdx, selected, tapPin]
    )
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-nova-bg p-6 font-sans text-nova-text">
      <GridBackdrop />
      <div className="relative w-full max-w-md">
        <div className="mb-9 text-center">
          <div className="inline-flex items-center gap-2.5">
            <NovaLogo />
            <span className="text-xs uppercase tracking-[0.2em] text-nova-dim">Point of Sale</span>
          </div>
        </div>

        {!selected ? (
          <Card className="animate-fade-up p-6">
            <p className="mb-4 text-[11px] uppercase tracking-widest text-nova-dim">Select user</p>
            <div className="grid grid-cols-2 gap-2">
              {USERS.map((u, i) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelected(u)}
                  className={`flex items-center gap-2.5 rounded-lg border bg-nova-bg p-3.5 text-left transition-colors hover:border-nova-accent ${
                    focusIdx === i ? "border-nova-accent ring-1 ring-nova-accent/40" : "border-nova-border"
                  }`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-nova-bg"
                    style={{ background: u.color }}
                  >
                    {u.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{u.name}</span>
                    <span className="block text-[11px] capitalize text-nova-dim">{u.role}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-center text-[11px] text-nova-dim">
              Keys: <span className="font-mono text-nova-accent">1–6</span> pick user · arrows · Enter
            </p>
          </Card>
        ) : (
          <Card className={`animate-fade-up p-7 ${pinErr ? "animate-shake" : ""}`}>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setPin("");
              }}
              className="mb-5 text-xs text-nova-dim hover:text-nova-text"
            >
              ← back (Esc)
            </button>
            <div className="mb-6 flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-nova-bg"
                style={{ background: selected.color }}
              >
                {selected.initials}
              </span>
              <div>
                <div className="text-lg font-semibold">{selected.name}</div>
                <div className="text-xs capitalize text-nova-dim">{selected.role}</div>
              </div>
            </div>
            <div
              className={`mb-6 flex h-12 items-center justify-center font-mono text-4xl tracking-[1.1rem] ${
                pinErr ? "text-red-400" : "text-nova-accent"
              }`}
            >
              {"●".repeat(pin.length)}
              {"○".repeat(4 - pin.length)}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "↵"].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => tapPin(k)}
                  className={`rounded-lg border py-4 font-mono text-lg font-semibold transition-colors ${
                    k === "↵"
                      ? "border-nova-accent bg-nova-accent text-nova-bg"
                      : "border-nova-border bg-nova-bg text-nova-text hover:border-nova-dim"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            {pinErr && (
              <p className="mt-3 text-center text-xs text-red-400">Incorrect PIN. Try again.</p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
