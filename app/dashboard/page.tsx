import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  PlayCircle,
  ShieldAlert,
} from "lucide-react";

import { PendingApprovalsQueueClient } from "@/components/dashboard/pending-approvals-queue-client";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/db/index";
import { businesses, userBusinesses } from "@/db/schema";
import {
  getDashboardActivityFeed,
  getDashboardSummaryStats,
  getTaskStatusBreakdownForUser,
  listPendingApprovalsPreviewForUser,
} from "@/lib/dashboard/home-data";
import {
  getAgentDashboardStatsForUserBusinesses,
} from "@/lib/tasks/dashboard-queries";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function formatRelativeTime(iso: Date): string {
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

function TaskStatusBar({
  b,
}: {
  b: { backlog: number; inProgress: number; blocked: number; inReview: number; done: number };
}) {
  const total = b.backlog + b.inProgress + b.blocked + b.inReview + b.done;
  if (total === 0) {
    return <div className="bg-muted mt-2 h-2 w-full rounded-full" />;
  }
  const pct = (n: number) => `${Math.max(8, Math.round((n / total) * 100))}%`;

  return (
    <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full">
      <div className="h-full bg-slate-500/60" style={{ width: pct(b.backlog) }} title="Backlog" />
      <div className="bg-primary h-full" style={{ width: pct(b.inProgress) }} title="In progress" />
      <div className="h-full bg-amber-500" style={{ width: pct(b.blocked) }} title="Blocked" />
      <div className="h-full bg-sky-500" style={{ width: pct(b.inReview) }} title="In review" />
      <div className="h-full bg-emerald-500" style={{ width: pct(b.done) }} title="Done" />
    </div>
  );
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

  const [stats, activity, pendingPreview, agentStats, breakdown] = await Promise.all([
    getDashboardSummaryStats(userId),
    getDashboardActivityFeed(userId, 10),
    listPendingApprovalsPreviewForUser(userId, 5),
    getAgentDashboardStatsForUserBusinesses(),
    getTaskStatusBreakdownForUser(),
  ]);

  return (
    <PageWrapper className="mx-auto max-w-screen-2xl px-6 py-6">
      <PageHeader
        breadcrumb={
          <div>
            <h1 className="text-foreground text-lg font-semibold">Dashboard</h1>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Signed in as{" "}
              <span className="text-foreground font-medium">
                {session?.user?.email ?? session?.user?.name ?? "user"}
              </span>
            </p>
          </div>
        }
        actions={
          <Button asChild className="cursor-pointer" data-testid="dashboard-new-business">
            <Link href="/dashboard/onboarding">New business</Link>
          </Button>
        }
        className="px-0 pt-0"
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={PlayCircle}
          label="Tasks in progress"
          value={stats.tasksInProgress}
        />
        <StatCard
          icon={AlertCircle}
          label="Blocked tasks"
          value={stats.blockedTasks}
        />
        <StatCard
          icon={ShieldAlert}
          label="Pending approvals"
          value={stats.pendingApprovals}
          className={
            stats.pendingApprovals > 0 ? "ring-destructive/40 ring-2" : undefined
          }
        />
        <StatCard icon={Bot} label="Active agents" value={stats.activeAgents} />
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="border-border bg-card rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Activity</h2>
            <Link
              href="/dashboard/tasks"
              className="text-primary cursor-pointer text-xs font-medium hover:underline"
            >
              View all
            </Link>
          </div>
          {activity.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent activity yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {activity.map((item) => (
                <li key={item.id} className="flex gap-3 text-sm">
                  <span
                    className="bg-accent text-primary mt-0.5 size-8 shrink-0 rounded-full text-center text-xs leading-8 font-semibold"
                    aria-hidden
                  >
                    {item.kind === "task" ? "T" : item.kind === "approval" ? "A" : "●"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-foreground leading-snug">{item.label}</p>
                    {item.sublabel ? (
                      <p className="text-muted-foreground mt-0.5 text-xs">{item.sublabel}</p>
                    ) : null}
                    <p className="text-muted-foreground mt-1 text-[11px] tabular-nums">
                      {formatRelativeTime(item.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-border bg-card rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Approvals</h2>
              {stats.pendingApprovals > 0 ? (
                <span className="bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums">
                  {stats.pendingApprovals > 99 ? "99+" : stats.pendingApprovals}
                </span>
              ) : null}
            </div>
            <Link
              href="/dashboard/approvals"
              className="text-primary cursor-pointer text-xs font-medium hover:underline"
            >
              View all
            </Link>
          </div>
          {stats.pendingApprovals === 0 ? (
            <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
              <CheckCircle2 className="size-5 shrink-0 text-emerald-500" aria-hidden />
              All caught up
            </div>
          ) : (
            <PendingApprovalsQueueClient items={pendingPreview} />
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-sm font-semibold">Businesses</h2>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No businesses yet.{" "}
            <Link href="/dashboard/onboarding" className="text-primary underline">
              Create one
            </Link>{" "}
            to get started.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((b) => {
              const a = agentStats.get(b.id);
              const agentCount = a?.agentCount ?? 0;
              const bd = breakdown.get(b.id) ?? {
                backlog: 0,
                inProgress: 0,
                blocked: 0,
                inReview: 0,
                done: 0,
              };
              const last = a?.lastAgentActivityAt;
              return (
                <div
                  key={b.id}
                  data-testid={`dashboard-business-${b.id}`}
                  className="border-border bg-card hover:border-primary/30 flex flex-col rounded-lg border p-4 transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-md"
                >
                  <div className="text-foreground font-medium">{b.name}</div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {agentCount} agent{agentCount === 1 ? "" : "s"}
                    {last ? ` · last activity ${formatRelativeTime(last)}` : ""}
                  </p>
                  <TaskStatusBar b={bd} />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="secondary" className="cursor-pointer">
                      <Link
                        href={`/dashboard/agents?businessId=${encodeURIComponent(b.id)}`}
                      >
                        Open
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost" className="cursor-pointer">
                      <Link
                        href={`/dashboard/tasks?businessId=${encodeURIComponent(b.id)}`}
                        data-testid={`dashboard-business-tasks-${b.id}`}
                      >
                        Tasks
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PageWrapper>
  );
}
