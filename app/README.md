# App directory

Route-driven UI for the AI Business Platform Next.js app.

## Route map


| Path                               | Purpose                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `/`                                | Marketing-style landing (public).                                                                                 |
| `/auth/[path]`                     | Neon Auth UI (`AuthView`) — `sign-in`, `sign-up`, `forgot-password`, etc.                                         |
| `/account/[path]`                  | Neon Auth account UI (`AccountView`) — `settings`, `security`.                                                    |
| `/dashboard`                       | Lists businesses the user belongs to; links to Grill-Me per business.                                             |
| `/dashboard/agents`                | Agent roster for a `businessId` query param (defaults to the user’s first business); cards show static **idle** badge, skill/MCP counts; links to edit and **New agent**. |
| `/dashboard/agents/new`            | Create agent (name, role, markdown instructions, optional reports-to).                                             |
| `/dashboard/agents/[agentId]/edit` | Edit agent; skill manager, MCP installer (encrypted server-side save only).                                       |
| `/dashboard/teams`                   | Teams for selected `businessId`; member counts and lead name.                                                      |
| `/dashboard/teams/new`             | Create team with lead plus **two** additional members (requires ≥3 agents).                                        |
| `/dashboard/teams/[teamId]`        | Team detail: org chart from `reportsToAgentId`, member list, lead highlighted.                                      |
| `/dashboard/onboarding`            | Create business (`createBusiness`) → redirect to Grill-Me chat.                                                   |
| `/dashboard/grill-me/[businessId]` | Grill-Me chat — **Vercel AI SDK UI** (`useChat`) + streaming `POST /api/grill-me/ui` wrapping `startGrillMeTurn`. |
| `/api/grill-me/ui`                 | UI message stream for Grill-Me (AI SDK data stream protocol).                                                     |
| `/api/grill-me/stream`             | Optional SSE transcript stream (separate from chat UI).                                                           |
| `/api/auth/[...path]`              | Neon Auth API proxy (`auth.handler()`).                                                                           |


## Server vs client conventions

- Files that call `getDb()`, read secrets, or export Route Handlers / Server Actions stay **server-only** (no `"use client"`).
- Interactive UI and Neon Auth client hooks use `**"use client"`** as the first line (e.g. `lib/auth/client.ts`, `app/components/nav-shell-auth.tsx`).
- Server Components that call `auth.getSession()` must export `export const dynamic = "force-dynamic"` (see `app/dashboard/page.tsx`).
- Grill-Me UI imports `**createBusiness**` / `**startGrillMeTurn**` / `**getBusinessSoulMemory**` only from `"use server"` modules in Client Components — never import `getDb()` into client files.

## Visual design (Geist)

Root layout applies **[Geist](https://vercel.com/font)** Sans/Mono via the `geist` package (`GeistSans` / `GeistMono` on `<html>`). Inline code in markdown uses `--font-geist-mono` from `app/globals.css`.

## AI SDK UI

Grill-Me uses `[useChat](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot)` from `@ai-sdk/react` with `[DefaultChatTransport](https://ai-sdk.dev/docs/ai-sdk-ui/transport)` and `prepareSendMessagesRequest` so each request sends `{ businessId, message }` to `/api/grill-me/ui`. Playwright’s dev server sets `GRILL_ME_E2E_MOCK=1` for deterministic assistant text without the Cursor CLI.

## Auth flow

1. `middleware.ts` protects `/dashboard` and `/account` and redirects anonymous users to `/auth/sign-in`.
2. `NeonAuthUIProvider` and `authClient` wrap the tree in `app/layout.tsx`.
3. Global styles combine Tailwind v4, shadcn theme tokens (`shadcn/tailwind.css`), and Neon Auth Tailwind (`@neondatabase/auth/ui/tailwind`) in `app/globals.css`.

## Scripts

- End-to-end: `npm run test:e2e` (starts dev server via Playwright when none is running).
- Playwright starts the dev server with `**GRILL_ME_E2E_MOCK=1`** by default so Grill-Me turns use deterministic assistant output without the Cursor CLI (override with `GRILL_ME_E2E_MOCK=0` if needed).
- **`tests/grill-me.spec.ts`** runs only when **`E2E_EMAIL`** and **`E2E_PASSWORD`** are set (see `.env.example`); requires a working **`DATABASE_URL`** for `createBusiness` / sessions.
- **`tests/agents.spec.ts`** uses the same auth + DB: onboarding → agents/skills/MCP/teams flow with `data-testid` selectors.
- **GitHub Actions:** add repository secrets `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `E2E_EMAIL`, `E2E_PASSWORD` so CI runs the full Grill-Me flow (see repo root `README.md`).

Environment variables for Neon Auth are documented in the repository `.env.example`.