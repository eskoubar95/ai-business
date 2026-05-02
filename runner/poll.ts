import { dispatchOrchestrationEvent } from "./dispatch";
import {
  getOrchestrationEventById,
  listPendingOrchestrationEvents,
  tryClaimOrchestrationEvent,
} from "./queries";

const inFlight = new Set<string>();

export async function pollOnce(apiKey: string): Promise<void> {
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
