import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentEditor } from "@/components/agents/document-editor";
import { RunHeartbeatButton } from "@/components/agents/run-heartbeat-button";
import { getAgentsByBusiness } from "@/lib/agents/actions";
import { getAgentDocuments } from "@/lib/agents/document-actions";
import { getMcpCredentialsMeta } from "@/lib/mcp/actions";
import { getSkillsByAgent, listSkillsByBusiness } from "@/lib/skills/actions";
import { resolveBusinessIdParam } from "@/lib/dashboard/business-scope";

import { AgentForm } from "@/components/agents/agent-form";
import { McpInstaller } from "@/components/mcp/mcp-installer";
import { SkillManager } from "@/components/agents/skill-manager";

export const dynamic = "force-dynamic";

export default async function EditAgentPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentId: string }>;
  searchParams: Promise<{ businessId?: string }>;
}) {
  const { agentId } = await params;
  const sp = await searchParams;
  const businessId = await resolveBusinessIdParam(sp.businessId, "/dashboard/agents");

  const peers = await getAgentsByBusiness(businessId);
  const agent = peers.find((a) => a.id === agentId);
  if (!agent) notFound();

  const [attached, library, mcpMeta, agentDocs] = await Promise.all([
    getSkillsByAgent(agentId),
    listSkillsByBusiness(businessId),
    getMcpCredentialsMeta(agentId),
    getAgentDocuments(agentId),
  ]);

  return (
    <div className="bg-background text-foreground flex flex-col gap-6 p-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`/dashboard/agents?businessId=${encodeURIComponent(businessId)}`}
          className="text-muted-foreground hover:text-foreground text-sm underline"
        >
          ← Agents
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Edit agent</h1>
        <RunHeartbeatButton agentId={agentId} />
      </div>
      <AgentForm
        mode="edit"
        businessId={businessId}
        agent={agent}
        peerAgents={peers}
        showInstructions={false}
      >
        <DocumentEditor agentId={agentId} initialDocs={agentDocs} />
        <SkillManager
          agentId={agentId}
          businessId={businessId}
          attached={attached}
          library={library}
        />
        <McpInstaller agentId={agentId} meta={mcpMeta} />
      </AgentForm>
    </div>
  );
}
