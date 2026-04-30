# Backend Agent — Worker handoff (Task **2.1**)

**Outgoing:** Backend Agent after **Task 2.1**  
**Audience:** Manager (next `apm-2-initiate-manager` / Frontend dispatch)  
**Date:** 2026-04-30

---

## VC truth

- **`main`** at **`ea84f6c`** — `feat(heartbeat): Cursor SDK runHeartbeat and encrypted user Cursor API key (Task 2.1) (#4)`.
- PR **#4** merged; fjern-branch **`phase2/stage2-backend`** slettet på origin (som forventet efter squash/merge workflow).

---

## Completed (past tense)

- **`@cursor/sdk`** integreret; **`runHeartbeat(agentId)`** i `lib/heartbeat/actions.ts` (local `cwd` fra `businesses.local_path`; model **`composer-2`**).
- Prompt: **`buildHeartbeatPrompt`** i `lib/heartbeat/prompt-builder.ts` (+ **`formatHeartbeatPrompt`** til Vitest).
- **User settings:** **`saveUserSettings`** / **`saveBusinessSettings`** i `lib/settings/actions.ts`; decryptet nøgle i **`lib/settings/cursor-api-key.ts`** (**ikke** Server Actions-modul → ikke client-RPC for rå API key).
- **Orkestrering:** insert **`orchestration_events`** med `type: heartbeat_run`, payload tokens/model/duration (succeeded/failed).
- **Tests:** `lib/heartbeat/__tests__/*`, `lib/settings/__tests__/actions-settings.test.ts`.
- **Dok:** `lib/heartbeat/README.md`, `.env.example`-note om Cursor key via **`user_settings`**, ikke global env.

**Task Log:** `.apm/memory/stage-02/task-02-01.log.md`  
**Report (kort):** `.apm/bus/backend-agent/report.md`

---

## Frontend Task **2.2** — dependencies unlocked

Kaldbare Server Actions fra **`"use server"`**-filer (kun de der **skal** kaldes fra UI):

| Behov UI | Moduleksport |
|---------|----------------|
| Kør heartbeat | `runHeartbeat` fra `@/lib/heartbeat/actions` |
| Gem Cursor API key | `saveUserSettings` fra `@/lib/settings/actions` |
| Gem business-path / repo / beskrivelse | `saveBusinessSettings` fra `@/lib/settings/actions` |

**Ikke** eksponér **`getUserCursorApiKeyDecrypted`** til klient — brug kun server-side eller tilføj separat **`configured: boolean`**-metadata action i frontend-task hvis nødvendigt.

**Ikke på plads fra 2.1 (stadig Task 2.2 backend-del ifølge plan):** `getAgentDocuments` / `updateAgentDocument` i `lib/agents/document-actions.ts` — opret eller udvid backend hvis Frontend Worker kræver det før UI kan gemme Soul/Tools/Heartbeat faner.

**Forudsætninger i UI før `runHeartbeat`:** bruger har gemt API key i Settings; business har **ikke-tom** `local_path`.

---

## Manager follow-ups

1. Dispatch **Frontend Agent** til **Task 2.2** på gren **`phase2/stage2-frontend`** fra **`main`**.
2. Bekræft **`.apm/tracker.md`**: Task 2.1 = merged; Stage 2 forbliver **1/2** indtil 2.2 leveres.
3. Ryd evt. **stashes** lokalt hvis team er færdig med phase2 WIP (valgfrit).

---

## Idle state

Backend Agent **idle** indtil næste Task Bus-dispatch (fx **3.1** eller midlertidig 2.2-supplement).
