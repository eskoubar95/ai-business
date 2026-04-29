# App directory

Route-driven UI for the AI Business Platform Next.js app.

## Route map

| Path | Purpose |
|------|---------|
| `/` | Marketing-style landing (public). |
| `/auth/[path]` | Neon Auth UI (`AuthView`) — `sign-in`, `sign-up`, `forgot-password`, etc. |
| `/account/[path]` | Neon Auth account UI (`AccountView`) — `settings`, `security`. |
| `/dashboard` | Protected placeholder; middleware sends anonymous users to `/auth/sign-in`. |
| `/api/auth/[...path]` | Neon Auth API proxy (`auth.handler()`). |

## Server vs client conventions

- Files that call `getDb()`, read secrets, or export Route Handlers / Server Actions stay **server-only** (no `"use client"`).
- Interactive UI and Neon Auth client hooks use **`"use client"`** as the first line (e.g. `lib/auth/client.ts`, `app/components/nav-shell-auth.tsx`).
- Server Components that call `auth.getSession()` must export `export const dynamic = "force-dynamic"` (see `app/dashboard/page.tsx`).

## Auth flow

1. `middleware.ts` protects `/dashboard` and `/account` and redirects to `/auth/sign-in` when needed.
2. `NeonAuthUIProvider` and `authClient` wrap the tree in `app/layout.tsx`.
3. Global styles combine Tailwind v4, shadcn theme tokens (`shadcn/tailwind.css`), and Neon Auth Tailwind (`@neondatabase/auth/ui/tailwind`) in `app/globals.css`.

## Scripts

- End-to-end smoke: `npm run test:e2e` (starts dev server via Playwright when none is running).

Environment variables for Neon Auth are documented in the repository `.env.example`.
