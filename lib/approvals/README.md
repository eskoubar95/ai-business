# Approvals

Server Actions for human-in-the-loop gates tied to orchestration events.

## Files

- **`actions.ts`** (`"use server"`) — `createApproval`, `approveArtifact(approvalId, comment)`, `rejectArtifact(approvalId, comment)`. Each transition writes to `approvals` and logs orchestration rows (`approval.created`, `approval.approved`, `approval.rejected`). When `agentId` is set, `createApproval` sets agent lifecycle to `awaiting_approval`; approve/reject set lifecycle to `idle`.

## Authorization

Actions use `requireSessionUserId` and `assertUserBusinessAccess` for the row’s `businessId`.
