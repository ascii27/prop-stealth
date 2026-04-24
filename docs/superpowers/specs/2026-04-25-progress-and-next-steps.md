# PropStealth — Progress & Next Steps

**Date:** 2026-04-25
**Branch:** `main` (merged), `feat/backend-auth` (PR #2 open)

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

## Next Steps

### Immediate (before auth is fully usable)
1. **Set up Google Cloud Console OAuth credentials** — create OAuth 2.0 client ID, configure authorized redirect URI (`http://localhost:3000/api/auth/google/callback`), add credentials to `api/.env`
2. **Merge PR #2** — backend auth branch
3. **End-to-end auth testing** — verify full sign-up/sign-in flow with real Google account

### Short-term (MVP functionality)
4. **Property CRUD API** — REST endpoints for creating, reading, updating, deleting properties. Wire owner Properties/Documents pages to real data instead of mock data.
5. **User profile in dashboard** — show logged-in user's name/avatar in sidebar, replace hardcoded "Dana" / "Priya" with real user data
6. **Tenant Evaluation API** — file upload endpoint, store evaluations in PostgreSQL, wire Tenant Eval pages to real data
7. **Agent-client relationship** — invite flow, client association, agent can see client properties

### Medium-term (AI Agents)
8. **Agent framework** — common agent interface, tool registry, structured traces
9. **Inbox Agent** — Gmail API OAuth integration, email classification, key points extraction, auto-respond drafts
10. **Tenant Evaluation Agent** — document analysis (OCR/parsing), credit check partner integration, risk scoring with AI narrative

### Later
11. **Email/password auth** — registration, login, password reset, email verification
12. **Deployment** — Vercel (web) + cloud hosting (api), production PostgreSQL
13. **Phase 2 agents** — Maintenance Coordinator, Portfolio Analyst, Bills & Utilities
