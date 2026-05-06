# RunPod bridge (`runner/runpod`)

These files only **re-export** the archived GPU / RunPod integration from
[`../_archived/gpu-track/runpod/`](../_archived/gpu-track/runpod/) so TypeScript
can resolve imports from `runner/orchestrator` and `runner/queue` without
duplicating logic.

## Files

| File | Re-exports |
|------|------------|
| `client.ts` | `RunpodClient`, `createRunpodClientFromEnv()` from `_archived/gpu-track/runpod/client` |
| `state-machine.ts` | DB-backed helpers from `_archived/gpu-track/runpod/state-machine` (e.g. `onJobEnqueued`, `maybeShutdownTick`, `recordRunpodActivity`, `evaluateShutdownTick`) |

## Usage

```ts
import { createRunpodClientFromEnv, type RunpodClient } from "@/runner/runpod/client";
import { onJobEnqueued, maybeShutdownTick } from "@/runner/runpod/state-machine";
```

When RunPod support is promoted out of archive, replace these shims with the
real implementation or delete them and import from a single module.
