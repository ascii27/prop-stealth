# PropStealth — Tenant Review MVP

**Date:** 2026-05-03
**Status:** Draft (pending review)
**Supersedes:** `docs/superpowers/archive/2026-04-19-PRD-v0.2.md` and the four older design specs/plans now in `docs/superpowers/archive/`.

---

## 1. Overview

PropStealth's revised v1 scope is a single workflow: **a real estate agent sources prospective tenants for a property owner, uploads supporting documents, lets an AI score them, and shares them with the owner for review.** The owner can ask questions, approve, or reject. The agent can reply to questions and revoke shares.

Everything else from the previous PRD — Inbox Agent, Gmail integration, document vault, portfolio analytics, maintenance, bills — is removed for this milestone and archived. The product is now a focused tenant-review tool with a per-tenant conversation thread.

## 2. Actors

- **Agent** — real estate agent. Signs up directly. Manages many owner-clients.
- **Owner** — property owner / investor. Onboarded via an invite from an agent. Has exactly one agent in v1.

Relationship: 1 agent → many owners. The relationship is created when an agent invites an owner; the owner accepts by clicking a magic link in the invite email and signing in with Google.

## 3. Primary Flow

1. Agent signs in (Google OAuth).
2. Agent invites an owner by email. Invite email contains a single-use, 14-day, magic-link token.
3. Owner clicks the link, signs in with Google, account is created with `role='owner'`, the agent–owner link is established.
4. Agent (or owner) creates one or more **properties** for the owner.
5. Agent creates a **tenant** record for a specific property:
   - Uploads documents, each tagged with a category (Application, ID, Income, Credit, Reference, Other).
   - Clicks "Run AI extraction" → AI returns basic applicant fields, agent reviews and corrects.
   - Clicks "Run Evaluation" → AI returns scores, recommendation, narrative, concerns, verified facts.
6. Agent decides whether to share. If yes:
   - Tenant moves to `shared` status.
   - Owner gets one email per share action (batched if multiple tenants are shared in the same action).
7. Owner clicks the deep link, signs in if needed, and reviews the tenant: documents, AI evaluation, comment thread.
8. Owner can: ask a question (posts to thread → agent gets email), approve, or reject. After approval/rejection the owner can re-open.
9. Agent can: reply in the thread (owner gets email), unshare, re-run evaluation, edit basics.

## 4. Auth & Onboarding

### 4.1 Sign-in

- `/login` shows a role toggle (Owner / Agent) and a single "Continue with Google" button. Email/password fields remain disabled.
- Agents sign up directly via `/login`.
- Owners can also sign in directly via `/login` after their first invite has been accepted.

### 4.2 Invite flow (first-time owner onboarding)

- Agent submits owner's email + name on `/agent/invite`.
- Backend creates a `pending` row in `agent_clients` keyed by that email, generates a 64-char URL-safe `invite_token` with a 14-day expiry, queues the invite email.
- Owner clicks `https://<host>/invite/<token>`.
  - Valid token → "Your agent <name> invited you. Continue with Google."
  - Expired or already-consumed → "This invite link is no longer valid. Ask your agent to resend."
- "Continue with Google" carries the token in the OAuth `state` parameter.
- OAuth callback creates the `users` row with `role='owner'`, marks the token consumed, links the `agent_clients` row to the new user, sets the session cookie, redirects to `/owner` (or to the first shared tenant if any exist).

### 4.3 Subsequent shares

- The agent shares an already-onboarded owner's tenants. Backend enqueues an email containing a deep link `https://<host>/owner/tenants/<id>`.
- If the owner is logged in, the link goes straight to the tenant page.
- If not logged in, Next.js middleware redirects to `/login?next=...`. After Google sign-in they land on the tenant page.

### 4.4 Sessions

- JWT in HTTP-only cookie, 7-day expiry (unchanged from current implementation).
- Middleware on `/agent/*` and `/owner/*` verifies the cookie. Wrong-role access (owner hitting `/agent/*` or vice versa) redirects to the correct dashboard.

## 5. Data Model

Term note: existing column and table names use `owner` (e.g. `properties.owner_id`, `agent_clients`). Keep those terms; do not rename.

### 5.1 Existing tables (kept)

- `users` — `id, email, name, avatar_url, role ('owner'|'agent'), google_id, created_at, updated_at`. No schema change.
- `sessions` — unchanged.
- `agent_clients` — kept as-is. The active agent↔owner link.
- `invitations` — kept; **add** `invite_token VARCHAR(64) UNIQUE`, `invite_token_expires_at TIMESTAMPTZ`, `invite_consumed_at TIMESTAMPTZ`. Existing fields (`agent_id, email, name, message, status`) stay. Token is generated on invite create and consumed during the OAuth callback when the owner accepts.

### 5.2 `properties` (existing, trimmed)

Existing columns: `id, user_id, address, city, state, beds, baths, unit, occupied, tenant_name, created_at, updated_at`.

- **Rename** `user_id` → `owner_id` (aligns with spec terminology).
- **Drop** `unit, occupied, tenant_name` (not used in this scope; tenant occupancy now lives on `tenants`).
- **Add** `created_by_agent_id UUID REFERENCES users(id)` (nullable for owner-self-created), `zip VARCHAR(10)`, `property_type VARCHAR(40)`, `monthly_rent_target NUMERIC`, `notes TEXT`.

Final shape: `id, owner_id, created_by_agent_id, address, city, state, zip, beds, baths, property_type, monthly_rent_target, notes, created_at, updated_at`.

Read/write permission: the owner and their linked agent both have full edit access.

### 5.3 `tenants` (new)

| column | type | notes |
|---|---|---|
| `id` | UUID PK | |
| `property_id` | UUID FK → properties | required |
| `created_by_agent_id` | UUID FK → users | |
| `status` | enum | `draft \| evaluating \| ready \| shared \| approved \| rejected` |
| `applicant_name` | TEXT | |
| `email` | TEXT | |
| `phone` | TEXT | |
| `employer` | TEXT | |
| `monthly_income` | NUMERIC | |
| `move_in_date` | DATE | |
| `notes` | TEXT | |
| `shared_at` | TIMESTAMPTZ | nullable |
| `decided_at` | TIMESTAMPTZ | nullable |
| `decision_by_user_id` | UUID FK → users | nullable |
| `decision_note` | TEXT | nullable |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

Status transitions:

```
draft → evaluating → ready → shared → approved | rejected
                       ↑                ↑           ↑
                       └─────── re-run ─┘           │
                                            ←── reopen ─┘
```

Owner can reopen a decided tenant (back to `shared`). Agent can unshare a `shared` tenant (back to `ready`).

### 5.4 `tenant_documents` (new)

`id, tenant_id, category ('application'|'id'|'income'|'credit'|'reference'|'other'), filename, storage_key, mime_type, size_bytes, uploaded_by_user_id, uploaded_at`.

`storage_key` is the path under `api/uploads/` (e.g. `tenants/<tenantId>/<uuid>.pdf`).

### 5.5 `tenant_evaluations` (new)

One row per AI eval run. The latest `complete` row is the "current" eval shown in the UI; older rows are kept for audit.

| column | type |
|---|---|
| `id` | UUID PK |
| `tenant_id` | UUID FK |
| `status` | `running \| complete \| failed` |
| `overall_score` | INT (0–100, nullable) |
| `recommendation` | `low_risk \| review \| high_risk` (nullable) |
| `category_scores` | JSONB — `{ income, credit, history, identity }`, each `{score:int, summary:text}` |
| `summary` | TEXT |
| `concerns` | JSONB — `[{ text, source_document_id }]` |
| `verified_facts` | JSONB — `[{ text, source_document_id }]` |
| `model_used` | TEXT |
| `error` | TEXT (nullable) |
| `created_at` | TIMESTAMPTZ |
| `completed_at` | TIMESTAMPTZ (nullable) |

### 5.6 `tenant_thread_events` (new)

Unified per-tenant timeline.

`id, tenant_id, type ('message'|'shared'|'unshared'|'approved'|'rejected'|'reopened'), author_user_id, body TEXT (only for type='message'), created_at`.

The owner-side and agent-side tenant pages render this list in chronological order. Decision events render as inline cards in the thread, not just as button states elsewhere.

### 5.7 `email_outbox` (new)

`id, to_email, to_user_id (nullable), subject, body_html, body_text, template_key, status ('pending'|'sent'|'failed'), attempts INT DEFAULT 0, last_attempt_at TIMESTAMPTZ, sent_at TIMESTAMPTZ, error TEXT, created_at`.

### 5.8 Tables to drop

Migration 006 drops:
- `agent_runs`, `gmail_connections`, `inbox_emails` (from migration 005)
- `evaluations` (from migration 003) — replaced by `tenants` + `tenant_evaluations`

## 6. Screens

### 6.1 Marketing & auth

- `/` — homepage. Copy pass to match the simpler product.
- `/login` — agent/owner toggle + Google button (existing).
- `/invite/[token]` — invite landing page. Validates token, shows agent name + Continue with Google.

### 6.2 Agent (`/agent/*`)

- `/agent` — Dashboard. List of owner-clients with property and tenant counts by status. "+ Invite Owner" CTA.
- `/agent/owners/[id]` — Owner detail. Properties list (with "+ Add Property") and a flat tenants list filterable by property and status.
- `/agent/owners/[id]/properties/new` and `/agent/owners/[id]/properties/[propId]` — property create/edit.
- `/agent/tenants/new` — wizard: pick owner+property → upload docs → run extraction → confirm basics → run evaluation → review → share or save draft.
- `/agent/tenants/[id]` — tenant detail. Header (name, property, status, decision pill), tabs: Documents / Evaluation / Thread. Action bar: Share / Unshare / Re-run / Edit basics.
- `/agent/invite` — invite owner form (mostly existing).
- `/agent/settings` — name, avatar, sign out.

### 6.3 Owner (`/owner/*`)

- `/owner` — Dashboard. "Tenants to review" cards (status=`shared`), recent thread activity, properties list.
- `/owner/properties` and `/owner/properties/[id]` — list + edit.
- `/owner/tenants` — full tenants list, filterable.
- `/owner/tenants/[id]` — same three-area layout as the agent view, but actions are Approve / Reject / Reopen and the thread has a reply box.
- `/owner/settings` — name, avatar, single notification toggle ("Email me when there's tenant activity"), sign out.

### 6.4 Pages removed

`/owner/inbox`, `/owner/documents`, `/owner/tenant-eval/*`, `/agent/clients/*` (renamed to `/agent/owners/*`), `/agent/pipeline`, `/agent/help-requests`.

## 7. AI Evaluation Pipeline

Two Claude calls via `@anthropic-ai/sdk`, both run inline in the request handler (no job queue for v1). Files are read fresh from disk on each call. Prompt caching is applied to the system prompt and document text since both calls share context.

### 7.1 Step 1 — Extraction

- Triggered when the agent finishes uploading docs and clicks "Run AI extraction" (or automatically on first upload — TBD-by-implementation; default: explicit button).
- Inputs: documents converted to text (PDFs via `pdf-parse`, images sent directly as Claude vision inputs).
- Output: JSON with `applicant_name, email, phone, employer, monthly_income, move_in_date`. Any field the model can't confidently determine is `null`.
- Result pre-populates the tenant form. Agent corrects and saves. The corrected values are the source of truth.

### 7.2 Step 2 — Evaluation

- Triggered when the agent clicks "Run Evaluation."
- Endpoint creates a `tenant_evaluations` row in `status='running'`, returns immediately, then runs the model call in a fire-and-forget async function that updates the row when complete or failed.
- Frontend polls `/api/tenants/:id` every 2s while status is `evaluating`.
- Inputs: confirmed basics, all documents (text and images), property context (rent target, address, beds/baths). Each document is given a stable `document_id` the model is told to cite.
- Output: matches `tenant_evaluations` schema — overall score, recommendation, four category scores (Income, Credit, History, Identity), narrative summary, concerns array, verified facts array. Concerns and verified facts entries cite a `source_document_id`.

### 7.3 Compliance guardrails (system-prompt constants)

- Never reference protected-class attributes (race, religion, national origin, sex, familial status, disability, age, source of income except where legally permitted).
- Every claim cites a source document.
- Output is advisory only; the human owner makes the final decision.
- Defined as a single exported constant in `api/src/agents/tenant-eval/prompts.ts` so it is auditable.

### 7.4 Re-runs and failure

- Each "Run Evaluation" creates a new `tenant_evaluations` row. The "current" evaluation is the latest `complete` row.
- On failure, status is `failed`, `error` populated, UI shows a retry button.

## 8. Notifications & Email

- Provider: `nodemailer` over SMTP. Dev points at Mailpit (added to `docker-compose.yml`); prod points at configured SMTP.
- Outbox pattern: every send writes a `email_outbox` row. A polling worker (`setInterval` inside Express, every 10s, claims up to 10 pending rows via `UPDATE … RETURNING`) sends each via nodemailer. Up to 5 attempts then `failed`.
- Templates (TS functions returning `{subject, html, text}`):
  - `invite` — magic-link invite from agent to new owner.
  - `tenants_shared` — agent shared 1+ tenants. One email per recipient owner per share action; lists every tenant just shared.
  - `thread_message` — bidirectional. Sent to the *other* party when a message is posted on a tenant thread.
  - `decision` — sent to the agent when the owner approves or rejects.
- No emails on `unshare` or `reopen`.
- Owner-side preference toggle in `/owner/settings`: "Email me when there's tenant activity" (default on). Agents always get notified.

## 9. Storage

- Local filesystem under `api/uploads/`, hidden behind a `Storage` interface (`put`, `get`, `delete`) defined in `api/src/storage/local.ts`. Swapping to S3-compatible later is a matter of writing a second implementation.
- Uploads use `multer` with size and MIME-type limits (TBD-by-implementation; sensible defaults: ≤25 MB per file, common doc + image MIME types only).

## 10. Compliance Notes

- Tenant evaluation outputs are advisory. The product UI clearly labels every evaluation as AI-generated.
- The system prompt enforces FCRA + Fair Housing constraints (see §7.3).
- Documents and evaluation outputs are scoped to the owner and their agent. No other user can read them.
- Audit: every state-changing action (share, unshare, decide, reopen, message) creates a row in `tenant_thread_events` with `author_user_id` and timestamp.

## 11. Migration / Code-Change Inventory

### 11.1 Branch

`feat/tenant-review-mvp` off `main`.

### 11.2 API — keep

`index.ts` (re-registers routes), `config.ts` (envs swapped), `db/{client.ts, migrate.ts}`, `middleware/auth.ts`, `routes/auth.ts`, migrations 001/002/004.

### 11.3 API — modify

- `types.ts` — add Tenant, TenantDocument, TenantEvaluation, ThreadEvent, EmailOutbox types; drop inbox/gmail types.
- `routes/properties.ts` — match trimmed schema.
- `routes/clients.ts` — when an agent invites an owner, generate `invite_token` and persist it on the `agent_clients` row. Token *lookup* (the unauthenticated landing-page query) lives in the new `routes/invites.ts`, not here.

### 11.4 API — delete

`agents/framework.ts`, `agents/inbox/*`, `routes/inbox.ts`, `routes/gmail.ts`, `routes/evaluations.ts`. Migration files 003 and 005 stay on disk (migration history); their tables are dropped by migration 006.

### 11.5 API — new

- Migrations:
  - `006_drop_inbox_tables.sql` — drops `agent_runs, gmail_connections, inbox_emails, evaluations`; adds invite-token columns to `invitations`; renames `properties.user_id` → `owner_id`, drops `unit/occupied/tenant_name`, adds `created_by_agent_id/zip/property_type/monthly_rent_target/notes`.
  - `007_create_tenant_tables.sql` — `tenants, tenant_documents, tenant_evaluations, tenant_thread_events`.
  - `008_create_email_outbox.sql`.
- Routes: `routes/tenants.ts`, `routes/tenant-documents.ts`, `routes/invites.ts`.
- Agents: `agents/tenant-eval/{index.ts, extract.ts, evaluate.ts, prompts.ts}`.
- Storage: `storage/local.ts`.
- Email: `email/{transport.ts, outbox.ts, worker.ts, templates/{invite.ts, tenants_shared.ts, thread_message.ts, decision.ts}}`.

### 11.6 Web — keep

`middleware.ts` (small role-gate addition), `app/layout.tsx`, `globals.css`, reusable components (`logo, status-badge, score-badge, stat-card, theme-dot, owner-sidebar, agent-sidebar`), `lib/user-context.tsx`.

### 11.7 Web — modify

- `lib/types.ts` — drop email/inbox types; add tenant types.
- `lib/mock-data.ts` — delete.
- Components: drop `email-card.tsx`. Reuse `client-card`, `attention-card`, `timeline-entry` under their existing or renamed forms where useful.
- `app/(marketing)/page.tsx` — copy pass.
- `app/(dashboard)/owner/layout.tsx` and `agent/layout.tsx` — sidebar updates.
- `app/(dashboard)/owner/page.tsx` and `agent/page.tsx` — rebuilt dashboards.
- `app/(dashboard)/owner/properties/{page.tsx, [id]/page.tsx}` — wire to API; trim fields.
- `app/(dashboard)/owner/settings/page.tsx` — drop Gmail block.
- `app/(dashboard)/agent/invite/page.tsx` — minor updates.

### 11.8 Web — delete

`app/(dashboard)/owner/inbox/`, `owner/documents/`, `owner/tenant-eval/`, `agent/clients/`, `agent/pipeline/`, `agent/help-requests/`.

### 11.9 Web — new

- `app/(auth)/invite/[token]/page.tsx`.
- `app/(dashboard)/owner/tenants/{page.tsx, [id]/page.tsx}`.
- `app/(dashboard)/agent/owners/{page.tsx, [id]/page.tsx, [id]/properties/[propId]/page.tsx, [id]/properties/new/page.tsx}`.
- `app/(dashboard)/agent/tenants/{new/page.tsx, [id]/page.tsx}`.
- Components: `tenant-card.tsx, tenant-thread.tsx, doc-upload.tsx, eval-summary.tsx`.

### 11.10 Root / infra

- `docker-compose.yml` — add Mailpit (`axllent/mailpit`, ports 1025 SMTP / 8025 web UI).
- `api/package.json` — add `nodemailer, @types/nodemailer, multer, @types/multer, pdf-parse`. Drop `googleapis`.
- `api/.env.example` — add `SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM`. Remove Gmail vars.
- `CLAUDE.md` — overview paragraph rewrite.

## 12. Implementation Phasing

1. Branch + spec write + archive old docs (this commit).
2. Migrations 006/007/008 + removal of old code in one commit.
3. Auth additions: invite tokens + invite landing page.
4. Properties: trim schema + wire pages to API.
5. Tenant CRUD + document upload + local storage.
6. AI extraction + evaluation pipeline.
7. Thread events + share / unshare / decide / reopen actions.
8. Email outbox + worker + templates + Mailpit.
9. Owner and agent dashboards rebuilt.
10. Marketing and login copy pass.
11. Sandbox redeploy + smoke test of the full flow.

## 13. Out of Scope (v1)

- Inbox triage, Gmail integration, any email-reading agent.
- Document vault not tied to a tenant.
- Maintenance, vendor sourcing, bills, utilities.
- Portfolio analytics, cash flow, equity tracking, investor reports.
- Tenant Pipeline (Kanban) and Help Requests pages.
- Email/password auth.
- Native mobile apps.
- Per-event notification preferences (single toggle only).
- Multi-agent owners (an owner has at most one agent).

## 14. Open Items (call out to track during implementation)

- Upload size and MIME-type limits (default ≤25 MB; restrict to PDF + common image types).
- "Run extraction" trigger: explicit button (default) vs auto on first upload.
- Whether to keep the existing static homepage layout or simplify further during the copy pass.
- The exact set of fields in the agent's tenant-creation form beyond what the AI extracts.
