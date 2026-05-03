# Agent Framework & Inbox Agent — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a thin agent framework and the Inbox Agent — Gmail OAuth integration, email classification via Claude, auto-respond draft generation, and wired frontend.

**Architecture:** Express API gets new route files for Gmail OAuth and inbox operations, plus an `agents/` directory containing the framework types, registry, and inbox agent logic. The inbox agent fetches emails from Gmail API, classifies each one via Claude structured tool use, stores results in PostgreSQL, and can generate reply drafts as Gmail drafts. Frontend replaces mock data with API calls and adds scan/auto-respond controls.

**Tech Stack:** Express 5, TypeScript, PostgreSQL, `googleapis` (Gmail API), `@anthropic-ai/sdk` (Claude), Next.js 16, Tailwind v4

---

## File Structure

### New Files (API)

| File | Responsibility |
|------|---------------|
| `api/src/db/migrations/005_create_agent_tables.sql` | Creates `agent_runs`, `gmail_connections`, `inbox_emails` tables |
| `api/src/agents/framework.ts` | Agent types (`AgentContext`, `AgentResult`, `AgentRunner`), registry map, `logAgentRun()` helper |
| `api/src/agents/inbox/index.ts` | Inbox agent runner — orchestrates fetch → classify → store pipeline |
| `api/src/agents/inbox/gmail.ts` | Gmail API wrapper — fetch emails, create drafts, token refresh |
| `api/src/agents/inbox/classify.ts` | Claude classification — theme, key points, property match, auto-respond flag |
| `api/src/routes/gmail.ts` | Gmail OAuth routes — connect, callback, status, label update, disconnect |
| `api/src/routes/inbox.ts` | Inbox API routes — scan trigger, list emails, generate draft |

### Modified Files (API)

| File | Change |
|------|--------|
| `api/src/index.ts` | Register `gmail` and `inbox` route files |
| `api/src/config.ts` | Add `ANTHROPIC_API_KEY` to config |

### Modified Files (Frontend)

| File | Change |
|------|--------|
| `web/src/lib/types.ts` | Add `maintenance` to `EmailTheme`, add `InboxEmail` type |
| `web/src/app/(dashboard)/owner/inbox/page.tsx` | Replace mock data with API fetch, add Scan Now button, wire auto-respond |
| `web/src/components/email-card.tsx` | Add `onAutoRespond` callback prop, loading state |
| `web/src/app/(dashboard)/owner/settings/page.tsx` | Wire Gmail connect/disconnect, label save |
| `web/src/components/theme-dot.tsx` | Add `maintenance` theme config |

---

## Task 1: Database Migration

**Files:**
- Create: `api/src/db/migrations/005_create_agent_tables.sql`

- [ ] **Step 1: Write the migration SQL**

Create `api/src/db/migrations/005_create_agent_tables.sql`:

```sql
-- Agent run log (shared across all agents)
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_name VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error')),
  summary TEXT,
  actions INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_user_id ON agent_runs(user_id);

-- Gmail connections (one per user)
CREATE TABLE IF NOT EXISTS gmail_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  gmail_email VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  label VARCHAR(100) DEFAULT 'PropStealth',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inbox emails (classified by the inbox agent)
CREATE TABLE IF NOT EXISTS inbox_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  gmail_message_id VARCHAR(255) NOT NULL UNIQUE,
  sender VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  theme VARCHAR(20) NOT NULL CHECK (theme IN ('tenant', 'hoa', 'bill', 'maintenance', 'other')),
  key_points TEXT,
  full_content TEXT,
  show_auto_respond BOOLEAN DEFAULT false,
  violation_tag VARCHAR(100),
  email_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inbox_emails_user_id ON inbox_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_inbox_emails_property_id ON inbox_emails(property_id);
```

- [ ] **Step 2: Run the migration**

Run: `npm run migrate -w api`
Expected: Migration `005_create_agent_tables.sql` executes successfully, prints confirmation.

- [ ] **Step 3: Verify tables exist**

Run: `docker exec prop-stealth-postgres-1 psql -U propstealth -c "\dt" propstealth`
Expected: `agent_runs`, `gmail_connections`, `inbox_emails` appear in the table list.

- [ ] **Step 4: Commit**

```bash
git add api/src/db/migrations/005_create_agent_tables.sql
git commit -m "feat: add migration for agent_runs, gmail_connections, inbox_emails tables"
```

---

## Task 2: Agent Framework

**Files:**
- Create: `api/src/agents/framework.ts`

- [ ] **Step 1: Create the agents directory**

```bash
mkdir -p api/src/agents/inbox
```

- [ ] **Step 2: Write framework.ts**

Create `api/src/agents/framework.ts`:

```typescript
import { db } from "../db/client.js";

// ---------------------------------------------------------------------------
// Agent types
// ---------------------------------------------------------------------------

export interface AgentContext {
  userId: string;
  agentName: string;
  params: Record<string, unknown>;
}

export interface AgentResult {
  status: "success" | "error";
  summary: string;
  data: Record<string, unknown>;
  actions: number;
}

export type AgentRunner = (context: AgentContext) => Promise<AgentResult>;

// ---------------------------------------------------------------------------
// Agent registry
// ---------------------------------------------------------------------------

const agents: Record<string, AgentRunner> = {};

export function registerAgent(name: string, runner: AgentRunner): void {
  agents[name] = runner;
}

export function getAgent(name: string): AgentRunner | undefined {
  return agents[name];
}

// ---------------------------------------------------------------------------
// Run logging
// ---------------------------------------------------------------------------

export async function logAgentRun(
  userId: string,
  agentName: string,
  result: AgentResult,
  durationMs: number,
): Promise<void> {
  await db.query(
    `INSERT INTO agent_runs (user_id, agent_name, status, summary, actions, duration_ms, error)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      userId,
      agentName,
      result.status,
      result.summary,
      result.actions,
      durationMs,
      result.status === "error" ? result.summary : null,
    ],
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `cd /Users/michaelgalloway/dev/prop-stealth && npx tsc --noEmit -p api/tsconfig.json`
Expected: No errors (or only pre-existing errors unrelated to `framework.ts`).

- [ ] **Step 4: Commit**

```bash
git add api/src/agents/framework.ts
git commit -m "feat: add agent framework types, registry, and run logger"
```

---

## Task 3: Gmail API Wrapper

**Files:**
- Create: `api/src/agents/inbox/gmail.ts`
- Modify: `api/package.json` (add `googleapis` dependency)

- [ ] **Step 1: Install googleapis**

Run: `npm install googleapis -w api`
Expected: `googleapis` added to `api/package.json` dependencies.

- [ ] **Step 2: Write gmail.ts**

Create `api/src/agents/inbox/gmail.ts`:

```typescript
import { google } from "googleapis";
import { config } from "../../config.js";
import { db } from "../../db/client.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GmailTokens {
  access_token: string;
  refresh_token: string;
  token_expires_at: Date;
}

export interface RawEmail {
  gmailMessageId: string;
  sender: string;
  subject: string;
  body: string;
  date: Date;
  threadId: string;
}

// ---------------------------------------------------------------------------
// OAuth client
// ---------------------------------------------------------------------------

function createOAuth2Client(tokens?: GmailTokens) {
  const client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.gmailCallbackUrl,
  );

  if (tokens) {
    client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.token_expires_at.getTime(),
    });
  }

  return client;
}

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

export async function getTokensForUser(userId: string): Promise<GmailTokens | null> {
  const result = await db.query(
    "SELECT access_token, refresh_token, token_expires_at FROM gmail_connections WHERE user_id = $1",
    [userId],
  );
  if (result.rows.length === 0) return null;
  return result.rows[0];
}

export async function refreshTokenIfNeeded(userId: string, tokens: GmailTokens): Promise<GmailTokens> {
  // If token expires within 5 minutes, refresh it
  const fiveMinutes = 5 * 60 * 1000;
  if (tokens.token_expires_at.getTime() - Date.now() > fiveMinutes) {
    return tokens;
  }

  const client = createOAuth2Client(tokens);
  const { credentials } = await client.refreshAccessToken();

  const updated: GmailTokens = {
    access_token: credentials.access_token!,
    refresh_token: credentials.refresh_token || tokens.refresh_token,
    token_expires_at: new Date(credentials.expiry_date!),
  };

  await db.query(
    `UPDATE gmail_connections
     SET access_token = $1, refresh_token = $2, token_expires_at = $3
     WHERE user_id = $4`,
    [updated.access_token, updated.refresh_token, updated.token_expires_at, userId],
  );

  return updated;
}

// ---------------------------------------------------------------------------
// Fetch emails
// ---------------------------------------------------------------------------

export async function fetchEmailsByLabel(
  tokens: GmailTokens,
  label: string,
  maxResults: number = 50,
): Promise<RawEmail[]> {
  const client = createOAuth2Client(tokens);
  const gmail = google.gmail({ version: "v1", auth: client });

  // Find or verify the label exists
  const labelsRes = await gmail.users.labels.list({ userId: "me" });
  const matchedLabel = labelsRes.data.labels?.find(
    (l) => l.name?.toLowerCase() === label.toLowerCase(),
  );

  if (!matchedLabel) {
    return []; // Label doesn't exist — no emails to fetch
  }

  // List messages with this label
  const listRes = await gmail.users.messages.list({
    userId: "me",
    labelIds: [matchedLabel.id!],
    maxResults,
  });

  if (!listRes.data.messages || listRes.data.messages.length === 0) {
    return [];
  }

  // Fetch each message's details
  const emails: RawEmail[] = [];
  for (const msg of listRes.data.messages) {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
      format: "full",
    });

    const headers = detail.data.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

    const sender = getHeader("From");
    const subject = getHeader("Subject");
    const dateStr = getHeader("Date");

    // Extract body text
    let body = "";
    const payload = detail.data.payload;
    if (payload?.body?.data) {
      body = Buffer.from(payload.body.data, "base64url").toString("utf-8");
    } else if (payload?.parts) {
      const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, "base64url").toString("utf-8");
      }
    }

    emails.push({
      gmailMessageId: msg.id!,
      sender,
      subject,
      body,
      date: dateStr ? new Date(dateStr) : new Date(),
      threadId: msg.threadId || msg.id!,
    });
  }

  return emails;
}

// ---------------------------------------------------------------------------
// Create draft reply
// ---------------------------------------------------------------------------

export async function createDraftReply(
  tokens: GmailTokens,
  threadId: string,
  originalMessageId: string,
  to: string,
  subject: string,
  bodyText: string,
): Promise<string> {
  const client = createOAuth2Client(tokens);
  const gmail = google.gmail({ version: "v1", auth: client });

  // Build RFC 2822 message
  const replySubject = subject.startsWith("Re:") ? subject : `Re: ${subject}`;
  const rawMessage = [
    `To: ${to}`,
    `Subject: ${replySubject}`,
    `In-Reply-To: ${originalMessageId}`,
    `References: ${originalMessageId}`,
    "",
    bodyText,
  ].join("\r\n");

  const encoded = Buffer.from(rawMessage).toString("base64url");

  const draft = await gmail.users.drafts.create({
    userId: "me",
    requestBody: {
      message: {
        raw: encoded,
        threadId,
      },
    },
  });

  return draft.data.id!;
}

// ---------------------------------------------------------------------------
// OAuth URL generation (used by routes)
// ---------------------------------------------------------------------------

export function getGmailAuthUrl(userId: string): string {
  const client = createOAuth2Client();
  const state = Buffer.from(JSON.stringify({ userId })).toString("base64url");

  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/gmail.labels",
    ],
    state,
  });
}

export async function exchangeGmailCode(code: string): Promise<{
  tokens: GmailTokens;
  email: string;
}> {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);

  client.setCredentials(tokens);
  const gmail = google.gmail({ version: "v1", auth: client });
  const profile = await gmail.users.getProfile({ userId: "me" });

  return {
    tokens: {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
      token_expires_at: new Date(tokens.expiry_date!),
    },
    email: profile.data.emailAddress!,
  };
}
```

- [ ] **Step 3: Add `gmailCallbackUrl` to config**

In `api/src/config.ts`, add `gmailCallbackUrl` inside the `google` block:

```typescript
// In the config object, inside the google block, after callbackUrl:
gmailCallbackUrl:
  process.env.GMAIL_CALLBACK_URL ||
  "http://localhost:3000/api/gmail/callback",
```

- [ ] **Step 4: Verify it compiles**

Run: `cd /Users/michaelgalloway/dev/prop-stealth && npx tsc --noEmit -p api/tsconfig.json`
Expected: No errors related to `gmail.ts`.

- [ ] **Step 5: Commit**

```bash
git add api/src/agents/inbox/gmail.ts api/src/config.ts api/package.json api/package-lock.json
git commit -m "feat: add Gmail API wrapper with OAuth, email fetch, and draft creation"
```

---

## Task 4: Claude Classification

**Files:**
- Create: `api/src/agents/inbox/classify.ts`
- Modify: `api/package.json` (add `@anthropic-ai/sdk`)
- Modify: `api/src/config.ts` (add `ANTHROPIC_API_KEY`)

- [ ] **Step 1: Install Anthropic SDK**

Run: `npm install @anthropic-ai/sdk -w api`
Expected: `@anthropic-ai/sdk` added to `api/package.json` dependencies.

- [ ] **Step 2: Add `anthropicApiKey` to config**

In `api/src/config.ts`, add at the top level of the config object (after `sessionMaxAge`):

```typescript
anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
```

- [ ] **Step 3: Write classify.ts**

Create `api/src/agents/inbox/classify.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { config } from "../../config.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EmailTheme = "tenant" | "hoa" | "bill" | "maintenance" | "other";

export interface ClassificationResult {
  theme: EmailTheme;
  keyPoints: string;
  propertyMatch: string | null;
  showAutoRespond: boolean;
  violationTag: string | null;
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

const client = new Anthropic({ apiKey: config.anthropicApiKey });

const classifyTool: Anthropic.Messages.Tool = {
  name: "classify_email",
  description: "Classify a property-related email and extract key information.",
  input_schema: {
    type: "object" as const,
    properties: {
      theme: {
        type: "string",
        enum: ["tenant", "hoa", "bill", "maintenance", "other"],
        description: "The primary theme of the email.",
      },
      key_points: {
        type: "string",
        description: "1-2 sentence summary of the most important information in the email.",
      },
      property_match: {
        type: "string",
        description: "The property address this email is most likely about, based on the content. Null if unclear.",
        nullable: true,
      },
      show_auto_respond: {
        type: "boolean",
        description: "Whether this email is appropriate for an auto-respond draft. True for tenant requests, HOA notices, and maintenance requests. False for bills, tax notices, and automated messages.",
      },
      violation_tag: {
        type: "string",
        description: "A short tag if the email contains a violation, urgent issue, or lease concern. Examples: 'Violation', 'Urgent', 'Lease violation'. Null if not applicable.",
        nullable: true,
      },
    },
    required: ["theme", "key_points", "property_match", "show_auto_respond", "violation_tag"],
  },
};

export async function classifyEmail(
  sender: string,
  subject: string,
  body: string,
  propertyAddresses: string[],
): Promise<ClassificationResult> {
  const propertyList = propertyAddresses.length > 0
    ? `The user owns these properties:\n${propertyAddresses.map((a) => `- ${a}`).join("\n")}`
    : "The user has no properties on file.";

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    tools: [classifyTool],
    tool_choice: { type: "tool", name: "classify_email" },
    messages: [
      {
        role: "user",
        content: `You are classifying a property-related email for a real estate owner/manager.

${propertyList}

Classify this email:

From: ${sender}
Subject: ${subject}

${body}`,
      },
    ],
  });

  // Extract tool use result
  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a tool use response");
  }

  const input = toolUse.input as Record<string, unknown>;
  return {
    theme: input.theme as EmailTheme,
    keyPoints: input.key_points as string,
    propertyMatch: (input.property_match as string) || null,
    showAutoRespond: input.show_auto_respond as boolean,
    violationTag: (input.violation_tag as string) || null,
  };
}

// ---------------------------------------------------------------------------
// Draft generation
// ---------------------------------------------------------------------------

export async function generateReplyDraft(
  originalEmail: { sender: string; subject: string; body: string; theme: string },
  propertyContext: string,
): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Draft a professional reply from a property owner/manager to this email.

CONSTRAINTS:
- Never reference protected class attributes (Fair Housing Act compliance)
- Keep the reply under 150 words
- Match the formality level of the incoming email
- For maintenance requests: acknowledge the issue, promise follow-up, do NOT commit to specific timelines
- Be helpful and professional

Property context: ${propertyContext}

Original email:
From: ${originalEmail.sender}
Subject: ${originalEmail.subject}

${originalEmail.body}

Write ONLY the reply body text — no subject line, no greeting prefix like "Dear", just start with the greeting naturally.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude did not return a text response");
  }
  return textBlock.text;
}
```

- [ ] **Step 4: Verify it compiles**

Run: `cd /Users/michaelgalloway/dev/prop-stealth && npx tsc --noEmit -p api/tsconfig.json`
Expected: No errors related to `classify.ts`.

- [ ] **Step 5: Commit**

```bash
git add api/src/agents/inbox/classify.ts api/src/config.ts api/package.json api/package-lock.json
git commit -m "feat: add Claude email classification and draft generation"
```

---

## Task 5: Inbox Agent Runner

**Files:**
- Create: `api/src/agents/inbox/index.ts`

- [ ] **Step 1: Write the inbox agent runner**

Create `api/src/agents/inbox/index.ts`:

```typescript
import { AgentContext, AgentResult, registerAgent, logAgentRun } from "../framework.js";
import { getTokensForUser, refreshTokenIfNeeded, fetchEmailsByLabel } from "./gmail.js";
import { classifyEmail } from "./classify.js";
import { db } from "../../db/client.js";

async function inboxAgent(context: AgentContext): Promise<AgentResult> {
  const startTime = Date.now();
  const { userId } = context;

  try {
    // 1. Get Gmail connection
    const conn = await db.query(
      "SELECT * FROM gmail_connections WHERE user_id = $1",
      [userId],
    );
    if (conn.rows.length === 0) {
      const result: AgentResult = {
        status: "error",
        summary: "Gmail not connected. Go to Settings to connect your Gmail.",
        data: {},
        actions: 0,
      };
      await logAgentRun(userId, "inbox", result, Date.now() - startTime);
      return result;
    }

    const connection = conn.rows[0];
    const label = connection.label || "PropStealth";

    // 2. Refresh token if needed
    const tokens = await refreshTokenIfNeeded(userId, {
      access_token: connection.access_token,
      refresh_token: connection.refresh_token,
      token_expires_at: new Date(connection.token_expires_at),
    });

    // 3. Fetch emails from Gmail
    const rawEmails = await fetchEmailsByLabel(tokens, label);

    // 4. Filter out already-processed emails
    const existingIds = await db.query(
      "SELECT gmail_message_id FROM inbox_emails WHERE user_id = $1",
      [userId],
    );
    const processedSet = new Set(existingIds.rows.map((r: { gmail_message_id: string }) => r.gmail_message_id));
    const newEmails = rawEmails.filter((e) => !processedSet.has(e.gmailMessageId));

    if (newEmails.length === 0) {
      const result: AgentResult = {
        status: "success",
        summary: "No new emails to process.",
        data: { processed: 0 },
        actions: 0,
      };
      await logAgentRun(userId, "inbox", result, Date.now() - startTime);
      return result;
    }

    // 5. Get user's property addresses for classification context
    const propsResult = await db.query(
      "SELECT id, address, city, state, unit FROM properties WHERE user_id = $1",
      [userId],
    );
    const propertyAddresses = propsResult.rows.map(
      (p: { address: string; city: string; state: string; unit: string | null }) =>
        `${p.address}${p.unit ? `, ${p.unit}` : ""}, ${p.city}, ${p.state}`,
    );

    // 6. Classify each email and store
    let processedCount = 0;
    for (const email of newEmails) {
      const classification = await classifyEmail(
        email.sender,
        email.subject,
        email.body,
        propertyAddresses,
      );

      // Match property by address if possible
      let propertyId: string | null = null;
      if (classification.propertyMatch) {
        const match = propsResult.rows.find(
          (p: { id: string; address: string; city: string; state: string }) =>
            classification.propertyMatch!.toLowerCase().includes(p.address.toLowerCase()),
        );
        if (match) propertyId = match.id;
      }

      await db.query(
        `INSERT INTO inbox_emails
         (user_id, property_id, gmail_message_id, sender, subject, theme, key_points, full_content, show_auto_respond, violation_tag, email_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (gmail_message_id) DO NOTHING`,
        [
          userId,
          propertyId,
          email.gmailMessageId,
          email.sender,
          email.subject,
          classification.theme,
          classification.keyPoints,
          email.body,
          classification.showAutoRespond,
          classification.violationTag,
          email.date,
        ],
      );
      processedCount++;
    }

    const result: AgentResult = {
      status: "success",
      summary: `Processed ${processedCount} new email${processedCount === 1 ? "" : "s"}.`,
      data: { processed: processedCount },
      actions: processedCount,
    };
    await logAgentRun(userId, "inbox", result, Date.now() - startTime);
    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    const result: AgentResult = {
      status: "error",
      summary: errorMsg,
      data: {},
      actions: 0,
    };
    await logAgentRun(userId, "inbox", result, Date.now() - startTime);
    return result;
  }
}

// Register the agent
registerAgent("inbox", inboxAgent);

export { inboxAgent };
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/michaelgalloway/dev/prop-stealth && npx tsc --noEmit -p api/tsconfig.json`
Expected: No errors related to `inbox/index.ts`.

- [ ] **Step 3: Commit**

```bash
git add api/src/agents/inbox/index.ts
git commit -m "feat: add inbox agent runner with fetch-classify-store pipeline"
```

---

## Task 6: Gmail OAuth Routes

**Files:**
- Create: `api/src/routes/gmail.ts`
- Modify: `api/src/index.ts`

- [ ] **Step 1: Write gmail.ts routes**

Create `api/src/routes/gmail.ts`:

```typescript
import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { JwtPayload } from "../types.js";
import { db } from "../db/client.js";
import { getGmailAuthUrl, exchangeGmailCode } from "../agents/inbox/gmail.js";

const router = Router();

// GET /connect — initiate Gmail OAuth
router.get("/connect", requireAuth, (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload;
  const url = getGmailAuthUrl(userId);
  res.redirect(url);
});

// GET /callback — handle Gmail OAuth callback
router.get("/callback", async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string | undefined;
    const stateParam = req.query.state as string | undefined;

    if (!code || !stateParam) {
      res.redirect("/owner/settings?error=gmail_auth_failed");
      return;
    }

    const state = JSON.parse(Buffer.from(stateParam, "base64url").toString("utf-8"));
    const userId = state.userId as string;

    if (!userId) {
      res.redirect("/owner/settings?error=gmail_auth_failed");
      return;
    }

    const { tokens, email } = await exchangeGmailCode(code);

    // Upsert gmail connection
    await db.query(
      `INSERT INTO gmail_connections (user_id, gmail_email, access_token, refresh_token, token_expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         gmail_email = EXCLUDED.gmail_email,
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         token_expires_at = EXCLUDED.token_expires_at`,
      [userId, email, tokens.access_token, tokens.refresh_token, tokens.token_expires_at],
    );

    res.redirect("/owner/settings?gmail=connected");
  } catch (err) {
    console.error("Gmail OAuth callback error:", err);
    res.redirect("/owner/settings?error=gmail_auth_failed");
  }
});

// GET /status — connection status
router.get("/status", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    const result = await db.query(
      "SELECT gmail_email, label, created_at FROM gmail_connections WHERE user_id = $1",
      [userId],
    );

    if (result.rows.length === 0) {
      res.json({ connected: false });
      return;
    }

    res.json({
      connected: true,
      email: result.rows[0].gmail_email,
      label: result.rows[0].label,
      connectedAt: result.rows[0].created_at,
    });
  } catch (err) {
    console.error("Gmail status error:", err);
    res.status(500).json({ error: "Failed to get Gmail status" });
  }
});

// PUT /label — update monitored label
router.put("/label", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    const { label } = req.body;

    if (!label || typeof label !== "string") {
      res.status(400).json({ error: "label is required" });
      return;
    }

    const result = await db.query(
      "UPDATE gmail_connections SET label = $1 WHERE user_id = $2 RETURNING label",
      [label.trim(), userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Gmail not connected" });
      return;
    }

    res.json({ label: result.rows[0].label });
  } catch (err) {
    console.error("Update label error:", err);
    res.status(500).json({ error: "Failed to update label" });
  }
});

// DELETE /disconnect — remove Gmail connection
router.delete("/disconnect", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    await db.query("DELETE FROM gmail_connections WHERE user_id = $1", [userId]);
    res.json({ success: true });
  } catch (err) {
    console.error("Gmail disconnect error:", err);
    res.status(500).json({ error: "Failed to disconnect Gmail" });
  }
});

export default router;
```

- [ ] **Step 2: Register gmail routes in index.ts**

In `api/src/index.ts`, add the import and route registration:

Add import after the `clientRoutes` import:
```typescript
import gmailRoutes from "./routes/gmail.js";
```

Add route after `app.use("/api/clients", clientRoutes);`:
```typescript
app.use("/api/gmail", gmailRoutes);
```

- [ ] **Step 3: Verify it compiles**

Run: `cd /Users/michaelgalloway/dev/prop-stealth && npx tsc --noEmit -p api/tsconfig.json`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add api/src/routes/gmail.ts api/src/index.ts
git commit -m "feat: add Gmail OAuth routes (connect, callback, status, label, disconnect)"
```

---

## Task 7: Inbox API Routes

**Files:**
- Create: `api/src/routes/inbox.ts`
- Modify: `api/src/index.ts`

- [ ] **Step 1: Write inbox.ts routes**

Create `api/src/routes/inbox.ts`:

```typescript
import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { JwtPayload } from "../types.js";
import { db } from "../db/client.js";
import { getAgent, logAgentRun } from "../agents/framework.js";
import "../agents/inbox/index.js"; // side-effect: registers the inbox agent
import { getTokensForUser, refreshTokenIfNeeded, createDraftReply } from "../agents/inbox/gmail.js";
import { generateReplyDraft } from "../agents/inbox/classify.js";

const router = Router();

// POST /scan — trigger inbox agent scan
router.post("/scan", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;

    const agent = getAgent("inbox");
    if (!agent) {
      res.status(500).json({ error: "Inbox agent not registered" });
      return;
    }

    const result = await agent({
      userId,
      agentName: "inbox",
      params: {},
    });

    res.json({ result });
  } catch (err) {
    console.error("Inbox scan error:", err);
    res.status(500).json({ error: "Scan failed" });
  }
});

// GET /emails — list processed emails, grouped by property
router.get("/emails", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;

    // Fetch all emails for this user, joined with property info
    const result = await db.query(
      `SELECT ie.*,
              p.address as property_address,
              p.city as property_city,
              p.state as property_state,
              p.unit as property_unit
       FROM inbox_emails ie
       LEFT JOIN properties p ON p.id = ie.property_id
       WHERE ie.user_id = $1
       ORDER BY ie.email_date DESC`,
      [userId],
    );

    // Group by property
    const propertyMap = new Map<string, {
      propertyId: string | null;
      address: string;
      city: string;
      emails: typeof result.rows;
    }>();

    for (const row of result.rows) {
      const key = row.property_id || "unmatched";
      if (!propertyMap.has(key)) {
        propertyMap.set(key, {
          propertyId: row.property_id,
          address: row.property_address || "Unmatched",
          city: row.property_city && row.property_state
            ? `${row.property_city}, ${row.property_state}`
            : "",
          emails: [],
        });
      }
      propertyMap.get(key)!.emails.push(row);
    }

    const groups = Array.from(propertyMap.values());

    // Also get the last scan time
    const lastScan = await db.query(
      "SELECT created_at FROM agent_runs WHERE user_id = $1 AND agent_name = 'inbox' ORDER BY created_at DESC LIMIT 1",
      [userId],
    );

    res.json({
      groups,
      lastScannedAt: lastScan.rows[0]?.created_at || null,
    });
  } catch (err) {
    console.error("List emails error:", err);
    res.status(500).json({ error: "Failed to list emails" });
  }
});

// POST /emails/:id/draft — generate auto-respond draft
router.post("/emails/:id/draft", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    const emailId = req.params.id;

    // Fetch the email
    const emailResult = await db.query(
      "SELECT * FROM inbox_emails WHERE id = $1 AND user_id = $2",
      [emailId, userId],
    );
    if (emailResult.rows.length === 0) {
      res.status(404).json({ error: "Email not found" });
      return;
    }
    const email = emailResult.rows[0];

    // Build property context
    let propertyContext = "No specific property context available.";
    if (email.property_id) {
      const propResult = await db.query(
        "SELECT address, city, state, unit, occupied, tenant_name FROM properties WHERE id = $1",
        [email.property_id],
      );
      if (propResult.rows.length > 0) {
        const p = propResult.rows[0];
        propertyContext = `Property: ${p.address}${p.unit ? `, ${p.unit}` : ""}, ${p.city}, ${p.state}. ${p.occupied ? `Occupied by ${p.tenant_name || "tenant"}.` : "Currently vacant."}`;
      }
    }

    // Generate draft text with Claude
    const draftText = await generateReplyDraft(
      {
        sender: email.sender,
        subject: email.subject || "",
        body: email.full_content || "",
        theme: email.theme,
      },
      propertyContext,
    );

    // Get Gmail tokens and create draft
    const tokens = await getTokensForUser(userId);
    if (!tokens) {
      res.status(400).json({ error: "Gmail not connected" });
      return;
    }

    const refreshedTokens = await refreshTokenIfNeeded(userId, tokens);

    await createDraftReply(
      refreshedTokens,
      email.gmail_message_id, // threadId — we stored message ID, use as thread reference
      email.gmail_message_id,
      email.sender,
      email.subject || "",
      draftText,
    );

    res.json({ draft: draftText });
  } catch (err) {
    console.error("Generate draft error:", err);
    res.status(500).json({ error: "Failed to generate draft" });
  }
});

export default router;
```

- [ ] **Step 2: Register inbox routes in index.ts**

In `api/src/index.ts`, add the import and route registration:

Add import after the `gmailRoutes` import:
```typescript
import inboxRoutes from "./routes/inbox.js";
```

Add route after `app.use("/api/gmail", gmailRoutes);`:
```typescript
app.use("/api/inbox", inboxRoutes);
```

- [ ] **Step 3: Verify it compiles**

Run: `cd /Users/michaelgalloway/dev/prop-stealth && npx tsc --noEmit -p api/tsconfig.json`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add api/src/routes/inbox.ts api/src/index.ts
git commit -m "feat: add inbox API routes (scan, list emails, generate draft)"
```

---

## Task 8: Frontend — Update Types and ThemeDot

**Files:**
- Modify: `web/src/lib/types.ts`
- Modify: `web/src/components/theme-dot.tsx`

- [ ] **Step 1: Add `maintenance` to EmailTheme**

In `web/src/lib/types.ts`, change line 1:

```typescript
// Before:
export type EmailTheme = "tenant" | "hoa" | "bill" | "other";

// After:
export type EmailTheme = "tenant" | "hoa" | "bill" | "maintenance" | "other";
```

- [ ] **Step 2: Add maintenance to ThemeDot**

In `web/src/components/theme-dot.tsx`, add `maintenance` entry to `themeConfig`:

```typescript
// Before:
const themeConfig: Record<EmailTheme, { dot: string; label: string }> = {
  tenant: { dot: "bg-blue-600", label: "TENANT" },
  hoa: { dot: "bg-purple-600", label: "HOA" },
  bill: { dot: "bg-brand", label: "BILL" },
  other: { dot: "bg-gray-500", label: "OTHER" },
};

// After:
const themeConfig: Record<EmailTheme, { dot: string; label: string }> = {
  tenant: { dot: "bg-blue-600", label: "TENANT" },
  hoa: { dot: "bg-purple-600", label: "HOA" },
  bill: { dot: "bg-brand", label: "BILL" },
  maintenance: { dot: "bg-amber-600", label: "MAINTENANCE" },
  other: { dot: "bg-gray-500", label: "OTHER" },
};
```

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/types.ts web/src/components/theme-dot.tsx
git commit -m "feat: add maintenance theme to email types and theme dot component"
```

---

## Task 9: Frontend — Wire Settings Page (Gmail Connection + Label)

**Files:**
- Modify: `web/src/app/(dashboard)/owner/settings/page.tsx`

- [ ] **Step 1: Rewrite the settings page to wire Gmail connection and label**

Replace `web/src/app/(dashboard)/owner/settings/page.tsx` with:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/user-context";

export default function SettingsPage() {
  const { user, loading: userLoading } = useUser();
  const [gmailStatus, setGmailStatus] = useState<{
    connected: boolean;
    email?: string;
    label?: string;
  } | null>(null);
  const [label, setLabel] = useState("PropStealth");
  const [labelSaving, setLabelSaving] = useState(false);
  const [labelSaved, setLabelSaved] = useState(false);

  useEffect(() => {
    fetch("/api/gmail/status", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { connected: false }))
      .then((data) => {
        setGmailStatus(data);
        if (data.label) setLabel(data.label);
      })
      .catch(() => setGmailStatus({ connected: false }));
  }, []);

  async function handleDisconnect() {
    await fetch("/api/gmail/disconnect", {
      method: "DELETE",
      credentials: "include",
    });
    setGmailStatus({ connected: false });
  }

  async function handleSaveLabel() {
    setLabelSaving(true);
    setLabelSaved(false);
    try {
      const res = await fetch("/api/gmail/label", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ label }),
      });
      if (res.ok) setLabelSaved(true);
    } catch {
      // ignore
    } finally {
      setLabelSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900 mb-5">Settings</h1>

      <div className="max-w-[560px]">
        {/* Gmail Connection */}
        <div className="border rounded-lg p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Gmail Connection
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Connect your Gmail account so the Inbox Agent can monitor your
            property emails.
          </p>
          <div className="flex items-center gap-2">
            {gmailStatus?.connected ? (
              <>
                <span className="text-[11px] px-2.5 py-1 rounded bg-green-50 border border-green-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  <span className="text-green-700 font-medium">
                    {gmailStatus.email}
                  </span>
                </span>
                <button
                  onClick={handleDisconnect}
                  className="text-[11px] text-red-600 hover:text-red-700"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <a
                href="/api/gmail/connect"
                className="bg-brand text-white px-3 py-1.5 rounded-md text-xs font-medium"
              >
                Connect Gmail
              </a>
            )}
          </div>
        </div>

        {/* Gmail Label */}
        <div className="border rounded-lg p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Gmail Label
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            The Inbox Agent monitors emails under this Gmail label. Apply the
            label manually or set up a Gmail filter to route property emails
            automatically.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setLabelSaved(false);
              }}
              className="w-[240px] border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <button
              onClick={handleSaveLabel}
              disabled={labelSaving}
              className="bg-brand text-white px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-50"
            >
              {labelSaving ? "Saving..." : "Save"}
            </button>
            {labelSaved && (
              <span className="text-[11px] text-green-600">Saved</span>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="border rounded-lg p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Notifications
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Choose how you want to be notified about activity.
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                defaultChecked
                className="accent-brand"
              />
              <span className="text-xs text-gray-700">Email digest (daily)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-brand" />
              <span className="text-xs text-gray-700">Push notifications</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-brand" />
              <span className="text-xs text-gray-700">
                SMS alerts for urgent items
              </span>
            </label>
          </div>
        </div>

        {/* Account */}
        <div className="border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Account</h2>
          {userLoading ? (
            <div className="text-xs text-gray-400">Loading...</div>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input
                  type="text"
                  defaultValue={user?.name || ""}
                  className="w-[240px] border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue={user?.email || ""}
                  disabled
                  className="w-[240px] border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-400 bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it renders**

Run: `npm run dev -w web`
Navigate to `http://localhost:3000/owner/settings` (with auth cookie).
Expected: Gmail Connection shows "Connect Gmail" button (or connected email if connected). Gmail Label shows editable input with Save button.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/\(dashboard\)/owner/settings/page.tsx
git commit -m "feat: wire settings page Gmail connection and label to API"
```

---

## Task 10: Frontend — Wire EmailCard Auto-Respond

**Files:**
- Modify: `web/src/components/email-card.tsx`

- [ ] **Step 1: Add onAutoRespond callback and loading state**

Replace `web/src/components/email-card.tsx` with:

```typescript
"use client";

import { useState } from "react";
import type { Email } from "@/lib/types";

interface EmailCardProps {
  email: Email;
  onAutoRespond?: (emailId: string) => Promise<void>;
}

export function EmailCard({ email, onAutoRespond }: EmailCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [drafted, setDrafted] = useState(false);

  const context = email.unit
    ? `${email.unit} · ${email.timestamp}`
    : email.timestamp;

  async function handleAutoRespond() {
    if (!onAutoRespond) return;
    setDrafting(true);
    try {
      await onAutoRespond(email.id);
      setDrafted(true);
    } catch {
      // ignore — parent can show errors
    } finally {
      setDrafting(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 mb-1.5">
      <div className="flex justify-between items-start">
        {/* Left */}
        <div className="flex-1">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-900">
              {email.sender}
            </span>
            <span className="text-[10px] text-gray-500">{context}</span>
            {email.violationTag && (
              <span className="text-[9px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded-sm">
                {email.violationTag}
              </span>
            )}
          </div>

          {/* Key points */}
          <p className="text-xs text-gray-700 leading-relaxed">
            <span className="font-bold text-gray-900">Key points:</span>{" "}
            {email.keyPoints}
          </p>

          {/* Expanded content */}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <pre className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap font-sans">
                {email.fullContent}
              </pre>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex gap-1.5 ml-3 flex-shrink-0">
          {email.showAutoRespond && !drafted && (
            <button
              onClick={handleAutoRespond}
              disabled={drafting}
              className="bg-brand text-white px-2.5 py-1 rounded-[5px] text-[11px] whitespace-nowrap disabled:opacity-50"
            >
              {drafting ? "Drafting..." : "Auto-respond"}
            </button>
          )}
          {drafted && (
            <span className="text-[11px] text-green-600 px-2.5 py-1">
              Draft created
            </span>
          )}
          <button
            className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-[5px] text-[11px]"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Collapse ▴" : "Expand ▾"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/email-card.tsx
git commit -m "feat: add auto-respond callback and draft status to EmailCard"
```

---

## Task 11: Frontend — Wire Inbox Page

**Files:**
- Modify: `web/src/app/(dashboard)/owner/inbox/page.tsx`

- [ ] **Step 1: Rewrite inbox page to use real API data**

Replace `web/src/app/(dashboard)/owner/inbox/page.tsx` with:

```typescript
"use client";

import { useEffect, useState } from "react";
import type { EmailTheme } from "@/lib/types";
import { ThemeDot } from "@/components/theme-dot";
import { EmailCard } from "@/components/email-card";

interface InboxEmail {
  id: string;
  sender: string;
  subject: string;
  theme: EmailTheme;
  key_points: string;
  full_content: string;
  show_auto_respond: boolean;
  violation_tag: string | null;
  email_date: string;
  property_id: string | null;
  property_unit: string | null;
}

interface PropertyGroup {
  propertyId: string | null;
  address: string;
  city: string;
  emails: InboxEmail[];
}

const themeOrder: EmailTheme[] = ["tenant", "hoa", "bill", "maintenance", "other"];

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

function formatLastScanned(dateStr: string | null): string {
  if (!dateStr) return "Never scanned";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function InboxPage() {
  const [groups, setGroups] = useState<PropertyGroup[]>([]);
  const [lastScannedAt, setLastScannedAt] = useState<string | null>(null);
  const [activeProperty, setActiveProperty] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  function fetchEmails() {
    fetch("/api/inbox/emails", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { groups: [], lastScannedAt: null }))
      .then((data) => {
        setGroups(data.groups);
        setLastScannedAt(data.lastScannedAt);
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchEmails();
  }, []);

  async function handleScan() {
    setScanning(true);
    setScanMessage(null);
    try {
      const res = await fetch("/api/inbox/scan", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setScanMessage(data.result.summary);
        fetchEmails(); // Refresh the list
      } else {
        setScanMessage(data.error || "Scan failed");
      }
    } catch {
      setScanMessage("Network error");
    } finally {
      setScanning(false);
    }
  }

  async function handleAutoRespond(emailId: string) {
    const res = await fetch(`/api/inbox/emails/${emailId}/draft`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to create draft");
    }
  }

  const filteredGroups =
    activeProperty === null
      ? groups
      : groups.filter((g) => g.propertyId === activeProperty);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-1.5">
        <h1 className="text-lg font-semibold text-gray-900">Inbox Agent</h1>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded">
            {formatLastScanned(lastScannedAt)}
          </span>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="bg-brand text-white px-3 py-1 rounded-md text-[11px] font-medium disabled:opacity-50"
          >
            {scanning ? "Scanning..." : "Scan Now"}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Emails from your Gmail label, classified and summarized by AI.
      </p>

      {scanMessage && (
        <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 mb-4">
          {scanMessage}
        </div>
      )}

      {loading && <p className="text-xs text-gray-400">Loading emails...</p>}

      {!loading && groups.length === 0 && (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">No emails yet</p>
          <p className="text-xs text-gray-400 mb-4">
            Connect Gmail in Settings, then click Scan Now to process your emails.
          </p>
        </div>
      )}

      {/* Property filter tabs */}
      {groups.length > 0 && (
        <div className="flex gap-0 mb-5 border-b border-gray-200">
          <button
            className={`px-3 py-1.5 text-xs ${
              activeProperty === null
                ? "text-brand border-b-2 border-brand font-medium"
                : "text-gray-500"
            }`}
            onClick={() => setActiveProperty(null)}
          >
            All Properties
          </button>
          {groups.map((group) => (
            <button
              key={group.propertyId || "unmatched"}
              className={`px-3 py-1.5 text-xs ${
                activeProperty === group.propertyId
                  ? "text-brand border-b-2 border-brand font-medium"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveProperty(group.propertyId)}
            >
              {group.address}
            </button>
          ))}
        </div>
      )}

      {/* Email groups */}
      {filteredGroups.map((group) => (
        <div key={group.propertyId || "unmatched"} className="mb-6">
          {/* Property header */}
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            {group.address}
            {group.city && (
              <span className="text-[10px] text-gray-500 font-normal">
                {group.city}
              </span>
            )}
          </h2>

          {/* Theme sections */}
          {themeOrder.map((theme) => {
            const themeEmails = group.emails.filter((e) => e.theme === theme);
            if (themeEmails.length === 0) return null;

            return (
              <div key={theme} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <ThemeDot theme={theme} />
                  <span className="text-[10px] text-gray-500">
                    {themeEmails.length}
                  </span>
                </div>
                {themeEmails.map((email) => (
                  <EmailCard
                    key={email.id}
                    email={{
                      id: email.id,
                      sender: email.sender,
                      propertyId: email.property_id || "",
                      unit: email.property_unit || undefined,
                      theme: email.theme,
                      timestamp: formatTimestamp(email.email_date),
                      keyPoints: email.key_points || "",
                      fullContent: email.full_content || "",
                      showAutoRespond: email.show_auto_respond,
                      violationTag: email.violation_tag || undefined,
                    }}
                    onAutoRespond={handleAutoRespond}
                  />
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify it renders**

Run: `npm run dev -w web`
Navigate to `http://localhost:3000/owner/inbox` (with auth cookie).
Expected: Page shows "No emails yet" empty state with prompt to connect Gmail. Scan Now button visible in header.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/\(dashboard\)/owner/inbox/page.tsx
git commit -m "feat: wire inbox page to API with scan, email list, and auto-respond"
```

---

## Task 12: End-to-End Verification

- [ ] **Step 1: Start both servers**

Run: `npm run dev`
Expected: Web on port 3000 (or next available), API on port 4000.

- [ ] **Step 2: Verify API endpoints**

Test Gmail status (should return not connected for a user without Gmail):
```bash
curl -s http://localhost:4000/api/gmail/status -H "Cookie: propstealth_session=<jwt>" | jq
```
Expected: `{ "connected": false }`

Test inbox emails (should return empty):
```bash
curl -s http://localhost:4000/api/inbox/emails -H "Cookie: propstealth_session=<jwt>" | jq
```
Expected: `{ "groups": [], "lastScannedAt": null }`

- [ ] **Step 3: Verify frontend pages**

Navigate to Settings page — verify "Connect Gmail" button appears.
Navigate to Inbox page — verify empty state, Scan Now button.

- [ ] **Step 4: Commit any fixes if needed**

If any issues are found during verification, fix them and commit.

- [ ] **Step 5: Final commit and push**

```bash
git push origin feat/inbox-agent
```
