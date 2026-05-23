"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useNovaStore } from "@/store/nova-store";

type GuardProps = {
  children: ReactNode;
  requireTill?: boolean;
  adminOnly?: boolean;
};

export function RouteGuard({ children, requireTill, adminOnly }: GuardProps) {
  const router = useRouter();
  const user = useNovaStore((s) => s.user);
  const till = useNovaStore((s) => s.till);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (adminOnly && user.role !== "admin") {
      router.replace("/till");
      return;
    }
    if (requireTill && till == null && user.role === "cashier") {
      router.replace("/till");
    }
    if (requireTill && till == null && user.role === "admin") {
      router.replace("/till");
    }
  }, [user, till, requireTill, adminOnly, router]);

  if (!user) return null;
  if (adminOnly && user.role !== "admin") return null;
  if (requireTill && till == null) return null;

  return <>{children}</>;
}
