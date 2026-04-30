import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { getBusinessSoulMemory } from "@/lib/grill-me/memory-read";
import { loadGrillMeSessionsForBusiness } from "@/lib/grill-me/session-queries";
import { Chat } from "@/components/grill-me/chat";

export const dynamic = "force-dynamic";

export default async function GrillMePage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") redirect("/auth/sign-in");

  try {
    await assertUserBusinessAccess(userId, businessId);
  } catch {
    redirect("/dashboard");
  }

  const initialTurns = await loadGrillMeSessionsForBusiness(businessId);
  const initialSoul = await getBusinessSoulMemory(businessId);

  return (
    <Chat
      businessId={businessId}
      initialTurns={initialTurns}
      initialSoulMarkdown={initialSoul}
    />
  );
}
