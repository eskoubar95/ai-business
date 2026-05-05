# Template scripts (`scripts/templates`)

| Script | npm command | Description |
|--------|-------------|-------------|
| [`build.ts`](./build.ts) | `npm run templates:build` | Validates shards, refreshes `manifest.json` SHA-256 fields, writes `dist/*.bundle.json` |
| [`seed-org.ts`](./seed-org.ts) | `npm run templates:seed-org` | Loads bundle, verifies hashes + schema, seeds DB via `seedEnterpriseTemplate()` |

Both assume the repo root as cwd. `seed-org.ts` loads `.env` then `.env.local` for `DATABASE_URL` (same precedence as Drizzle).

## Typecheck vs production build

- **`npm run typecheck`** uses [`tsconfig.typecheck.json`](../../tsconfig.typecheck.json) (excludes `.next/`) for a fast CLI check without generating Next.js typed routes.
- **Deploy / full parity** still requires **`npm run build`**, which runs Next’s own type checking against generated `.next/types`.
