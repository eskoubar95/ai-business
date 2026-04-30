# Grill-Me UI components

Client components for the Grill-Me onboarding chat, aligned with **Vercel AI SDK UI** (`useChat`, `DefaultChatTransport`) and **Geist**-style spacing/typography via shared design tokens.

| File | Role |
|------|------|
| `chat.tsx` | `useChat` targeting `POST /api/grill-me/ui`; hydrates from server-loaded turns; refreshes soul preview via `getBusinessSoulMemory` when completion marker appears. |
| `message-list.tsx` | Renders `UIMessage[]` (role + text parts). |
| `input-form.tsx` | Composer; disabled while `useChat` status is not `ready`. |
| `soul-file-preview.tsx` | Read-only markdown (`react-markdown`). |

Server streaming bridge: `app/api/grill-me/ui/route.ts` (`createUIMessageStream` → chunks of `assistantReply` from `startGrillMeTurn`). Conversion helpers: `lib/grill-me/ui-messages.ts`.
