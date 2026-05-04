# Product Requirements Document (PRD)

**Product (working name):** PropStealth
**Document owner:** Product Management
**Status:** Draft v0.2
**Last updated:** 2026-04-19

---

## 1. Executive Summary

PropStealth is an AI-native operating system for real estate agents and small-portfolio landlords (typically 1–5 rental properties). The product uses a modular fleet of AI agents to automate the repetitive, high-friction work of managing rental properties — from tenant screening and maintenance coordination to utility bill management, compliance tracking, and portfolio performance analysis.

The core insight: a real estate agent who can offer ongoing property management and wealth-building services — not just a transaction — becomes dramatically more valuable to investor clients. PropStealth gives agents the leverage to provide those services without hiring staff.

Unlike traditional property management software that is primarily a system of record, PropStealth is a **system of action**. Users connect their email, calendar, documents, and accounts; AI agents then read, classify, and act on incoming information on the user's behalf, surfacing only the decisions that truly require human input.

## 2. Problem Statement

Real estate agents and small-portfolio landlords spend the majority of their working hours on non-revenue-generating operational overhead:

- **Inbox overload**: utility notices, tenant messages, vendor quotes, municipal notifications, and HOA emails all flood a single mailbox with no prioritization.
- **Document sprawl**: lease agreements, insurance policies, inspection reports, tax documents, and property records live in scattered folders and email threads.
- **Tenant screening friction**: Evaluating applicants requires pulling credit reports, verifying employment, cross-referencing public records, and synthesizing everything into a go/no-go decision.
- **Maintenance chaos**: When something breaks, owners must diagnose the issue, source a qualified vendor, get quotes, schedule, and verify completion — a multi-day workflow for a single leaky faucet.
- **No portfolio intelligence**: Landlords and their agents lack a clear view of per-property performance, equity growth, and when to refinance, sell, or acquire.
- **Agents can't scale services**: A real estate agent who helps a client buy an investment property has no efficient way to continue supporting that client with ongoing management — so the relationship ends at closing.

Existing SaaS tools (AppFolio, Buildium, Propertyware) are built for mid-to-large property management firms. They digitize record-keeping but still require humans to read, decide, and act — and they're overkill for someone with 1–5 properties. PropStealth closes that loop with agents, at a scale and price point that fits small portfolios.

## 3. Goals and Non-Goals

### 3.1 Goals (MVP)

1. Deliver a working Google-authenticated web app with a property portfolio dashboard.
2. Ship a modular agent framework that supports both on-demand and event-driven agent runs.
3. Launch two core agents: **Inbox Triage** (monitors a user-specified Gmail account) and **Tenant Evaluation** (document upload → AI-generated risk score).
4. Let users connect their own Gmail account (OAuth) as the inbox the Inbox agent monitors — no managed inbox infrastructure for MVP.
5. Give users a transparent activity log of every agent action, with human-in-the-loop approval gates for high-stakes actions (tenant decisions, email replies).
6. Enable real estate agents to offer ongoing post-transaction property management as a service to their investor clients.

### 3.2 Non-Goals (MVP)

- Full accounting/bookkeeping general ledger (integrate with QuickBooks instead).
- MLS listing syndication (deferred to Phase 2).
- Native mobile apps (responsive web first; mobile in Phase 2).
- Multi-language support at launch (English-only).
- Building our own credit bureau integration; use a partner such as TransUnion SmartMove or Experian RentBureau.
- Large-scale property management (50+ units) — this is for small portfolios.
- Maintenance Coordinator, Portfolio Analyst, and Bills & Utilities agents (Phase 2).
- Managed PropStealth inbox (`@inbox.propstealth.com`) — MVP uses the user's own Gmail account.
- Bill payment execution, vendor sourcing, or any financial transactions (Phase 2).

## 4. Target Users and Personas

### 4.1 Primary: The Real Estate Agent ("Priya")
Helps clients buy residential investment properties. Wants to offer ongoing management and wealth-building advisory as a service — turning one-time commissions into recurring relationships. Manages properties on behalf of 5–15 investor clients, each with 1–3 properties. Needs AI leverage to provide this service without hiring staff.

### 4.2 Primary: The Small Portfolio Landlord ("Dana")
Owns 1–5 rental units. Self-manages. Has a day job or runs another small business. Values time savings, avoiding late fees, and understanding how her portfolio is performing financially. May or may not work with a real estate agent.

### 4.3 Secondary: The Side-Hustle Investor ("Marcus")
Recently bought his first or second rental property. Doesn't know the ropes yet. Needs guidance on tenant screening, maintenance, and whether the investment is actually performing. Likely found PropStealth through his real estate agent (Priya).

## 5. User Stories (Prioritized)

### P0 — Must have for MVP
- As Dana, I sign in with Google and connect my Gmail so the Inbox agent can read property-related email.
- As Dana, I add a property with address, unit count, and key documents (deed, insurance, lease).
- As Dana, I upload a prospective tenant's application and receive an AI-generated risk rating with supporting evidence within 10 minutes.
- As Priya, I connect my Gmail and see the Inbox agent classify and summarize property-related emails across all my clients' properties.
- As Priya, I onboard a new investor client and their properties into my workspace so I can manage them alongside my other clients.
- As Dana, I review a full activity log of every agent action per property.

### P1 — Should have for MVP
- As Priya, when the Inbox agent detects a tenant-related email, it drafts a reply for my review before sending.
- As Dana, I receive a daily digest summarizing what the Inbox agent processed and what needs my attention.
- As Marcus, I upload multiple documents for a prospective tenant and the Tenant Evaluation agent cross-references them into a single assessment.

### P2 — Phase 2
- As Priya, I ask an on-demand agent to evaluate a property my client is considering buying (pulls comps, permits, tax history, rental yield estimate).
- As Dana, I view a portfolio dashboard showing per-property cash flow, occupancy, and equity estimates.
- As Priya, I schedule the Maintenance Coordinator to run weekly and proactively check my clients' properties for pending vendor quotes.
- As Dana, when a water bill arrives, the Bills agent verifies the amount against historical averages and queues it for payment.
- As Priya, I share a read-only portfolio performance view with my investor clients.
- As Priya, I generate a monthly investor report for each client summarizing property performance, agent actions taken, and upcoming decisions.

## 6. Functional Requirements

### 6.1 Authentication & Accounts
- Google OAuth 2.0 sign-in (primary). Email/password as fallback for invited team members without Google accounts.
- Workspace model: a user belongs to one or more workspaces. A workspace owns properties, agents, and integrations. An agent like Priya has one workspace containing all her clients' properties; a landlord like Dana has her own workspace for self-managed properties.
- Role-based access: Owner, Agent (manages on behalf of clients), Read-only (investor client view), Vendor (limited scope).
- Mandatory 2FA for Owner role on any workspace containing a payment integration.

### 6.2 Property Management
- Add/edit/archive properties with: address (geocoded), property type, units, square footage, year built, purchase price, current estimated value, mortgage holder, insurance carrier, HOA (if applicable), tax parcel ID.
- Per-unit tracking: current tenant, lease start/end, rent amount, security deposit, pet policy.
- Document vault per property: upload, auto-classify (lease, inspection, receipt, tax, insurance, HOA doc), OCR, searchable.
- Key dates calendar surfaces lease renewals, insurance renewals, tax deadlines, mortgage milestones.
- Per-property financial snapshot: monthly cash flow, cap rate, equity estimate, appreciation tracking.

### 6.3 AI Agent Framework (Modular)
The agent framework is the product's architectural core. Every agent conforms to a common interface so new agents can be added without changes to the runtime.

**Required agent capabilities:**
- **Trigger types**: scheduled (cron-like), event-driven (new email, new document), on-demand (user invoked).
- **Tool use**: agents can call a registry of tools — email read/send, document OCR, web search, public records lookup, vendor marketplace, payment execution, calendar, SMS.
- **Memory**: per-agent long-term memory scoped to workspace + property, retrievable across runs.
- **Guardrails**: each agent declares which actions require human approval vs. auto-execute, configurable per workspace.
- **Observability**: every agent run emits a structured trace (inputs, tool calls, reasoning, outputs, cost) viewable in the UI.
- **Modularity contract**: an agent is a package with `manifest.yaml` (name, triggers, required tools, permissions), `agent.py` (or TS equivalent) implementing `run(context)`, and optional `ui.tsx` for custom configuration panels.

**MVP agents (2):**
1. **Inbox Agent** — monitors the user's connected Gmail account, classifies incoming email (utility, tenant, vendor, municipal, HOA, spam), extracts action items, drafts replies for user approval, and logs all activity.
2. **Tenant Evaluation Agent** — user uploads tenant application documents (application form, pay stubs, ID, references, etc.); agent analyzes and cross-references the documents, optionally triggers partner credit/background checks, and produces a 1–100 risk score with narrative justification and red/yellow/green recommendation.

**Phase 2 agents (planned):**
3. **Maintenance Coordinator Agent** — diagnoses issues from tenant messages/photos, sources vendors (starts with a curated directory + Thumbtack/Angi API), requests quotes, schedules appointments, tracks completion.
4. **Portfolio Analyst Agent** — tracks per-property financial performance (cash flow, cap rate, equity, appreciation), flags refinance or 1031 exchange opportunities, generates investor reports, and evaluates prospective acquisitions using comps and rental yield estimates.
5. **Bills & Utilities Agent** — monitors for utility (water, power, gas, internet), tax, and insurance bills; verifies against history; schedules or executes payment per user rules.

### 6.4 Gmail Integration
- User connects their own Gmail account via Google OAuth (read + scoped send permissions).
- User specifies which Gmail account the Inbox agent should monitor (they may use a dedicated Gmail address for property email, or their primary account with label/filter-based scoping).
- Inbox agent polls for new email, classifies each message, extracts action items, and drafts replies for user approval.
- Users see a unified activity feed in the app: inbound email → classification → agent action → result.
- Phase 2: dedicated managed inbox (`@inbox.propstealth.com`) for users who prefer not to share Gmail access.

### 6.5 Tenant Evaluation
- Upload or email a rental application.
- Optional consent-based credit/background check via partner integration.
- Public search module aggregates: LinkedIn profile match, eviction records (where legally permitted), social media sentiment, employer verification attempts.
- Output: risk score, summary card with evidence citations, red/yellow/green recommendation. All outputs clearly marked as AI-generated and advisory; user makes final decision.
- **Compliance note:** must honor Fair Housing Act and Fair Credit Reporting Act. Public search module must be opt-in and geo-aware; certain signals (e.g., protected class inferences) are blocked by policy.

### 6.6 Maintenance & Vendor Sourcing *(Phase 2)*
- Tenant submits issue via tenant portal or email; Maintenance agent creates a work order.
- Agent matches to vendor category, pulls 3 quotes from curated vendor marketplace, presents options.
- User approves one quote → agent schedules and sends vendor instructions.
- Post-job: agent follows up for completion photos and tenant confirmation before releasing payment.

### 6.7 Portfolio Intelligence & Investor Reporting *(Phase 2)*
- Per-property dashboard: monthly cash flow (rent − mortgage − expenses), cap rate, estimated equity, year-over-year appreciation.
- Portfolio-level roll-up across all properties in a workspace.
- Automated alerts: "Property at 123 Main is cash-flow negative for the second consecutive month" or "Mortgage rate environment suggests refinance opportunity."
- Acquisition evaluator: given an address or listing, pull comps, estimate rental yield, project cash flow, and flag risks.
- Investor report generation: monthly/quarterly PDF or email summarizing performance, agent actions, and upcoming decisions — designed for agents (Priya) to share with their clients.
- Natural-language query across property documents: "what are the lease terms for unit 2B?" → cites relevant document section.

### 6.8 Bills, Utilities & Municipal *(Phase 2)*
- Bill ingestion via managed inbox + account scraping (where user provides credentials).
- Amount anomaly detection ("this water bill is 3x your 12-month average — review before paying").
- Payment execution through integrated ACH provider (user confirms limit rules).
- Municipal and HOA notices (property tax, code enforcement, registration, HOA violations/dues) are classified and summarized with deadlines.

### 6.9 Scheduling & Automation
- Inbox agent runs continuously (polling the connected Gmail on a configurable interval).
- Tenant Evaluation agent is on-demand (user uploads documents to trigger a run).
- Phase 2: cron-style scheduler UI, automation templates, per-property overrides.

### 6.10 Notifications & Digests
- Daily digest email (configurable time).
- Urgent push/SMS for user-defined triggers (e.g., bill anomaly, tenant emergency keywords).
- In-app notification center with unread state.

## 7. Non-Functional Requirements

### 7.1 Security
- SOC 2 Type II readiness from day one (logging, access controls, vendor management).
- Encryption at rest (AES-256) and in transit (TLS 1.2+).
- Secrets in a managed vault (GCP Secret Manager or HashiCorp Vault).
- Per-workspace data isolation; row-level security in the database.
- Comprehensive audit log: every agent action and every human override.

### 7.2 Privacy & Compliance
- GDPR/CCPA data export and deletion flows.
- Fair Housing Act: tenant screening outputs never reference protected class attributes.
- Fair Credit Reporting Act: screening partners handle credit data; we never store raw credit reports longer than the tenancy decision window.
- HIPAA is out of scope; block any inbound health data.

### 7.3 Reliability
- 99.5% uptime target for MVP.
- Agent runs are idempotent and retried on transient failure.
- Dead-letter queue for failed agent runs with user-visible error details.

### 7.4 Performance
- Dashboard load < 2s p95.
- Tenant screening end-to-end < 10 minutes p95.
- Inbox classification within 60s of email arrival p95.

### 7.5 Cost
- Per-workspace LLM spend tracking; soft and hard caps per plan tier.
- Prompt caching on stable context (property details, HOA docs) to reduce token costs.

## 8. Architecture Overview (High Level)

- **Frontend**: Next.js (React) web app, TailwindCSS. Responsive.
- **Backend**: Python (FastAPI) for agent runtime; TypeScript (Node) for API/BFF. Monorepo.
- **Agent runtime**: Claude (Anthropic) as the primary LLM; agent loop built on the Anthropic Agent SDK where applicable, with tool registry and streaming.
- **Data**: PostgreSQL (primary), pgvector for embeddings, Redis for queues/caches, object storage (GCS/S3) for documents.
- **Auth**: Google OAuth 2.0 + JWT session. Auth provider: Clerk or Auth.js.
- **Email**: inbound via Postmark/SendGrid Inbound; Gmail API for user-connected accounts.
- **Payments**: Stripe (platform billing) + Plaid/Dwolla (bill pay ACH).
- **Infra**: GCP or AWS, Terraform IaC, GitHub Actions CI/CD.

## 9. Integrations (MVP)

**MVP:**
- Google (OAuth, Gmail API)
- Stripe (billing)
- TransUnion SmartMove or Experian RentBureau (tenant screening — partner integration)

**Phase 2:**
- Plaid (bank linking for bill pay)
- Thumbtack or Angi (vendor sourcing)
- Twilio (SMS)
- Postmark (managed inbox inbound email)
- Google Calendar, Drive
- QuickBooks Online

## 10. Success Metrics

### North Star
Hours of operational work saved per user per week (self-reported + inferred from agent action counts).

### Product KPIs
- **Activation**: % of new users who add ≥1 property and run ≥1 agent within 7 days.
- **Engagement**: weekly active agent runs per workspace.
- **Retention**: 30/60/90-day workspace retention.
- **Agent accuracy**: % of agent decisions accepted without modification by the user.
- **Inbox automation rate**: % of inbound emails resolved without human intervention.

### Business KPIs
- Paid workspaces, ARPU, net revenue retention, CAC payback.

## 11. Pricing (Preliminary)

- **Landlord** — $29/mo per workspace, up to 3 properties, 500 agent actions/mo.
- **Agent** — $99/mo, up to 15 properties across clients, 5,000 agent actions/mo, investor reports, vendor marketplace.
- **Agent Pro** — $249/mo, up to 40 properties, priority support, custom agents, white-label investor reports.
- Tenant screening passed through at cost + margin; bill pay free up to a cap then $0.50/transaction.

## 12. Milestones & Phasing

### Phase 0 — Foundations (weeks 0–4)
Auth (Google OAuth), workspace model, property CRUD, document vault, agent framework scaffolding, Gmail API integration.

### Phase 1 — MVP (weeks 5–10)
Inbox Agent (Gmail monitoring, classification, draft replies) + Tenant Evaluation Agent (document upload, AI scoring). Private alpha with 10 design-partner landlords and 3–5 real estate agents.

### Phase 2 — Expand Agents (weeks 11–18)
Bills & Utilities Agent, Maintenance Coordinator, Portfolio Analyst. Managed inbox infrastructure. Scheduled automations. Investor reporting. Public waitlist onboarding.

### Phase 3 — GA (weeks 19–26)
Vendor marketplace, QuickBooks integration, client-facing read-only views, audit exports. Public launch.

### Phase 4+ — Expansion
Mobile apps, MLS/listing integration, acquisition pipeline tools, custom agent builder for power users.

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LLM hallucination in tenant evaluation (wrong score or missed red flag) | Medium | High | Human always makes final decision; all outputs marked advisory; evidence citations required for every claim |
| Fair Housing / FCRA violation in tenant screening | Medium | Severe | Legal review of screening prompts; partner with licensed CRA; policy layer blocks protected-class outputs |
| Users unwilling to grant Gmail access | High | Medium | Clearly scoped OAuth permissions (read + limited send); offer label/filter-based scoping so agent only sees relevant email; Phase 2 managed inbox as alternative |
| Agents don't adopt because they don't see themselves as property managers | High | High | Position as "wealth-building service" not "property management"; emphasize recurring revenue and client retention |
| Cost of LLM usage at scale | Medium | Medium | Prompt caching, smaller models (Haiku) for classification, per-plan usage caps |
| Data breach involving tenant PII | Low | Severe | SOC 2, encryption, least-privilege, bug bounty, cyber insurance |

## 14. Open Questions

1. Which states/metros do we support first given landlord-tenant law variation?
    ANSWER: Florida

2. How does the agent–client relationship work in the product? Does the agent (Priya) invite clients, or do clients sign up and connect to their agent?
    ANSWER: Agent can invite clients. Clients can also sign up on their own (in that case there is no agent).
3. Should the Tenant Evaluation agent gate output behind a CRA-issued disclosure to comply with adverse-action requirements?
    ANSWER: yes

4. What Gmail OAuth scopes do we request? Broad read access vs. label-filtered? How do we handle users who want the agent to only monitor specific labels?
    ANSWER: label-filtered. No support for agent monitoring of emails. It is the client responsibility.

5. What is our stance on the Inbox agent composing and sending email autonomously vs. always drafting-for-approval?
    ANSWER: For now always drafting-for-approval. In the future we'll have a toggle.

6. How do we source property valuation and comp data for the Portfolio Analyst (Phase 2) — Zillow API, Redfin, or a data partner?
    ANSWER: For now we'll just allow manually setting it.

7. Do we build our own vendor marketplace or partner exclusively (Phase 2)?
    ANSWER: No building for now.

## 15. Glossary

- **Workspace**: the top-level tenant of the product — a landlord managing their own properties, or a real estate agent managing properties on behalf of investor clients.
- **Agent**: an autonomous AI worker that performs a class of tasks, defined by a manifest and runtime code.
- **Managed Inbox**: the PropStealth-provided email address per workspace, monitored by agents.
- **Tool**: a capability (email send, payment, web search) that agents may call, registered in the tool registry.
- **Approval gate**: a configurable checkpoint requiring human confirmation before an agent action executes.

---

*End of document.*
