# Cursor SDK wrapper

`lib/cursor/agent.ts` exposes `runCursorAgent(prompt)` which shells out to the local Cursor CLI runtime:

- `Agent.create({ model: { id: "composer-2" }, local: { cwd: process.cwd() } })`
- Streams assistant `text` deltas from `Run.stream()` and yields them as async-iterable strings.

For unit tests, use `setRunCursorAgentImpl` / `resetRunCursorAgentImpl`, or `mockCursorAgent` stub from the same module — avoid talking to the real Cursor binary in CI.

See official SDK types under `node_modules/@cursor/sdk/dist/esm/stubs.d.ts` if the API evolves.
