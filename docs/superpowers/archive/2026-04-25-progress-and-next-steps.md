# PropStealth — Progress & Next Steps

**Updated:** 2026-04-25
**Branches:** `main` (merged through PR #1), `feat/backend-auth` (PR #2 open), `feat/exe-dev-testing` (active)

---

## Completed

### Phase 0: PRD & Design (merged to main)
- PRD v0.2 — focused on real estate agents + small landlords (1-5 properties), 2-agent MVP (Inbox Agent + Tenant Evaluation)
- UI Design Spec — all screens for both Owner (Dana) and Agent (Priya) roles, approved with interactive mockups

### Phase 1: Static UI (merged to main via PR #1)
- Next.js 16 + Tailwind v4 + TypeScript project
- 15 static pages with hardcoded mock data, no backend
- Pages: Homepage, Login/Signup, Owner (Activity Feed, Inbox Agent, Tenant Eval list + results, Properties list + detail, Documents, Settings), Agent (Portfolio Overview, Client Detail, Tenant Pipeline, Help Requests, Invite Client)

### Phase 2: Backend & Auth (PR #2, branch `feat/backend-auth`)
- Monorepo restructure: `web/` (Next.js) + `api/` (Express + TypeScript)
- Docker Compose with PostgreSQL 16
- Database schema: `users` and `sessions` tables with migration runner
- Google OAuth via Passport.js with JWT sessions in HTTP-only cookies
- Next.js middleware for route protection (redirects unauthenticated users)
- Next.js rewrites to proxy `/api/*` to Express on port 4000
- Login page wired to real Google OAuth flow (email/password disabled for MVP)
- API routes: `GET /api/auth/google`, `GET /api/auth/google/callback`, `POST /api/auth/logout`, `GET /api/auth/me`, `GET /api/health`

### Testing Sandbox (branch `feat/exe-dev-testing`)
- exe.dev sandbox provisioned at `wyvern-zebra.exe.xyz`
- Node.js 22, PostgreSQL 16 installed on sandbox
- Database created and migrations run
- Google OAuth credentials configured (callback: `https://wyvern-zebra.exe.xyz/api/auth/google/callback`)
- Full sign-in flow verified and working
- Deploy/status/stop scripts in `scripts/`
- Web runs on port 8000, API on port 4000
- Accessible at `https://wyvern-zebra.exe.xyz`

## Next Steps

### Immediate
1. **Merge PR #2** — backend auth branch to main
2. **Merge exe.dev testing branch** — sandbox scripts to main

### Short-term (MVP functionality)
3. **User profile in dashboard** — show logged-in user's name/avatar in sidebar, replace hardcoded "Dana" / "Priya" with real user data from `/api/auth/me`
4. **Property CRUD API** — REST endpoints for creating, reading, updating, deleting properties. Wire owner Properties/Documents pages to real data instead of mock data.
5. **Tenant Evaluation API** — file upload endpoint, store evaluations in PostgreSQL, wire Tenant Eval pages to real data
6. **Agent-client relationship** — invite flow, client association, agent can see client properties

### Medium-term (AI Agents)
7. **Agent framework** — common agent interface, tool registry, structured traces
8. **Inbox Agent** — Gmail API OAuth integration, email classification, key points extraction, auto-respond drafts
9. **Tenant Evaluation Agent** — document analysis (OCR/parsing), credit check partner integration, risk scoring with AI narrative

### Later
10. **Email/password auth** — registration, login, password reset, email verification
11. **Deployment** — Vercel (web) + cloud hosting (api), production PostgreSQL
12. **Phase 2 agents** — Maintenance Coordinator, Portfolio Analyst, Bills & Utilities
