"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Revalidates this route every 5s so agent status stays fresh (spec: 5s polling). */
export function AgentsDashboardAutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
    }, 5000);
    return () => window.clearInterval(id);
  }, [router]);
  return null;
}
