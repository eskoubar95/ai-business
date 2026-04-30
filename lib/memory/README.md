# Memory retrieval

| Export | Role |
|--------|------|
| `retrieveMemory` | Latest markdown blocks for a business; optional `agentId` scopes to business-wide + that agent’s rows. Default `limit` 5, `updated_at` descending. |
| `assembleAgentContext` | Builds a prompt prefix: agent header, instructions, attached skills, then `retrieveMemory`. `taskType` is reserved (MVP ignores). |

Trusted **server** callers only (`getDb`). Do not expose raw memory outside authenticated route boundaries.
