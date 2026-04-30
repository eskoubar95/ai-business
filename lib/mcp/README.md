# MCP credentials (server-only)

- **`encryption.ts`** — `encryptCredential` / `decryptCredential` (AES-256-GCM), `loadEncryptionKeyFromEnv`. IV is random 12 bytes stored **base64** on the row; ciphertext + GCM tag live in `encrypted_payload` as `{ ciphertext, tag }` (base64 strings).
- **`actions.ts`** — `saveMcpCredential`, `getMcpCredentialsMeta` (no secrets), `deleteMcpCredential` — still uses session + business membership like other roster actions. Decryption stays in **`encryption.ts`** (`decryptCredential`) and is only called from other **server-only** modules (never from this `"use server"` barrel as an exported callable, so secrets are not surfaced to Client Components via Server Actions).
- **`config.ts`** — Static field metadata for `github` / `notion` / `context7` forms (no secrets).

**Env:** `ENCRYPTION_KEY` — 64 hex chars (32-byte key). See `.env.example`.
