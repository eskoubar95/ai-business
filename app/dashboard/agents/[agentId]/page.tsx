import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AgentDetailTabs } from "@/components/agents/agent-detail-tabs";
import { AgentForm } from "@/components/agents/agent-form";
import { AgentOnboardingHint } from "@/components/agents/agent-onboarding-hint";
import { DocumentEditor } from "@/components/agents/document-editor";
import { McpInstaller } from "@/components/mcp/mcp-installer";
import { RunHeartbeatButton } from "@/components/agents/run-heartbeat-button";
import { SkillManager } from "@/components/agents/skill-manager";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { getAgentsByBusiness } from "@/lib/agents/actions";
import { getAgentDocuments } from "@/lib/agents/document-actions";
import { getMcpCredentialsForAgent } from "@/lib/mcp/actions";
import { getSkillsByAgent, listSkillsByBusiness } from "@/lib/skills/actions";
import { resolveBusinessIdParam } from "@/lib/dashboard/business-scope";
import { getTasksByAgent } from "@/lib/tasks/actions";

export const dynamic = "force-dynamic";

export default async function AgentDetailPage({
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

  const [attached, library, mcpMeta, agentDocs, tasks] = await Promise.all([
    getSkillsByAgent(agentId),
    listSkillsByBusiness(businessId),
    getMcpCredentialsForAgent(agentId),
    getAgentDocuments(agentId),
    getTasksByAgent(agentId),
  ]);

  const recentTasks = tasks.slice(-10).reverse();

  return (
    <PageWrapper className="mx-auto max-w-screen-2xl px-6 py-6">
      <Suspense fallback={null}>
        <AgentOnboardingHint businessId={businessId} agentId={agentId} />
      </Suspense>

      <PageHeader
        breadcrumb={
          <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Breadcrumb">
            <Link
              href={`/dashboard/agents?businessId=${encodeURIComponent(businessId)}`}
              className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              Agents
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium">{agent.name}</span>
          </nav>
        }
        actions={<RunHeartbeatButton agentId={agentId} />}
        className="border-0 px-0 pt-0"
      />

      <div className="mt-6">
        <AgentDetailTabs
          overview={
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-medium">Recent tasks</h3>
                {recentTasks.length === 0 ? (
                  <p className="text-muted-foreground mt-2 text-sm">No tasks linked yet.</p>
                ) : (
                  <ul className="mt-2 flex flex-col gap-2 text-sm">
                    {recentTasks.map((t) => (
                      <li key={t.id} className="border-border flex flex-wrap justify-between gap-2 border-b py-2">
                        <span className="text-foreground min-w-0 truncate">{t.title}</span>
                        <span className="text-muted-foreground shrink-0 text-xs uppercase">
                          {String(t.status).replaceAll("_", " ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                Need full task detail? Open{" "}
                <Link href="/dashboard/tasks" className="text-primary underline">
                  Tasks
                </Link>
                .
              </p>
            </div>
          }
          instructions={
            <div className="flex flex-col gap-4">
              <DocumentEditor agentId={agentId} initialDocs={agentDocs} />
            </div>
          }
          skills={
            <div className="flex flex-col gap-4">
              <SkillManager
                agentId={agentId}
                businessId={businessId}
                attached={attached}
                library={library}
              />
            </div>
          }
          mcp={
            <div className="flex flex-col gap-4">
              <McpInstaller businessId={businessId} agentId={agentId} meta={mcpMeta} />
            </div>
          }
          settings={
            <AgentForm
              mode="edit"
              businessId={businessId}
              agent={agent}
              peerAgents={peers}
              showInstructions={false}
            />
          }
        />
      </div>
    </PageWrapper>
  );
}
