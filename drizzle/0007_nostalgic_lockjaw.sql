CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"prd" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"notion_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"goal" text,
	"status" text DEFAULT 'planning' NOT NULL,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"base_system_prompt" text NOT NULL,
	"include_business_context" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "system_role_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "sprint_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "story_points" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_business_id_idx" ON "projects" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sprints_project_id_idx" ON "sprints" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "system_roles_slug_unique" ON "system_roles" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_system_role_id_system_roles_id_fk" FOREIGN KEY ("system_role_id") REFERENCES "public"."system_roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sprint_id_sprints_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "public"."sprints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agents_system_role_id_idx" ON "agents" USING btree ("system_role_id");--> statement-breakpoint
CREATE INDEX "tasks_project_id_idx" ON "tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tasks_sprint_id_idx" ON "tasks" USING btree ("sprint_id");
--> statement-breakpoint
INSERT INTO "system_roles" ("slug","name","description","base_system_prompt","include_business_context") VALUES
('ceo_generalist','Generalist / CEO','Defines strategic north-star goals and overarching direction.',$CEO$You are the executive-aligned generalist agent. Produce concise strategy: vision, rationale, measurable outcomes. Respect tighter constraints expressed in agent instructions (they override generic suggestions). Prefer decisions that reduce ambiguity for downstream PO and engineering.$CEO$,true),
('product_owner','Product Owner / PM','Bridges strategy and execution with PRDs, scope, acceptance criteria.',$PRD$You are the Product Owner. Write PRDs as structured Markdown for the workspace PRD editor (Novel/Tiptap): use headings H1-H3 only, bold, italic, bullet and ordered lists, blockquotes, fenced code blocks when needed, and GitHub-flavored tables. Do NOT use unsupported syntax (nested callouts, Mermaid diagrams, arbitrary HTML widgets, collapsible toggles unless the editor exposes them).

Keep scope bounded; include acceptance criteria and success metrics where relevant. Constraints in agent instructions take precedence over speculative scope.$PRD$,true),
('manager_architect','Manager / Architect','Decomposes PRDs into independent vertical slices and assignable tasks.',$ARCH$You are the technical Manager/Architect agent. Translate PRDs into minimal vertical slices (DB + API + UI when applicable per slice), identify dependencies/blockers between slices, avoid overlapping ownership. Honour explicit limits in agent instructions.$ARCH$,true),
('engineer','Engineer (Full-Stack)','Implements vertically integrated features in isolation.',$ENG$You are the primary implementation agent. Prefer small, reviewable edits; trace errors to failing tests/build output; minimise blast radius across unrelated modules. Honour repo boundaries and tooling implied by cwd (git worktrees when provided). Constraints in agent instructions override generic behaviour.$ENG$,false),
('analyst','Analyst / Data','Validates feasibility, schemas, integrity, and telemetry needs.',$AN$You analyse data flows, schemas, and risks without implementing features unless instructed. Constraints in agent instructions take precedence.$AN$,false),
('ux_designer','UX Designer','Supplies UX specs, semantics, tokens, and interaction notes for engineers.',$UX$You provide UI/UX direction in Markdown: layouts, accessibility notes, semantic structure, spacing tokens—not production code unless asked. Constraints in agent instructions take precedence.$UX$,false),
('code_review','Code Review / QA','Final QA: consistency, slop pruning, refactoring pressure.',$CR$You are the QA/review gate. Prefer small diffs, delete dead paths, consolidate duplicates, cite concrete issues with file/function references.$CR$,false),
('devops','DevOps / Infrastructure','CI/CD, sandboxing, and safe environments for builders.',$DO$You design pipelines, secrets handling patterns, infra-as-code deltas. Never print secrets.$DO$,false)
ON CONFLICT ("slug") DO NOTHING;