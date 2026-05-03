# Tenant Review MVP — Progress

**Last updated:** 2026-05-03
**Branch:** `feat/tenant-review-mvp` (push'd to origin, deployed to sandbox)
**Spec:** `docs/superpowers/specs/2026-05-03-tenant-review-design.md`
**Plan:** `docs/superpowers/plans/2026-05-03-tenant-review-mvp.md`

---

## Status

| Phase | Status | Tasks | Commits |
|---|---|---|---|
| A — Foundation | ✅ done | A1–A11 + cleanup | 16 |
| B — Invite flow (server) | ✅ done | B1–B4 + email-normalization fix | 5 |
| C — Invite landing page (web) | ✅ done | C1 | 1 |
| D — Properties refactor | ✅ done | D1, D2 | 2 |
| E — Storage + tenant CRUD | ✅ done | E1, E2 | 2 |
| F — Document upload | ✅ done | F1 | 1 |
| G — AI pipeline | ✅ done | G1–G6 | 6 |
| H — Threads + decisions | ⏳ next | H1 | — |
| I — Email outbox + worker + templates | pending | I1–I4 | — |
| J — Web dashboards/pages | pending | J1–J10 | — |
| K — Polish + smoke test | pending | K1–K3 | — |

39 commits on the branch since `main` diverged at `91eea58`. HEAD: `aa94845`.

## What works right now

- Schema is in v1 final shape (10 application tables: users, sessions, agent_clients, invitations + invite tokens, properties + new fields, tenants, tenant_documents, tenant_evaluations, tenant_thread_events, email_outbox).
- API type-checks clean. 15 vitest tests pass (invite-token + storage + eval-parsing).
- Web build clean (only pre-existing lint issues remain).
- Mailpit running locally on `:1025` SMTP and `:8025` web UI.
- Google OAuth sign-in works for both roles.
- Magic-link invite end-to-end: agent creates invite → API issues token → `/invite/[token]` page validates → "Continue with Google" carries token → callback validates email match, creates owner, links agent_clients, marks invitation accepted.
- Invite errors surface to the user via login page (`?error=invite_invalid|invite_expired|invite_email_mismatch`).
- Properties API is role-aware: owners list/edit their own; agents list across linked owners and create on behalf of a linked owner. Owner-only delete. Owner properties pages read/write through the API with the v1 fields (zip, property_type, monthly_rent_target, notes).
- Agent clients management (ahead-of-schedule slice of J1+J5): `/agent/clients` list page (accepted + pending) with cancel-invite, `/agent/clients/[id]` detail page with read-only properties and Remove client. Sidebar Clients header is now a link. Backed by new `DELETE /api/clients/:id` and `DELETE /api/clients/invitations/:id`. URL rename to `/agent/owners/*` is still deferred to J1; agent property add/edit still in J5.
- Local filesystem storage abstraction (`api/src/storage/local.ts`) with put/get/delete/resolveAbsolute, vetted by 3 vitest cases (round-trip, path-escape rejection, delete). Backs the F-phase upload pipeline.
- Tenants CRUD route (`/api/tenants`): list (owner sees own shared/decided; agent sees across linked owners with filters), get-by-id, create-draft (agent only, must be linked to property's owner), patch (agent only). Owner JOIN exposes property_address/city/state on list rows.
- Tenant documents route (`/api/tenant-documents`): upload (agent, multer memory storage, 25 MB cap, mime allowlist for pdf/jpeg/png/webp/heic), list, inline download, delete. Files land at `api/uploads/tenants/<tenantId>/<uuid><ext>`; `api/uploads/` is gitignored.
- AI pipeline (`api/src/agents/tenant-eval/`): `prompts.ts` (compliance guardrails + extract/evaluate system prompts, model `claude-opus-4-7`), `parse.ts` (with vitest), `build-content.ts` (text + raw PDF + images, pdf-parse v2), `extract.ts` and `evaluate.ts` (Anthropic SDK calls). Wired into the tenants route as `POST /api/tenants/:id/extract`, `POST /api/tenants/:id/evaluate` (background, 202), `GET /api/tenants/:id/evaluation`. Status transitions: draft → evaluating → ready (or → draft on failure).

## What's stubbed or placeholder

- `/owner` and `/agent` dashboards — minimal "Coming soon" stubs (Phase J6/J9).
- Owner settings still has only the user info card (Gmail block was removed in A6).
- Marketing homepage copy still describes the old product (Phase K1).

## Sandbox

- URL: `https://wyvern-zebra.exe.xyz`
- API: `:4000`, web: `:8000`, postgres local on the box, Mailpit NOT installed there yet (no email sending in any phase before I anyway).
- The Google OAuth client (`771221835755-654rud12afgptef5s0rdd7gsk65knrnb`) has the sandbox callback `https://wyvern-zebra.exe.xyz/api/auth/google/callback` registered.
- Sandbox redeployed after Phase G (HEAD = `aa94845`; PROGRESS update may bump it further). `ANTHROPIC_API_KEY` is set in both local `api/.env` and sandbox `api/.env`.

## Known gaps / follow-ups (not blocking)

Carry these forward as we move through later phases:

0. **In-flight evaluations are dropped on API restart.** `POST /api/tenants/:id/evaluate` runs the model in a fire-and-forget async block. If the process restarts mid-call (sandbox redeploy, crash, OOM), the `tenant_evaluations` row stays in `running` status forever and the tenant stays in `evaluating`. Fix later by either (a) a small worker queue + heartbeat-based reaper, or (b) a manual "Retry" button that flips the row to `failed` and starts a new run.

1. **`scripts/sandbox-deploy.sh` doesn't `set -e` inside the remote heredoc.** The script silently continued on a failed `git checkout` once already (working tree had a `package-lock.json` change blocking checkout). Worth tightening: add `set -euo pipefail` at the top of the remote script and `git stash || true` before checkout.

2. **Token at-rest hashing (security hardening).** `invite_token` is stored as plaintext in `invitations`. Consider hashing (sha256) before storage and looking up by hash. Defer until Phase I touches the email path.

3. **Migrations not transactional.** `api/src/db/migrate.ts` runs each file via a single `db.query(sql)` with no `BEGIN/COMMIT`. A failed migration mid-file would leave a half-applied schema. Pre-existing infra issue. Worth wrapping each file in a transaction once we add another migration that's risky.

4. **`InviteRow` etc. exported but unused outside `tokens.ts`.** Acceptable as a public API for the module. No action.

5. **`POST /invitations` returns the plaintext token in the response body.** Documented; remove the field from the response once Phase I sends emails so the token only lives in the email.

6. **`tenant_evaluations` lacks a (tenant_id, created_at DESC) compound index.** Low cardinality per tenant, fine for now.

7. **Sandbox does not have Mailpit.** Phase I will need a dev-SMTP server on the sandbox (or we point `SMTP_HOST` at the local Mac via SSH tunnel — TBD).

## Code-review-flagged "Important" items already addressed

- ✅ Email-case-insensitive duplicate guard (Phase B follow-up commit `30032f2`)
- ✅ `properties.occupied` removed from `clients.ts` (Phase A-3 follow-up `b6ef3d1`)
- ✅ `ThreadEvent` shape synced between web and API types (Phase A-4 follow-up `fcfda7d`)

## How to resume

1. Read this file and `docs/superpowers/plans/2026-05-03-tenant-review-mvp.md` (Phase E onwards).
2. Confirm with `git branch --show-current` you're on `feat/tenant-review-mvp`. If not: `git checkout feat/tenant-review-mvp && git pull`.
3. Verify state: `git log --oneline -3` should show `aa94845` (or the PROGRESS-update commit on top).
4. Verify infra: `docker compose up -d` (postgres + mailpit), `npm install`, `npm run dev`.
5. Pick up Phase H — H1 is `POST /api/tenants/:id/messages`, `POST /api/tenants/:id/share|unshare|approve|reject|reopen`, plus the thread-events list endpoint. Plan starts at line 3651 of the plan file.
6. Continue subagent-driven cadence: bundle small/coupled tasks, dispatch implementer + spec reviewer + code-quality reviewer per bundle, deploy to sandbox at the end of each phase.

## Memory hooks

- `feedback_sandbox_deploy.md` — user wants the sandbox refreshed at end of each phase.
- `MEMORY.md` index — if a new session, this is auto-loaded.
