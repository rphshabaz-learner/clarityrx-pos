"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { RouteGuard } from "@/components/auth/route-guard";
import { Card, GridBackdrop } from "@/components/ui/nova-shell";
import { findUserById } from "@/lib/data/users";
import { useKeyboard } from "@/hooks/use-keyboard";
import { useNovaStore } from "@/store/nova-store";

const TILLS = [1, 2, 3, 4, 5];

function TillSelect() {
  const router = useRouter();
  const user = useNovaStore((s) => s.user);
  const activeTills = useNovaStore((s) => s.activeTills);
  const openTill = useNovaStore((s) => s.openTill);
  const logout = useNovaStore((s) => s.logout);
  const [focusTill, setFocusTill] = useState(1);

  const pickTill = useCallback(
    (t: number) => {
      if (!user) return;
      const occupant = activeTills[t];
      if (occupant && occupant !== user.id) return;
      openTill(t, user.id);
      router.push("/pos");
    },
    [activeTills, openTill, router, user]
  );

  useKeyboard(
    useCallback(
      (e) => {
        if (!user) return;
        if (e.key >= "1" && e.key <= "5") pickTill(Number(e.key));
        if (e.key === "ArrowRight") setFocusTill((t) => Math.min(5, t + 1));
        if (e.key === "ArrowLeft") setFocusTill((t) => Math.max(1, t - 1));
        if (e.key === "Enter") pickTill(focusTill);
        if (e.key === "a" && user.role === "admin") router.push("/admin");
      },
      [focusTill, pickTill, router, user]
    )
  );

  if (!user) return null;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-nova-bg p-6 font-sans text-nova-text">
      <GridBackdrop />
      <div className="relative w-full max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="text-xs text-nova-dim">Welcome back,</div>
            <div className="text-2xl font-semibold">{user.name}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="rounded-md border border-nova-accent px-4 py-2 text-sm font-semibold text-nova-accent"
          >
            Sign out
          </button>
        </div>

        <Card className="animate-fade-up p-7">
          <p className="mb-5 text-[11px] uppercase tracking-widest text-nova-dim">Select a till</p>
          <div className="grid grid-cols-5 gap-3">
            {TILLS.map((t) => {
              const occupant = activeTills[t];
              const busy = occupant != null && occupant !== user.id;
              const who = busy ? findUserById(occupant) : null;
              return (
                <button
                  key={t}
                  type="button"
                  disabled={busy}
                  onClick={() => pickTill(t)}
                  className={`rounded-lg border bg-nova-bg py-5 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    focusTill === t ? "border-nova-accent" : "border-nova-border hover:border-nova-accent"
                  }`}
                >
                  <div className="mb-2 text-2xl">🖥️</div>
                  <div className="font-condensed text-lg font-bold tracking-wide">T{t}</div>
                  <div className={`mt-1 text-[10px] ${busy ? "text-red-400" : "text-emerald-400"}`}>
                    {busy ? who?.name.split(" ")[0] : "open"}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-center text-[11px] text-nova-dim">
            Press <span className="font-mono text-nova-accent">1–5</span> or Enter on focused till
          </p>
        </Card>

        {user.role === "admin" && (
          <Link
            href="/admin"
            className="font-condensed mt-3 block w-full rounded-lg bg-nova-accent py-3.5 text-center text-sm font-bold tracking-wide text-nova-bg"
          >
            Admin dashboard (A)
          </Link>
        )}
      </div>
    </div>
  );
}

export default function TillPage() {
  return (
    <RouteGuard>
      <TillSelect />
    </RouteGuard>
  );
}
