# Orchestration events

Persistence for `orchestration_events` (`db/schema.ts` → `orchestrationEvents`).

## Files

- **`events.ts`** — `logEvent` inserts a row; `logAgentLifecycleStatus` writes type `agent.lifecycle` with `payload.lifecycleStatus` (`idle` | `working` | `awaiting_approval`). `getAgentStatus(agentId)` scans recent events with matching `payload.agentId` and returns the latest `lifecycleStatus`, defaulting to `idle`.

## Agent status

UI and workers should call `logAgentLifecycleStatus` whenever agent state changes so `getAgentStatus` stays consistent.
