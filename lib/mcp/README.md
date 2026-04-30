# MCP credentials (server-only)

- **`encryption.ts`** — `encryptCredential` / `decryptCredential` (AES-256-GCM), `loadEncryptionKeyFromEnv`. IV is random 12 bytes stored **base64** on the row; ciphertext + GCM tag live in `encrypted_payload` as `{ ciphertext, tag }` (base64 strings).
- **`actions.ts`** — `saveMcpCredential`, `getMcpCredentialsMeta` (no secrets), `deleteMcpCredential`, `getMcpCredentialDecrypted` (server orchestration; still uses session + `user_businesses` like other roster actions).
- **`config.ts`** — Static field metadata for `github` / `notion` / `context7` forms (no secrets).

**Env:** `ENCRYPTION_KEY` — 64 hex chars (32-byte key). See `.env.example`.
