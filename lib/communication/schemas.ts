import { z } from "zod";

export const EdgeDirectionSchema = z.enum(["one_way", "bidirectional"]);
export const QuotaModeSchema = z.enum(["warn_only", "enforce"]);

/** Input for creating or replacing an edge (idempotent on business + roles). */
export const CreateCommunicationEdgeSchema = z.object({
  fromRole: z.string().min(1),
  toRole: z.string().min(1),
  direction: EdgeDirectionSchema,
  allowedIntents: z.array(z.string().min(1)).min(1),
  allowedArtifacts: z.array(z.string().min(1)).default([]),
  requiresHumanAck: z.boolean().default(false),
  quotaPerHour: z.number().int().positive().nullable().optional(),
  quotaMode: QuotaModeSchema.default("warn_only"),
});

export type CreateCommunicationEdgeInput = z.infer<typeof CreateCommunicationEdgeSchema>;

export const UpdateCommunicationEdgeSchema = z
  .object({
    fromRole: z.string().min(1).optional(),
    toRole: z.string().min(1).optional(),
    direction: EdgeDirectionSchema.optional(),
    allowedIntents: z.array(z.string().min(1)).min(1).optional(),
    allowedArtifacts: z.array(z.string().min(1)).optional(),
    requiresHumanAck: z.boolean().optional(),
    quotaPerHour: z.number().int().positive().nullable().optional(),
    quotaMode: QuotaModeSchema.optional(),
  })
  .strict();

export type UpdateCommunicationEdgeInput = z.infer<typeof UpdateCommunicationEdgeSchema>;

export const ConsultCheckBodySchema = z.object({
  org_id: z.string().uuid(),
  from_role: z.string().min(1),
  to_role: z.string().min(1),
  intent: z.string().min(1),
  artifacts: z
    .array(
      z.object({
        kind: z.string().min(1),
        ref: z.string().min(1).nullable().optional(),
      }),
    )
    .optional()
    .default([]),
});

export type ConsultCheckBody = z.infer<typeof ConsultCheckBodySchema>;
