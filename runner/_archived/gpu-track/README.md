# Archived: GPU Track (RunPod + LiteLLM)

**Status:** Archived — do not modify  
**Archived:** 2026-05-06  
**Reason:** RunPod GPU pods require a persistent running process and cannot be cost-effectively started/stopped on demand. The MVP runs Cursor CLI agents directly on the Hetzner server instead.

## What is here

- `runpod/` — RunPod state machine (wake/sleep/drain), RunPod API client
- `litellm/` — LiteLLM proxy config template, request metadata helpers

## When to revisit

This code becomes relevant again if/when:
- A truly serverless GPU inference provider is available (e.g. Modal.com, Vast.ai, or a future RunPod serverless tier that supports true cold starts)
- Self-hosted vLLM on a dedicated Hetzner GPU server becomes cost-effective
- Token volume justifies a dedicated inference layer separate from Cursor CLI

## Do not

- Import from this directory in application code
- Run migrations that depend on this module
- Modify files here without creating a new feature branch and updating this README

The code is fully preserved in git history regardless.
