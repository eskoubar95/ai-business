# RunPod bridge (`runner/runpod`)

These files only **re-export** the archived GPU / RunPod integration from
[`../_archived/gpu-track/runpod/`](../_archived/gpu-track/runpod/) so TypeScript
can resolve imports from `runner/orchestrator` and `runner/queue` without
duplicating logic.

When RunPod support is promoted out of archive, replace these shims with the
real implementation or delete them and import from a single module.
