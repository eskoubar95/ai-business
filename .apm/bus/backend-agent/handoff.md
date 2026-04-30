# Backend Agent — Worker handoff (Task **3.1**)

**Audience:** Manager + **Frontend Agent** (Task **3.2**)  
**Branch:** `phase2/stage3-backend`  
**Date:** 2026-04-30

---

## Summary

Tasks-domænet er på plads på backend: CRUD og træ-visning pr. virksomhed, task logs med human-forfatter og mention-parsing til orchestration-events, samt struktureret subtræ-/sletteadfærd. Se **`lib/tasks/README.md`** og **`log_path`** nedenfor.

**Task Log:** `.apm/memory/stage-03/task-03-01.log.md`

---

## Exports til Task 3.2 (Server Actions — `"use server"`)

| Behov | Modul |
|--------|-----|
| Opret/opdater/flyt status/slet/oplist | `@/lib/tasks/actions` (`createTask`, `updateTask`, `updateTaskStatus`, `deleteTask`, `getTasksByBusiness`, `getTasksByAgent`) |
| Tilføj hent logs | `@/lib/tasks/log-actions` (`appendTaskLog`, `getTaskLogs`) |
| Mention-fortolkning ved humansk log-indhold | allerede koblet på `appendTaskLog` hvor relevant — se **`lib/tasks/mention-trigger.ts`** |

Frontend må **kun** importere eksisterende `"use server"`-filer; udvid ikke ad hoc med rå DB i Client Components.

---

## Manager-follow-ups

1. Åbn/opdater PR fra **`phase2/stage3-backend`** → **`main`**; kør/passér **E2E** som projekt-standard.
2. Efter merge: dispatch **Frontend** til Task **3.2** på **`phase2/stage3-frontend`**.
