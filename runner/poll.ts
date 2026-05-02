import { dispatchOrchestrationEvent } from "./dispatch";
import {
  finishOrchestrationEvent,
  getOrchestrationEventById,
  listPendingOrchestrationEvents,
  resolveRunnerCursorApiKey,
  tryClaimOrchestrationEvent,
} from "./queries";

const inFlight = new Set<string>();

export async function pollOnce(): Promise<void> {
  const pending = await listPendingOrchestrationEvents(8);
  for (const row of pending) {
    if (inFlight.has(row.id)) continue;
    const claimed = await tryClaimOrchestrationEvent(row.id);
    if (!claimed) continue;
    inFlight.add(row.id);
    try {
      const full = await getOrchestrationEventById(row.id);
      if (!full) continue;
      const payload =
        full.payload && typeof full.payload === "object" && full.payload !== null
          ? (full.payload as Record<string, unknown>)
          : {};

      const apiKey = await resolveRunnerCursorApiKey(full.businessId);
      if (!apiKey) {
        await finishOrchestrationEvent(full.id, {
          status: "failed",
          payload: {
            ...payload,
            runnerError:
              "No Cursor API key: save a validated key under Settings/onboarding for a business member linked to this business, or set CURSOR_API_KEY for this runner process.",
          },
        });
        continue;
      }

      await dispatchOrchestrationEvent(
        full.id,
        {
          businessId: full.businessId,
          type: full.type,
          payload,
        },
        apiKey,
      );
    } finally {
      inFlight.delete(row.id);
    }
  }
}
