import Link from "next/link";

import { auth } from "@/lib/auth/server";
import { countPendingApprovalsForUser } from "@/lib/approvals/queries";

import { NavShellAuth } from "./nav-shell-auth";

export async function NavShell({ children }: { children: React.ReactNode }) {
  const { data: session } = await auth.getSession();
  const uid = session?.user?.id;
  const pending =
    typeof uid === "string" ? await countPendingApprovalsForUser(uid) : 0;

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <header className="border-border bg-background sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 border-b px-4 py-3">
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            AI Business
          </Link>
          <nav
            aria-label="Primary"
            className="text-muted-foreground flex flex-wrap gap-4 text-sm"
          >
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/agents" className="hover:text-foreground transition-colors">
              Agents
            </Link>
            <Link href="/dashboard/teams" className="hover:text-foreground transition-colors">
              Teams
            </Link>
            <Link href="/dashboard/approvals" className="hover:text-foreground transition-colors">
              Approvals
              {pending > 0 ? (
                <span
                  data-testid="nav-approvals-pending-count"
                  className="bg-primary text-primary-foreground ml-1 inline-flex min-w-[1.25rem] justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none"
                >
                  {pending > 99 ? "99+" : pending}
                </span>
              ) : null}
            </Link>
            <Link href="/dashboard/notion" className="hover:text-foreground transition-colors">
              Notion
            </Link>
            <Link href="/dashboard/webhooks" className="hover:text-foreground transition-colors">
              Webhooks
            </Link>
            <Link
              href="/dashboard/onboarding"
              className="hover:text-foreground transition-colors"
            >
              New business
            </Link>
          </nav>
        </div>
        <NavShellAuth />
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
