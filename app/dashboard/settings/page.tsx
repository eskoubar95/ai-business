import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";
import { loadUserBusinesses } from "@/lib/dashboard/business-scope";

import { SettingsForms } from "./settings-forms";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ businessId?: string }>;
}) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) redirect("/auth/sign-in");

  const sp = await searchParams;
  const businesses = await loadUserBusinesses();
  const fromQuery =
    typeof sp.businessId === "string" && sp.businessId.length > 0
      ? businesses.find((b) => b.id === sp.businessId)?.id
      : undefined;
  const initialBusinessId = fromQuery ?? businesses[0]?.id ?? null;

  return (
    <div className="bg-background text-foreground flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Account credentials and per-business workspace defaults.
        </p>
      </div>
      <SettingsForms businesses={businesses} initialBusinessId={initialBusinessId} />
    </div>
  );
}
