# AI Business Platform — Product brief (Planner input)

**Status:** Pre-MVP · **Kickoff target:** May 2026

## Vision

A platform where you define a business once (via a Grill-Me session), configure a roster of autonomous agents, and evaluate output — instead of manual prompting all day.

The platform is model-agnostic and use case-agnostic, scaling from a single user to SaaS.

**First use case:** MercFlow AI coding factory — Product Owner + engineering team coding autonomously.

## Architectural principle: Cockpit vs. engine

- **Cockpit:** this platform (onboarding, roster, teams, webhooks, approvals, memory, Notion).
- **Engine:** Cursor CLI / `@cursor/sdk` for agent execution.

The platform orchestrates *when, what, and who* via webhooks; humans approve via a dashboard. The MVP runs **Cursor CLI locally**; cloud workers are post-MVP.

## What the platform builds (MVP direction)

- Grill-Me onboarding → structured business memory (markdown).
- Agent roster (not hardcoded): name, role, instructions, heartbeat sequence, MCP tools, execution env.
- Team management with lead agent.
- Webhook orchestration toward local runners.
- Approval / human review dashboard.
- Persistent memory (e.g. PARA-style markdown in DB).
- Notion as source of truth (backlog, PRDs, sprint status) via API.

## Tech direction (non-binding for this repo)

- Frontend/backend: Next.js (TypeScript), API routes.
- Database: PostgreSQL (e.g. Neon).
- Notion: official API from server.
- Agents: Cursor CLI (MVP).

## Current repository state

This repo is initialized for **APM + Cursor** development workflow. Application code may be added after planning completes.

## Open decisions for Planner

- Initial worker split (e.g. backend vs. frontend vs. infra) for first implementation phase.
- Branching and merge conventions.
- Definition of “done” for Stage 1 (scaffold vs. first vertical slice).