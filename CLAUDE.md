# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PropStealth is an AI-native property management platform for real estate agents and small-portfolio landlords (1–5 properties). It uses a fleet of modular AI agents to automate operational work: inbox triage, tenant screening, maintenance coordination, portfolio analysis, and bill management.

The core value prop: a real estate agent can offer ongoing management and wealth-building services to investor clients — turning one-time commissions into recurring relationships — without hiring staff.

The product is a **system of action** (not just a system of record) — agents read, classify, and act on incoming information, surfacing only decisions requiring human input.

## Current State

**Monorepo** with two packages:
- `web/` — Next.js 16 frontend (Tailwind v4, TypeScript)
- `api/` — Express 5 backend (TypeScript, PostgreSQL)

### What's built
- **15 static UI pages** — Homepage, Login, Owner dashboard (Activity Feed, Inbox Agent, Tenant Eval, Properties, Documents, Settings), Agent dashboard (Portfolio Overview, Client Detail, Tenant Pipeline, Help Requests, Invite Client)
- **Google OAuth authentication** — Passport.js, JWT sessions in HTTP-only cookies, role-based routing (owner/agent)
- **PostgreSQL database** — users + sessions tables, migration runner
- **Next.js middleware** — protects `/owner/*` and `/agent/*` routes, redirects unauthenticated users
- **API proxy** — Next.js rewrites `/api/*` to Express on port 4000

### What's not built yet
- Email/password auth (fields disabled in UI)
- Property CRUD API (pages use hardcoded mock data)
- AI agents (Inbox, Tenant Eval)
- Real user data in dashboard (currently static mock data)

## Architecture

```
prop-stealth/
├── package.json          # npm workspaces: ["web", "api"]
├── docker-compose.yml    # PostgreSQL 16
├── scripts/              # Sandbox deploy/status/stop scripts
├── web/                  # Next.js 16 + Tailwind v4
│   ├── src/
│   │   ├── app/          # App Router: (marketing), (auth), (dashboard)
│   │   ├── components/   # Shared UI components
│   │   ├── lib/          # Types + mock data
│   │   └── middleware.ts  # Auth route protection
│   └── next.config.ts    # Rewrites /api/* → Express
├── api/                  # Express 5 + TypeScript
│   ├── src/
│   │   ├── index.ts      # App entry (port 4000)
│   │   ├── config.ts     # Env vars
│   │   ├── types.ts      # User, Session, JwtPayload
│   │   ├── db/           # pg client, migration runner, SQL migrations
│   │   ├── routes/       # auth.ts (Google OAuth, logout, /me)
│   │   └── middleware/   # requireAuth (JWT verification)
│   └── .env              # Secrets (gitignored)
├── spec/                 # PRD
└── docs/superpowers/     # Design specs + implementation plans
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

1. User selects role (owner/agent) on login page, clicks "Continue with Google"
2. `GET /api/auth/google?role=owner` → Passport redirects to Google
3. Google callback → Express creates/finds user, issues JWT cookie
4. Redirect to `/owner` or `/agent` based on role
5. Next.js middleware verifies JWT cookie on all dashboard routes

## Two Roles

- **Owner (Dana)** — manages their own properties, uses AI agents (Inbox + Tenant Eval)
- **Agent (Priya)** — manages a portfolio of clients, sources tenants, responds to help requests

## Design Docs

- `docs/superpowers/specs/2026-04-19-ui-design.md` — UI design spec for all screens
- `docs/superpowers/specs/2026-04-19-backend-auth-design.md` — Backend + auth architecture
- `docs/superpowers/specs/2026-04-25-progress-and-next-steps.md` — Progress tracker

## Key Compliance Constraints

- Fair Housing Act and FCRA compliance required for tenant screening — never reference protected class attributes
- Human approval gates mandatory for payments above configurable thresholds
- Row-level security for per-workspace data isolation
