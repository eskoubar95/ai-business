# Agent rules (APM)

This file may be extended by the APM **Planner** during Work Breakdown.  
**Do not remove** the section below — it defines how Workers are run in Cursor.

## Worker dispatch via sub-agents

When dispatching a Task to a Worker, do **not** wait for the user to open a separate chat.

Use the **Task** tool (`subagent_type`: `generalPurpose` unless a narrower type fits) with the full Task Prompt. The Worker sub-agent must:

1. Read `.apm/bus/<worker-id>/task.md` for full instructions.
2. Execute the task.
3. Write the Task Log under `.apm/memory/` at the path specified in the Task Prompt.
4. Write a brief Task Report to `.apm/bus/<worker-id>/report.md`.
5. Return a one-paragraph summary to the parent Manager.

The Manager continues from the summary + report file.

(A mirrored copy lives in `.cursor/rules/apm-worker-subagents.mdc` so this behavior survives Planner edits — Planner should keep this section aligned.)