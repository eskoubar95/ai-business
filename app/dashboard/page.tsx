import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/db/index";
import { businesses, userBusinesses } from "@/db/schema";
import {
  getAgentDashboardStatsForUserBusinesses,
  getTaskCountsForUserBusinesses,
} from "@/lib/tasks/dashboard-queries";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function formatLastActive(iso: Date): string {
  const diff = Date.now() - iso.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return iso.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") redirect("/auth/sign-in");

  const db = getDb();
  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      createdAt: businesses.createdAt,
    })
    .from(userBusinesses)
    .innerJoin(businesses, eq(userBusinesses.businessId, businesses.id))
    .where(eq(userBusinesses.userId, userId));

  const taskCounts = await getTaskCountsForUserBusinesses();
  const agentStats = await getAgentDashboardStatsForUserBusinesses();

  return (
    <div className="bg-background text-foreground flex flex-col gap-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Signed in as{" "}
            <span className="text-foreground font-medium">
              {session?.user?.email ?? session?.user?.name ?? "user"}
            </span>
          </p>
        </div>
        <Button asChild data-testid="dashboard-new-business">
          <Link href="/dashboard/onboarding">New business</Link>
        </Button>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Your businesses</h2>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No businesses yet.{" "}
            <Link href="/dashboard/onboarding" className="text-primary underline">
              Create one
            </Link>{" "}
            to run Grill-Me.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((b) => (
              <li key={b.id}>
                <div
                  className="border-border hover:bg-muted/50 hover:border-primary/30 rounded-lg border px-4 py-3 text-sm transition-colors"
                  data-testid={`dashboard-business-${b.id}`}
                >
                  <Link
                    href={`/dashboard/agents?businessId=${encodeURIComponent(b.id)}`}
                    className="text-foreground block font-medium hover:underline"
                  >
                    {b.name}
                  </Link>
                  <span className="text-muted-foreground mt-2 block text-xs leading-relaxed">
                    {(() => {
                      const a = agentStats.get(b.id);
                      const agentCount = a?.agentCount ?? 0;
                      const c = taskCounts.get(b.id) ?? { inProgress: 0, blocked: 0 };
                      const parts: string[] = [];
                      parts.push(`${agentCount} agent${agentCount === 1 ? "" : "s"}`);
                      parts.push(
                        `${c.inProgress} task${c.inProgress === 1 ? "" : "s"} in progress`,
                      );
                      if (c.blocked > 0) {
                        parts.push(`${c.blocked} blocked`);
                      }
                      return parts.join(" · ");
                    })()}
                  </span>
                  {(() => {
                    const last = agentStats.get(b.id)?.lastAgentActivityAt;
                    if (!last) return null;
                    return (
                      <span className="text-muted-foreground block text-xs">
                        Last roster activity {formatLastActive(last)}
                      </span>
                    );
                  })()}
                  <span className="text-muted-foreground mt-1 block text-xs">
                    Since{" "}
                    {new Date(b.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <Link
                    href={`/dashboard/tasks?businessId=${encodeURIComponent(b.id)}`}
                    className="text-primary mt-2 inline-block text-xs underline"
                    data-testid={`dashboard-business-tasks-${b.id}`}
                  >
                    Open tasks
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
