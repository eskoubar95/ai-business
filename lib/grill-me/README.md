# Grill-Me backend

Server actions in `actions.ts` orchestrate the onboarding loop:

1. `createBusiness(name)` / `createBusinessWithDetails({ name, description?, githubRepoUrl? })` — authenticated; inserts into `businesses` (+ optional profile fields) and `user_businesses`.
2. `startGrillMeTurn(businessId, userMessage, businessType?)` — loads the `businesses` row to **seed** the Cursor prompt with wizard facts (name, summary, repo). `businessType` is `'existing' | 'new'` (default `'existing'`).
3. When the assistant output contains `[[GRILL_ME_COMPLETE]]`, `extractAndStoreSoulFile` writes/updates the markdown **soul blob** in `memory` with `scope = 'business'` (no `agentId`).
4. `saveBusinessSoulFromOnboarding(businessId, markdown)` — overwrites business soul after the landing onboarding editor step (validated access).

5. `getBusinessSoulMemory(businessId)` (`memory-read.ts`) — authenticated server action; returns latest business-scoped markdown soul row or `null`.

Completion marker (must match product copy exactly):

```text
[[GRILL_ME_COMPLETE]]
```

Any text after removing the marker is stored as markdown in `memory`.

`app/api/grill-me/stream/route.ts` exposes **GET** SSE (`?businessId=`). It streams from the SDK for EventSource progress without writing new `grill_me_sessions` rows — main writes still go through the server actions above.
