# Tenant Review MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot PropStealth from the broader agent-fleet/Inbox vision to a focused tenant-review workflow: an agent uploads docs for a prospective tenant, AI scores, agent shares with owner, owner reviews in a per-tenant thread with approve/reject.

**Architecture:** Next.js 16 web + Express 5 API monorepo (already set up). PostgreSQL via Docker. Local filesystem doc storage. Inline async AI calls via Anthropic SDK. SMTP email via nodemailer with an outbox table + polling worker. Google OAuth retained; magic-link invite tokens added on the existing `invitations` table.

**Tech Stack:** TypeScript, Next.js 16, Express 5, PostgreSQL 16, `@anthropic-ai/sdk`, `nodemailer`, `multer`, `pdf-parse`, `vitest` (new), Mailpit (new SMTP dev server).

**Spec:** `docs/superpowers/specs/2026-05-03-tenant-review-design.md`. Read it before starting. This plan is the executable form of that spec.

**Branch:** `feat/tenant-review-mvp` (already created off `main`; spec already committed in commit `ca3cfa6`).

---

## Testing Approach

The codebase has no existing test framework. We add **`vitest`** to `api/` only (web stays manual-test for v1). The plan tests business-logic units (token generation, AI prompt construction, AI output parsing, outbox claim semantics, storage). HTTP handlers are validated with manual `curl` smoke tests called out in each phase. Web UI is validated by running `npm run dev` and clicking through.

**Why this mix:** the codebase has zero tests today; adding heavy test coverage to plain DB CRUD wiring and React pages is YAGNI. Where the logic is non-obvious — token lifecycle, AI parsing, outbox concurrency — tests pay for themselves.

**Per-task pattern:**
- For business-logic tasks: write failing test → run it → implement → run test → commit.
- For glue/wiring tasks: implement → run manual smoke test → commit.

---

## File Structure

**Files to delete:**
- `api/src/agents/framework.ts`, `api/src/agents/inbox/` (whole dir)
- `api/src/routes/inbox.ts`, `api/src/routes/gmail.ts`, `api/src/routes/evaluations.ts`
- `web/src/app/(dashboard)/owner/inbox/`, `owner/documents/`, `owner/tenant-eval/`
- `web/src/app/(dashboard)/agent/clients/`, `agent/pipeline/`, `agent/help-requests/`
- `web/src/components/email-card.tsx`
- `web/src/lib/mock-data.ts`

**Files to modify (substantial rewrites):**
- `api/src/index.ts`, `api/src/config.ts`, `api/src/types.ts`
- `api/src/routes/properties.ts`, `api/src/routes/clients.ts`, `api/src/routes/auth.ts`
- `api/src/middleware/auth.ts` (minor)
- `api/.env.example`
- `docker-compose.yml`, `api/package.json`
- `web/src/lib/types.ts`
- `web/src/middleware.ts`
- `web/src/components/owner-sidebar.tsx`, `web/src/components/agent-sidebar.tsx`
- `web/src/app/(dashboard)/owner/layout.tsx`, `agent/layout.tsx` (minor)
- `web/src/app/(dashboard)/owner/page.tsx`, `agent/page.tsx`, `owner/properties/...`, `owner/settings/page.tsx`, `agent/invite/page.tsx`
- `web/src/app/(marketing)/page.tsx` (copy)
- `web/src/app/(auth)/login/page.tsx` (copy)
- `CLAUDE.md` (overview paragraph)

**Files to create:**
- `api/src/db/migrations/006_drop_inbox_tables.sql`
- `api/src/db/migrations/007_create_tenant_tables.sql`
- `api/src/db/migrations/008_create_email_outbox.sql`
- `api/src/routes/tenants.ts`, `api/src/routes/tenant-documents.ts`, `api/src/routes/invites.ts`
- `api/src/agents/tenant-eval/{prompts.ts, extract.ts, evaluate.ts, index.ts}`
- `api/src/storage/local.ts`
- `api/src/email/{transport.ts, outbox.ts, worker.ts, templates/{invite.ts, tenants_shared.ts, thread_message.ts, decision.ts}}`
- `api/vitest.config.ts`
- `api/test/storage.test.ts`, `api/test/invite-token.test.ts`, `api/test/eval-parsing.test.ts`, `api/test/outbox.test.ts`
- `web/src/app/(auth)/invite/[token]/page.tsx`
- `web/src/app/(dashboard)/owner/tenants/{page.tsx, [id]/page.tsx}`
- `web/src/app/(dashboard)/agent/owners/{page.tsx, [id]/page.tsx, [id]/properties/new/page.tsx, [id]/properties/[propId]/page.tsx}`
- `web/src/app/(dashboard)/agent/tenants/{new/page.tsx, [id]/page.tsx}`
- `web/src/components/{tenant-card.tsx, tenant-thread.tsx, doc-upload.tsx, eval-summary.tsx}`

---

## Phases overview

- **Phase A — Foundation:** dependencies, env, Mailpit, vitest, migrations, type updates, dead-code removal.
- **Phase B — Invite flow (server):** invite-token generation, lookup endpoint, OAuth-callback consumption.
- **Phase C — Invite landing page (web):** `/invite/[token]` page wired to backend.
- **Phase D — Properties refactor:** API + web pages match the trimmed schema.
- **Phase E — Storage + tenant CRUD (server):** local filesystem storage, tenants endpoints.
- **Phase F — Document upload:** multer, tenant-documents endpoints, file viewing.
- **Phase G — AI pipeline:** prompts, extract, evaluate, polling endpoint.
- **Phase H — Threads + decisions:** thread events, share/unshare/decision/reopen.
- **Phase I — Email:** outbox, worker, transport, templates, trigger wiring.
- **Phase J — Dashboards + sidebars + tenant pages (web):** rebuilt agent and owner UIs.
- **Phase K — Polish + smoke test:** marketing copy, login copy, CLAUDE.md, full E2E walk-through.

---

## Phase A: Foundation

### Task A1: Install new API dependencies and remove `googleapis`

**Files:**
- Modify: `api/package.json`

- [ ] **Step 1: Install runtime + dev deps**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
npm install -w api nodemailer multer pdf-parse
npm install -w api -D @types/nodemailer @types/multer vitest
npm uninstall -w api googleapis
```

- [ ] **Step 2: Add `test` script to `api/package.json`**

Edit `api/package.json` `scripts` block to add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Verify `api/package.json` has correct deps**

Run: `cat api/package.json | grep -E "nodemailer|multer|pdf-parse|vitest|googleapis"`
Expected: lines for `nodemailer`, `multer`, `pdf-parse`, `vitest`, `@types/nodemailer`, `@types/multer`. NO `googleapis`.

- [ ] **Step 4: Commit**

```bash
git add api/package.json package-lock.json
git commit -m "chore: swap googleapis for nodemailer/multer/pdf-parse, add vitest"
```

---

### Task A2: Add Mailpit to docker-compose

**Files:**
- Modify: `docker-compose.yml`

- [ ] **Step 1: Edit `docker-compose.yml` to add a Mailpit service**

Replace the entire file contents with:

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: propstealth
      POSTGRES_USER: propstealth
      POSTGRES_PASSWORD: propstealth_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  mailpit:
    image: axllent/mailpit:latest
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    environment:
      MP_MAX_MESSAGES: 5000
      MP_SMTP_AUTH_ACCEPT_ANY: 1
      MP_SMTP_AUTH_ALLOW_INSECURE: 1

volumes:
  pgdata:
```

- [ ] **Step 2: Start Mailpit and verify**

```bash
docker compose up -d mailpit
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8025/
```

Expected output: `200`.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "chore: add Mailpit SMTP dev server to docker-compose"
```

---

### Task A3: Update `.env.example` and `config.ts` for SMTP, drop Gmail

**Files:**
- Modify: `api/.env.example`
- Modify: `api/src/config.ts`

- [ ] **Step 1: Replace `api/.env.example` content**

```
DATABASE_URL=postgresql://propstealth:propstealth_dev@localhost:5432/propstealth
JWT_SECRET=change-me-to-a-random-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
PORT=4000
NODE_ENV=development
ANTHROPIC_API_KEY=
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM="PropStealth <noreply@propstealth.local>"
APP_BASE_URL=http://localhost:3000
UPLOAD_DIR=./uploads
```

- [ ] **Step 2: Update local `api/.env`**

Append the SMTP keys above to the actual `api/.env` file (preserving real Google secrets). Don't commit `.env`.

- [ ] **Step 3: Replace `api/src/config.ts` with**

```ts
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://propstealth:propstealth_dev@localhost:5432/propstealth",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      "http://localhost:3000/api/auth/google/callback",
  },
  cookieName: "propstealth_session",
  sessionMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  smtp: {
    host: process.env.SMTP_HOST || "localhost",
    port: parseInt(process.env.SMTP_PORT || "1025", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "PropStealth <noreply@propstealth.local>",
  },
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  uploadDir: process.env.UPLOAD_DIR || path.resolve(__dirname, "../uploads"),
} as const;
```

- [ ] **Step 4: Commit**

```bash
git add api/.env.example api/src/config.ts
git commit -m "chore: add SMTP, app base URL, upload dir config; drop Gmail callback"
```

---

### Task A4: Configure vitest

**Files:**
- Create: `api/vitest.config.ts`
- Create: `api/test/.gitkeep`

- [ ] **Step 1: Create `api/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
  resolve: {
    // Allow .js import specifiers (NodeNext) to resolve in tests
    extensions: [".ts", ".js"],
  },
});
```

- [ ] **Step 2: Create `api/test/.gitkeep`** (empty file).

- [ ] **Step 3: Verify vitest runs**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
npm run test -w api
```

Expected: `No test files found`. (Exits 0 or 1 — both are fine; we just want vitest to start.)

- [ ] **Step 4: Commit**

```bash
git add api/vitest.config.ts api/test/.gitkeep
git commit -m "chore: configure vitest for api package"
```

---

### Task A5: Delete obsolete API code paths

**Files:**
- Delete: `api/src/agents/framework.ts`
- Delete: `api/src/agents/inbox/` (entire directory)
- Delete: `api/src/routes/inbox.ts`
- Delete: `api/src/routes/gmail.ts`
- Delete: `api/src/routes/evaluations.ts`
- Modify: `api/src/index.ts` (drop the deleted routes)

- [ ] **Step 1: Delete the files**

```bash
rm /Users/michaelgalloway/dev/prop-stealth/api/src/agents/framework.ts
rm -rf /Users/michaelgalloway/dev/prop-stealth/api/src/agents/inbox
rm /Users/michaelgalloway/dev/prop-stealth/api/src/routes/inbox.ts
rm /Users/michaelgalloway/dev/prop-stealth/api/src/routes/gmail.ts
rm /Users/michaelgalloway/dev/prop-stealth/api/src/routes/evaluations.ts
```

- [ ] **Step 2: Replace `api/src/index.ts` with**

```ts
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import propertyRoutes from "./routes/properties.js";
import clientRoutes from "./routes/clients.js";

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/clients", clientRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(config.port, () => {
  console.log(`API server running on http://localhost:${config.port}`);
});
```

(Phase E and later add `tenants`, `tenant-documents`, `invites`, and email worker imports.)

- [ ] **Step 3: Verify it still type-checks**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
npm run dev -w api &
sleep 4
curl -s http://localhost:4000/api/health
kill %1 2>/dev/null
```

Expected: `{"status":"ok"}`. If errors, fix imports/types before continuing.

- [ ] **Step 4: Commit**

```bash
git add -A api/src
git commit -m "refactor: remove inbox/gmail/evaluations API code"
```

---

### Task A6: Delete obsolete web pages and components

**Files:**
- Delete: `web/src/app/(dashboard)/owner/inbox/` (entire directory)
- Delete: `web/src/app/(dashboard)/owner/documents/` (entire directory)
- Delete: `web/src/app/(dashboard)/owner/tenant-eval/` (entire directory)
- Delete: `web/src/app/(dashboard)/agent/clients/` (entire directory)
- Delete: `web/src/app/(dashboard)/agent/pipeline/` (entire directory)
- Delete: `web/src/app/(dashboard)/agent/help-requests/` (entire directory)
- Delete: `web/src/components/email-card.tsx`
- Delete: `web/src/lib/mock-data.ts`

- [ ] **Step 1: Delete directories and files**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
rm -rf web/src/app/\(dashboard\)/owner/inbox \
       web/src/app/\(dashboard\)/owner/documents \
       web/src/app/\(dashboard\)/owner/tenant-eval \
       web/src/app/\(dashboard\)/agent/clients \
       web/src/app/\(dashboard\)/agent/pipeline \
       web/src/app/\(dashboard\)/agent/help-requests
rm web/src/components/email-card.tsx web/src/lib/mock-data.ts
```

- [ ] **Step 2: Replace `web/src/lib/types.ts` with new minimal types** (extending types added in later phases)

```ts
export type UserRole = "owner" | "agent";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: UserRole;
}

export interface Property {
  id: string;
  owner_id: string;
  created_by_agent_id: string | null;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  beds: number;
  baths: number;
  property_type: string | null;
  monthly_rent_target: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type TenantStatus =
  | "draft"
  | "evaluating"
  | "ready"
  | "shared"
  | "approved"
  | "rejected";

export interface Tenant {
  id: string;
  property_id: string;
  created_by_agent_id: string;
  status: TenantStatus;
  applicant_name: string | null;
  email: string | null;
  phone: string | null;
  employer: string | null;
  monthly_income: number | null;
  move_in_date: string | null;
  notes: string | null;
  shared_at: string | null;
  decided_at: string | null;
  decision_by_user_id: string | null;
  decision_note: string | null;
  created_at: string;
  updated_at: string;
}

export type DocumentCategory =
  | "application"
  | "id"
  | "income"
  | "credit"
  | "reference"
  | "other";

export interface TenantDocument {
  id: string;
  tenant_id: string;
  category: DocumentCategory;
  filename: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by_user_id: string;
  uploaded_at: string;
}

export type EvaluationStatus = "running" | "complete" | "failed";

export interface CategoryScore {
  score: number;
  summary: string;
}

export interface EvalCitation {
  text: string;
  source_document_id: string | null;
}

export interface TenantEvaluation {
  id: string;
  tenant_id: string;
  status: EvaluationStatus;
  overall_score: number | null;
  recommendation: "low_risk" | "review" | "high_risk" | null;
  category_scores: {
    income: CategoryScore;
    credit: CategoryScore;
    history: CategoryScore;
    identity: CategoryScore;
  } | null;
  summary: string | null;
  concerns: EvalCitation[];
  verified_facts: EvalCitation[];
  model_used: string | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export type ThreadEventType =
  | "message"
  | "shared"
  | "unshared"
  | "approved"
  | "rejected"
  | "reopened";

export interface ThreadEvent {
  id: string;
  tenant_id: string;
  type: ThreadEventType;
  author_user_id: string;
  author_name: string | null;
  body: string | null;
  created_at: string;
}
```

- [ ] **Step 3: Run web build to verify no broken imports**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
npm run lint -w web 2>&1 | tail -40
```

Fix any lint errors that result from the deletions (most likely `email-card` imports in components or pages we missed; also `mock-data` references in remaining pages).

- [ ] **Step 4: Commit**

```bash
git add -A web/src
git commit -m "refactor: remove inbox/documents/tenant-eval/pipeline/help-requests web pages"
```

---

### Task A7: Migration 006 — drop old tables, add invite tokens, refactor properties

**Files:**
- Create: `api/src/db/migrations/006_drop_inbox_tables.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Drop tables that are no longer used
DROP TABLE IF EXISTS inbox_emails;
DROP TABLE IF EXISTS gmail_connections;
DROP TABLE IF EXISTS agent_runs;
DROP TABLE IF EXISTS evaluations;

-- Invite-token columns on the existing invitations table
ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS invite_token VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invite_consumed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_invitations_invite_token ON invitations(invite_token);

-- Properties refactor:
-- 1. Rename user_id → owner_id
-- 2. Drop unit, occupied, tenant_name
-- 3. Add created_by_agent_id, zip, property_type, monthly_rent_target, notes
ALTER TABLE properties RENAME COLUMN user_id TO owner_id;

ALTER TABLE properties
  DROP COLUMN IF EXISTS unit,
  DROP COLUMN IF EXISTS occupied,
  DROP COLUMN IF EXISTS tenant_name;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS created_by_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS zip VARCHAR(10),
  ADD COLUMN IF NOT EXISTS property_type VARCHAR(40),
  ADD COLUMN IF NOT EXISTS monthly_rent_target NUMERIC,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Replace the old user_id index name
DROP INDEX IF EXISTS idx_properties_user_id;
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_by_agent_id ON properties(created_by_agent_id);
```

- [ ] **Step 2: Run the migration**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
npm run migrate -w api
```

Expected: `Running migration: 006_drop_inbox_tables.sql` then `Migrations complete`.

- [ ] **Step 3: Verify schema**

```bash
docker exec -it $(docker ps -qf name=postgres) psql -U propstealth -d propstealth -c '\d properties' \
  -c '\d invitations' \
  -c "SELECT to_regclass('inbox_emails'), to_regclass('gmail_connections'), to_regclass('agent_runs'), to_regclass('evaluations');"
```

Expected: `properties` has `owner_id, created_by_agent_id, zip, property_type, monthly_rent_target, notes`, no `unit/occupied/tenant_name`. `invitations` has `invite_token, invite_token_expires_at, invite_consumed_at`. The four `to_regclass` results are all `NULL`.

- [ ] **Step 4: Commit**

```bash
git add api/src/db/migrations/006_drop_inbox_tables.sql
git commit -m "feat(db): drop inbox tables, add invite tokens, refactor properties"
```

---

### Task A8: Migration 007 — tenant tables

**Files:**
- Create: `api/src/db/migrations/007_create_tenant_tables.sql`

- [ ] **Step 1: Create migration file**

```sql
CREATE TABLE IF NOT EXISTS tenants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id           UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_by_agent_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status                VARCHAR(20) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','evaluating','ready','shared','approved','rejected')),
  applicant_name        VARCHAR(255),
  email                 VARCHAR(255),
  phone                 VARCHAR(50),
  employer              VARCHAR(255),
  monthly_income        NUMERIC,
  move_in_date          DATE,
  notes                 TEXT,
  shared_at             TIMESTAMPTZ,
  decided_at            TIMESTAMPTZ,
  decision_by_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  decision_note         TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_created_by_agent_id ON tenants(created_by_agent_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

CREATE TABLE IF NOT EXISTS tenant_documents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category              VARCHAR(20) NOT NULL
                        CHECK (category IN ('application','id','income','credit','reference','other')),
  filename              VARCHAR(255) NOT NULL,
  storage_key           VARCHAR(512) NOT NULL,
  mime_type             VARCHAR(100) NOT NULL,
  size_bytes            BIGINT NOT NULL,
  uploaded_by_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  uploaded_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_documents_tenant_id ON tenant_documents(tenant_id);

CREATE TABLE IF NOT EXISTS tenant_evaluations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status            VARCHAR(20) NOT NULL DEFAULT 'running'
                    CHECK (status IN ('running','complete','failed')),
  overall_score     INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  recommendation    VARCHAR(20) CHECK (recommendation IN ('low_risk','review','high_risk')),
  category_scores   JSONB,
  summary           TEXT,
  concerns          JSONB DEFAULT '[]'::jsonb,
  verified_facts    JSONB DEFAULT '[]'::jsonb,
  model_used        VARCHAR(100),
  error             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tenant_evaluations_tenant_id ON tenant_evaluations(tenant_id);

CREATE TABLE IF NOT EXISTS tenant_thread_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type              VARCHAR(20) NOT NULL
                    CHECK (type IN ('message','shared','unshared','approved','rejected','reopened')),
  author_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  body              TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_thread_events_tenant_id ON tenant_thread_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_thread_events_created_at ON tenant_thread_events(created_at);
```

- [ ] **Step 2: Run migration**

```bash
npm run migrate -w api
```

Expected: `Running migration: 007_create_tenant_tables.sql` then `Migrations complete`.

- [ ] **Step 3: Verify**

```bash
docker exec -it $(docker ps -qf name=postgres) psql -U propstealth -d propstealth -c '\dt' \
  -c '\d tenants' -c '\d tenant_evaluations' -c '\d tenant_thread_events' -c '\d tenant_documents'
```

Expected: all four tables present with the columns above.

- [ ] **Step 4: Commit**

```bash
git add api/src/db/migrations/007_create_tenant_tables.sql
git commit -m "feat(db): add tenant, tenant_documents, tenant_evaluations, tenant_thread_events tables"
```

---

### Task A9: Migration 008 — email outbox

**Files:**
- Create: `api/src/db/migrations/008_create_email_outbox.sql`

- [ ] **Step 1: Create migration**

```sql
CREATE TABLE IF NOT EXISTS email_outbox (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email        VARCHAR(255) NOT NULL,
  to_user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  subject         VARCHAR(500) NOT NULL,
  body_html       TEXT NOT NULL,
  body_text       TEXT NOT NULL,
  template_key    VARCHAR(80) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','sent','failed')),
  attempts        INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  error           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_status_created_at
  ON email_outbox(status, created_at)
  WHERE status = 'pending';
```

- [ ] **Step 2: Run + verify**

```bash
npm run migrate -w api
docker exec -it $(docker ps -qf name=postgres) psql -U propstealth -d propstealth -c '\d email_outbox'
```

- [ ] **Step 3: Commit**

```bash
git add api/src/db/migrations/008_create_email_outbox.sql
git commit -m "feat(db): add email_outbox table"
```

---

### Task A10: Update API types

**Files:**
- Modify: `api/src/types.ts`

- [ ] **Step 1: Replace `api/src/types.ts` with**

```ts
export type UserRole = "owner" | "agent";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: UserRole;
  google_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: Date;
  created_at: Date;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
  sessionId: string;
}

export interface Invitation {
  id: string;
  agent_id: string;
  email: string;
  name: string;
  message: string | null;
  status: "pending" | "accepted" | "expired";
  invite_token: string | null;
  invite_token_expires_at: Date | null;
  invite_consumed_at: Date | null;
  created_at: Date;
}

export interface Property {
  id: string;
  owner_id: string;
  created_by_agent_id: string | null;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  beds: number;
  baths: number;
  property_type: string | null;
  monthly_rent_target: number | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export type TenantStatus =
  | "draft"
  | "evaluating"
  | "ready"
  | "shared"
  | "approved"
  | "rejected";

export interface Tenant {
  id: string;
  property_id: string;
  created_by_agent_id: string;
  status: TenantStatus;
  applicant_name: string | null;
  email: string | null;
  phone: string | null;
  employer: string | null;
  monthly_income: number | null;
  move_in_date: string | null;
  notes: string | null;
  shared_at: Date | null;
  decided_at: Date | null;
  decision_by_user_id: string | null;
  decision_note: string | null;
  created_at: Date;
  updated_at: Date;
}

export type DocumentCategory =
  | "application"
  | "id"
  | "income"
  | "credit"
  | "reference"
  | "other";

export interface TenantDocument {
  id: string;
  tenant_id: string;
  category: DocumentCategory;
  filename: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by_user_id: string;
  uploaded_at: Date;
}

export type EvaluationStatus = "running" | "complete" | "failed";

export interface CategoryScore {
  score: number;
  summary: string;
}

export interface EvalCitation {
  text: string;
  source_document_id: string | null;
}

export interface CategoryScores {
  income: CategoryScore;
  credit: CategoryScore;
  history: CategoryScore;
  identity: CategoryScore;
}

export interface TenantEvaluation {
  id: string;
  tenant_id: string;
  status: EvaluationStatus;
  overall_score: number | null;
  recommendation: "low_risk" | "review" | "high_risk" | null;
  category_scores: CategoryScores | null;
  summary: string | null;
  concerns: EvalCitation[];
  verified_facts: EvalCitation[];
  model_used: string | null;
  error: string | null;
  created_at: Date;
  completed_at: Date | null;
}

export type ThreadEventType =
  | "message"
  | "shared"
  | "unshared"
  | "approved"
  | "rejected"
  | "reopened";

export interface ThreadEvent {
  id: string;
  tenant_id: string;
  type: ThreadEventType;
  author_user_id: string;
  body: string | null;
  created_at: Date;
}

export type EmailStatus = "pending" | "sent" | "failed";

export interface EmailOutboxRow {
  id: string;
  to_email: string;
  to_user_id: string | null;
  subject: string;
  body_html: string;
  body_text: string;
  template_key: string;
  status: EmailStatus;
  attempts: number;
  last_attempt_at: Date | null;
  sent_at: Date | null;
  error: string | null;
  created_at: Date;
}
```

- [ ] **Step 2: Verify it type-checks (in conjunction with the still-to-be-updated routes)**

It's expected that `routes/clients.ts` and `routes/properties.ts` reference removed columns; we'll fix those in Phase D and B respectively. For now just confirm `index.ts` still compiles:

```bash
cd /Users/michaelgalloway/dev/prop-stealth/api
npx tsc --noEmit 2>&1 | head -40
```

Expected output: errors only in `routes/properties.ts` and `routes/clients.ts` (we'll fix soon). No errors in `index.ts`, `auth.ts`, `middleware/auth.ts`, `types.ts`.

- [ ] **Step 3: Commit**

```bash
git add api/src/types.ts
git commit -m "refactor(types): rewrite api/src/types.ts for tenant-review domain"
```

---

### Task A11: Update CLAUDE.md overview

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Replace the "Project Overview" and "Current State" sections**

Find the `## Project Overview` section. Replace through the end of `## Current State` (just before `## Architecture`) with:

```markdown
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
```

- [ ] **Step 2: Verify the file is readable**

```bash
head -60 /Users/michaelgalloway/dev/prop-stealth/CLAUDE.md
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: rewrite CLAUDE.md overview for tenant-review scope"
```

---

## Phase B: Invite Flow (Server)

### Task B1: Test invite-token generation and lookup logic

**Files:**
- Create: `api/src/invites/tokens.ts`
- Create: `api/test/invite-token.test.ts`

- [ ] **Step 1: Write failing test**

Create `api/test/invite-token.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generateInviteToken, isInviteValid } from "../src/invites/tokens.js";

describe("generateInviteToken", () => {
  it("returns a 64-char URL-safe string", () => {
    const t = generateInviteToken();
    expect(t).toHaveLength(64);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns different values on subsequent calls", () => {
    const a = generateInviteToken();
    const b = generateInviteToken();
    expect(a).not.toBe(b);
  });
});

describe("isInviteValid", () => {
  it("returns false when token is missing", () => {
    expect(
      isInviteValid({
        invite_token: null,
        invite_token_expires_at: new Date(Date.now() + 1000),
        invite_consumed_at: null,
      }),
    ).toBe(false);
  });

  it("returns false when expired", () => {
    expect(
      isInviteValid({
        invite_token: "abc",
        invite_token_expires_at: new Date(Date.now() - 1000),
        invite_consumed_at: null,
      }),
    ).toBe(false);
  });

  it("returns false when already consumed", () => {
    expect(
      isInviteValid({
        invite_token: "abc",
        invite_token_expires_at: new Date(Date.now() + 1000),
        invite_consumed_at: new Date(),
      }),
    ).toBe(false);
  });

  it("returns true for valid unexpired unconsumed token", () => {
    expect(
      isInviteValid({
        invite_token: "abc",
        invite_token_expires_at: new Date(Date.now() + 1000),
        invite_consumed_at: null,
      }),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
npm run test -w api
```

Expected: FAIL — `Cannot find module '../src/invites/tokens.js'`.

- [ ] **Step 3: Implement**

Create `api/src/invites/tokens.ts`:

```ts
import crypto from "crypto";

export function generateInviteToken(): string {
  // 48 random bytes → base64url ≈ 64 chars (no padding)
  return crypto.randomBytes(48).toString("base64url").slice(0, 64);
}

export const INVITE_TTL_DAYS = 14;

export function inviteExpiry(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + INVITE_TTL_DAYS);
  return d;
}

export interface InviteRow {
  invite_token: string | null;
  invite_token_expires_at: Date | null;
  invite_consumed_at: Date | null;
}

export function isInviteValid(row: InviteRow, now: Date = new Date()): boolean {
  if (!row.invite_token) return false;
  if (row.invite_consumed_at) return false;
  if (!row.invite_token_expires_at) return false;
  return row.invite_token_expires_at.getTime() > now.getTime();
}
```

- [ ] **Step 4: Run, expect pass**

```bash
npm run test -w api
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add api/src/invites/tokens.ts api/test/invite-token.test.ts
git commit -m "feat(invites): token generation and validity helpers with tests"
```

---

### Task B2: Issue invite token when an agent invites an owner

**Files:**
- Modify: `api/src/routes/clients.ts`

- [ ] **Step 1: Replace `api/src/routes/clients.ts` `POST /invitations` handler**

Find the existing `router.post("/invitations", ...)` block in `api/src/routes/clients.ts` and replace it with:

```ts
// POST /invitations — create a client invitation with magic-link token
router.post("/invitations", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "agent") {
      res.status(403).json({ error: "Only agents can invite clients" });
      return;
    }

    const { name, email, message } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: "name and email are required" });
      return;
    }

    // Check for an existing pending invite from THIS agent for THIS email
    const existing = await db.query(
      "SELECT * FROM invitations WHERE agent_id = $1 AND email = $2 AND status = 'pending'",
      [userId, email],
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Invitation already sent to this email" });
      return;
    }

    // Already a linked client?
    const existingUser = await db.query(
      `SELECT u.id FROM users u
       JOIN agent_clients ac ON ac.owner_id = u.id AND ac.agent_id = $1
       WHERE u.email = $2`,
      [userId, email],
    );
    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: "This user is already your client" });
      return;
    }

    const token = generateInviteToken();
    const expiresAt = inviteExpiry();

    const result = await db.query(
      `INSERT INTO invitations
         (agent_id, email, name, message, invite_token, invite_token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, email, name, message || null, token, expiresAt],
    );

    // Auto-link if the user already exists as an owner — skip token, mark accepted
    const ownerResult = await db.query(
      "SELECT id FROM users WHERE email = $1 AND role = 'owner'",
      [email],
    );
    if (ownerResult.rows.length > 0) {
      await db.query(
        `INSERT INTO agent_clients (agent_id, owner_id)
         VALUES ($1, $2)
         ON CONFLICT (agent_id, owner_id) DO NOTHING`,
        [userId, ownerResult.rows[0].id],
      );
      await db.query(
        `UPDATE invitations
            SET status = 'accepted',
                invite_consumed_at = NOW()
          WHERE id = $1`,
        [result.rows[0].id],
      );
      result.rows[0].status = "accepted";
      result.rows[0].invite_consumed_at = new Date();
    }

    res.status(201).json({ invitation: result.rows[0] });
  } catch (err) {
    console.error("Create invitation error:", err);
    res.status(500).json({ error: "Failed to create invitation" });
  }
});
```

- [ ] **Step 2: Add the import at top of `api/src/routes/clients.ts`**

After the existing imports add:

```ts
import { generateInviteToken, inviteExpiry } from "../invites/tokens.js";
```

- [ ] **Step 3: Also remove the now-broken `evaluations` query in `GET /:id`**

Find this block in `routes/clients.ts`:

```ts
const evalsResult = await db.query(
  "SELECT * FROM evaluations WHERE user_id = $1 ORDER BY created_at DESC",
  [req.params.id],
);
```

Delete it. Then in the `client = { ... }` object below it, remove the line `evaluations: evalsResult.rows,`. (Tenants will be re-added in Phase E.)

- [ ] **Step 4: Smoke test**

Start servers and confirm:

```bash
cd /Users/michaelgalloway/dev/prop-stealth
npm run dev &
sleep 6
# Sign in via browser as an agent first; then:
COOKIE='propstealth_session=PASTE_FROM_BROWSER_DEVTOOLS'
curl -s -X POST http://localhost:3000/api/clients/invitations \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE" \
  -d '{"name":"Test Owner","email":"test-owner@example.test"}' | head -c 500
```

Expected: a JSON response with `invitation.invite_token` (64 chars) and `invite_token_expires_at` populated. Stop servers when done.

- [ ] **Step 5: Commit**

```bash
git add api/src/routes/clients.ts
git commit -m "feat(invites): generate magic-link token on invite creation"
```

---

### Task B3: `GET /api/invites/:token` endpoint

**Files:**
- Create: `api/src/routes/invites.ts`
- Modify: `api/src/index.ts` (register route)

- [ ] **Step 1: Create `api/src/routes/invites.ts`**

```ts
import { Router, Request, Response } from "express";
import { db } from "../db/client.js";
import { isInviteValid } from "../invites/tokens.js";

const router = Router();

// GET /:token — public lookup for the invite landing page
router.get("/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const result = await db.query(
      `SELECT i.id, i.email, i.name, i.message, i.invite_token,
              i.invite_token_expires_at, i.invite_consumed_at,
              u.name AS agent_name, u.avatar_url AS agent_avatar_url
         FROM invitations i
         JOIN users u ON u.id = i.agent_id
        WHERE i.invite_token = $1`,
      [token],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }

    const row = result.rows[0];
    if (!isInviteValid(row)) {
      res.status(410).json({ error: "Invitation has expired or already been used" });
      return;
    }

    res.json({
      invitation: {
        email: row.email,
        name: row.name,
        message: row.message,
        agent_name: row.agent_name,
        agent_avatar_url: row.agent_avatar_url,
      },
    });
  } catch (err) {
    console.error("Get invite error:", err);
    res.status(500).json({ error: "Failed to look up invitation" });
  }
});

export default router;
```

- [ ] **Step 2: Register the route in `api/src/index.ts`**

Add the import:

```ts
import inviteRoutes from "./routes/invites.js";
```

Add (after `app.use("/api/clients", clientRoutes);`):

```ts
app.use("/api/invites", inviteRoutes);
```

- [ ] **Step 3: Smoke test**

Use the token from Task B2 step 4:

```bash
TOKEN='PASTE_TOKEN_FROM_PREVIOUS_STEP'
curl -s http://localhost:3000/api/invites/$TOKEN | head -c 500
curl -s http://localhost:3000/api/invites/notarealtoken
```

Expected: valid token returns invitation JSON; bogus token returns 404 with `Invitation not found`.

- [ ] **Step 4: Commit**

```bash
git add api/src/routes/invites.ts api/src/index.ts
git commit -m "feat(invites): public GET /api/invites/:token endpoint"
```

---

### Task B4: Consume invite token in OAuth callback

**Files:**
- Modify: `api/src/routes/auth.ts`

The current flow encodes only `{role, csrf}` in `state`. We need to also carry an optional `inviteToken` so the callback can:
1. Validate it.
2. Force `role='owner'`.
3. Mark the invitation consumed and create the `agent_clients` row.

- [ ] **Step 1: Update `createState` and `parseState` in `api/src/routes/auth.ts`**

Replace those two functions with:

```ts
function createState(role: string, inviteToken?: string): string {
  const csrf = crypto.randomBytes(16).toString("hex");
  const payload = JSON.stringify({ role, csrf, inviteToken: inviteToken || null });
  return Buffer.from(payload).toString("base64url");
}

function parseState(
  state: string,
): { role: string; csrf: string; inviteToken: string | null } | null {
  try {
    const json = Buffer.from(state, "base64url").toString("utf-8");
    const parsed = JSON.parse(json);
    if (
      parsed &&
      typeof parsed.role === "string" &&
      typeof parsed.csrf === "string"
    ) {
      return {
        role: parsed.role,
        csrf: parsed.csrf,
        inviteToken:
          typeof parsed.inviteToken === "string" ? parsed.inviteToken : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Update the `GET /google` handler to accept `invite_token` query param**

Replace the `router.get("/google", ...)` handler with:

```ts
// GET /google — initiate OAuth flow
router.get("/google", (req: Request, res: Response, next) => {
  const role = req.query.role as string | undefined;
  const inviteToken = (req.query.invite_token as string | undefined) || undefined;

  if (role !== "owner" && role !== "agent") {
    res.status(400).json({ error: "role query param must be 'owner' or 'agent'" });
    return;
  }

  const state = createState(role, inviteToken);

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state,
    session: false,
  })(req, res, next);
});
```

- [ ] **Step 3: Replace the OAuth callback handler**

Replace the `router.get("/google/callback", ...)` block with:

```ts
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login?error=auth_failed",
    session: false,
  }),
  async (req: Request, res: Response) => {
    try {
      const stateParam = req.query.state as string | undefined;
      if (!stateParam) {
        res.redirect("/login?error=missing_state");
        return;
      }

      const state = parseState(stateParam);
      if (!state || (state.role !== "owner" && state.role !== "agent")) {
        res.redirect("/login?error=invalid_state");
        return;
      }

      const profile = req.user as unknown as {
        googleId: string;
        email: string;
        name: string | null;
        avatarUrl: string | null;
      };

      // If an invite token is present, validate and attach it
      let invitation: {
        id: string;
        agent_id: string;
        email: string;
      } | null = null;
      let effectiveRole = state.role;

      if (state.inviteToken) {
        const inv = await db.query(
          `SELECT id, agent_id, email, invite_token, invite_token_expires_at,
                  invite_consumed_at
             FROM invitations
            WHERE invite_token = $1`,
          [state.inviteToken],
        );
        if (inv.rows.length === 0) {
          res.redirect("/login?error=invite_invalid");
          return;
        }
        const row = inv.rows[0];
        if (
          row.invite_consumed_at ||
          !row.invite_token_expires_at ||
          new Date(row.invite_token_expires_at).getTime() <= Date.now()
        ) {
          res.redirect("/login?error=invite_expired");
          return;
        }
        if (row.email.toLowerCase() !== profile.email.toLowerCase()) {
          res.redirect("/login?error=invite_email_mismatch");
          return;
        }
        invitation = { id: row.id, agent_id: row.agent_id, email: row.email };
        effectiveRole = "owner"; // invite always creates an owner
      }

      const user = await findOrCreateUser(
        profile.googleId,
        profile.email,
        profile.name,
        profile.avatarUrl,
        effectiveRole,
      );

      if (invitation) {
        await db.query(
          `INSERT INTO agent_clients (agent_id, owner_id)
             VALUES ($1, $2)
             ON CONFLICT (agent_id, owner_id) DO NOTHING`,
          [invitation.agent_id, user.id],
        );
        await db.query(
          `UPDATE invitations
              SET status = 'accepted',
                  invite_consumed_at = NOW()
            WHERE id = $1`,
          [invitation.id],
        );
      }

      const sessionId = await createSession(user.id);

      const token = signJwt({
        userId: user.id,
        role: user.role,
        sessionId,
      });

      setSessionCookie(res, token);

      res.redirect(user.role === "owner" ? "/owner" : "/agent");
    } catch (err) {
      console.error("OAuth callback error:", err);
      res.redirect("/login?error=server_error");
    }
  },
);
```

- [ ] **Step 4: Smoke test**

You need a real Google account whose email matches the invitation email (or change the invitation row in psql to match an account you control).

```bash
# Issue an invite to your real Google email, then visit:
# http://localhost:3000/api/auth/google?role=owner&invite_token=THE_TOKEN
# Complete Google sign-in. You should land on /owner.
# Then verify in psql:
docker exec -it $(docker ps -qf name=postgres) psql -U propstealth -d propstealth \
  -c "SELECT email, status, invite_consumed_at FROM invitations ORDER BY created_at DESC LIMIT 3;" \
  -c "SELECT * FROM agent_clients ORDER BY created_at DESC LIMIT 3;"
```

Expected: invitation status=`accepted`, `invite_consumed_at` filled in, an `agent_clients` row exists.

- [ ] **Step 5: Commit**

```bash
git add api/src/routes/auth.ts
git commit -m "feat(auth): consume invite token during OAuth callback"
```

---

## Phase C: Invite Landing Page (Web)

### Task C1: `/invite/[token]` page

**Files:**
- Create: `web/src/app/(auth)/invite/[token]/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface InvitationView {
  email: string;
  name: string;
  message: string | null;
  agent_name: string | null;
  agent_avatar_url: string | null;
}

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "valid"; invitation: InvitationView }
    | { kind: "invalid"; reason: string }
  >({ kind: "loading" });

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setState({ kind: "valid", invitation: data.invitation });
        } else if (res.status === 404 || res.status === 410) {
          const data = await res.json().catch(() => ({}));
          setState({
            kind: "invalid",
            reason: data.error || "This invite link is no longer valid.",
          });
        } else {
          setState({ kind: "invalid", reason: "Could not load invitation." });
        }
      })
      .catch(() =>
        setState({ kind: "invalid", reason: "Could not load invitation." }),
      );
  }, [token]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-[380px] p-8">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 bg-brand rounded-lg" />
          <span className="font-bold text-xl text-gray-900">PropStealth</span>
        </div>

        {state.kind === "loading" && (
          <p className="text-sm text-gray-500 text-center">Loading…</p>
        )}

        {state.kind === "invalid" && (
          <>
            <h1 className="text-base font-semibold text-gray-900 text-center mb-2">
              Invitation unavailable
            </h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              {state.reason} Ask your agent to send a new one.
            </p>
            <a
              href="/login"
              className="block w-full border border-gray-300 rounded-lg py-2.5 text-center text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to sign-in
            </a>
          </>
        )}

        {state.kind === "valid" && (
          <>
            <h1 className="text-base font-semibold text-gray-900 text-center mb-2">
              {state.invitation.agent_name || "Your agent"} invited you to PropStealth
            </h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              Sign in with Google as <span className="font-medium">{state.invitation.email}</span> to review tenant candidates.
            </p>

            {state.invitation.message && (
              <p className="text-xs text-gray-600 italic border-l-2 border-gray-200 pl-3 mb-6">
                "{state.invitation.message}"
              </p>
            )}

            <a
              href={`/api/auth/google?role=owner&invite_token=${encodeURIComponent(token)}`}
              className="w-full border border-gray-300 rounded-lg py-2.5 flex items-center justify-center gap-2.5 hover:bg-gray-50"
            >
              <span className="w-[18px] h-[18px] bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">G</span>
              </span>
              <span className="text-[13px] font-medium text-gray-700">
                Continue with Google
              </span>
            </a>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add `invite_email_mismatch`, `invite_expired`, `invite_invalid` messages to login error map**

Edit `web/src/app/(auth)/login/page.tsx`'s `messages` map inside `ErrorMessage`:

```ts
const messages: Record<string, string> = {
  auth_failed: "Google sign-in failed. Please try again.",
  invalid_state: "Something went wrong. Please try again.",
  server_error: "Server error. Please try again later.",
  invite_invalid: "That invite link is not valid. Ask your agent to resend.",
  invite_expired: "That invite link has expired. Ask your agent to resend.",
  invite_email_mismatch:
    "That invite was for a different Google account. Sign in with the email your agent invited.",
};
```

- [ ] **Step 3: Smoke test**

```bash
# With both servers running, visit:
# http://localhost:3000/invite/<your-test-token>
# Then again with a bogus token — confirm the "unavailable" branch.
```

- [ ] **Step 4: Commit**

```bash
git add "web/src/app/(auth)/invite" "web/src/app/(auth)/login/page.tsx"
git commit -m "feat(invites): /invite/[token] landing page wired to Google OAuth"
```

---

## Phase D: Properties Refactor

### Task D1: Update properties API to new schema

**Files:**
- Modify: `api/src/routes/properties.ts`

- [ ] **Step 1: Replace `api/src/routes/properties.ts` entirely with**

```ts
import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { JwtPayload } from "../types.js";
import { db } from "../db/client.js";

const router = Router();

const SELECT_COLS = `id, owner_id, created_by_agent_id, address, city, state, zip,
                     beds, baths, property_type, monthly_rent_target, notes,
                     created_at, updated_at`;

// Authorization: a property is accessible to its owner OR to any agent linked
// to that owner via agent_clients.
async function userCanAccessProperty(
  userId: string,
  role: string,
  propertyId: string,
): Promise<{ allowed: boolean; ownerId?: string }> {
  const result = await db.query(
    `SELECT p.owner_id
       FROM properties p
       LEFT JOIN agent_clients ac
         ON ac.owner_id = p.owner_id AND ac.agent_id = $1
      WHERE p.id = $2
        AND (p.owner_id = $3 OR ac.agent_id IS NOT NULL)`,
    [userId, propertyId, userId],
  );
  if (result.rows.length === 0) return { allowed: false };
  return { allowed: true, ownerId: result.rows[0].owner_id };
}

// GET / — list properties scoped to the caller
//   - owner: their own properties
//   - agent: properties of any owner they're linked to
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    const ownerIdQuery = req.query.owner_id as string | undefined;

    let result;
    if (role === "owner") {
      result = await db.query(
        `SELECT ${SELECT_COLS} FROM properties WHERE owner_id = $1 ORDER BY created_at DESC`,
        [userId],
      );
    } else {
      // agent
      if (ownerIdQuery) {
        // Verify the agent is linked to this owner
        const link = await db.query(
          "SELECT 1 FROM agent_clients WHERE agent_id = $1 AND owner_id = $2",
          [userId, ownerIdQuery],
        );
        if (link.rows.length === 0) {
          res.status(403).json({ error: "Not your client" });
          return;
        }
        result = await db.query(
          `SELECT ${SELECT_COLS} FROM properties WHERE owner_id = $1 ORDER BY created_at DESC`,
          [ownerIdQuery],
        );
      } else {
        // All properties for any of the agent's owners
        result = await db.query(
          `SELECT ${SELECT_COLS}
             FROM properties p
             JOIN agent_clients ac ON ac.owner_id = p.owner_id AND ac.agent_id = $1
            ORDER BY p.created_at DESC`,
          [userId],
        );
      }
    }

    res.json({ properties: result.rows });
  } catch (err) {
    console.error("List properties error:", err);
    res.status(500).json({ error: "Failed to list properties" });
  }
});

// GET /:id
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    const access = await userCanAccessProperty(userId, role, req.params.id);
    if (!access.allowed) {
      res.status(404).json({ error: "Property not found" });
      return;
    }

    const result = await db.query(
      `SELECT ${SELECT_COLS} FROM properties WHERE id = $1`,
      [req.params.id],
    );
    res.json({ property: result.rows[0] });
  } catch (err) {
    console.error("Get property error:", err);
    res.status(500).json({ error: "Failed to get property" });
  }
});

// POST / — create
//   - owner: creates for themself
//   - agent: must include owner_id; the agent must be linked to that owner
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    const {
      address,
      city,
      state,
      zip,
      beds,
      baths,
      property_type,
      monthly_rent_target,
      notes,
      owner_id: bodyOwnerId,
    } = req.body;

    if (!address || !city || !state) {
      res.status(400).json({ error: "address, city, and state are required" });
      return;
    }

    let ownerId: string;
    let createdByAgentId: string | null = null;

    if (role === "owner") {
      ownerId = userId;
    } else {
      // agent
      if (!bodyOwnerId) {
        res.status(400).json({ error: "owner_id is required for agents" });
        return;
      }
      const link = await db.query(
        "SELECT 1 FROM agent_clients WHERE agent_id = $1 AND owner_id = $2",
        [userId, bodyOwnerId],
      );
      if (link.rows.length === 0) {
        res.status(403).json({ error: "Not your client" });
        return;
      }
      ownerId = bodyOwnerId;
      createdByAgentId = userId;
    }

    const result = await db.query(
      `INSERT INTO properties
         (owner_id, created_by_agent_id, address, city, state, zip, beds, baths,
          property_type, monthly_rent_target, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING ${SELECT_COLS}`,
      [
        ownerId,
        createdByAgentId,
        address,
        city,
        state,
        zip || null,
        beds ?? 0,
        baths ?? 0,
        property_type || null,
        monthly_rent_target ?? null,
        notes || null,
      ],
    );
    res.status(201).json({ property: result.rows[0] });
  } catch (err) {
    console.error("Create property error:", err);
    res.status(500).json({ error: "Failed to create property" });
  }
});

// PUT /:id — update (owner OR linked agent)
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    const access = await userCanAccessProperty(userId, role, req.params.id);
    if (!access.allowed) {
      res.status(404).json({ error: "Property not found" });
      return;
    }

    const {
      address,
      city,
      state,
      zip,
      beds,
      baths,
      property_type,
      monthly_rent_target,
      notes,
    } = req.body;

    const result = await db.query(
      `UPDATE properties
          SET address = COALESCE($1, address),
              city = COALESCE($2, city),
              state = COALESCE($3, state),
              zip = $4,
              beds = COALESCE($5, beds),
              baths = COALESCE($6, baths),
              property_type = $7,
              monthly_rent_target = $8,
              notes = $9,
              updated_at = NOW()
        WHERE id = $10
        RETURNING ${SELECT_COLS}`,
      [
        address,
        city,
        state,
        zip ?? null,
        beds,
        baths,
        property_type ?? null,
        monthly_rent_target ?? null,
        notes ?? null,
        req.params.id,
      ],
    );
    res.json({ property: result.rows[0] });
  } catch (err) {
    console.error("Update property error:", err);
    res.status(500).json({ error: "Failed to update property" });
  }
});

// DELETE /:id — owner only
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "owner") {
      res.status(403).json({ error: "Only owners can delete properties" });
      return;
    }
    const result = await db.query(
      "DELETE FROM properties WHERE id = $1 AND owner_id = $2 RETURNING id",
      [req.params.id, userId],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Property not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Delete property error:", err);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

export default router;
```

- [ ] **Step 2: Smoke test as agent and as owner**

```bash
# As an agent (cookie from agent login):
curl -s -X POST http://localhost:3000/api/properties \
  -H "Content-Type: application/json" -H "Cookie: $AGENT_COOKIE" \
  -d '{"owner_id":"OWNER_UUID","address":"123 Main","city":"Miami","state":"FL","beds":3,"baths":2}' \
  | head -c 300
# Should return the new property with created_by_agent_id populated.

# As an owner — list properties:
curl -s http://localhost:3000/api/properties -H "Cookie: $OWNER_COOKIE" | head -c 500
```

- [ ] **Step 3: Commit**

```bash
git add api/src/routes/properties.ts
git commit -m "refactor(properties): adopt owner_id/created_by_agent_id schema with role-aware access"
```

---

### Task D2: Wire owner properties pages to API

**Files:**
- Modify: `web/src/app/(dashboard)/owner/properties/page.tsx`
- Modify: `web/src/app/(dashboard)/owner/properties/[id]/page.tsx`

- [ ] **Step 1: Replace `web/src/app/(dashboard)/owner/properties/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Property } from "@/lib/types";

export default function OwnerPropertiesPage() {
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/properties", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load properties");
        const data = await r.json();
        setProperties(data.properties);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900 mb-1">Properties</h1>
      <p className="text-xs text-gray-500 mb-5">Properties you own.</p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!properties && !error && <p className="text-sm text-gray-500">Loading…</p>}

      {properties && properties.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">
            No properties yet. Your agent will add properties for you.
          </p>
        </div>
      )}

      {properties && properties.length > 0 && (
        <ul className="space-y-2">
          {properties.map((p) => (
            <li key={p.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <Link href={`/owner/properties/${p.id}`} className="block">
                <p className="text-sm font-medium text-gray-900">{p.address}</p>
                <p className="text-xs text-gray-500">
                  {p.city}, {p.state} {p.zip || ""} · {p.beds} bd / {p.baths} ba
                  {p.property_type ? ` · ${p.property_type}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace `web/src/app/(dashboard)/owner/properties/[id]/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Property } from "@/lib/types";

export default function OwnerPropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/properties/${params.id}`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Property not found");
        const data = await r.json();
        setProperty(data.property);
      })
      .catch((e) => setError(e.message));
  }, [params.id]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!property) return;
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const body = {
      address: form.get("address"),
      city: form.get("city"),
      state: form.get("state"),
      zip: form.get("zip") || null,
      beds: Number(form.get("beds")) || 0,
      baths: Number(form.get("baths")) || 0,
      property_type: form.get("property_type") || null,
      monthly_rent_target: form.get("monthly_rent_target")
        ? Number(form.get("monthly_rent_target"))
        : null,
      notes: form.get("notes") || null,
    };
    try {
      const r = await fetch(`/api/properties/${params.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Failed to save");
      router.push("/owner/properties");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (error && !property) return <p className="text-sm text-red-600">{error}</p>;
  if (!property) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="max-w-[560px]">
      <h1 className="text-lg font-semibold text-gray-900 mb-1">Edit property</h1>
      <p className="text-xs text-gray-500 mb-5">
        Update the basic details for this property.
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Address" name="address" defaultValue={property.address} required />
        <div className="grid grid-cols-3 gap-3">
          <Field label="City" name="city" defaultValue={property.city} required />
          <Field label="State" name="state" defaultValue={property.state} required maxLength={2} />
          <Field label="Zip" name="zip" defaultValue={property.zip || ""} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Beds" name="beds" type="number" defaultValue={String(property.beds)} />
          <Field label="Baths" name="baths" type="number" defaultValue={String(property.baths)} />
          <Field
            label="Type"
            name="property_type"
            defaultValue={property.property_type || ""}
            placeholder="single-family, condo…"
          />
        </div>
        <Field
          label="Monthly rent target"
          name="monthly_rent_target"
          type="number"
          defaultValue={property.monthly_rent_target ? String(property.monthly_rent_target) : ""}
        />
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={property.notes || ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="bg-brand text-white px-4 py-2 rounded-md text-xs font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  maxLength,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
      />
    </div>
  );
}
```

- [ ] **Step 3: Smoke test**

Open `/owner/properties` in the browser as the test owner; create a property in psql first if there are none, then verify it lists; click in and edit.

- [ ] **Step 4: Commit**

```bash
git add "web/src/app/(dashboard)/owner/properties"
git commit -m "feat(web): wire owner properties list and detail to API"
```

---

## Phase E: Storage + Tenant CRUD

### Task E1: Local storage abstraction with tests

**Files:**
- Create: `api/src/storage/local.ts`
- Create: `api/test/storage.test.ts`

- [ ] **Step 1: Failing test**

`api/test/storage.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { createLocalStorage } from "../src/storage/local.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ps-storage-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("createLocalStorage", () => {
  it("put writes a file under root and get reads it back", async () => {
    const storage = createLocalStorage(tmpDir);
    await storage.put("a/b.txt", Buffer.from("hello"));
    const out = await storage.get("a/b.txt");
    expect(out.toString()).toBe("hello");
  });

  it("put refuses keys that try to escape the root", async () => {
    const storage = createLocalStorage(tmpDir);
    await expect(storage.put("../escape.txt", Buffer.from("x"))).rejects.toThrow();
    await expect(storage.put("/abs/path.txt", Buffer.from("x"))).rejects.toThrow();
  });

  it("delete removes the file", async () => {
    const storage = createLocalStorage(tmpDir);
    await storage.put("c.txt", Buffer.from("data"));
    await storage.delete("c.txt");
    await expect(storage.get("c.txt")).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run, expect fail**

```bash
npm run test -w api
```

- [ ] **Step 3: Implement `api/src/storage/local.ts`**

```ts
import fs from "fs/promises";
import path from "path";

export interface Storage {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  resolveAbsolute(key: string): string;
}

function safeResolve(rootAbs: string, key: string): string {
  if (path.isAbsolute(key)) {
    throw new Error("storage key must be relative");
  }
  const target = path.resolve(rootAbs, key);
  if (target !== rootAbs && !target.startsWith(rootAbs + path.sep)) {
    throw new Error("storage key escapes the root");
  }
  return target;
}

export function createLocalStorage(rootDir: string): Storage {
  const rootAbs = path.resolve(rootDir);
  return {
    async put(key, data) {
      const target = safeResolve(rootAbs, key);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, data);
    },
    async get(key) {
      const target = safeResolve(rootAbs, key);
      return fs.readFile(target);
    },
    async delete(key) {
      const target = safeResolve(rootAbs, key);
      await fs.rm(target, { force: true });
    },
    resolveAbsolute(key) {
      return safeResolve(rootAbs, key);
    },
  };
}
```

- [ ] **Step 4: Run, expect pass**

```bash
npm run test -w api
```

Expected: 3 storage tests pass (plus the existing invite-token tests).

- [ ] **Step 5: Commit**

```bash
git add api/src/storage/local.ts api/test/storage.test.ts
git commit -m "feat(storage): local filesystem storage abstraction"
```

---

### Task E2: Tenants CRUD route (no docs/eval yet)

**Files:**
- Create: `api/src/routes/tenants.ts`
- Modify: `api/src/index.ts` (register route)

- [ ] **Step 1: Create `api/src/routes/tenants.ts`**

```ts
import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { JwtPayload } from "../types.js";
import { db } from "../db/client.js";

const router = Router();

const TENANT_COLS = `id, property_id, created_by_agent_id, status, applicant_name,
                     email, phone, employer, monthly_income, move_in_date, notes,
                     shared_at, decided_at, decision_by_user_id, decision_note,
                     created_at, updated_at`;

// Returns { allowed, role, ownerId } if the caller can access the tenant.
//   - owner: only when the tenant's property belongs to them AND status is 'shared'/'approved'/'rejected'
//   - agent: only when they are linked to the property's owner
async function tenantAccess(
  userId: string,
  role: string,
  tenantId: string,
): Promise<
  | { allowed: false }
  | { allowed: true; ownerId: string; status: string; propertyId: string }
> {
  const result = await db.query(
    `SELECT t.id, t.status, t.property_id, p.owner_id
       FROM tenants t
       JOIN properties p ON p.id = t.property_id
      WHERE t.id = $1`,
    [tenantId],
  );
  if (result.rows.length === 0) return { allowed: false };
  const row = result.rows[0];

  if (role === "owner") {
    if (row.owner_id !== userId) return { allowed: false };
    // Owners only see tenants once shared (or after a decision)
    if (!["shared", "approved", "rejected"].includes(row.status)) {
      return { allowed: false };
    }
    return {
      allowed: true,
      ownerId: row.owner_id,
      status: row.status,
      propertyId: row.property_id,
    };
  }

  // agent
  const link = await db.query(
    "SELECT 1 FROM agent_clients WHERE agent_id = $1 AND owner_id = $2",
    [userId, row.owner_id],
  );
  if (link.rows.length === 0) return { allowed: false };
  return {
    allowed: true,
    ownerId: row.owner_id,
    status: row.status,
    propertyId: row.property_id,
  };
}

// GET / — list tenants
//   - owner: only their shared/decided tenants
//   - agent: tenants for any property of any linked owner; supports
//     ?owner_id, ?property_id, ?status filters.
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    const ownerId = req.query.owner_id as string | undefined;
    const propertyId = req.query.property_id as string | undefined;
    const status = req.query.status as string | undefined;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let join = "JOIN properties p ON p.id = t.property_id";

    if (role === "owner") {
      conditions.push(`p.owner_id = $${params.push(userId)}`);
      conditions.push(`t.status IN ('shared','approved','rejected')`);
    } else {
      // agent — must be linked to the property's owner
      join += ` JOIN agent_clients ac ON ac.owner_id = p.owner_id AND ac.agent_id = $${params.push(userId)}`;
      if (ownerId) conditions.push(`p.owner_id = $${params.push(ownerId)}`);
    }

    if (propertyId) conditions.push(`t.property_id = $${params.push(propertyId)}`);
    if (status) conditions.push(`t.status = $${params.push(status)}`);

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await db.query(
      `SELECT t.${TENANT_COLS.replace(/, /g, ", t.")},
              p.address AS property_address, p.city AS property_city, p.state AS property_state
         FROM tenants t
         ${join}
         ${where}
         ORDER BY t.created_at DESC`,
      params,
    );
    res.json({ tenants: result.rows });
  } catch (err) {
    console.error("List tenants error:", err);
    res.status(500).json({ error: "Failed to list tenants" });
  }
});

// GET /:id
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    const access = await tenantAccess(userId, role, req.params.id);
    if (!access.allowed) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const result = await db.query(
      `SELECT ${TENANT_COLS} FROM tenants WHERE id = $1`,
      [req.params.id],
    );
    res.json({ tenant: result.rows[0] });
  } catch (err) {
    console.error("Get tenant error:", err);
    res.status(500).json({ error: "Failed to get tenant" });
  }
});

// POST / — create a tenant (agent only)
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "agent") {
      res.status(403).json({ error: "Only agents can create tenants" });
      return;
    }

    const { property_id, applicant_name, notes } = req.body;
    if (!property_id) {
      res.status(400).json({ error: "property_id is required" });
      return;
    }

    // Verify the agent is linked to the property's owner
    const link = await db.query(
      `SELECT p.id
         FROM properties p
         JOIN agent_clients ac ON ac.owner_id = p.owner_id AND ac.agent_id = $1
        WHERE p.id = $2`,
      [userId, property_id],
    );
    if (link.rows.length === 0) {
      res.status(403).json({ error: "Not your client's property" });
      return;
    }

    const result = await db.query(
      `INSERT INTO tenants
         (property_id, created_by_agent_id, status, applicant_name, notes)
       VALUES ($1, $2, 'draft', $3, $4)
       RETURNING ${TENANT_COLS}`,
      [property_id, userId, applicant_name || null, notes || null],
    );
    res.status(201).json({ tenant: result.rows[0] });
  } catch (err) {
    console.error("Create tenant error:", err);
    res.status(500).json({ error: "Failed to create tenant" });
  }
});

// PATCH /:id — update basic fields (agent only, draft/ready statuses)
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "agent") {
      res.status(403).json({ error: "Only agents can edit tenants" });
      return;
    }
    const access = await tenantAccess(userId, role, req.params.id);
    if (!access.allowed) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const {
      applicant_name,
      email,
      phone,
      employer,
      monthly_income,
      move_in_date,
      notes,
    } = req.body;

    const result = await db.query(
      `UPDATE tenants
          SET applicant_name = COALESCE($1, applicant_name),
              email = COALESCE($2, email),
              phone = COALESCE($3, phone),
              employer = COALESCE($4, employer),
              monthly_income = COALESCE($5, monthly_income),
              move_in_date = COALESCE($6, move_in_date),
              notes = COALESCE($7, notes),
              updated_at = NOW()
        WHERE id = $8
        RETURNING ${TENANT_COLS}`,
      [
        applicant_name ?? null,
        email ?? null,
        phone ?? null,
        employer ?? null,
        monthly_income ?? null,
        move_in_date ?? null,
        notes ?? null,
        req.params.id,
      ],
    );
    res.json({ tenant: result.rows[0] });
  } catch (err) {
    console.error("Update tenant error:", err);
    res.status(500).json({ error: "Failed to update tenant" });
  }
});

export default router;
```

- [ ] **Step 2: Register the route in `api/src/index.ts`**

Add import + `app.use`:

```ts
import tenantRoutes from "./routes/tenants.js";
// ...
app.use("/api/tenants", tenantRoutes);
```

- [ ] **Step 3: Smoke test (agent only)**

```bash
# As agent:
curl -s -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" -H "Cookie: $AGENT_COOKIE" \
  -d '{"property_id":"PROPERTY_UUID","applicant_name":"Jane Doe"}' | head -c 300

curl -s http://localhost:3000/api/tenants -H "Cookie: $AGENT_COOKIE" | head -c 500
```

Expected: tenant created with `status='draft'` and listed.

- [ ] **Step 4: Commit**

```bash
git add api/src/routes/tenants.ts api/src/index.ts
git commit -m "feat(tenants): CRUD route with role-aware access"
```

---

## Phase F: Document Upload

### Task F1: Tenant documents endpoints (multer + local storage)

**Files:**
- Create: `api/src/routes/tenant-documents.ts`
- Modify: `api/src/index.ts`

- [ ] **Step 1: Create `api/src/routes/tenant-documents.ts`**

```ts
import { Router, Request, Response } from "express";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import { requireAuth } from "../middleware/auth.js";
import { JwtPayload, DocumentCategory } from "../types.js";
import { db } from "../db/client.js";
import { config } from "../config.js";
import { createLocalStorage } from "../storage/local.js";

const router = Router();
const storage = createLocalStorage(config.uploadDir);

const ALLOWED_CATEGORIES: DocumentCategory[] = [
  "application",
  "id",
  "income",
  "credit",
  "reference",
  "other",
];

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error("Unsupported file type"));
      return;
    }
    cb(null, true);
  },
});

async function tenantOwnedByAgent(agentId: string, tenantId: string): Promise<boolean> {
  const r = await db.query(
    `SELECT 1
       FROM tenants t
       JOIN properties p ON p.id = t.property_id
       JOIN agent_clients ac ON ac.owner_id = p.owner_id AND ac.agent_id = $1
      WHERE t.id = $2`,
    [agentId, tenantId],
  );
  return r.rows.length > 0;
}

async function tenantOwnedByOwnerForView(
  ownerId: string,
  tenantId: string,
): Promise<boolean> {
  const r = await db.query(
    `SELECT 1
       FROM tenants t
       JOIN properties p ON p.id = t.property_id
      WHERE t.id = $1 AND p.owner_id = $2 AND t.status IN ('shared','approved','rejected')`,
    [tenantId, ownerId],
  );
  return r.rows.length > 0;
}

// POST /:tenantId — upload one file (agent only)
router.post(
  "/:tenantId",
  requireAuth,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const { userId, role } = req.user as JwtPayload;
      if (role !== "agent") {
        res.status(403).json({ error: "Only agents can upload documents" });
        return;
      }
      const ok = await tenantOwnedByAgent(userId, req.params.tenantId);
      if (!ok) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }
      const category = (req.body.category as string) as DocumentCategory;
      if (!ALLOWED_CATEGORIES.includes(category)) {
        res.status(400).json({ error: "Invalid category" });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: "file is required" });
        return;
      }

      const ext = path.extname(req.file.originalname).slice(0, 10) || "";
      const id = crypto.randomUUID();
      const storageKey = `tenants/${req.params.tenantId}/${id}${ext}`;
      await storage.put(storageKey, req.file.buffer);

      const insert = await db.query(
        `INSERT INTO tenant_documents
           (id, tenant_id, category, filename, storage_key, mime_type, size_bytes, uploaded_by_user_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [
          id,
          req.params.tenantId,
          category,
          req.file.originalname,
          storageKey,
          req.file.mimetype,
          req.file.size,
          userId,
        ],
      );
      res.status(201).json({ document: insert.rows[0] });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: (err as Error).message || "Upload failed" });
    }
  },
);

// GET /:tenantId — list documents (agent or shared-tenant owner)
router.get("/:tenantId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    const ok =
      role === "agent"
        ? await tenantOwnedByAgent(userId, req.params.tenantId)
        : await tenantOwnedByOwnerForView(userId, req.params.tenantId);
    if (!ok) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }
    const result = await db.query(
      `SELECT * FROM tenant_documents WHERE tenant_id = $1 ORDER BY uploaded_at`,
      [req.params.tenantId],
    );
    res.json({ documents: result.rows });
  } catch (err) {
    console.error("List documents error:", err);
    res.status(500).json({ error: "Failed to list documents" });
  }
});

// GET /:tenantId/:documentId/file — download
router.get(
  "/:tenantId/:documentId/file",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { userId, role } = req.user as JwtPayload;
      const ok =
        role === "agent"
          ? await tenantOwnedByAgent(userId, req.params.tenantId)
          : await tenantOwnedByOwnerForView(userId, req.params.tenantId);
      if (!ok) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }
      const docResult = await db.query(
        `SELECT * FROM tenant_documents WHERE id = $1 AND tenant_id = $2`,
        [req.params.documentId, req.params.tenantId],
      );
      if (docResult.rows.length === 0) {
        res.status(404).json({ error: "Document not found" });
        return;
      }
      const doc = docResult.rows[0];
      const buf = await storage.get(doc.storage_key);
      res.setHeader("Content-Type", doc.mime_type);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(doc.filename)}"`,
      );
      res.send(buf);
    } catch (err) {
      console.error("Download error:", err);
      res.status(500).json({ error: "Failed to fetch document" });
    }
  },
);

// DELETE /:tenantId/:documentId — agent only
router.delete(
  "/:tenantId/:documentId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { userId, role } = req.user as JwtPayload;
      if (role !== "agent") {
        res.status(403).json({ error: "Only agents can delete documents" });
        return;
      }
      const ok = await tenantOwnedByAgent(userId, req.params.tenantId);
      if (!ok) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }
      const docResult = await db.query(
        `DELETE FROM tenant_documents
            WHERE id = $1 AND tenant_id = $2
        RETURNING storage_key`,
        [req.params.documentId, req.params.tenantId],
      );
      if (docResult.rows.length === 0) {
        res.status(404).json({ error: "Document not found" });
        return;
      }
      try {
        await storage.delete(docResult.rows[0].storage_key);
      } catch {
        // log only; row already gone
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Delete document error:", err);
      res.status(500).json({ error: "Failed to delete document" });
    }
  },
);

export default router;
```

- [ ] **Step 2: Register the route in `api/src/index.ts`**

```ts
import tenantDocumentRoutes from "./routes/tenant-documents.js";
// ...
app.use("/api/tenant-documents", tenantDocumentRoutes);
```

- [ ] **Step 3: Add `api/uploads/` to `.gitignore`**

Append to root `.gitignore`:

```
api/uploads/
```

- [ ] **Step 4: Smoke test**

```bash
# As agent:
curl -s -X POST http://localhost:3000/api/tenant-documents/$TENANT_ID \
  -H "Cookie: $AGENT_COOKIE" \
  -F "category=income" -F "file=@/path/to/some.pdf" | head -c 300

curl -s http://localhost:3000/api/tenant-documents/$TENANT_ID \
  -H "Cookie: $AGENT_COOKIE" | head -c 500
```

Expected: 201 with the document row; list shows it. File present under `api/uploads/tenants/<tenantId>/`.

- [ ] **Step 5: Commit**

```bash
git add api/src/routes/tenant-documents.ts api/src/index.ts .gitignore
git commit -m "feat(tenant-docs): upload, list, download, delete with multer + local storage"
```

---

## Phase G: AI Pipeline

The model used here is `claude-opus-4-7` (the latest Claude Opus 4.X). All calls use the Anthropic SDK already in `api/package.json`.

### Task G1: Prompts module

**Files:**
- Create: `api/src/agents/tenant-eval/prompts.ts`

- [ ] **Step 1: Create the file**

```ts
export const COMPLIANCE_GUARDRAILS = `You produce tenant-evaluation outputs that comply with the Fair Housing Act and the Fair Credit Reporting Act:
- Do NOT reference protected-class attributes: race, color, religion, national origin, sex, familial status, disability, age (except as legally permitted), or source-of-income (except as legally permitted).
- Do NOT infer any of the above from a person's name, photo, or document content.
- Every claim you make in 'concerns' or 'verified_facts' MUST cite a specific source_document_id from the documents you were given.
- Your output is advisory only. The human reviewer makes the final decision.
- If you cannot find evidence for a claim, do not make the claim.`;

export const EXTRACT_SYSTEM = `You read tenant-application documents and return JSON with the applicant's basic information. ${COMPLIANCE_GUARDRAILS}

Return ONLY valid JSON matching this shape:
{
  "applicant_name": string | null,
  "email": string | null,
  "phone": string | null,
  "employer": string | null,
  "monthly_income": number | null,
  "move_in_date": string | null  // ISO YYYY-MM-DD
}

Use null for any field you cannot confidently determine.`;

export const EVALUATE_SYSTEM = `You evaluate a prospective tenant for a rental property using the documents provided and the applicant details supplied. Score four categories on a 0-100 scale and produce an overall score that summarizes the candidate's risk profile from a financial-fitness perspective only.

${COMPLIANCE_GUARDRAILS}

Categories:
- income: ratio of stated monthly income to the property's monthly rent target, plus stability/verifiability evidence.
- credit: signals from credit reports/background docs about creditworthiness and payment history.
- history: prior-rental history and references.
- identity: identity verification — does an ID document corroborate the applicant_name?

Return ONLY valid JSON matching this shape:
{
  "overall_score": integer 0-100,
  "recommendation": "low_risk" | "review" | "high_risk",
  "category_scores": {
    "income":   { "score": integer 0-100, "summary": string },
    "credit":   { "score": integer 0-100, "summary": string },
    "history":  { "score": integer 0-100, "summary": string },
    "identity": { "score": integer 0-100, "summary": string }
  },
  "summary": string,                 // 2-4 sentence narrative
  "concerns": [{ "text": string, "source_document_id": string }],
  "verified_facts": [{ "text": string, "source_document_id": string }]
}`;

export const MODEL_ID = "claude-opus-4-7";
```

- [ ] **Step 2: Commit**

```bash
git add api/src/agents/tenant-eval/prompts.ts
git commit -m "feat(ai): tenant-eval prompts and compliance guardrails"
```

---

### Task G2: Eval-output parsing with tests

**Files:**
- Create: `api/src/agents/tenant-eval/parse.ts`
- Create: `api/test/eval-parsing.test.ts`

- [ ] **Step 1: Failing tests**

`api/test/eval-parsing.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseExtractionJson, parseEvaluationJson } from "../src/agents/tenant-eval/parse.js";

describe("parseExtractionJson", () => {
  it("parses well-formed JSON", () => {
    const out = parseExtractionJson(
      '{"applicant_name":"Jane","email":null,"phone":null,"employer":null,"monthly_income":4200,"move_in_date":null}',
    );
    expect(out.applicant_name).toBe("Jane");
    expect(out.monthly_income).toBe(4200);
  });

  it("strips ```json fences", () => {
    const wrapped = "```json\n{\"applicant_name\":\"Jane\",\"email\":null,\"phone\":null,\"employer\":null,\"monthly_income\":null,\"move_in_date\":null}\n```";
    const out = parseExtractionJson(wrapped);
    expect(out.applicant_name).toBe("Jane");
  });

  it("throws on malformed JSON", () => {
    expect(() => parseExtractionJson("not json")).toThrow();
  });
});

describe("parseEvaluationJson", () => {
  const valid = JSON.stringify({
    overall_score: 78,
    recommendation: "review",
    category_scores: {
      income:   { score: 80, summary: "ok" },
      credit:   { score: 70, summary: "ok" },
      history:  { score: 85, summary: "ok" },
      identity: { score: 90, summary: "ok" },
    },
    summary: "looks fine",
    concerns: [{ text: "small late payment", source_document_id: "doc-1" }],
    verified_facts: [{ text: "income ok", source_document_id: "doc-2" }],
  });

  it("parses a valid response", () => {
    const out = parseEvaluationJson(valid);
    expect(out.overall_score).toBe(78);
    expect(out.recommendation).toBe("review");
    expect(out.category_scores.income.score).toBe(80);
    expect(out.concerns).toHaveLength(1);
  });

  it("rejects missing categories", () => {
    const broken = JSON.parse(valid);
    delete broken.category_scores.identity;
    expect(() => parseEvaluationJson(JSON.stringify(broken))).toThrow();
  });

  it("rejects unknown recommendation", () => {
    const broken = JSON.parse(valid);
    broken.recommendation = "definitely_yes";
    expect(() => parseEvaluationJson(JSON.stringify(broken))).toThrow();
  });
});
```

- [ ] **Step 2: Run, expect fail.**

```bash
npm run test -w api
```

- [ ] **Step 3: Implement `api/src/agents/tenant-eval/parse.ts`**

```ts
import type { CategoryScores, EvalCitation } from "../../types.js";

function stripFences(s: string): string {
  const match = s.match(/```(?:json)?\s*([\s\S]+?)```/);
  return match ? match[1].trim() : s.trim();
}

export interface ExtractionResult {
  applicant_name: string | null;
  email: string | null;
  phone: string | null;
  employer: string | null;
  monthly_income: number | null;
  move_in_date: string | null;
}

export function parseExtractionJson(raw: string): ExtractionResult {
  const obj = JSON.parse(stripFences(raw));
  const fields: (keyof ExtractionResult)[] = [
    "applicant_name",
    "email",
    "phone",
    "employer",
    "monthly_income",
    "move_in_date",
  ];
  const out: ExtractionResult = {
    applicant_name: null,
    email: null,
    phone: null,
    employer: null,
    monthly_income: null,
    move_in_date: null,
  };
  for (const f of fields) {
    if (obj[f] === undefined) continue;
    out[f] = obj[f] === null ? null : (obj[f] as never);
  }
  return out;
}

export interface EvaluationResult {
  overall_score: number;
  recommendation: "low_risk" | "review" | "high_risk";
  category_scores: CategoryScores;
  summary: string;
  concerns: EvalCitation[];
  verified_facts: EvalCitation[];
}

const REC_VALUES = ["low_risk", "review", "high_risk"] as const;
const CATEGORIES = ["income", "credit", "history", "identity"] as const;

export function parseEvaluationJson(raw: string): EvaluationResult {
  const obj = JSON.parse(stripFences(raw));

  if (typeof obj.overall_score !== "number") {
    throw new Error("missing overall_score");
  }
  if (!REC_VALUES.includes(obj.recommendation)) {
    throw new Error(`invalid recommendation: ${obj.recommendation}`);
  }
  if (!obj.category_scores || typeof obj.category_scores !== "object") {
    throw new Error("missing category_scores");
  }
  for (const cat of CATEGORIES) {
    const cs = obj.category_scores[cat];
    if (!cs || typeof cs.score !== "number" || typeof cs.summary !== "string") {
      throw new Error(`category_scores.${cat} missing or malformed`);
    }
  }
  if (typeof obj.summary !== "string") {
    throw new Error("summary must be a string");
  }
  if (!Array.isArray(obj.concerns)) throw new Error("concerns must be an array");
  if (!Array.isArray(obj.verified_facts)) {
    throw new Error("verified_facts must be an array");
  }

  return {
    overall_score: Math.round(obj.overall_score),
    recommendation: obj.recommendation,
    category_scores: obj.category_scores,
    summary: obj.summary,
    concerns: obj.concerns.map((c: EvalCitation) => ({
      text: c.text,
      source_document_id: c.source_document_id ?? null,
    })),
    verified_facts: obj.verified_facts.map((c: EvalCitation) => ({
      text: c.text,
      source_document_id: c.source_document_id ?? null,
    })),
  };
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
npm run test -w api
```

- [ ] **Step 5: Commit**

```bash
git add api/src/agents/tenant-eval/parse.ts api/test/eval-parsing.test.ts
git commit -m "feat(ai): JSON parsing for extraction and evaluation responses"
```

---

### Task G3: Build content blocks from documents

**Files:**
- Create: `api/src/agents/tenant-eval/build-content.ts`

The Anthropic SDK accepts an array of content blocks per message — text and images, and PDFs as base64-encoded `application/pdf`. We build that array from `tenant_documents` rows, including the `document_id` so the model can cite.

- [ ] **Step 1: Create**

```ts
import { TenantDocument } from "../../types.js";
import { Storage } from "../../storage/local.js";
import pdfParse from "pdf-parse";

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | {
      type: "document";
      source: { type: "base64"; media_type: "application/pdf"; data: string };
    };

export async function buildDocumentBlocks(
  storage: Storage,
  docs: TenantDocument[],
): Promise<ContentBlock[]> {
  const blocks: ContentBlock[] = [];

  for (const doc of docs) {
    blocks.push({
      type: "text",
      text: `--- Document ---\ndocument_id: ${doc.id}\ncategory: ${doc.category}\nfilename: ${doc.filename}`,
    });

    const buf = await storage.get(doc.storage_key);

    if (doc.mime_type === "application/pdf") {
      // Try to extract text for context, AND include the raw PDF for vision/parsing.
      try {
        const parsed = await pdfParse(buf);
        if (parsed.text && parsed.text.trim().length > 0) {
          blocks.push({
            type: "text",
            text: `Extracted text from ${doc.filename}:\n${parsed.text.slice(0, 50_000)}`,
          });
        }
      } catch {
        // pdf-parse failed; fall back to including the raw PDF only
      }
      blocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: buf.toString("base64"),
        },
      });
    } else if (doc.mime_type.startsWith("image/")) {
      blocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: doc.mime_type,
          data: buf.toString("base64"),
        },
      });
    } else {
      blocks.push({
        type: "text",
        text: `(Unsupported MIME type ${doc.mime_type} for ${doc.filename}; skipping body.)`,
      });
    }
  }

  return blocks;
}
```

- [ ] **Step 2: Commit**

```bash
git add api/src/agents/tenant-eval/build-content.ts
git commit -m "feat(ai): content-block builder for documents (PDF text + raw + images)"
```

---

### Task G4: Extraction call

**Files:**
- Create: `api/src/agents/tenant-eval/extract.ts`

- [ ] **Step 1: Create**

```ts
import Anthropic from "@anthropic-ai/sdk";
import { config } from "../../config.js";
import { TenantDocument } from "../../types.js";
import { Storage } from "../../storage/local.js";
import { EXTRACT_SYSTEM, MODEL_ID } from "./prompts.js";
import { buildDocumentBlocks } from "./build-content.js";
import { parseExtractionJson, ExtractionResult } from "./parse.js";

export async function runExtraction(
  storage: Storage,
  docs: TenantDocument[],
): Promise<ExtractionResult> {
  const client = new Anthropic({ apiKey: config.anthropicApiKey });
  const blocks = await buildDocumentBlocks(storage, docs);

  const message = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: EXTRACT_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          ...blocks,
          {
            type: "text",
            text: "Extract the basic applicant info as JSON.",
          },
        ],
      },
    ],
  });

  const text = message.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  return parseExtractionJson(text);
}
```

- [ ] **Step 2: Commit**

```bash
git add api/src/agents/tenant-eval/extract.ts
git commit -m "feat(ai): extraction call using Claude with prompt caching"
```

---

### Task G5: Evaluation call

**Files:**
- Create: `api/src/agents/tenant-eval/evaluate.ts`

- [ ] **Step 1: Create**

```ts
import Anthropic from "@anthropic-ai/sdk";
import { config } from "../../config.js";
import { Tenant, TenantDocument, Property } from "../../types.js";
import { Storage } from "../../storage/local.js";
import { EVALUATE_SYSTEM, MODEL_ID } from "./prompts.js";
import { buildDocumentBlocks } from "./build-content.js";
import { parseEvaluationJson, EvaluationResult } from "./parse.js";

export async function runEvaluation(
  storage: Storage,
  tenant: Tenant,
  property: Property,
  docs: TenantDocument[],
): Promise<{ result: EvaluationResult; modelUsed: string }> {
  const client = new Anthropic({ apiKey: config.anthropicApiKey });
  const blocks = await buildDocumentBlocks(storage, docs);

  const summary = `Applicant: ${tenant.applicant_name || "(unspecified)"}
Stated employer: ${tenant.employer || "(unspecified)"}
Stated monthly income: ${tenant.monthly_income ?? "(unspecified)"}
Target move-in: ${tenant.move_in_date ?? "(unspecified)"}
Property: ${property.address}, ${property.city}, ${property.state}
Beds/baths: ${property.beds}/${property.baths}
Monthly rent target: ${property.monthly_rent_target ?? "(unspecified)"}`;

  const message = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: EVALUATE_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: summary },
          ...blocks,
          { type: "text", text: "Produce the evaluation JSON now." },
        ],
      },
    ],
  });

  const text = message.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  return { result: parseEvaluationJson(text), modelUsed: MODEL_ID };
}
```

- [ ] **Step 2: Commit**

```bash
git add api/src/agents/tenant-eval/evaluate.ts
git commit -m "feat(ai): evaluation call producing scored output"
```

---

### Task G6: Wire extraction + evaluation endpoints into tenants route

**Files:**
- Modify: `api/src/routes/tenants.ts`

Add three new endpoints to the existing tenants router: `POST /:id/extract`, `POST /:id/evaluate`, `GET /:id/evaluation`. Append the code below to the file (above `export default router;`).

- [ ] **Step 1: Add imports near the top**

```ts
import { runExtraction } from "../agents/tenant-eval/extract.js";
import { runEvaluation } from "../agents/tenant-eval/evaluate.js";
import { createLocalStorage } from "../storage/local.js";
import { config as appConfig } from "../config.js";
```

Add right after the existing imports:

```ts
const storage = createLocalStorage(appConfig.uploadDir);
```

- [ ] **Step 2: Append the three handlers above `export default router;`**

```ts
// POST /:id/extract — agent-only. Run AI extraction, write to tenants row,
// return the updated tenant. Inline (no queue).
router.post("/:id/extract", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "agent") {
      res.status(403).json({ error: "Only agents can run extraction" });
      return;
    }
    const access = await tenantAccess(userId, role, req.params.id);
    if (!access.allowed) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const docs = await db.query(
      `SELECT * FROM tenant_documents WHERE tenant_id = $1`,
      [req.params.id],
    );
    if (docs.rows.length === 0) {
      res.status(400).json({ error: "Upload at least one document first" });
      return;
    }

    const extracted = await runExtraction(storage, docs.rows);
    const updated = await db.query(
      `UPDATE tenants
          SET applicant_name = COALESCE(applicant_name, $1),
              email          = COALESCE(email, $2),
              phone          = COALESCE(phone, $3),
              employer       = COALESCE(employer, $4),
              monthly_income = COALESCE(monthly_income, $5),
              move_in_date   = COALESCE(move_in_date, $6),
              updated_at = NOW()
        WHERE id = $7
        RETURNING ${TENANT_COLS}`,
      [
        extracted.applicant_name,
        extracted.email,
        extracted.phone,
        extracted.employer,
        extracted.monthly_income,
        extracted.move_in_date,
        req.params.id,
      ],
    );
    res.json({ tenant: updated.rows[0], extracted });
  } catch (err) {
    console.error("Extraction error:", err);
    res.status(500).json({ error: (err as Error).message || "Extraction failed" });
  }
});

// POST /:id/evaluate — agent-only. Creates a tenant_evaluations row in 'running'
// status, returns it immediately, and runs the model in the background. Polls
// via GET /:id/evaluation.
router.post("/:id/evaluate", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "agent") {
      res.status(403).json({ error: "Only agents can run evaluations" });
      return;
    }
    const access = await tenantAccess(userId, role, req.params.id);
    if (!access.allowed) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const tenant = await db.query(`SELECT * FROM tenants WHERE id = $1`, [
      req.params.id,
    ]);
    const property = await db.query(
      `SELECT * FROM properties WHERE id = $1`,
      [tenant.rows[0].property_id],
    );
    const docs = await db.query(
      `SELECT * FROM tenant_documents WHERE tenant_id = $1`,
      [req.params.id],
    );
    if (docs.rows.length === 0) {
      res.status(400).json({ error: "Upload documents first" });
      return;
    }

    const evalRow = await db.query(
      `INSERT INTO tenant_evaluations (tenant_id, status)
       VALUES ($1, 'running')
       RETURNING *`,
      [req.params.id],
    );
    await db.query(
      `UPDATE tenants SET status = 'evaluating', updated_at = NOW() WHERE id = $1`,
      [req.params.id],
    );

    // Fire-and-forget
    (async () => {
      try {
        const { result, modelUsed } = await runEvaluation(
          storage,
          tenant.rows[0],
          property.rows[0],
          docs.rows,
        );
        await db.query(
          `UPDATE tenant_evaluations
              SET status = 'complete',
                  overall_score = $1,
                  recommendation = $2,
                  category_scores = $3,
                  summary = $4,
                  concerns = $5,
                  verified_facts = $6,
                  model_used = $7,
                  completed_at = NOW()
            WHERE id = $8`,
          [
            result.overall_score,
            result.recommendation,
            JSON.stringify(result.category_scores),
            result.summary,
            JSON.stringify(result.concerns),
            JSON.stringify(result.verified_facts),
            modelUsed,
            evalRow.rows[0].id,
          ],
        );
        await db.query(
          `UPDATE tenants SET status = 'ready', updated_at = NOW() WHERE id = $1`,
          [req.params.id],
        );
      } catch (err) {
        await db.query(
          `UPDATE tenant_evaluations
              SET status = 'failed', error = $1, completed_at = NOW()
            WHERE id = $2`,
          [(err as Error).message, evalRow.rows[0].id],
        );
        await db.query(
          `UPDATE tenants SET status = 'draft', updated_at = NOW() WHERE id = $1`,
          [req.params.id],
        );
      }
    })();

    res.status(202).json({ evaluation: evalRow.rows[0] });
  } catch (err) {
    console.error("Evaluate error:", err);
    res.status(500).json({ error: "Failed to start evaluation" });
  }
});

// GET /:id/evaluation — return the latest evaluation (any status)
router.get("/:id/evaluation", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    const access = await tenantAccess(userId, role, req.params.id);
    if (!access.allowed) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }
    const result = await db.query(
      `SELECT * FROM tenant_evaluations
        WHERE tenant_id = $1
        ORDER BY created_at DESC
        LIMIT 1`,
      [req.params.id],
    );
    if (result.rows.length === 0) {
      res.json({ evaluation: null });
      return;
    }
    res.json({ evaluation: result.rows[0] });
  } catch (err) {
    console.error("Get evaluation error:", err);
    res.status(500).json({ error: "Failed to get evaluation" });
  }
});
```

- [ ] **Step 3: Smoke test (requires real Anthropic API key)**

```bash
# As agent, with a tenant that has at least one uploaded document:
curl -s -X POST http://localhost:3000/api/tenants/$TENANT_ID/extract \
  -H "Cookie: $AGENT_COOKIE" | head -c 500
curl -s -X POST http://localhost:3000/api/tenants/$TENANT_ID/evaluate \
  -H "Cookie: $AGENT_COOKIE" | head -c 500
# Wait ~15s, then poll:
curl -s http://localhost:3000/api/tenants/$TENANT_ID/evaluation \
  -H "Cookie: $AGENT_COOKIE" | head -c 800
```

Expected: `extract` returns updated tenant + extracted JSON. `evaluate` returns 202 with a `running` evaluation row. After polling, status becomes `complete` with scores.

- [ ] **Step 4: Commit**

```bash
git add api/src/routes/tenants.ts
git commit -m "feat(tenants): /extract, /evaluate, /evaluation endpoints driven by Claude"
```

---

## Phase H: Threads, Sharing, Decisions

### Task H1: Thread + share/unshare/decision/reopen endpoints

**Files:**
- Modify: `api/src/routes/tenants.ts`

Add four more handler groups to the tenants router. (Email triggers wired in Phase I.)

- [ ] **Step 1: Append above `export default router;`**

```ts
// GET /:id/thread — list events (chronological)
router.get("/:id/thread", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    const access = await tenantAccess(userId, role, req.params.id);
    if (!access.allowed) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }
    const result = await db.query(
      `SELECT te.id, te.tenant_id, te.type, te.author_user_id, te.body, te.created_at,
              u.name AS author_name, u.role AS author_role
         FROM tenant_thread_events te
         JOIN users u ON u.id = te.author_user_id
        WHERE te.tenant_id = $1
        ORDER BY te.created_at ASC`,
      [req.params.id],
    );
    res.json({ events: result.rows });
  } catch (err) {
    console.error("List thread error:", err);
    res.status(500).json({ error: "Failed to list thread" });
  }
});

// POST /:id/thread — post a message (agent or owner). Owners can only post
// when status is shared/approved/rejected.
router.post("/:id/thread", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    const access = await tenantAccess(userId, role, req.params.id);
    if (!access.allowed) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const body = (req.body.body as string | undefined)?.trim();
    if (!body) {
      res.status(400).json({ error: "body is required" });
      return;
    }

    const insert = await db.query(
      `INSERT INTO tenant_thread_events (tenant_id, type, author_user_id, body)
       VALUES ($1, 'message', $2, $3)
       RETURNING *`,
      [req.params.id, userId, body],
    );
    res.status(201).json({ event: insert.rows[0] });
  } catch (err) {
    console.error("Post thread error:", err);
    res.status(500).json({ error: "Failed to post message" });
  }
});

// POST /share — agent-only. Body: { tenant_ids: string[] }. Marks each tenant
// shared and writes a 'shared' thread event.
router.post("/share", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "agent") {
      res.status(403).json({ error: "Only agents can share" });
      return;
    }
    const tenantIds = req.body.tenant_ids;
    if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
      res.status(400).json({ error: "tenant_ids must be a non-empty array" });
      return;
    }

    // Verify each tenant is in 'ready' AND owned by one of agent's owners.
    const verify = await db.query(
      `SELECT t.id, p.owner_id
         FROM tenants t
         JOIN properties p ON p.id = t.property_id
         JOIN agent_clients ac ON ac.owner_id = p.owner_id AND ac.agent_id = $1
        WHERE t.id = ANY($2::uuid[]) AND t.status = 'ready'`,
      [userId, tenantIds],
    );
    if (verify.rows.length !== tenantIds.length) {
      res.status(400).json({
        error: "Some tenants are not in 'ready' status or not your client's",
      });
      return;
    }

    await db.query(
      `UPDATE tenants
          SET status = 'shared', shared_at = NOW(), updated_at = NOW()
        WHERE id = ANY($1::uuid[])`,
      [tenantIds],
    );
    for (const id of tenantIds) {
      await db.query(
        `INSERT INTO tenant_thread_events (tenant_id, type, author_user_id)
         VALUES ($1, 'shared', $2)`,
        [id, userId],
      );
    }

    // Group by owner so the email trigger (Phase I) can batch.
    const byOwner = new Map<string, string[]>();
    for (const row of verify.rows) {
      if (!byOwner.has(row.owner_id)) byOwner.set(row.owner_id, []);
      byOwner.get(row.owner_id)!.push(row.id);
    }
    res.json({ shared: tenantIds, by_owner: Array.from(byOwner.entries()) });
  } catch (err) {
    console.error("Share error:", err);
    res.status(500).json({ error: "Failed to share" });
  }
});

// POST /:id/unshare — agent-only. Tenant must be 'shared'.
router.post("/:id/unshare", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "agent") {
      res.status(403).json({ error: "Only agents can unshare" });
      return;
    }
    const access = await tenantAccess(userId, role, req.params.id);
    if (!access.allowed || access.status !== "shared") {
      res.status(400).json({ error: "Tenant is not in 'shared' status" });
      return;
    }
    await db.query(
      `UPDATE tenants SET status = 'ready', shared_at = NULL, updated_at = NOW()
        WHERE id = $1`,
      [req.params.id],
    );
    await db.query(
      `INSERT INTO tenant_thread_events (tenant_id, type, author_user_id)
       VALUES ($1, 'unshared', $2)`,
      [req.params.id, userId],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Unshare error:", err);
    res.status(500).json({ error: "Failed to unshare" });
  }
});

// POST /:id/decision — owner-only. Body: { decision: 'approved'|'rejected', note?: string }.
router.post("/:id/decision", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "owner") {
      res.status(403).json({ error: "Only owners can decide" });
      return;
    }
    const access = await tenantAccess(userId, role, req.params.id);
    if (!access.allowed || access.status !== "shared") {
      res.status(400).json({ error: "Tenant is not in 'shared' status" });
      return;
    }
    const decision = req.body.decision;
    if (decision !== "approved" && decision !== "rejected") {
      res.status(400).json({ error: "decision must be 'approved' or 'rejected'" });
      return;
    }
    const note = req.body.note ? String(req.body.note) : null;

    await db.query(
      `UPDATE tenants
          SET status = $1, decided_at = NOW(),
              decision_by_user_id = $2, decision_note = $3,
              updated_at = NOW()
        WHERE id = $4`,
      [decision, userId, note, req.params.id],
    );
    await db.query(
      `INSERT INTO tenant_thread_events (tenant_id, type, author_user_id, body)
       VALUES ($1, $2, $3, $4)`,
      [req.params.id, decision, userId, note],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Decision error:", err);
    res.status(500).json({ error: "Failed to record decision" });
  }
});

// POST /:id/reopen — owner-only. Approved/rejected → shared.
router.post("/:id/reopen", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "owner") {
      res.status(403).json({ error: "Only owners can reopen" });
      return;
    }
    const access = await tenantAccess(userId, role, req.params.id);
    if (!access.allowed || !["approved", "rejected"].includes(access.status)) {
      res.status(400).json({ error: "Tenant is not in a decided state" });
      return;
    }
    await db.query(
      `UPDATE tenants
          SET status = 'shared',
              decided_at = NULL,
              decision_by_user_id = NULL,
              decision_note = NULL,
              updated_at = NOW()
        WHERE id = $1`,
      [req.params.id],
    );
    await db.query(
      `INSERT INTO tenant_thread_events (tenant_id, type, author_user_id)
       VALUES ($1, 'reopened', $2)`,
      [req.params.id, userId],
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Reopen error:", err);
    res.status(500).json({ error: "Failed to reopen" });
  }
});
```

- [ ] **Step 2: Smoke test the round trip**

```bash
# Move a tenant to 'ready' (run /evaluate from G6 to completion).
# Then as agent:
curl -s -X POST http://localhost:3000/api/tenants/share \
  -H "Cookie: $AGENT_COOKIE" -H "Content-Type: application/json" \
  -d "{\"tenant_ids\":[\"$TENANT_ID\"]}" | head -c 200

# As owner — read thread, post message, approve:
curl -s http://localhost:3000/api/tenants/$TENANT_ID/thread \
  -H "Cookie: $OWNER_COOKIE" | head -c 500
curl -s -X POST http://localhost:3000/api/tenants/$TENANT_ID/thread \
  -H "Cookie: $OWNER_COOKIE" -H "Content-Type: application/json" \
  -d '{"body":"Why is the credit score low?"}' | head -c 200
curl -s -X POST http://localhost:3000/api/tenants/$TENANT_ID/decision \
  -H "Cookie: $OWNER_COOKIE" -H "Content-Type: application/json" \
  -d '{"decision":"approved"}' | head -c 200
```

Expected: each call returns 200/201; check tenant status changes via `/api/tenants/$TENANT_ID`.

- [ ] **Step 3: Commit**

```bash
git add api/src/routes/tenants.ts
git commit -m "feat(tenants): thread events, share, unshare, decision, reopen"
```

---

## Phase I: Email — Outbox, Worker, Templates, Triggers

### Task I1: Outbox helper with tests

**Files:**
- Create: `api/src/email/outbox.ts`
- Create: `api/test/outbox.test.ts`

We unit-test the *claim* logic in isolation by passing in a mock query function — the worker uses an `UPDATE … RETURNING` to atomically claim pending rows.

- [ ] **Step 1: Failing test**

`api/test/outbox.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { claimPendingForUpdate } from "../src/email/outbox.js";

describe("claimPendingForUpdate", () => {
  it("uses UPDATE ... RETURNING and bumps attempts", async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      rows: [{ id: "row-1", to_email: "x@y.test" }],
    });
    const rows = await claimPendingForUpdate({ query: mockQuery } as never, 5);
    expect(rows).toHaveLength(1);
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toMatch(/UPDATE\s+email_outbox/i);
    expect(sql).toMatch(/SET\s+attempts/i);
    expect(sql).toMatch(/RETURNING/i);
    expect(sql).toMatch(/FOR\s+UPDATE\s+SKIP\s+LOCKED/i);
    expect(mockQuery.mock.calls[0][1]).toEqual([5]);
  });
});
```

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Implement `api/src/email/outbox.ts`**

```ts
import { Pool } from "pg";
import { db } from "../db/client.js";

export interface OutboxEnqueueParams {
  toEmail: string;
  toUserId?: string | null;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  templateKey: string;
}

export async function enqueueEmail(p: OutboxEnqueueParams): Promise<string> {
  const result = await db.query(
    `INSERT INTO email_outbox
       (to_email, to_user_id, subject, body_html, body_text, template_key)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      p.toEmail,
      p.toUserId || null,
      p.subject,
      p.bodyHtml,
      p.bodyText,
      p.templateKey,
    ],
  );
  return result.rows[0].id;
}

export interface ClaimedRow {
  id: string;
  to_email: string;
  subject: string;
  body_html: string;
  body_text: string;
}

interface QueryRunner {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

// Atomically claim up to `limit` pending rows. Concurrency-safe via FOR UPDATE
// SKIP LOCKED so multiple workers (or a worker + a stuck transaction) don't
// double-claim the same row.
export async function claimPendingForUpdate(
  runner: QueryRunner,
  limit: number,
): Promise<ClaimedRow[]> {
  const sql = `
    UPDATE email_outbox
       SET attempts = attempts + 1,
           last_attempt_at = NOW()
     WHERE id IN (
       SELECT id
         FROM email_outbox
        WHERE status = 'pending' AND attempts < 5
        ORDER BY created_at
        LIMIT $1
        FOR UPDATE SKIP LOCKED
     )
   RETURNING id, to_email, subject, body_html, body_text;`;
  const result = await runner.query<ClaimedRow>(sql, [limit]);
  return result.rows;
}

export async function markSent(id: string): Promise<void> {
  await db.query(
    `UPDATE email_outbox
        SET status = 'sent', sent_at = NOW(), error = NULL
      WHERE id = $1`,
    [id],
  );
}

export async function markFailedTransient(id: string, err: string): Promise<void> {
  // attempts already incremented in claim; if it hit 5, mark final failed.
  await db.query(
    `UPDATE email_outbox
        SET error = $1,
            status = CASE WHEN attempts >= 5 THEN 'failed' ELSE status END
      WHERE id = $2`,
    [err, id],
  );
}

// Help TS see the unused import (re-exported for callers if needed).
export type { Pool };
```

- [ ] **Step 4: Run tests, expect pass**

- [ ] **Step 5: Commit**

```bash
git add api/src/email/outbox.ts api/test/outbox.test.ts
git commit -m "feat(email): outbox helpers + concurrency-safe claim"
```

---

### Task I2: SMTP transport + worker

**Files:**
- Create: `api/src/email/transport.ts`
- Create: `api/src/email/worker.ts`

- [ ] **Step 1: Create `api/src/email/transport.ts`**

```ts
import nodemailer from "nodemailer";
import { config } from "../config.js";

export const mailer = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false, // Mailpit is plain SMTP; prod can override with TLS
  auth: config.smtp.user
    ? { user: config.smtp.user, pass: config.smtp.pass }
    : undefined,
});

export async function sendMail(p: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  await mailer.sendMail({
    from: config.smtp.from,
    to: p.to,
    subject: p.subject,
    html: p.html,
    text: p.text,
  });
}
```

- [ ] **Step 2: Create `api/src/email/worker.ts`**

```ts
import { db } from "../db/client.js";
import { claimPendingForUpdate, markSent, markFailedTransient } from "./outbox.js";
import { sendMail } from "./transport.js";

const POLL_INTERVAL_MS = 10_000;
const BATCH_SIZE = 10;

let timer: NodeJS.Timeout | null = null;
let running = false;

async function tick() {
  if (running) return; // skip if previous tick still working
  running = true;
  try {
    const claimed = await claimPendingForUpdate(db, BATCH_SIZE);
    for (const row of claimed) {
      try {
        await sendMail({
          to: row.to_email,
          subject: row.subject,
          html: row.body_html,
          text: row.body_text,
        });
        await markSent(row.id);
      } catch (err) {
        const message = (err as Error).message || String(err);
        console.error(`Outbox send failed for ${row.id}: ${message}`);
        await markFailedTransient(row.id, message);
      }
    }
  } catch (err) {
    console.error("Outbox poll error:", err);
  } finally {
    running = false;
  }
}

export function startEmailWorker() {
  if (timer) return;
  timer = setInterval(tick, POLL_INTERVAL_MS);
  // Run once on startup so we don't wait 10s for the first batch
  tick();
}

export function stopEmailWorker() {
  if (timer) clearInterval(timer);
  timer = null;
}
```

- [ ] **Step 3: Start the worker in `api/src/index.ts`**

Add import:

```ts
import { startEmailWorker } from "./email/worker.js";
```

Inside `app.listen` callback:

```ts
app.listen(config.port, () => {
  console.log(`API server running on http://localhost:${config.port}`);
  startEmailWorker();
});
```

- [ ] **Step 4: Smoke test (independent of any trigger yet)**

```bash
# Insert a fake outbox row directly:
docker exec -it $(docker ps -qf name=postgres) psql -U propstealth -d propstealth -c \
  "INSERT INTO email_outbox (to_email, subject, body_html, body_text, template_key) \
   VALUES ('test@example.test','Hello','<p>hi</p>','hi','smoke');"
# Restart api server. Within ~12s, check Mailpit at http://localhost:8025/
# and confirm the email shows up. Verify status moved to 'sent':
docker exec -it $(docker ps -qf name=postgres) psql -U propstealth -d propstealth \
  -c "SELECT id, status, attempts, sent_at FROM email_outbox ORDER BY created_at DESC LIMIT 3;"
```

- [ ] **Step 5: Commit**

```bash
git add api/src/email/transport.ts api/src/email/worker.ts api/src/index.ts
git commit -m "feat(email): nodemailer transport and outbox polling worker"
```

---

### Task I3: Email templates

**Files:**
- Create: `api/src/email/templates/invite.ts`
- Create: `api/src/email/templates/tenants_shared.ts`
- Create: `api/src/email/templates/thread_message.ts`
- Create: `api/src/email/templates/decision.ts`

Each template is a function returning `{ subject, html, text }`. We keep them plain — no HTML framework, just inline styles.

- [ ] **Step 1: Create `api/src/email/templates/invite.ts`**

```ts
import { config } from "../../config.js";

export function renderInvite(p: {
  ownerName: string;
  agentName: string | null;
  message: string | null;
  token: string;
}) {
  const link = `${config.appBaseUrl}/invite/${encodeURIComponent(p.token)}`;
  const agentLabel = p.agentName || "Your agent";
  const subject = `${agentLabel} invited you to PropStealth`;
  const text = `Hi ${p.ownerName},\n\n${agentLabel} invited you to PropStealth to review tenant candidates for your property.\n\nAccept the invite:\n${link}\n\n${p.message ? `Personal note: ${p.message}\n\n` : ""}This link expires in 14 days.`;
  const html = `<p>Hi ${escape(p.ownerName)},</p>
<p>${escape(agentLabel)} invited you to PropStealth to review tenant candidates for your property.</p>
<p><a href="${link}" style="display:inline-block;padding:10px 16px;background:#059669;color:#fff;text-decoration:none;border-radius:6px">Accept the invite</a></p>
${p.message ? `<p style="border-left:3px solid #e5e7eb;padding-left:12px;color:#6b7280"><em>${escape(p.message)}</em></p>` : ""}
<p style="color:#6b7280;font-size:12px">This link expires in 14 days.</p>`;
  return { subject, html, text };
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c] as string);
}
```

- [ ] **Step 2: Create `api/src/email/templates/tenants_shared.ts`**

```ts
import { config } from "../../config.js";

export interface SharedTenantSummary {
  id: string;
  applicant_name: string | null;
  property_address: string;
  overall_score: number | null;
}

export function renderTenantsShared(p: {
  ownerName: string | null;
  agentName: string | null;
  tenants: SharedTenantSummary[];
}) {
  const count = p.tenants.length;
  const subject =
    count === 1
      ? `${p.agentName || "Your agent"} shared a tenant candidate with you`
      : `${p.agentName || "Your agent"} shared ${count} tenant candidates with you`;

  const tenantsList = p.tenants
    .map((t) => {
      const link = `${config.appBaseUrl}/owner/tenants/${t.id}`;
      const score = t.overall_score != null ? ` — score ${t.overall_score}/100` : "";
      return `<li><a href="${link}">${escape(t.applicant_name || "(unnamed applicant)")}</a> · ${escape(t.property_address)}${score}</li>`;
    })
    .join("");

  const html = `<p>Hi ${escape(p.ownerName || "there")},</p>
<p>${escape(p.agentName || "Your agent")} shared the following tenant ${count === 1 ? "candidate" : "candidates"} with you for review:</p>
<ul>${tenantsList}</ul>
<p>Open PropStealth to read the AI summary, ask questions, or approve.</p>`;

  const text =
    `${p.agentName || "Your agent"} shared ${count} tenant ${count === 1 ? "candidate" : "candidates"} with you:\n\n` +
    p.tenants
      .map(
        (t) =>
          `- ${t.applicant_name || "(unnamed)"} — ${t.property_address} (${config.appBaseUrl}/owner/tenants/${t.id})`,
      )
      .join("\n");

  return { subject, html, text };
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c] as string);
}
```

- [ ] **Step 3: Create `api/src/email/templates/thread_message.ts`**

```ts
import { config } from "../../config.js";

export function renderThreadMessage(p: {
  recipientName: string | null;
  authorName: string | null;
  applicantName: string | null;
  body: string;
  tenantId: string;
  recipientRole: "owner" | "agent";
}) {
  const link = `${config.appBaseUrl}/${p.recipientRole}/tenants/${p.tenantId}`;
  const applicantLabel = p.applicantName || "the tenant candidate";
  const subject = `${p.authorName || "Someone"} replied about ${applicantLabel}`;
  const excerpt = p.body.length > 240 ? p.body.slice(0, 237) + "…" : p.body;
  const html = `<p>Hi ${escape(p.recipientName || "there")},</p>
<p><strong>${escape(p.authorName || "Someone")}</strong> wrote about <strong>${escape(applicantLabel)}</strong>:</p>
<blockquote style="border-left:3px solid #e5e7eb;padding-left:12px;color:#374151">${escape(excerpt)}</blockquote>
<p><a href="${link}">View the conversation</a></p>`;
  const text = `${p.authorName || "Someone"} wrote about ${applicantLabel}:\n\n${excerpt}\n\nView: ${link}`;
  return { subject, html, text };
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c] as string);
}
```

- [ ] **Step 4: Create `api/src/email/templates/decision.ts`**

```ts
import { config } from "../../config.js";

export function renderDecision(p: {
  agentName: string | null;
  ownerName: string | null;
  applicantName: string | null;
  decision: "approved" | "rejected";
  note: string | null;
  tenantId: string;
}) {
  const verb = p.decision === "approved" ? "approved" : "rejected";
  const subject = `${p.ownerName || "Your client"} ${verb} ${p.applicantName || "the tenant"}`;
  const link = `${config.appBaseUrl}/agent/tenants/${p.tenantId}`;
  const html = `<p>Hi ${escape(p.agentName || "there")},</p>
<p><strong>${escape(p.ownerName || "Your client")}</strong> ${verb} <strong>${escape(p.applicantName || "the tenant")}</strong>.</p>
${p.note ? `<p><em>"${escape(p.note)}"</em></p>` : ""}
<p><a href="${link}">Open in PropStealth</a></p>`;
  const text = `${p.ownerName || "Your client"} ${verb} ${p.applicantName || "the tenant"}.${p.note ? `\n\n"${p.note}"` : ""}\n\n${link}`;
  return { subject, html, text };
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c] as string);
}
```

- [ ] **Step 5: Commit**

```bash
git add api/src/email/templates
git commit -m "feat(email): four email templates (invite, shared, thread, decision)"
```

---

### Task I4: Wire email triggers into endpoints

**Files:**
- Modify: `api/src/routes/clients.ts` (invite trigger)
- Modify: `api/src/routes/tenants.ts` (share, thread message, decision triggers)

- [ ] **Step 1: Invite email trigger in `routes/clients.ts`**

In the `POST /invitations` handler, after the existing `INSERT INTO invitations` block but BEFORE the auto-link `if (ownerResult.rows.length > 0)` branch, add:

```ts
// Enqueue invite email — but only if we DIDN'T auto-link below. We'll branch:
//   - If auto-linked, skip the invite email and send nothing.
//   - Otherwise, enqueue.
```

Then restructure: after the auto-link branch, add at the end (still before `res.status(201).json(...)`):

```ts
if (result.rows[0].status !== "accepted") {
  // Look up the agent's display name
  const agentResult = await db.query(
    "SELECT name FROM users WHERE id = $1",
    [userId],
  );
  const tpl = renderInvite({
    ownerName: name,
    agentName: agentResult.rows[0]?.name || null,
    message: message || null,
    token,
  });
  await enqueueEmail({
    toEmail: email,
    subject: tpl.subject,
    bodyHtml: tpl.html,
    bodyText: tpl.text,
    templateKey: "invite",
  });
}
```

Add imports at top of `routes/clients.ts`:

```ts
import { enqueueEmail } from "../email/outbox.js";
import { renderInvite } from "../email/templates/invite.js";
```

- [ ] **Step 2: Share email trigger in `routes/tenants.ts`**

Inside `POST /share`, after the loop that writes `tenant_thread_events 'shared'` rows but before `res.json(...)`, add:

```ts
// Send one email per recipient owner, batched.
for (const [ownerId, ids] of byOwner.entries()) {
  const ownerRow = await db.query(
    `SELECT email, name FROM users WHERE id = $1`,
    [ownerId],
  );
  if (ownerRow.rows.length === 0) continue;

  const tenantsRes = await db.query(
    `SELECT t.id, t.applicant_name, p.address || ', ' || p.city || ', ' || p.state AS property_address,
            (SELECT te.overall_score FROM tenant_evaluations te
              WHERE te.tenant_id = t.id AND te.status = 'complete'
              ORDER BY te.created_at DESC LIMIT 1) AS overall_score
       FROM tenants t
       JOIN properties p ON p.id = t.property_id
      WHERE t.id = ANY($1::uuid[])`,
    [ids],
  );

  const agentRow = await db.query(`SELECT name FROM users WHERE id = $1`, [userId]);

  const tpl = renderTenantsShared({
    ownerName: ownerRow.rows[0].name,
    agentName: agentRow.rows[0]?.name || null,
    tenants: tenantsRes.rows,
  });
  await enqueueEmail({
    toEmail: ownerRow.rows[0].email,
    toUserId: ownerId,
    subject: tpl.subject,
    bodyHtml: tpl.html,
    bodyText: tpl.text,
    templateKey: "tenants_shared",
  });
}
```

Add the imports near the top of `routes/tenants.ts`:

```ts
import { enqueueEmail } from "../email/outbox.js";
import { renderTenantsShared } from "../email/templates/tenants_shared.js";
import { renderThreadMessage } from "../email/templates/thread_message.js";
import { renderDecision } from "../email/templates/decision.js";
```

- [ ] **Step 3: Thread-message email trigger**

Inside `POST /:id/thread`, after `INSERT INTO tenant_thread_events ... RETURNING *` but before `res.status(201).json(...)`, add:

```ts
// Notify the OTHER party. Look up tenant + recipient.
const tInfo = await db.query(
  `SELECT t.applicant_name, p.owner_id, t.created_by_agent_id
     FROM tenants t JOIN properties p ON p.id = t.property_id
    WHERE t.id = $1`,
  [req.params.id],
);
const recipientId = role === "agent" ? tInfo.rows[0].owner_id : tInfo.rows[0].created_by_agent_id;
const recipientRole: "owner" | "agent" = role === "agent" ? "owner" : "agent";

const recipient = await db.query(`SELECT email, name FROM users WHERE id = $1`, [recipientId]);
const author = await db.query(`SELECT name FROM users WHERE id = $1`, [userId]);

if (recipient.rows.length > 0) {
  const tpl = renderThreadMessage({
    recipientName: recipient.rows[0].name,
    authorName: author.rows[0]?.name || null,
    applicantName: tInfo.rows[0].applicant_name,
    body,
    tenantId: req.params.id,
    recipientRole,
  });
  await enqueueEmail({
    toEmail: recipient.rows[0].email,
    toUserId: recipientId,
    subject: tpl.subject,
    bodyHtml: tpl.html,
    bodyText: tpl.text,
    templateKey: "thread_message",
  });
}
```

- [ ] **Step 4: Decision email trigger**

Inside `POST /:id/decision`, after the `INSERT INTO tenant_thread_events` block, add:

```ts
const tInfo = await db.query(
  `SELECT t.applicant_name, t.created_by_agent_id
     FROM tenants t WHERE t.id = $1`,
  [req.params.id],
);
const agent = await db.query(
  `SELECT email, name FROM users WHERE id = $1`,
  [tInfo.rows[0].created_by_agent_id],
);
const owner = await db.query(`SELECT name FROM users WHERE id = $1`, [userId]);
if (agent.rows.length > 0) {
  const tpl = renderDecision({
    agentName: agent.rows[0].name,
    ownerName: owner.rows[0]?.name || null,
    applicantName: tInfo.rows[0].applicant_name,
    decision,
    note,
    tenantId: req.params.id,
  });
  await enqueueEmail({
    toEmail: agent.rows[0].email,
    toUserId: tInfo.rows[0].created_by_agent_id,
    subject: tpl.subject,
    bodyHtml: tpl.html,
    bodyText: tpl.text,
    templateKey: "decision",
  });
}
```

- [ ] **Step 5: End-to-end smoke test**

Make sure Mailpit is up. Trigger each event:

1. Invite a new owner → check Mailpit for invite email.
2. Share a ready tenant → check Mailpit for "shared" email to the owner.
3. Owner posts a thread message → check Mailpit for thread_message to the agent.
4. Owner approves → check Mailpit for decision email to the agent.
5. Agent posts a thread message in reply → check Mailpit for thread_message to the owner.

Browser: `http://localhost:8025/` shows the inbox.

- [ ] **Step 6: Commit**

```bash
git add api/src/routes/clients.ts api/src/routes/tenants.ts
git commit -m "feat(email): wire invite/shared/thread_message/decision triggers"
```

---

## Phase J: Web — Sidebars, Pages, Components

Each task below produces a working page. Styling follows the existing Tailwind patterns (`bg-brand`, `bg-brand-light`, `border-gray-200`, etc.) — match neighboring components rather than reinventing.

### Task J1: Update sidebars

**Files:**
- Modify: `web/src/components/owner-sidebar.tsx`
- Modify: `web/src/components/agent-sidebar.tsx`

- [ ] **Step 1: Replace `web/src/components/owner-sidebar.tsx` `navItems`**

Find the `navItems` array near the top. Replace it with:

```ts
const navItems = [
  { label: "Dashboard", href: "/owner", exact: true },
  { label: "Tenants", href: "/owner/tenants" },
  { label: "Properties", href: "/owner/properties" },
];
```

(Drop the static `badge: "3"` field — counts are computed in the dashboard.)

- [ ] **Step 2: Replace the `navItems` and middle `<nav>` block in `web/src/components/agent-sidebar.tsx`**

Replace the existing `<nav>` element from `<nav className="flex-1 ...` through `</nav>` with:

```tsx
<nav className="flex-1 flex flex-col gap-0.5">
  <Link
    href="/agent"
    className={`px-2 py-1.5 rounded-md text-sm ${
      isActive("/agent", true)
        ? "bg-brand-light text-brand font-medium"
        : "text-gray-500 hover:text-gray-700"
    }`}
  >
    Dashboard
  </Link>

  <div className="mt-2">
    <span className="px-2 text-sm text-gray-500">Owners</span>
    <div className="mt-1 flex flex-col gap-0.5 pl-2">
      {clients.length === 0 && pending.length === 0 && (
        <span className="px-2 py-1 text-[11px] text-gray-300">None yet</span>
      )}
      {clients.map((client) => {
        const clientHref = `/agent/owners/${client.id}`;
        const active = pathname.startsWith(clientHref);
        return (
          <Link
            key={client.id}
            href={clientHref}
            className={`px-2 py-1 rounded text-[11px] ${
              active ? "text-brand" : "text-gray-400"
            }`}
          >
            {client.name}
          </Link>
        );
      })}
      {pending.map((inv) => (
        <span
          key={inv.id}
          className="px-2 py-1 text-[11px] text-gray-300 italic"
        >
          {inv.name} (pending)
        </span>
      ))}
    </div>
  </div>
</nav>
```

(This drops Tenant Pipeline and Help Requests; renames "Clients" → "Owners".)

- [ ] **Step 3: Verify both sidebars render** by running `npm run dev` and clicking around as both roles.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/owner-sidebar.tsx web/src/components/agent-sidebar.tsx
git commit -m "feat(web): update sidebars for new navigation"
```

---

### Task J2: Doc upload component

**Files:**
- Create: `web/src/components/doc-upload.tsx`

- [ ] **Step 1: Create**

```tsx
"use client";

import { useState } from "react";
import type { DocumentCategory, TenantDocument } from "@/lib/types";

const CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: "application", label: "Application" },
  { value: "id", label: "ID" },
  { value: "income", label: "Income" },
  { value: "credit", label: "Credit/Background" },
  { value: "reference", label: "Reference" },
  { value: "other", label: "Other" },
];

export function DocUpload({
  tenantId,
  onUploaded,
}: {
  tenantId: string;
  onUploaded: (doc: TenantDocument) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<DocumentCategory>("application");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("category", category);
      fd.append("file", file);
      const r = await fetch(`/api/tenant-documents/${tenantId}`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      const data = await r.json();
      onUploaded(data.document);
      e.target.value = "";
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-4">
      <div className="flex gap-2 items-center">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as DocumentCategory)}
          className="border border-gray-300 rounded-md px-2 py-1 text-xs"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={onChange}
          disabled={busy}
          className="text-xs"
        />
      </div>
      {busy && <p className="text-xs text-gray-500 mt-2">Uploading…</p>}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/doc-upload.tsx
git commit -m "feat(web): doc-upload component with categorized POST to tenant-documents"
```

---

### Task J3: Eval summary component

**Files:**
- Create: `web/src/components/eval-summary.tsx`

- [ ] **Step 1: Create**

```tsx
"use client";

import type { TenantEvaluation, TenantDocument } from "@/lib/types";

const REC_LABEL: Record<string, { label: string; classes: string }> = {
  low_risk: { label: "Recommended — Low Risk", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  review: { label: "Review Carefully", classes: "bg-amber-50 text-amber-700 border-amber-200" },
  high_risk: { label: "High Risk", classes: "bg-red-50 text-red-700 border-red-200" },
};

export function EvalSummary({
  evaluation,
  documents,
}: {
  evaluation: TenantEvaluation | null;
  documents: TenantDocument[];
}) {
  if (!evaluation) {
    return <p className="text-sm text-gray-500">No evaluation yet.</p>;
  }
  if (evaluation.status === "running") {
    return <p className="text-sm text-gray-500">Evaluation running… this can take 10–30 seconds.</p>;
  }
  if (evaluation.status === "failed") {
    return (
      <div className="border border-red-200 bg-red-50 rounded p-3">
        <p className="text-sm text-red-700 font-medium">Evaluation failed</p>
        <p className="text-xs text-red-600 mt-1">{evaluation.error}</p>
      </div>
    );
  }

  const docMap = new Map(documents.map((d) => [d.id, d]));
  const rec = evaluation.recommendation
    ? REC_LABEL[evaluation.recommendation]
    : null;

  return (
    <div className="space-y-5">
      {/* Header — score + recommendation */}
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold text-gray-900">
          {evaluation.overall_score}
          <span className="text-sm text-gray-400">/100</span>
        </div>
        {rec && (
          <span className={`text-xs font-medium px-2 py-1 rounded border ${rec.classes}`}>
            {rec.label}
          </span>
        )}
      </div>
      <p className="text-[11px] text-gray-500">
        AI-generated and advisory. The final decision is yours.
      </p>

      {/* Categories */}
      {evaluation.category_scores && (
        <div className="grid grid-cols-2 gap-3">
          {(["income", "credit", "history", "identity"] as const).map((k) => {
            const cs = evaluation.category_scores![k];
            return (
              <div key={k} className="border border-gray-200 rounded p-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700 capitalize">{k}</span>
                  <span className="text-xs text-gray-900">{cs.score}</span>
                </div>
                <p className="text-[11px] text-gray-500">{cs.summary}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      <div>
        <h3 className="text-xs font-medium text-gray-700 mb-1">AI Summary</h3>
        <p className="text-sm text-gray-700 whitespace-pre-line">{evaluation.summary}</p>
      </div>

      {/* Concerns */}
      {evaluation.concerns.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-700 mb-1">Concerns</h3>
          <ul className="space-y-1">
            {evaluation.concerns.map((c, i) => (
              <li key={i} className="text-xs text-gray-600">
                <span className="text-amber-600">●</span> {c.text}
                {c.source_document_id && docMap.has(c.source_document_id) && (
                  <span className="text-gray-400">
                    {" "}— {docMap.get(c.source_document_id)!.filename}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Verified facts */}
      {evaluation.verified_facts.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-700 mb-1">Verified facts</h3>
          <ul className="space-y-1">
            {evaluation.verified_facts.map((c, i) => (
              <li key={i} className="text-xs text-gray-600">
                <span className="text-emerald-600">●</span> {c.text}
                {c.source_document_id && docMap.has(c.source_document_id) && (
                  <span className="text-gray-400">
                    {" "}— {docMap.get(c.source_document_id)!.filename}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/eval-summary.tsx
git commit -m "feat(web): eval-summary component"
```

---

### Task J4: Tenant thread component

**Files:**
- Create: `web/src/components/tenant-thread.tsx`

- [ ] **Step 1: Create**

```tsx
"use client";

import { useEffect, useState } from "react";

interface ThreadEvent {
  id: string;
  type: "message" | "shared" | "unshared" | "approved" | "rejected" | "reopened";
  author_user_id: string;
  author_name: string | null;
  author_role: "owner" | "agent";
  body: string | null;
  created_at: string;
}

const SYSTEM_LABELS: Record<string, string> = {
  shared: "shared this candidate",
  unshared: "unshared this candidate",
  approved: "approved",
  rejected: "rejected",
  reopened: "re-opened the decision",
};

export function TenantThread({
  tenantId,
  canPost,
}: {
  tenantId: string;
  canPost: boolean;
}) {
  const [events, setEvents] = useState<ThreadEvent[] | null>(null);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const r = await fetch(`/api/tenants/${tenantId}/thread`, {
      credentials: "include",
    });
    if (r.ok) {
      const data = await r.json();
      setEvents(data.events);
    }
  }

  useEffect(() => {
    load();
  }, [tenantId]);

  async function onPost(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const r = await fetch(`/api/tenants/${tenantId}/thread`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send");
      }
      setBody("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPosting(false);
    }
  }

  if (!events) return <p className="text-sm text-gray-500">Loading thread…</p>;

  return (
    <div className="space-y-3">
      {events.length === 0 && (
        <p className="text-xs text-gray-500">No activity yet.</p>
      )}
      <ol className="space-y-3">
        {events.map((e) => (
          <li key={e.id} className="border border-gray-200 rounded-md p-3">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs font-medium text-gray-700">
                {e.author_name || "(unknown)"}
                <span className="text-gray-400 ml-2">{e.author_role}</span>
              </span>
              <span className="text-[10px] text-gray-400">
                {new Date(e.created_at).toLocaleString()}
              </span>
            </div>
            {e.type === "message" ? (
              <p className="text-sm text-gray-700 whitespace-pre-line">{e.body}</p>
            ) : (
              <p className="text-xs text-gray-500 italic">
                {SYSTEM_LABELS[e.type] || e.type}
                {e.body && <span> — "{e.body}"</span>}
              </p>
            )}
          </li>
        ))}
      </ol>

      {canPost && (
        <form onSubmit={onPost} className="border-t border-gray-200 pt-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Ask a question or reply…"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={posting || !body.trim()}
            className="bg-brand text-white px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50 mt-2"
          >
            {posting ? "Sending…" : "Send"}
          </button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/tenant-thread.tsx
git commit -m "feat(web): tenant-thread component (events + reply box)"
```

---

### Task J5: Agent — owner detail + property pages

**Files:**
- Create: `web/src/app/(dashboard)/agent/owners/[id]/page.tsx`
- Create: `web/src/app/(dashboard)/agent/owners/[id]/properties/new/page.tsx`
- Create: `web/src/app/(dashboard)/agent/owners/[id]/properties/[propId]/page.tsx`

- [ ] **Step 1: Create `agent/owners/[id]/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Property, Tenant } from "@/lib/types";

interface OwnerView {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export default function AgentOwnerDetailPage() {
  const params = useParams<{ id: string }>();
  const [owner, setOwner] = useState<OwnerView | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<(Tenant & { property_address?: string })[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/clients/${params.id}`, { credentials: "include" }).then((r) => r.json()),
      fetch(`/api/properties?owner_id=${params.id}`, { credentials: "include" }).then((r) => r.json()),
      fetch(`/api/tenants?owner_id=${params.id}`, { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([clientRes, propsRes, tenantsRes]) => {
        if (clientRes.error) {
          setError(clientRes.error);
          return;
        }
        setOwner(clientRes.client);
        setProperties(propsRes.properties || []);
        setTenants(tenantsRes.tenants || []);
      })
      .catch((e) => setError(e.message));
  }, [params.id]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!owner) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{owner.name || owner.email}</h1>
        <p className="text-xs text-gray-500">{owner.email}</p>
      </div>

      <section>
        <div className="flex justify-between items-baseline mb-2">
          <h2 className="text-sm font-medium text-gray-900">Properties</h2>
          <Link
            href={`/agent/owners/${owner.id}/properties/new`}
            className="text-xs text-brand"
          >
            + Add property
          </Link>
        </div>
        {properties.length === 0 ? (
          <p className="text-xs text-gray-500">No properties yet.</p>
        ) : (
          <ul className="space-y-2">
            {properties.map((p) => (
              <li key={p.id} className="border border-gray-200 rounded p-3">
                <Link href={`/agent/owners/${owner.id}/properties/${p.id}`} className="block">
                  <p className="text-sm font-medium text-gray-900">{p.address}</p>
                  <p className="text-xs text-gray-500">
                    {p.city}, {p.state} {p.zip || ""} · {p.beds}bd / {p.baths}ba
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex justify-between items-baseline mb-2">
          <h2 className="text-sm font-medium text-gray-900">Tenants</h2>
          <Link href="/agent/tenants/new" className="text-xs text-brand">
            + New tenant
          </Link>
        </div>
        {tenants.length === 0 ? (
          <p className="text-xs text-gray-500">No tenants yet.</p>
        ) : (
          <ul className="space-y-2">
            {tenants.map((t) => (
              <li key={t.id} className="border border-gray-200 rounded p-3">
                <Link href={`/agent/tenants/${t.id}`} className="block">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {t.applicant_name || "(unnamed)"}
                    </p>
                    <span className="text-[10px] uppercase text-gray-500">{t.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">{t.property_address}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Create the property NEW page (`properties/new/page.tsx`)**

```tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AgentPropertyNewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      owner_id: params.id,
      address: f.get("address"),
      city: f.get("city"),
      state: f.get("state"),
      zip: f.get("zip") || null,
      beds: Number(f.get("beds") || 0),
      baths: Number(f.get("baths") || 0),
      property_type: f.get("property_type") || null,
      monthly_rent_target: f.get("monthly_rent_target")
        ? Number(f.get("monthly_rent_target"))
        : null,
      notes: f.get("notes") || null,
    };
    try {
      const r = await fetch("/api/properties", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create");
      }
      router.push(`/agent/owners/${params.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-[560px]">
      <h1 className="text-lg font-semibold text-gray-900 mb-4">Add property</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Address" name="address" required />
        <div className="grid grid-cols-3 gap-3">
          <Field label="City" name="city" required />
          <Field label="State" name="state" required maxLength={2} />
          <Field label="Zip" name="zip" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Beds" name="beds" type="number" />
          <Field label="Baths" name="baths" type="number" />
          <Field label="Type" name="property_type" placeholder="single-family, condo…" />
        </div>
        <Field label="Monthly rent target" name="monthly_rent_target" type="number" />
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea
            name="notes"
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="bg-brand text-white px-4 py-2 rounded-md text-xs font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Create"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  maxLength,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
      />
    </div>
  );
}
```

- [ ] **Step 3: Create the property EDIT page (`properties/[propId]/page.tsx`)** — copy the owner property edit page from Task D2 step 2 (it works for agents too thanks to the API's role-aware access). Save it at `web/src/app/(dashboard)/agent/owners/[id]/properties/[propId]/page.tsx` with the import path adjusted; the file otherwise matches Task D2.

- [ ] **Step 4: Commit**

```bash
git add "web/src/app/(dashboard)/agent/owners"
git commit -m "feat(web): agent owner detail and property new/edit pages"
```

---

### Task J6: Agent dashboard

**Files:**
- Modify: `web/src/app/(dashboard)/agent/page.tsx`

- [ ] **Step 1: Replace with**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Owner {
  id: string;
  email: string;
  name: string | null;
  properties: { id: string }[];
}

interface PendingInvite {
  id: string;
  email: string;
  name: string;
}

export default function AgentDashboardPage() {
  const [owners, setOwners] = useState<Owner[] | null>(null);
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [tenantCounts, setTenantCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/clients", { credentials: "include" })
      .then((r) => r.json())
      .then(async (data) => {
        setOwners(data.clients || []);
        setPending(data.pendingInvitations || []);

        const counts: Record<string, number> = {};
        await Promise.all(
          (data.clients || []).map(async (o: Owner) => {
            const tr = await fetch(`/api/tenants?owner_id=${o.id}&status=shared`, {
              credentials: "include",
            }).then((r) => r.json());
            counts[o.id] = (tr.tenants || []).length;
          }),
        );
        setTenantCounts(counts);
      });
  }, []);

  if (!owners) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-baseline">
        <h1 className="text-lg font-semibold text-gray-900">Owners</h1>
        <Link
          href="/agent/invite"
          className="bg-brand text-white text-xs font-medium px-3 py-1.5 rounded"
        >
          + Invite owner
        </Link>
      </div>

      {owners.length === 0 && pending.length === 0 && (
        <p className="text-sm text-gray-500">
          No owners yet. Invite your first one.
        </p>
      )}

      <ul className="space-y-2">
        {owners.map((o) => (
          <li key={o.id} className="border border-gray-200 rounded p-3 hover:bg-gray-50">
            <Link href={`/agent/owners/${o.id}`} className="block">
              <div className="flex justify-between">
                <p className="text-sm font-medium text-gray-900">
                  {o.name || o.email}
                </p>
                <p className="text-xs text-gray-500">
                  {o.properties.length} {o.properties.length === 1 ? "property" : "properties"}
                  {tenantCounts[o.id] > 0 && (
                    <span className="ml-2 text-amber-600">
                      · {tenantCounts[o.id]} awaiting review
                    </span>
                  )}
                </p>
              </div>
            </Link>
          </li>
        ))}
        {pending.map((p) => (
          <li key={p.id} className="border border-gray-200 rounded p-3 italic text-gray-400">
            <p className="text-sm">{p.name} <span className="text-xs">— invite pending</span></p>
            <p className="text-xs">{p.email}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "web/src/app/(dashboard)/agent/page.tsx"
git commit -m "feat(web): agent dashboard listing owners"
```

---

### Task J7: Agent — new tenant wizard and tenant detail

**Files:**
- Create: `web/src/app/(dashboard)/agent/tenants/new/page.tsx`
- Create: `web/src/app/(dashboard)/agent/tenants/[id]/page.tsx`

- [ ] **Step 1: New tenant page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Owner {
  id: string;
  name: string | null;
  email: string;
  properties: { id: string; address: string; city: string; state: string }[];
}

export default function AgentNewTenantPage() {
  const router = useRouter();
  const [owners, setOwners] = useState<Owner[] | null>(null);
  const [ownerId, setOwnerId] = useState<string>("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [applicantName, setApplicantName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setOwners(data.clients || []));
  }, []);

  const selectedOwner = owners?.find((o) => o.id === ownerId);
  const properties = selectedOwner?.properties || [];

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!propertyId) {
      setError("Pick a property");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const r = await fetch("/api/tenants", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          applicant_name: applicantName || null,
        }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create tenant");
      }
      const data = await r.json();
      router.push(`/agent/tenants/${data.tenant.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-[560px] space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">New tenant</h1>

      <form onSubmit={onCreate} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Owner</label>
          <select
            value={ownerId}
            onChange={(e) => {
              setOwnerId(e.target.value);
              setPropertyId("");
            }}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
          >
            <option value="">Select an owner…</option>
            {owners?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name || o.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Property</label>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            required
            disabled={!ownerId}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs disabled:opacity-50"
          >
            <option value="">Select a property…</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address}, {p.city}, {p.state}
              </option>
            ))}
          </select>
          {ownerId && properties.length === 0 && (
            <p className="text-[11px] text-gray-500 mt-1">
              This owner has no properties yet. Add one first.
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Applicant name (optional — AI can extract from docs later)
          </label>
          <input
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={creating}
          className="bg-brand text-white px-4 py-2 rounded-md text-xs font-medium disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create draft"}
        </button>
      </form>

      <p className="text-[11px] text-gray-500">
        After creating the draft you'll upload documents, run AI extraction, review, and run the full evaluation — all on the next page.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Tenant detail page (agent view)**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DocUpload } from "@/components/doc-upload";
import { EvalSummary } from "@/components/eval-summary";
import { TenantThread } from "@/components/tenant-thread";
import type { Tenant, TenantDocument, TenantEvaluation } from "@/lib/types";

export default function AgentTenantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [documents, setDocuments] = useState<TenantDocument[]>([]);
  const [evaluation, setEvaluation] = useState<TenantEvaluation | null>(null);
  const [tab, setTab] = useState<"docs" | "eval" | "thread">("docs");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadTenant() {
    const r = await fetch(`/api/tenants/${params.id}`, { credentials: "include" });
    if (r.ok) setTenant((await r.json()).tenant);
  }
  async function loadDocs() {
    const r = await fetch(`/api/tenant-documents/${params.id}`, { credentials: "include" });
    if (r.ok) setDocuments((await r.json()).documents);
  }
  async function loadEval() {
    const r = await fetch(`/api/tenants/${params.id}/evaluation`, { credentials: "include" });
    if (r.ok) setEvaluation((await r.json()).evaluation);
  }

  useEffect(() => {
    loadTenant();
    loadDocs();
    loadEval();
  }, [params.id]);

  // Poll while evaluating
  useEffect(() => {
    if (tenant?.status !== "evaluating") return;
    const id = setInterval(() => {
      loadTenant();
      loadEval();
    }, 2000);
    return () => clearInterval(id);
  }, [tenant?.status]);

  async function runExtract() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/tenants/${params.id}/extract`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      await loadTenant();
      setMsg("Extracted. Review fields below and run the full evaluation.");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function runEvaluate() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/tenants/${params.id}/evaluate`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      await loadTenant();
      await loadEval();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function shareTenant() {
    setBusy(true);
    try {
      const r = await fetch(`/api/tenants/share`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_ids: [params.id] }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      await loadTenant();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function unshareTenant() {
    setBusy(true);
    try {
      const r = await fetch(`/api/tenants/${params.id}/unshare`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      await loadTenant();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveBasics(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenant) return;
    const f = new FormData(e.currentTarget);
    const body = {
      applicant_name: f.get("applicant_name") || null,
      email: f.get("email") || null,
      phone: f.get("phone") || null,
      employer: f.get("employer") || null,
      monthly_income: f.get("monthly_income") ? Number(f.get("monthly_income")) : null,
      move_in_date: f.get("move_in_date") || null,
      notes: f.get("notes") || null,
    };
    const r = await fetch(`/api/tenants/${params.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      const data = await r.json();
      setTenant(data.tenant);
    }
  }

  if (!tenant) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {tenant.applicant_name || "(unnamed candidate)"}
          </h1>
          <p className="text-xs text-gray-500">
            Status: <span className="uppercase">{tenant.status}</span>
          </p>
        </div>

        <div className="flex gap-2">
          {tenant.status === "draft" && documents.length > 0 && (
            <button
              onClick={runExtract}
              disabled={busy}
              className="text-xs border border-gray-300 px-3 py-1.5 rounded disabled:opacity-50"
            >
              Run AI extraction
            </button>
          )}
          {(tenant.status === "draft" || tenant.status === "ready") && documents.length > 0 && (
            <button
              onClick={runEvaluate}
              disabled={busy}
              className="text-xs bg-brand text-white px-3 py-1.5 rounded disabled:opacity-50"
            >
              {tenant.status === "ready" ? "Re-run evaluation" : "Run evaluation"}
            </button>
          )}
          {tenant.status === "ready" && (
            <button
              onClick={shareTenant}
              disabled={busy}
              className="text-xs bg-brand text-white px-3 py-1.5 rounded disabled:opacity-50"
            >
              Share with owner
            </button>
          )}
          {tenant.status === "shared" && (
            <button
              onClick={unshareTenant}
              disabled={busy}
              className="text-xs border border-gray-300 px-3 py-1.5 rounded disabled:opacity-50"
            >
              Unshare
            </button>
          )}
        </div>
      </div>

      {msg && <p className="text-xs text-amber-700">{msg}</p>}

      <form onSubmit={saveBasics} className="border border-gray-200 rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-medium text-gray-900">Basics</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" name="applicant_name" defaultValue={tenant.applicant_name || ""} />
          <Field label="Email" name="email" defaultValue={tenant.email || ""} />
          <Field label="Phone" name="phone" defaultValue={tenant.phone || ""} />
          <Field label="Employer" name="employer" defaultValue={tenant.employer || ""} />
          <Field
            label="Monthly income"
            name="monthly_income"
            type="number"
            defaultValue={tenant.monthly_income ? String(tenant.monthly_income) : ""}
          />
          <Field
            label="Target move-in"
            name="move_in_date"
            type="date"
            defaultValue={tenant.move_in_date || ""}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea name="notes" rows={2} defaultValue={tenant.notes || ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs" />
        </div>
        <button className="text-xs bg-gray-100 px-3 py-1.5 rounded">Save basics</button>
      </form>

      <div className="border-b border-gray-200">
        <TabBtn label="Documents" active={tab === "docs"} onClick={() => setTab("docs")} />
        <TabBtn label="Evaluation" active={tab === "eval"} onClick={() => setTab("eval")} />
        <TabBtn label="Thread" active={tab === "thread"} onClick={() => setTab("thread")} />
      </div>

      {tab === "docs" && (
        <div className="space-y-3">
          <DocUpload tenantId={params.id} onUploaded={(d) => setDocuments((arr) => [...arr, d])} />
          <ul className="space-y-1">
            {documents.map((d) => (
              <li key={d.id} className="text-xs text-gray-700 flex justify-between border border-gray-200 rounded px-3 py-2">
                <span>
                  <span className="text-gray-400 mr-2 uppercase text-[10px]">{d.category}</span>
                  <a href={`/api/tenant-documents/${params.id}/${d.id}/file`} target="_blank" rel="noreferrer" className="text-brand">
                    {d.filename}
                  </a>
                </span>
                <span className="text-gray-400">{(d.size_bytes / 1024).toFixed(0)} KB</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "eval" && <EvalSummary evaluation={evaluation} documents={documents} />}

      {tab === "thread" && <TenantThread tenantId={params.id} canPost={true} />}
    </div>
  );
}

function Field({ label, name, type = "text", defaultValue }: { label: string; name: string; type?: string; defaultValue?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
      />
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs py-2 px-3 -mb-px border-b-2 ${active ? "border-brand text-brand font-medium" : "border-transparent text-gray-500"}`}
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 3: Smoke test the wizard end-to-end**

In the browser as agent: Owners → owner detail → Add property → save. Then dashboard `+ Invite owner`-style nav: New tenant → pick owner+property → create. On the tenant page: upload docs, click "Run AI extraction", review basics, "Run evaluation", wait for ready, "Share with owner". Switch to owner account → see the new tenant in `/owner/tenants`.

- [ ] **Step 4: Commit**

```bash
git add "web/src/app/(dashboard)/agent/tenants"
git commit -m "feat(web): agent new-tenant wizard and tenant detail page"
```

---

### Task J8: Owner — tenants list and tenant detail

**Files:**
- Create: `web/src/app/(dashboard)/owner/tenants/page.tsx`
- Create: `web/src/app/(dashboard)/owner/tenants/[id]/page.tsx`

- [ ] **Step 1: Owner tenants list**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TenantRow {
  id: string;
  applicant_name: string | null;
  status: string;
  property_address: string;
  property_city: string;
  property_state: string;
  shared_at: string | null;
}

export default function OwnerTenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[] | null>(null);

  useEffect(() => {
    fetch("/api/tenants", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setTenants(data.tenants || []));
  }, []);

  if (!tenants) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Tenants</h1>
      {tenants.length === 0 ? (
        <p className="text-sm text-gray-500">No tenants shared with you yet.</p>
      ) : (
        <ul className="space-y-2">
          {tenants.map((t) => (
            <li key={t.id} className="border border-gray-200 rounded p-3">
              <Link href={`/owner/tenants/${t.id}`} className="block">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {t.applicant_name || "(unnamed)"}
                  </p>
                  <span className="text-[10px] uppercase text-gray-500">{t.status}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {t.property_address}, {t.property_city}, {t.property_state}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Owner tenant detail**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EvalSummary } from "@/components/eval-summary";
import { TenantThread } from "@/components/tenant-thread";
import type { Tenant, TenantDocument, TenantEvaluation } from "@/lib/types";

export default function OwnerTenantDetailPage() {
  const params = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [documents, setDocuments] = useState<TenantDocument[]>([]);
  const [evaluation, setEvaluation] = useState<TenantEvaluation | null>(null);
  const [tab, setTab] = useState<"docs" | "eval" | "thread">("eval");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadAll() {
    const [t, d, e] = await Promise.all([
      fetch(`/api/tenants/${params.id}`, { credentials: "include" }).then((r) => r.json()),
      fetch(`/api/tenant-documents/${params.id}`, { credentials: "include" }).then((r) => r.json()),
      fetch(`/api/tenants/${params.id}/evaluation`, { credentials: "include" }).then((r) => r.json()),
    ]);
    setTenant(t.tenant);
    setDocuments(d.documents || []);
    setEvaluation(e.evaluation);
  }

  useEffect(() => {
    loadAll();
  }, [params.id]);

  async function decide(decision: "approved" | "rejected") {
    setBusy(true);
    try {
      const r = await fetch(`/api/tenants/${params.id}/decision`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      await loadAll();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function reopen() {
    setBusy(true);
    try {
      const r = await fetch(`/api/tenants/${params.id}/reopen`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      await loadAll();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!tenant) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {tenant.applicant_name || "(unnamed candidate)"}
          </h1>
          <p className="text-xs text-gray-500">
            Status: <span className="uppercase">{tenant.status}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {tenant.status === "shared" && (
            <>
              <button
                onClick={() => decide("approved")}
                disabled={busy}
                className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => decide("rejected")}
                disabled={busy}
                className="text-xs bg-red-600 text-white px-3 py-1.5 rounded disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}
          {(tenant.status === "approved" || tenant.status === "rejected") && (
            <button
              onClick={reopen}
              disabled={busy}
              className="text-xs border border-gray-300 px-3 py-1.5 rounded disabled:opacity-50"
            >
              Reopen
            </button>
          )}
        </div>
      </div>

      {msg && <p className="text-xs text-amber-700">{msg}</p>}

      <div className="border-b border-gray-200">
        <TabBtn label="Evaluation" active={tab === "eval"} onClick={() => setTab("eval")} />
        <TabBtn label="Documents" active={tab === "docs"} onClick={() => setTab("docs")} />
        <TabBtn label="Thread" active={tab === "thread"} onClick={() => setTab("thread")} />
      </div>

      {tab === "eval" && <EvalSummary evaluation={evaluation} documents={documents} />}

      {tab === "docs" && (
        <ul className="space-y-1">
          {documents.map((d) => (
            <li key={d.id} className="text-xs text-gray-700 flex justify-between border border-gray-200 rounded px-3 py-2">
              <span>
                <span className="text-gray-400 mr-2 uppercase text-[10px]">{d.category}</span>
                <a href={`/api/tenant-documents/${params.id}/${d.id}/file`} target="_blank" rel="noreferrer" className="text-brand">
                  {d.filename}
                </a>
              </span>
              <span className="text-gray-400">{(d.size_bytes / 1024).toFixed(0)} KB</span>
            </li>
          ))}
          {documents.length === 0 && <p className="text-xs text-gray-500">No documents.</p>}
        </ul>
      )}

      {tab === "thread" && <TenantThread tenantId={params.id} canPost={true} />}
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs py-2 px-3 -mb-px border-b-2 ${active ? "border-brand text-brand font-medium" : "border-transparent text-gray-500"}`}
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "web/src/app/(dashboard)/owner/tenants"
git commit -m "feat(web): owner tenants list and tenant detail with approve/reject/reopen"
```

---

### Task J9: Owner dashboard

**Files:**
- Modify: `web/src/app/(dashboard)/owner/page.tsx`

- [ ] **Step 1: Replace with**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TenantRow {
  id: string;
  applicant_name: string | null;
  status: string;
  property_address: string;
  property_city: string;
  property_state: string;
}

interface PropertyRow {
  id: string;
  address: string;
  city: string;
  state: string;
}

export default function OwnerDashboardPage() {
  const [shared, setShared] = useState<TenantRow[] | null>(null);
  const [properties, setProperties] = useState<PropertyRow[]>([]);

  useEffect(() => {
    fetch("/api/tenants?status=shared", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setShared(data.tenants || []));
    fetch("/api/properties", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setProperties(data.properties || []));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>

      <section>
        <h2 className="text-sm font-medium text-gray-900 mb-2">Tenants to review</h2>
        {!shared && <p className="text-sm text-gray-500">Loading…</p>}
        {shared && shared.length === 0 && (
          <p className="text-sm text-gray-500">Nothing shared with you right now.</p>
        )}
        {shared && shared.length > 0 && (
          <ul className="space-y-2">
            {shared.map((t) => (
              <li key={t.id} className="border border-gray-200 rounded p-3 hover:bg-gray-50">
                <Link href={`/owner/tenants/${t.id}`} className="block">
                  <p className="text-sm font-medium text-gray-900">
                    {t.applicant_name || "(unnamed)"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t.property_address}, {t.property_city}, {t.property_state}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-gray-900 mb-2">Your properties</h2>
        {properties.length === 0 ? (
          <p className="text-sm text-gray-500">Your agent will add properties for you.</p>
        ) : (
          <ul className="space-y-2">
            {properties.map((p) => (
              <li key={p.id} className="border border-gray-200 rounded p-3">
                <Link href={`/owner/properties/${p.id}`} className="block">
                  <p className="text-sm font-medium text-gray-900">{p.address}</p>
                  <p className="text-xs text-gray-500">{p.city}, {p.state}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "web/src/app/(dashboard)/owner/page.tsx"
git commit -m "feat(web): owner dashboard with tenants-to-review and properties"
```

---

### Task J10: Trim owner settings page (drop Gmail)

**Files:**
- Modify: `web/src/app/(dashboard)/owner/settings/page.tsx`

- [ ] **Step 1: Replace the file**

The existing settings page has a Gmail OAuth block that no longer applies. Replace with a minimal:

```tsx
"use client";

import { useUser } from "@/lib/user-context";

export default function OwnerSettingsPage() {
  const { user } = useUser();
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
      {user && (
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            Signed in as <strong>{user.name || user.email}</strong>
          </p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      )}
      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-900">Email notifications</p>
        <p className="text-xs text-gray-500 mt-1">
          You'll receive an email when your agent shares a tenant or replies on a thread.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "web/src/app/(dashboard)/owner/settings/page.tsx"
git commit -m "refactor(settings): drop Gmail block from owner settings"
```

---

## Phase K: Polish, Copy, End-to-End Smoke Test

### Task K1: Marketing homepage copy pass

**Files:**
- Modify: `web/src/app/(marketing)/page.tsx`

- [ ] **Step 1: Find and update copy**

The existing homepage references "Inbox Agent," "system of action," and the broader vision. Edit only the copy strings (don't restructure components yet) so they describe the new product:

- Hero headline: replace with `Tenant evaluation, shared with your client`.
- Hero sub: `Your real estate agent runs the docs through AI, then shares the result with you in a single click. You ask questions, approve, or reject — all in one place.`
- "How it works" 3 steps: (1) "Your agent uploads the candidate's docs", (2) "AI generates a score and summary", (3) "You review and decide together".
- Remove any "Inbox Agent" feature panel; replace with a single tenant-eval-focused panel describing the screening flow.
- Remove the Gmail/connect-account messaging.
- Footer remains the same.

If the marketing page is more involved than these copy edits, time-box this task to 30 minutes — the goal is "doesn't lie about the product," not "perfect launch page."

- [ ] **Step 2: Commit**

```bash
git add "web/src/app/(marketing)/page.tsx"
git commit -m "docs(marketing): rewrite homepage copy for tenant-review product"
```

---

### Task K2: Login page copy pass

**Files:**
- Modify: `web/src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Update the role-based messaging map**

Find the `messaging` const and replace with:

```ts
const messaging: Record<Role, { headline: string; sub: string }> = {
  owner: {
    headline: "Review tenant candidates from your agent",
    sub: "AI-summarized applications, your decision.",
  },
  agent: {
    headline: "Screen tenants for your clients",
    sub: "Upload docs, share AI evaluations, manage decisions in one place.",
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add "web/src/app/(auth)/login/page.tsx"
git commit -m "docs(login): refresh role-based messaging copy"
```

---

### Task K3: Full end-to-end smoke test

This task runs through the entire user journey to confirm everything is wired. No code changes; just running and observing.

- [ ] **Step 1: Reset state**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
docker compose up -d
docker exec -it $(docker ps -qf name=postgres) psql -U propstealth -d propstealth \
  -c "TRUNCATE TABLE email_outbox, tenant_thread_events, tenant_evaluations, tenant_documents, tenants, agent_clients, invitations, sessions, properties, users RESTART IDENTITY CASCADE;"
rm -rf api/uploads/*
npm run dev
```

- [ ] **Step 2: Sign in as agent**

Open `http://localhost:3000/login` → toggle "Real Estate Agent" → "Continue with Google" → use a real Google account A → land on `/agent`.

- [ ] **Step 3: Invite an owner**

Click `Invite Owner` → enter the email of Google account B (a different account you control) → submit. Open Mailpit at `http://localhost:8025/` → confirm an invite email. Click the invite link in Mailpit.

- [ ] **Step 4: Accept invite as owner**

In a different browser/profile, click the link → see the invite landing page → "Continue with Google" with account B → land on `/owner`.

- [ ] **Step 5: Create property + tenant (as agent)**

In the agent browser: dashboard → owner row → `+ Add property` → fill out a Florida address → save. Then `+ New tenant` → pick the owner + property → create draft → upload at least one PDF/image with category "Application" or "Income" → "Run AI extraction" → confirm fields populate → "Run evaluation" → wait for status `ready`.

- [ ] **Step 6: Share with the owner**

Click "Share with owner". Open Mailpit → confirm "tenants_shared" email. Click the link.

- [ ] **Step 7: Owner reviews + asks question**

In the owner browser, click the link → land on tenant detail → review evaluation → switch to Thread tab → post `Why is the credit score that?` → submit. Confirm tenant status moves to "shared".

- [ ] **Step 8: Agent replies**

Open Mailpit → confirm thread_message email to the agent. As agent → tenant detail → Thread tab → reply.

- [ ] **Step 9: Owner approves**

Owner browser → Approve. Confirm Mailpit "decision" email to the agent. Confirm tenant status now `approved`.

- [ ] **Step 10: Owner reopens**

Owner browser → "Reopen" button. Confirm status returns to `shared`.

- [ ] **Step 11: Agent unshares (optional)**

Reject in owner browser → reopen → in agent browser, "Unshare" → confirm status returns to `ready`.

- [ ] **Step 12: Capture results**

If anything fails or feels off, file an issue note with the failing step. If everything works, **the MVP is done.**

---

## Self-Review

After writing this plan, the following checks were run against the spec at `docs/superpowers/specs/2026-05-03-tenant-review-design.md`:

**1. Spec coverage:**
- §3 Primary Flow → Task A (foundations), B–C (invite), D (properties), E–F (tenants + docs), G (AI), H (threads + decisions), I (email), J (UI), K (smoke). ✓
- §4 Auth & Onboarding → Phase B (server), Phase C (web). ✓
- §5 Data Model → Tasks A7/A8/A9 (migrations), A10 (TS types). All tables and columns covered. ✓
- §6 Screens → Phase J covers all listed screens. The marketing copy pass is in K1. ✓
- §7 AI Pipeline → Phase G. Two-call structure preserved. Compliance constants in `prompts.ts`. ✓
- §8 Notifications & Email → Phase I (Tasks I1–I4). ✓
- §9 Storage → Task E1 (`createLocalStorage`). ✓
- §10 Compliance → Compliance constant baked into prompts (G1). ✓
- §11 Code-Change Inventory → Phase A handles deletions; subsequent phases create the new files. ✓
- §12 Phasing → Plan phases A–K mirror the spec order. ✓

**2. Placeholder scan:** No "TBD", "TODO", "implement later", "similar to", or vague-handling instructions remain. The two open items in §14 of the spec (upload limits, extraction trigger) are encoded as concrete defaults in code (25 MB limit, allow-listed MIME types in F1; explicit "Run AI extraction" button in J7).

**3. Type consistency:**
- `category_scores` keys (`income`, `credit`, `history`, `identity`) match in `prompts.ts` (G1), `parse.ts` (G2), `eval-summary.tsx` (J3), and the migration JSONB (A8).
- `recommendation` enum (`low_risk`, `review`, `high_risk`) consistent across migration, parse, eval-summary, and types.
- `status` enum on `tenants` consistent across migration (A8), backend handlers (E2 + G6 + H1), and frontend rendering.
- `tenant_thread_events.type` enum consistent across migration, backend, and `tenant-thread.tsx` SYSTEM_LABELS map.

No issues found.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-03-tenant-review-mvp.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using `superpowers:executing-plans`, batch with checkpoints for review.

Which approach?

