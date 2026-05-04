import { redirect } from "next/navigation";

import { Chat } from "@/components/grill-me/chat";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import type { GrillBusinessType } from "@/lib/grill-me/grill-prompt";
import { getBusinessSoulMemory } from "@/lib/grill-me/memory-read";
import { loadGrillMeSessionsForBusiness } from "@/lib/grill-me/session-queries";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function GrillMePage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ businessType?: string }>;
}) {
  const { businessId } = await params;
  const sp = await searchParams;
  let businessType: GrillBusinessType = "existing";
  const raw = sp.businessType?.trim();
  if (raw === "new") businessType = "new";
  else if (raw === "existing") businessType = "existing";
  else if (raw && raw !== "")
    redirect(`/dashboard/grill-me/${encodeURIComponent(businessId)}`);

  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") redirect("/auth/sign-in");

  try {
    await assertUserBusinessAccess(userId, businessId);
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") {
      redirect("/dashboard");
    }
    throw e;
  }

  const initialTurns = await loadGrillMeSessionsForBusiness(businessId);
  const initialSoul = await getBusinessSoulMemory(businessId);

  return (
    <Chat
      businessId={businessId}
      businessType={businessType}
      initialTurns={initialTurns}
      initialSoulMarkdown={initialSoul}
    />
  );
}
