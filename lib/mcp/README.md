# MCP credentials (server-only)

- **`encryption.ts`** — `encryptCredential` / `decryptCredential` (AES-256-GCM), `loadEncryptionKeyFromEnv`. IV is random 12 bytes stored **base64** on the row; ciphertext + GCM tag live in `encrypted_payload` as `{ ciphertext, tag }` (base64 strings).
- **`actions.ts`** — `saveMcpCredential(businessId, …)` returns `{ id }`; `grantMcpAccessToAgent` / `revokeMcpAccessFromAgent`; `getMcpCredentialsByBusiness`; `getMcpCredentialsForAgent` (no secrets); `deleteMcpCredential`. Session + `assertUserBusinessAccess` / `assertUserOwnsAgent` as appropriate. Decryption stays in **`encryption.ts`** (`decryptCredential`) — only from other **server-only** modules, not exported to client bundles as callable decrypt.
- **`config.ts`** — Static field metadata for `github` / `notion` / `context7` forms (no secrets).

**Env:** `ENCRYPTION_KEY` — 64 hex chars (32-byte key). See `.env.example`.
