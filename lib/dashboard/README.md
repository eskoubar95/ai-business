# Dashboard helpers

Shared server utilities for dashboard routes that need **business scope** (tenant selection).

## Files

- **`business-scope.ts`** — `loadUserBusinesses()` loads businesses for the signed-in user (redirects to sign-in if anonymous). `resolveBusinessIdParam()` validates `businessId` from the query string against that list; if missing or invalid, redirects to the same path with the first business id (`?businessId=…`). If the user has no businesses, redirects to `/dashboard/onboarding`.

## Usage

Agent roster, teams, approvals, Notion, and webhooks pages call `resolveBusinessIdParam(searchParams.businessId, "<scoped-path>")` so URLs carry an authorized `businessId`. Omitting `businessId` is supported: the server picks the user’s first business.
