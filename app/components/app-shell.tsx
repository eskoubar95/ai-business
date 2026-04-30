import { auth } from "@/lib/auth/server";
import { countPendingApprovalsForUser } from "@/lib/approvals/queries";

import { AppSidebar } from "./sidebar";

export const dynamic = "force-dynamic";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = await auth.getSession();
  const uid = session?.user?.id;
  const pending =
    typeof uid === "string" ? await countPendingApprovalsForUser(uid) : 0;
  const userEmail = session?.user?.email ?? null;

  return (
    <div className="bg-background flex min-h-svh flex-col md:flex-row">
      <AppSidebar pendingApprovalsCount={pending} userEmail={userEmail} />
      <div className="flex min-h-svh min-w-0 flex-1 flex-col pt-12 md:pt-0">
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
