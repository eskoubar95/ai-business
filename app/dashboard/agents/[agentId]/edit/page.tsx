import { redirect } from "next/navigation";

/** Legacy URL — canonical agent detail is `/dashboard/agents/[agentId]`. */
export default async function LegacyEditAgentRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { agentId } = await params;
  const sp = await searchParams;
  const q = new URLSearchParams();
  const businessId = sp.businessId;
  if (typeof businessId === "string") {
    q.set("businessId", businessId);
  }
  const rest = q.toString();
  redirect(`/dashboard/agents/${agentId}${rest ? `?${rest}` : ""}`);
}
