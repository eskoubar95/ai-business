# LiteLLM proxy (Stream B)

Copy `config-template.yaml` and substitute environment variables at deploy time (`RUNPOD_ENDPOINT`, `RUNPOD_API_KEY`, `LITELLM_MASTER_KEY`). Headers listed under `router_settings.headers_to_pass` are produced by `metadata.ts` (`buildLiteLLMHeaders`).

## Cursor adapter gap

Agents using **`cursor_agent_cli`** rely on Cursor-managed model selection. Correlation and tenant metadata (`x-correlation-id`, etc.) are **best-effort** for that path until Cursor exposes a supported instrumentation hook for outbound completion calls. GPU-track adapters (`hermes_agent_cli`, `claude_code_cli`) should route exclusively through this LiteLLM → RunPod chokepoint so headers are applied consistently.
