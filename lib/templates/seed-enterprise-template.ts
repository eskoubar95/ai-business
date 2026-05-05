import { and, eq, sql } from "drizzle-orm";

import {
  agents,
  businesses,
  communicationEdges,
  gateKinds,
  teamMembers,
  teams,
} from "@/db/schema";
import type { AppDb } from "@/lib/templates/db-types";
import { TemplateSeedError } from "@/lib/templates/template-errors";
import type { BundlePayload } from "@/lib/templates/zod-schemas";

/**
 * Idempotent seed: upserts agents, teams, memberships, gate kinds, and communication edges.
 * Caller must verify bundle integrity (`verifyAndParseBundle`) before invoking.
 */
export async function seedEnterpriseTemplate(
  db: AppDb,
  businessId: string,
  bundle: BundlePayload,
): Promise<void> {
  const templateId = bundle.manifest.template_id;
  const templateVersion = bundle.manifest.template_version;

  const updatedBusiness = await db
    .update(businesses)
    .set({
      templateId,
      templateVersion,
      derivedFromTemplateId: templateId,
      derivedFromTemplateVersion: templateVersion,
    })
    .where(eq(businesses.id, businessId))
    .returning({ id: businesses.id });

  if (updatedBusiness.length === 0) {
    throw new TemplateSeedError(
      "BUSINESS_NOT_FOUND",
      `No business exists with id ${businessId}; refusing to seed template rows.`,
    );
  }

  await db
    .insert(agents)
    .values(
      bundle.shards.agents.map((agent) => ({
        businessId,
        slug: agent.agent_slug,
        name: agent.display_name,
        role: agent.agent_slug,
        executionAdapter: agent.execution_adapter,
        modelRouting: agent.model_routing,
        tier: agent.tier,
      })),
    )
    .onConflictDoUpdate({
      target: [agents.businessId, agents.slug],
      set: {
        name: sql.raw("excluded.name"),
        role: sql.raw("excluded.role"),
        executionAdapter: sql.raw("excluded.execution_adapter"),
        modelRouting: sql.raw("excluded.model_routing"),
        tier: sql.raw("excluded.tier"),
        updatedAt: sql`now()`,
      },
    });

  const agentRows = await db
    .select({ id: agents.id, slug: agents.slug })
    .from(agents)
    .where(and(eq(agents.businessId, businessId)));
  const agentIdBySlug = new Map(agentRows.filter((r) => r.slug).map((r) => [r.slug!, r.id]));

  const teamValues = bundle.shards.teams.map((team) => {
    const leadId = agentIdBySlug.get(team.lead_agent_slug);
    if (!leadId) {
      throw new TemplateSeedError(
        "SEED_REFERENCE_MISSING",
        `Lead agent slug not found after upsert: ${team.lead_agent_slug}`,
      );
    }
    return {
      businessId,
      slug: team.team_slug,
      name: team.display_name,
      leadAgentId: leadId,
    };
  });

  await db
    .insert(teams)
    .values(teamValues)
    .onConflictDoUpdate({
      target: [teams.businessId, teams.slug],
      set: {
        name: sql.raw("excluded.name"),
        leadAgentId: sql.raw("excluded.lead_agent_id"),
        updatedAt: sql`now()`,
      },
    });

  const teamRows = await db
    .select({ id: teams.id, slug: teams.slug })
    .from(teams)
    .where(eq(teams.businessId, businessId));
  const teamIdBySlug = new Map(teamRows.filter((r) => r.slug).map((r) => [r.slug!, r.id]));

  const memberRows = bundle.shards.agents.map((agent) => {
    const teamId = teamIdBySlug.get(agent.team_slug);
    const agentId = agentIdBySlug.get(agent.agent_slug);
    if (!teamId || !agentId) {
      throw new TemplateSeedError(
        "SEED_REFERENCE_MISSING",
        `Team membership unresolved for agent_slug=${agent.agent_slug} team_slug=${agent.team_slug}`,
      );
    }
    return {
      teamId,
      agentId,
      sortOrder: agent.tier,
    };
  });

  await db
    .insert(teamMembers)
    .values(memberRows)
    .onConflictDoUpdate({
      target: [teamMembers.teamId, teamMembers.agentId],
      set: {
        sortOrder: sql.raw("excluded.sort_order"),
      },
    });

  const gateShard = bundle.shards.gates;
  await db
    .insert(gateKinds)
    .values(
      gateShard.gate_kinds.map((gate) => ({
        businessId,
        slug: gate.slug,
        label: gate.label,
        description: gate.description,
        defaultMode: gateShard.default_mode,
        templateId,
        templateVersion,
      })),
    )
    .onConflictDoUpdate({
      target: [gateKinds.businessId, gateKinds.slug],
      set: {
        label: sql.raw("excluded.label"),
        description: sql.raw("excluded.description"),
        defaultMode: sql.raw("excluded.default_mode"),
        templateId: sql.raw("excluded.template_id"),
        templateVersion: sql.raw("excluded.template_version"),
      },
    });

  await db
    .insert(communicationEdges)
    .values(
      bundle.shards.communication_policy.edges.map((edge) => ({
        businessId,
        fromRole: edge.from_role,
        toRole: edge.to_role,
        direction: edge.direction,
        allowedIntents: edge.allowed_intents,
        allowedArtifacts: edge.allowed_artifacts,
        requiresHumanAck: edge.requires_human_ack,
        quotaPerHour: edge.quota_per_hour ?? null,
        quotaMode: edge.quota_mode,
        templateId,
        templateVersion,
        derivedFromTemplateId: templateId,
        derivedFromTemplateVersion: templateVersion,
      })),
    )
    .onConflictDoUpdate({
      target: [communicationEdges.businessId, communicationEdges.fromRole, communicationEdges.toRole],
      set: {
        direction: sql.raw("excluded.direction"),
        allowedIntents: sql.raw("excluded.allowed_intents"),
        allowedArtifacts: sql.raw("excluded.allowed_artifacts"),
        requiresHumanAck: sql.raw("excluded.requires_human_ack"),
        quotaPerHour: sql.raw("excluded.quota_per_hour"),
        quotaMode: sql.raw("excluded.quota_mode"),
        templateId: sql.raw("excluded.template_id"),
        templateVersion: sql.raw("excluded.template_version"),
        derivedFromTemplateId: sql.raw("excluded.derived_from_template_id"),
        derivedFromTemplateVersion: sql.raw("excluded.derived_from_template_version"),
        updatedAt: sql`now()`,
      },
    });
}
