import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";
import { getDb } from "@/db/index";
import { businesses, userBusinesses } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") redirect("/auth/sign-in");

  const db = getDb();
  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
    })
    .from(userBusinesses)
    .innerJoin(businesses, eq(userBusinesses.businessId, businesses.id))
    .where(eq(userBusinesses.userId, userId));

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
        <Link
          href="/dashboard/onboarding"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex rounded-md px-4 py-2 text-sm font-medium"
          data-testid="dashboard-new-business"
        >
          Start new business
        </Link>
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
                <Link
                  href={`/dashboard/grill-me/${b.id}`}
                  className="border-border hover:bg-muted/50 block rounded-lg border px-4 py-3 text-sm font-medium"
                  data-testid={`dashboard-business-${b.id}`}
                >
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
