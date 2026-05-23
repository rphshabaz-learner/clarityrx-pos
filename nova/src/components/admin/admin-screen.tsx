"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { RouteGuard } from "@/components/auth/route-guard";
import { Card, NovaLogo, ShortcutBar } from "@/components/ui/nova-shell";
import { formatMoney } from "@/lib/cart";
import { mockAssistantReply, mockInsights } from "@/lib/mock-ai";
import { PRODUCTS } from "@/lib/data/products";
import { USERS } from "@/lib/data/users";
import { useKeyboard } from "@/hooks/use-keyboard";
import { useNovaStore } from "@/store/nova-store";
import type { AdminTab } from "@/types";

const TABS: { id: AdminTab; label: string; key: string }[] = [
  { id: "dashboard", label: "Dashboard", key: "1" },
  { id: "transactions", label: "Transactions", key: "2" },
  { id: "products", label: "Products", key: "3" },
  { id: "staff", label: "Staff", key: "4" },
];

export function AdminScreen() {
  const router = useRouter();
  const user = useNovaStore((s) => s.user);
  const till = useNovaStore((s) => s.till);
  const transactions = useNovaStore((s) => s.transactions);
  const activeTills = useNovaStore((s) => s.activeTills);
  const logout = useNovaStore((s) => s.logout);

  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [aiQ, setAiQ] = useState("");
  const [aiMsgs, setAiMsgs] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content:
        "NOVA assistant (local mock). Ask about low stock, today sales, or top sellers.",
    },
  ]);
  const [insight, setInsight] = useState("");

  const today = useMemo(() => {
    const day = new Date().toDateString();
    const list = transactions.filter((t) => t.timestamp.toDateString() === day);
    const rev = list.reduce((s, t) => s + t.total, 0);
    return { list, rev, count: list.length };
  }, [transactions]);

  const ctx = useMemo(
    () => ({ todayCount: today.count, todayRev: today.rev, txns: transactions }),
    [today, transactions]
  );

  const cardPct = useMemo(() => {
    if (!transactions.length) return 0;
    return Math.round(
      (transactions.filter((t) => t.method === "card").length / transactions.length) * 100
    );
  }, [transactions]);

  useKeyboard(
    useCallback(
      (e) => {
        if (e.key >= "1" && e.key <= "4") setTab(TABS[Number(e.key) - 1].id);
        if (e.key === "p" && till) router.push("/pos");
        if (e.key === "t") router.push("/till");
      },
      [router, till]
    )
  );

  const sendAi = () => {
    if (!aiQ.trim()) return;
    const q = aiQ.trim();
    setAiQ("");
    setAiMsgs((m) => [...m, { role: "user", content: q }]);
    const reply = mockAssistantReply(q, ctx);
    window.setTimeout(() => {
      setAiMsgs((m) => [...m, { role: "assistant", content: reply }]);
    }, 120);
  };

  if (!user) return null;

  return (
    <RouteGuard adminOnly>
      <div className="flex h-dvh flex-col bg-nova-bg font-sans text-nova-text">
        <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-nova-border bg-nova-card px-4">
          <div className="flex items-center gap-3">
            <NovaLogo size="sm" />
            <span className="text-sm text-nova-dim">Admin · {user.name}</span>
          </div>
          <div className="flex gap-2">
            {till ? (
              <Link href="/pos" className="rounded-md border border-nova-border px-3 py-1 text-xs">
                POS (P)
              </Link>
            ) : (
              <Link href="/till" className="rounded-md border border-nova-border px-3 py-1 text-xs">
                Tills (T)
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="rounded-md border border-red-400/60 px-3 py-1 text-xs text-red-400"
            >
              Sign out
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <nav className="flex w-44 shrink-0 flex-col gap-1 border-r border-nova-border p-3">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-md px-3 py-2 text-left text-sm font-medium ${
                  tab === t.id ? "bg-nova-accent text-nova-bg" : "text-nova-dim hover:text-nova-text"
                }`}
              >
                {t.label} <span className="font-mono text-[10px] opacity-70">{t.key}</span>
              </button>
            ))}
          </nav>

          <main className="min-w-0 flex-1 overflow-y-auto p-4">
            {tab === "dashboard" && (
              <div className="space-y-4">
                <h1 className="font-condensed text-2xl font-bold tracking-wide">Dashboard</h1>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    { label: "Today sales", value: String(today.count) },
                    { label: "Today revenue", value: formatMoney(today.rev) },
                    { label: "Active tills", value: `${Object.keys(activeTills).length}/5` },
                    { label: "Card %", value: `${cardPct}%` },
                  ].map((s) => (
                    <Card key={s.label} className="p-4">
                      <p className="text-[10px] uppercase tracking-widest text-nova-dim">{s.label}</p>
                      <p className="mt-2 font-mono text-2xl font-bold text-nova-accent">{s.value}</p>
                    </Card>
                  ))}
                </div>
                <Card className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-widest text-nova-dim">Insights (mock)</p>
                    <button
                      type="button"
                      onClick={() => setInsight(mockInsights(ctx))}
                      className="rounded-md bg-nova-accent px-3 py-1 text-xs font-semibold text-nova-bg"
                    >
                      Generate
                    </button>
                  </div>
                  {insight ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-nova-text/90">
                      {insight}
                    </p>
                  ) : (
                    <p className="text-sm text-nova-dim">No insights yet — click Generate.</p>
                  )}
                </Card>
              </div>
            )}

            {tab === "transactions" && (
              <div>
                <h1 className="font-condensed mb-4 text-2xl font-bold">Transactions</h1>
                <div className="overflow-x-auto rounded-lg border border-nova-border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-nova-card text-[11px] uppercase tracking-wide text-nova-dim">
                      <tr>
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Time</th>
                        <th className="px-3 py-2">Till</th>
                        <th className="px-3 py-2">Cashier</th>
                        <th className="px-3 py-2">Method</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 20).map((t) => (
                        <tr key={t.id} className="border-t border-nova-border/80">
                          <td className="px-3 py-2 font-mono text-xs">{t.id}</td>
                          <td className="px-3 py-2 text-nova-dim">
                            {t.timestamp.toLocaleString()}
                          </td>
                          <td className="px-3 py-2">T{t.till}</td>
                          <td className="px-3 py-2">{t.user.name}</td>
                          <td className="px-3 py-2 capitalize">{t.method}</td>
                          <td className="px-3 py-2 text-right font-mono text-nova-accent">
                            {formatMoney(t.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "products" && (
              <div>
                <h1 className="font-condensed mb-4 text-2xl font-bold">Products</h1>
                <div className="overflow-x-auto rounded-lg border border-nova-border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-nova-card text-[11px] uppercase tracking-wide text-nova-dim">
                      <tr>
                        <th className="px-3 py-2">SKU</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2 text-right">Price</th>
                        <th className="px-3 py-2 text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PRODUCTS.map((p) => (
                        <tr key={p.id} className="border-t border-nova-border/80">
                          <td className="px-3 py-2 font-mono text-xs">{p.sku}</td>
                          <td className="px-3 py-2">{p.name}</td>
                          <td className="px-3 py-2 text-nova-dim">{p.category}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatMoney(p.price)}</td>
                          <td
                            className={`px-3 py-2 text-right font-mono ${
                              p.stock < 15 ? "text-red-400" : ""
                            }`}
                          >
                            {p.stock}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "staff" && (
              <div>
                <h1 className="font-condensed mb-4 text-2xl font-bold">Staff</h1>
                <div className="grid gap-2 sm:grid-cols-2">
                  {USERS.map((u) => (
                    <Card key={u.id} className="flex items-center gap-3 p-4">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-nova-bg"
                        style={{ background: u.color }}
                      >
                        {u.initials}
                      </span>
                      <div>
                        <div className="font-semibold">{u.name}</div>
                        <div className="text-xs capitalize text-nova-dim">{u.role}</div>
                      </div>
                    </Card>
                  ))}
                </div>
                <Card className="mt-4 p-4">
                  <p className="mb-2 text-[10px] uppercase tracking-widest text-nova-dim">
                    Assistant (mock)
                  </p>
                  <div className="mb-2 max-h-40 space-y-2 overflow-y-auto text-sm">
                    {aiMsgs.map((m, i) => (
                      <p
                        key={i}
                        className={m.role === "user" ? "text-nova-accent" : "text-nova-text/90"}
                      >
                        <span className="font-semibold">{m.role === "user" ? "You: " : "AI: "}</span>
                        {m.content}
                      </p>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={aiQ}
                      onChange={(e) => setAiQ(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendAi()}
                      placeholder="Ask about sales or stock…"
                      className="flex-1 rounded-md border border-nova-border bg-nova-bg px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={sendAi}
                      className="rounded-md bg-nova-accent px-4 py-2 text-sm font-semibold text-nova-bg"
                    >
                      Send
                    </button>
                  </div>
                </Card>
              </div>
            )}
          </main>
        </div>

        <ShortcutBar
          items={[
            { keys: "1–4", label: "tabs" },
            { keys: "P", label: "POS" },
            { keys: "T", label: "tills" },
          ]}
        />
      </div>
    </RouteGuard>
  );
}
