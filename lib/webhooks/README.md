# Webhooks

Server-side helpers for verifying incoming webhooks and recording idempotent deliveries in `webhook_deliveries`.

## Files

- **`hmac.ts`** — `signPayload` / `verifySignature` using HMAC-SHA256 and `crypto.timingSafeEqual` (compare hex digests).
- **`engine.ts`** — `deliverWebhook(type, businessId, payload, idempotencyKey, options?)` records a delivery row, runs optional `process`, and marks `delivered` or `failed`. Duplicate keys with status `delivered` or `pending` are skipped. For tests, pass a custom `adapter` implementing `WebhookDeliveryAdapter`.

## Configuration

- `WEBHOOK_SECRET` — used by `signPayload` / `verifySignature` when no explicit secret argument is passed.

## Usage

Call `verifySignature(rawBody, signatureHeader, process.env.WEBHOOK_SECRET)` on incoming HTTP webhooks, then `deliverWebhook(...)` with a stable `idempotencyKey` (e.g. provider delivery id).
