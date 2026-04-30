import Link from "next/link";

import { NavShellAuth } from "./nav-shell-auth";

export function NavShell({ children }: { children: React.ReactNode }) {
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
