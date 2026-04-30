import Link from "next/link";

import { auth } from "@/lib/auth/server";
import { countPendingApprovalsForUser } from "@/lib/approvals/queries";

import { NavLinks } from "./nav-links";
import { NavNewBusinessButton } from "./nav-new-business-button";
import { NavShellAuth } from "./nav-shell-auth";

export async function NavShell({ children }: { children: React.ReactNode }) {
  const { data: session } = await auth.getSession();
  const uid = session?.user?.id;
  const pending =
    typeof uid === "string" ? await countPendingApprovalsForUser(uid) : 0;

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <header className="border-border bg-background sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 border-b px-4 py-3">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            AI Business
          </Link>
          <NavLinks pendingApprovalsCount={pending} />
          <NavNewBusinessButton />
        </div>
        <NavShellAuth />
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
