"use server";

import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { getDb } from "@/db/index";
import { requireSessionUserId } from "@/lib/roster/session";

import {
  CreateCommunicationEdgeSchema,
  UpdateCommunicationEdgeSchema,
  type CreateCommunicationEdgeInput,
  type UpdateCommunicationEdgeInput,
} from "./schemas";
import {
  deleteCommunicationEdge,
  listCommunicationEdges,
  mergeSmartUpdateEdge,
  upsertCommunicationEdge,
  type CommunicationEdgeRow,
} from "./edge-store";

async function ensureAccess(businessId: string): Promise<void> {
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);
}

export async function createEdge(
  businessId: string,
  input: CreateCommunicationEdgeInput,
): Promise<CommunicationEdgeRow> {
  await ensureAccess(businessId);
  const parsed = CreateCommunicationEdgeSchema.parse(input);
  const db = getDb();
  return upsertCommunicationEdge(db, businessId, parsed, {
    templateId: null,
    templateVersion: null,
    derivedFromTemplateId: null,
    derivedFromTemplateVersion: null,
  });
}

export async function updateEdge(
  businessId: string,
  edgeId: string,
  patch: UpdateCommunicationEdgeInput,
): Promise<CommunicationEdgeRow | null> {
  await ensureAccess(businessId);
  const parsed = UpdateCommunicationEdgeSchema.parse(patch);
  const db = getDb();
  return mergeSmartUpdateEdge(db, businessId, edgeId, parsed);
}

export async function deleteEdge(businessId: string, edgeId: string): Promise<boolean> {
  await ensureAccess(businessId);
  const db = getDb();
  return deleteCommunicationEdge(db, businessId, edgeId);
}

export async function listEdges(businessId: string): Promise<CommunicationEdgeRow[]> {
  await ensureAccess(businessId);
  const db = getDb();
  return listCommunicationEdges(db, businessId);
}
