---
title: AI Business Platform
---

# APM Memory Index

## Memory Notes

- **npm / Neon Auth:** `@neondatabase/auth` (beta) may list `next@>=16` as optional peer while the app targets Next 15; installs can require `.npmrc` with `legacy-peer-deps=true` until upstream or Next alignment changes.
- **Production builds:** `next build` can require `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` to be set during route analysis for Neon Auth routes—document in CI as the Worker noted.

## Stage Summaries

