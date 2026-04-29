import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/** Core tenant — onboarding, memory, agents, teams attach here. */
export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("businesses_created_at_idx").on(t.createdAt)],
);

/** Neon Auth user id (opaque string); links authenticated users to businesses. */
export const userBusinesses = pgTable(
  "user_businesses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("user_businesses_user_id_business_id_unique").on(t.userId, t.businessId),
    index("user_businesses_business_id_idx").on(t.businessId),
    index("user_businesses_user_id_idx").on(t.userId),
  ],
);

export const memoryScopeEnum = pgEnum("memory_scope", ["business", "agent"]);

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Job / roster role label (distinct from DB role names). */
    role: text("role").notNull(),
    instructions: text("instructions").notNull(),
    reportsToAgentId: uuid("reports_to_agent_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.reportsToAgentId],
      foreignColumns: [t.id],
    }).onDelete("set null"),
    index("agents_business_id_idx").on(t.businessId),
    index("agents_reports_to_agent_id_idx").on(t.reportsToAgentId),
  ],
);

/** Markdown memory PARA-style; scoped to business-wide or agent-specific rows. */
export const memory = pgTable(
  "memory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }),
    scope: memoryScopeEnum("scope").notNull(),
    /** Markdown body. */
    content: text("content").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    version: integer("version").notNull().default(1),
  },
  (t) => [
    index("memory_business_id_idx").on(t.businessId),
    index("memory_agent_id_idx").on(t.agentId),
    index("memory_scope_idx").on(t.scope),
  ],
);

export const grillMeRoleEnum = pgEnum("grill_me_role", ["user", "assistant"]);

/** Grill-Me onboarding turns ordered per business. */
export const grillMeSessions = pgTable(
  "grill_me_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    role: grillMeRoleEnum("role").notNull(),
    content: text("content").notNull(),
    seq: integer("seq").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("grill_me_sessions_business_id_seq_unique").on(t.businessId, t.seq),
    index("grill_me_sessions_business_id_idx").on(t.businessId),
  ],
);

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    markdown: text("markdown").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("skills_business_id_idx").on(t.businessId)],
);

export const agentSkills = pgTable(
  "agent_skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("agent_skills_agent_id_skill_id_unique").on(t.agentId, t.skillId),
    index("agent_skills_skill_id_idx").on(t.skillId),
  ],
);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    leadAgentId: uuid("lead_agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("teams_business_id_idx").on(t.businessId),
    index("teams_lead_agent_id_idx").on(t.leadAgentId),
  ],
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("team_members_team_id_agent_id_unique").on(t.teamId, t.agentId),
    index("team_members_agent_id_idx").on(t.agentId),
  ],
);

export const mcpCredentials = pgTable(
  "mcp_credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    mcpName: text("mcp_name").notNull(),
    encryptedPayload: jsonb("encrypted_payload").notNull(),
    /** Base64-encoded IV / nonce for AES. */
    iv: text("iv").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("mcp_credentials_agent_id_mcp_name_unique").on(t.agentId, t.mcpName),
    index("mcp_credentials_agent_id_idx").on(t.agentId),
  ],
);

export const orchestrationStatusEnum = pgEnum("orchestration_status", [
  "pending",
  "processing",
  "succeeded",
  "failed",
]);

export const orchestrationEvents = pgTable(
  "orchestration_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "set null" }),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
    status: orchestrationStatusEnum("status").notNull().default("pending"),
    correlationId: text("correlation_id"),
    correlationKey: text("correlation_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("orchestration_events_business_id_idx").on(t.businessId),
    index("orchestration_events_status_idx").on(t.status),
    index("orchestration_events_correlation_id_idx").on(t.correlationId),
  ],
);

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
    status: text("status").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("webhook_deliveries_business_id_idx").on(t.businessId),
    index("webhook_deliveries_status_idx").on(t.status),
    index("webhook_deliveries_type_idx").on(t.type),
  ],
);

export const approvalStatusEnum = pgEnum("approval_status", ["pending", "approved", "rejected"]);

export const approvals = pgTable(
  "approvals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    artifactRef: jsonb("artifact_ref").notNull(),
    approvalStatus: approvalStatusEnum("approval_status").notNull().default("pending"),
    comment: text("comment"),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "set null" }),
    agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("approvals_business_id_idx").on(t.businessId),
    index("approvals_agent_id_idx").on(t.agentId),
    index("approvals_approval_status_idx").on(t.approvalStatus),
  ],
);

// --- Self-reference on agents (after table exists) ---
// Drizzle resolves forward refs via callback returning column

// --- Relations ---

export const businessesRelations = relations(businesses, ({ many }) => ({
  userLinks: many(userBusinesses),
  memories: many(memory),
  agents: many(agents),
  grillSessions: many(grillMeSessions),
  skillsMany: many(skills),
  teamsMany: many(teams),
  orchestrations: many(orchestrationEvents),
  webhookDeliveriesMany: many(webhookDeliveries),
  approvalsMany: many(approvals),
}));

export const userBusinessesRelations = relations(userBusinesses, ({ one }) => ({
  business: one(businesses, {
    fields: [userBusinesses.businessId],
    references: [businesses.id],
  }),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  business: one(businesses, {
    fields: [agents.businessId],
    references: [businesses.id],
  }),
  reportsTo: one(agents, {
    fields: [agents.reportsToAgentId],
    references: [agents.id],
    relationName: "agent_hierarchy",
  }),
  directReports: many(agents, { relationName: "agent_hierarchy" }),
  memories: many(memory),
  skillsLinks: many(agentSkills),
  leadOfTeams: many(teams),
  teamMemberships: many(teamMembers),
  mcpCreds: many(mcpCredentials),
  approvals: many(approvals),
}));

export const memoryRelations = relations(memory, ({ one }) => ({
  business: one(businesses, {
    fields: [memory.businessId],
    references: [businesses.id],
  }),
  agent: one(agents, {
    fields: [memory.agentId],
    references: [agents.id],
  }),
}));

export const grillMeSessionsRelations = relations(grillMeSessions, ({ one }) => ({
  business: one(businesses, {
    fields: [grillMeSessions.businessId],
    references: [businesses.id],
  }),
}));

export const skillsRelations = relations(skills, ({ one, many }) => ({
  business: one(businesses, {
    fields: [skills.businessId],
    references: [businesses.id],
  }),
  agentLinks: many(agentSkills),
}));

export const agentSkillsRelations = relations(agentSkills, ({ one }) => ({
  agent: one(agents, {
    fields: [agentSkills.agentId],
    references: [agents.id],
  }),
  skill: one(skills, {
    fields: [agentSkills.skillId],
    references: [skills.id],
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  business: one(businesses, {
    fields: [teams.businessId],
    references: [businesses.id],
  }),
  leadAgent: one(agents, {
    fields: [teams.leadAgentId],
    references: [agents.id],
  }),
  members: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  agent: one(agents, {
    fields: [teamMembers.agentId],
    references: [agents.id],
  }),
}));

export const mcpCredentialsRelations = relations(mcpCredentials, ({ one }) => ({
  agent: one(agents, {
    fields: [mcpCredentials.agentId],
    references: [agents.id],
  }),
}));

export const orchestrationEventsRelations = relations(orchestrationEvents, ({ one }) => ({
  business: one(businesses, {
    fields: [orchestrationEvents.businessId],
    references: [businesses.id],
  }),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one }) => ({
  business: one(businesses, {
    fields: [webhookDeliveries.businessId],
    references: [businesses.id],
  }),
}));

export const approvalsRelations = relations(approvals, ({ one }) => ({
  business: one(businesses, {
    fields: [approvals.businessId],
    references: [businesses.id],
  }),
  agent: one(agents, {
    fields: [approvals.agentId],
    references: [agents.id],
  }),
}));
