# APM Planner kickoff (one-time chat)

1. Open a **new** Agent chat in Cursor (dedicated Planner session).
2. Run:

```text
/apm-1-initiate-planner @docs/ai-business-platform-spec.md
```

1. Complete **Context Gathering** and **Work Breakdown** with the Planner.
2. **Approve** the generated `Spec`, `Plan`, and `Rules` (including updates to `AGENTS.md`).
3. Ensure the **Worker dispatch via sub-agents** section is preserved:
  - It lives in `.cursor/rules/apm-worker-subagents.mdc` (always applied) and is mirrored in `AGENTS.md` after Planner finishes.
4. Close the Planner chat when planning is complete.

Then start your ongoing work chat:

```text
/apm-2-initiate-manager
```

See the root `README.md` for the full APM + hooks setup.