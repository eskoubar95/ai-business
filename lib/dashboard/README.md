# Dashboard data helpers

Server-only query helpers for the redesigned home dashboard (`app/dashboard/page.tsx`).

| Module | Role |
|--------|------|
| [`home-data.ts`](home-data.ts) | Summary stats (tasks, approvals, “active” agents), merged activity feed, pending-approval cards for the queue, per-business task status breakdown |

All functions assume a valid session user where applicable (`requireSessionUserId` or `userId` passed from the page).
