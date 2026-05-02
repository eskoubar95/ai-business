# Projects UI

- **`project-card.tsx`** — list card with status chip, PRD text preview, sprint/task counts.
- **`project-form.tsx`** — client form for creating a project (name, status, Novel PRD editor).
- **`project-detail-tabs.tsx`** — tabbed project workspace: PRD, sprints, linked tasks, approvals filtered by `artifactRef.kind === "project"`.
- **`sprint-card.tsx`** / **`sprint-form.tsx`** — sprint CRUD shortcuts calling `lib/sprints/actions`.

Server actions live in `lib/projects/actions.ts` and `lib/sprints/actions.ts`.
