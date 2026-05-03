# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PropStealth is a tenant-review tool for real estate agents and their property-owner clients. Agents source prospective tenants for an owner's property, upload supporting docs, and let an AI score the candidate. The agent shares the candidate with the owner; the owner reviews docs + AI summary, asks questions in a per-tenant thread, and approves or rejects.

Two roles: **agent** (signs up directly, manages many owners) and **owner** (invited via magic link by an agent, can also self-sign-in after onboarding).

## Current State

**Monorepo** with two packages:
- `web/` — Next.js 16 frontend (Tailwind v4, TypeScript)
- `api/` — Express 5 backend (TypeScript, PostgreSQL, vitest)

Auth: Google OAuth via Passport, JWT in HTTP-only cookie. Magic-link invite tokens for first-time owners.

Email: nodemailer + SMTP (Mailpit in dev), outbox table + polling worker.

Storage: local filesystem under `api/uploads/`.

AI: `@anthropic-ai/sdk`, two calls per tenant (extract basics, then full evaluation).

## Architecture

```
prop-stealth/
├── package.json          # npm workspaces: ["web", "api"]
├── docker-compose.yml    # PostgreSQL 16 + Mailpit (dev SMTP)
├── scripts/              # Sandbox deploy/status/stop scripts
├── web/                  # Next.js 16 + Tailwind v4
│   ├── src/
│   │   ├── app/          # App Router: (marketing), (auth), (dashboard)
│   │   ├── components/   # Shared UI components
│   │   ├── lib/          # Domain types
│   │   └── middleware.ts # Auth route protection
│   └── next.config.ts    # Rewrites /api/* → Express
├── api/                  # Express 5 + TypeScript + vitest
│   ├── src/
│   │   ├── index.ts      # App entry (port 4000), email worker boot
│   │   ├── config.ts     # Env vars
│   │   ├── types.ts      # Domain types (User, Tenant, Property, ...)
│   │   ├── db/           # pg client, migration runner, SQL migrations
│   │   ├── routes/       # auth, properties, clients, tenants, ...
│   │   ├── agents/       # tenant-eval (Claude calls)
│   │   ├── email/        # nodemailer transport + outbox worker + templates
│   │   ├── storage/      # Local filesystem storage abstraction
│   │   └── middleware/   # requireAuth (JWT verification)
│   ├── uploads/          # Tenant document storage (gitignored)
│   ├── test/             # vitest tests
│   └── .env              # Secrets (gitignored)
└── docs/superpowers/     # Design specs, implementation plans, archive
```

## Development

### Prerequisites
- Node.js 22+
- Docker (for PostgreSQL)
- Google OAuth credentials (for auth)

### Setup
```bash
npm install                    # Install all workspace deps
docker compose up -d           # Start PostgreSQL
cp api/.env.example api/.env   # Create env file, add Google credentials
npm run migrate -w api         # Run database migrations
npm run dev                    # Start both web (3000) + api (4000)
```

### Key Commands
```bash
npm run dev                    # Start both servers (concurrently)
npm run dev -w web             # Start frontend only
npm run dev -w api             # Start backend only
npm run build -w web           # Build frontend
npm run migrate -w api         # Run database migrations
npm run lint                   # Lint frontend
```

### Testing Sandbox (exe.dev)
The app runs on a hosted sandbox at `wyvern-zebra.exe.xyz` for end-to-end testing.

```bash
./scripts/sandbox-deploy.sh [branch]  # Deploy latest to sandbox
./scripts/sandbox-status.sh           # Check if services are running
./scripts/sandbox-stop.sh             # Stop app servers
```

The sandbox runs: web on port 8000, API on port 4000, PostgreSQL locally. Accessible at `https://wyvern-zebra.exe.xyz`.

## Auth Flow

**Agents** sign in directly: `/login` → role toggle → "Continue with Google" → `GET /api/auth/google?role=agent` → Passport → Google callback → JWT cookie → `/agent`.

**Owners** are invited: agent submits an invite → API generates a 14-day single-use `invite_token` and queues an email (via the outbox worker) → owner clicks the link → `/invite/[token]` validates → "Continue with Google" carries the token in OAuth `state` → callback creates the `users` row, links `agent_clients`, marks the token consumed, sets the cookie, redirects to `/owner`. After the first acceptance, owners can also sign in directly via `/login`.

Next.js middleware verifies the JWT cookie on `/owner/*` and `/agent/*` and enforces role-based access.

## Two Roles

- **Agent** — invites owners, creates tenant records for an owner's property, uploads docs, runs the AI evaluation, shares with the owner, replies in the per-tenant thread.
- **Owner** — reviews shared tenants (docs + AI summary + scores), asks questions in the thread, approves or rejects (and can reopen).

## Design Docs

- `docs/superpowers/specs/2026-05-03-tenant-review-design.md` — current design spec (the one to read).
- `docs/superpowers/plans/2026-05-03-tenant-review-mvp.md` — implementation plan.
- `docs/superpowers/archive/` — superseded PRD and design docs.

## Key Compliance Constraints

- Fair Housing Act and FCRA compliance for tenant screening — never reference protected-class attributes; AI prompt has explicit guardrails.
- Every AI evaluation claim must cite a source document.
- AI output is advisory only; the human owner makes the final decision.
