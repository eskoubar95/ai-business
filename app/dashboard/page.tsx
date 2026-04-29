import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { data: session } = await auth.getSession();

  return (
    <div className="bg-background text-foreground flex flex-col gap-2 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        Protected placeholder — you are signed in as{" "}
        <span className="text-foreground font-medium">
          {session?.user?.email ?? session?.user?.name ?? "user"}
        </span>
        .
      </p>
    </div>
  );
}
