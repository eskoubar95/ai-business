CREATE TABLE "task_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"from_task_id" uuid NOT NULL,
	"to_task_id" uuid NOT NULL,
	"relation_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "priority" text DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "labels" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "project" text;--> statement-breakpoint
ALTER TABLE "task_relations" ADD CONSTRAINT "task_relations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_relations_from_idx" ON "task_relations" USING btree ("from_task_id");--> statement-breakpoint
CREATE INDEX "task_relations_to_idx" ON "task_relations" USING btree ("to_task_id");--> statement-breakpoint
CREATE INDEX "task_relations_business_id_idx" ON "task_relations" USING btree ("business_id");