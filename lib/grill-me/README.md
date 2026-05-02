# Grill-Me backend

Two-phase onboarding (wizard → silent reasoning → streamed chat → soul markdown):

1. **`runGrillReasoningPhase(businessId, businessType)`** (`reasoning-actions.ts`) — **Prompt 1**: builds `reasoning-prompt.ts` using the `businesses` row plus optional **GitHub snapshot** (`github-repo-snapshot.ts`), streams once via **`mergeGrillMeReasoningAgentOptions`** (model from **`CURSOR_GRILL_REASONING_MODEL_ID`** and params), parses **JSON-only** output (`extract-json-from-model.ts`), coerces with `grill-reasoning-types.ts`, persists **`businesses.grill_reasoning_context`** (+ `grill_reasoning_last_error`, `grill_reasoning_updated_at`). On failure, persists **`minimalFallbackReasoningContext`**.
2. **`createBusiness` / `createBusinessWithDetails`** — inserts `businesses` + `user_businesses`; onboarding UI calls **`runGrillReasoningPhase`** during the preparing step before the Grill chat opens. If that step returns **`ok: false`**, the client calls **`deleteOnboardingDraftBusiness`** to remove the tenant when it has no Grill turns and no memory (safe rollback).
3. **`startGrillMeTurn(businessId, userMessage, businessType?)`** — runs Prompt 1 if **`grill_reasoning_context`** is still null; **`buildGrillChatTurnPrompt`** assembles **Prompt 2** (`grill-me-chat-system.md` + injected reasoning JSON + **`grill-me-soul-output-template.md`**) plus transcript and optional skill appendix (**`GRILL_ME_SKILL_PATHS`** / default skill file). **`mergeGrillMeCursorAgentOptions`** wires **`CURSOR_GRILL_ME_*`** (chat model + `local.settingSources`).
4. **`[[GRILL_ME_COMPLETE]]`** in the assistant reply → **`extractAndStoreSoulFile`** (fenced `markdown` body via `soul-markdown-from-response.ts`) → **`memory`** row with `scope = business`, no `agentId`.
5. **`saveBusinessSoulFromOnboarding`** / **`getBusinessSoulMemory`** — editor handoff & reads.
6. **`getGrillInterviewTranscript(businessId)`** — returns ordered **`grill_me_sessions`** for the authenticated user (hydrates onboarding Soul editor interview column).

SSE: **`app/api/grill-me/stream/route.ts`** (**GET**) streams Cursor progress for the UI; **`grill_me_sessions`** persists chat turns via server actions.

Completion marker:

```text
[[GRILL_ME_COMPLETE]]
```

Env names: **`CURSOR_GRILL_REASONING_*`**, **`CURSOR_GRILL_ME_*`**, **`GRILL_ME_SKILL_PATHS`**, **`GRILL_ME_E2E_MOCK`** — see **`.env.example`**.
