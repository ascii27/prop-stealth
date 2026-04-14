# Product Requirements Document (PRD)

**Product (working name):** PropStealth
**Document owner:** Product Management
**Status:** Draft v0.1
**Last updated:** 2026-04-14

---

## 1. Executive Summary

PropStealth is an AI-native operating system for independent real estate agents, small-to-midsize property management firms, and individual landlords. The product uses a modular fleet of AI agents to automate the repetitive, high-friction work of managing real properties — from tenant screening and maintenance coordination to HOA compliance, utility bill management, and municipal correspondence.

Unlike traditional property management software that is primarily a system of record, PropStealth is a **system of action**. Users connect their email, calendar, documents, and accounts; AI agents then read, classify, and act on incoming information on the user's behalf, surfacing only the decisions that truly require human input.

## 2. Problem Statement

Real estate agents and property managers spend the majority of their working hours on non-revenue-generating operational overhead:

- **Inbox overload**: HOA emails, utility notices, tenant messages, vendor quotes, and municipal notifications all flood a single mailbox with no prioritization.
- **Document sprawl**: HOA rules, lease agreements, insurance policies, inspection reports, and tax documents live in scattered folders and email threads.
- **Tenant screening friction**: Evaluating applicants requires pulling credit reports, verifying employment, cross-referencing public records, and synthesizing everything into a go/no-go decision.
- **Maintenance chaos**: When something breaks, owners must diagnose the issue, source a qualified vendor, get quotes, schedule, and verify completion — a multi-day workflow for a single leaky faucet.
- **Compliance drift**: Missed HOA deadlines, late utility payments, and unanswered municipal notices carry financial and legal consequences.

Existing SaaS tools (AppFolio, Buildium, Propertyware) digitize record-keeping but still require humans to read, decide, and act. PropStealth closes that loop with agents.

## 3. Goals and Non-Goals

### 3.1 Goals (MVP)

1. Deliver a working Google-authenticated web app with a property portfolio dashboard.
2. Ship a modular agent framework that supports both scheduled (autonomous) and on-demand agent runs.
3. Launch five core agents: Inbox Triage, Tenant Screening, Maintenance Coordinator, HOA Assistant, and Bills & Utilities.
4. Provide a dedicated PropStealth-managed inbox that agents monitor continuously.
5. Give users a transparent activity log of every agent action, with human-in-the-loop approval gates for high-stakes actions (payments, vendor contracts, tenant decisions).

### 3.2 Non-Goals (MVP)

- Full accounting/bookkeeping general ledger (integrate with QuickBooks instead).
- MLS listing syndication for agents (deferred to Phase 2).
- Native mobile apps (responsive web first; mobile in Phase 2).
- Multi-language support at launch (English-only).
- Building our own credit bureau integration; use a partner such as TransUnion SmartMove or Experian RentBureau.

## 4. Target Users and Personas

### 4.1 Primary: The Small Portfolio Landlord ("Dana")
Owns 3–15 rental units. Self-manages. Has a day job or runs another small business. Values time savings and avoiding late fees or compliance mistakes.

### 4.2 Primary: The Independent Property Manager ("Marcus")
Manages 20–150 units across multiple owners. One to three staff. Drowning in email. Needs leverage to scale without hiring.

### 4.3 Secondary: The Solo Real Estate Agent ("Priya")
Buys/sells residential properties and occasionally manages listings for investor clients. Wants AI to help with tenant placement, property evaluation, and client communication.

### 4.4 Tertiary: The HOA Board Member
Volunteer managing community documents, dues, and owner communications. May adopt later.

## 5. User Stories (Prioritized)

### P0 — Must have for MVP
- As Dana, I sign in with Google and connect my Gmail so agents can read property-related email.
- As Dana, I add a property with address, unit count, and key documents (deed, insurance, HOA bylaws).
- As Dana, I upload a prospective tenant's application and receive an AI-generated risk rating with supporting evidence within 10 minutes.
- As Marcus, I receive a morning digest summarizing what agents did overnight and what decisions need my attention today.
- As Dana, when my HOA sends a violation notice, the Inbox Triage agent categorizes it, drafts a response, and asks me to approve before replying.
- As Dana, when a water bill arrives, the Bills agent verifies the amount against historical averages and queues it for payment.

### P1 — Should have for MVP
- As Marcus, I schedule the Maintenance Coordinator to run weekly and proactively check properties for pending vendor quotes.
- As Dana, I review a full audit trail of every agent action per property.
- As Priya, I ask an on-demand agent to evaluate a property I'm considering buying (pulls comps, permits, tax history).
- As Marcus, I define custom automation rules (e.g., "always auto-pay utility bills under $200 on accounts tagged 'residential'").

### P2 — Nice to have (post-MVP)
- As Dana, I grant a co-owner read-only access to one property.
- As Marcus, I brand the tenant-facing portal with my company logo.
- As Dana, I connect Plaid to let the Bills agent pay directly from my operating account.

## 6. Functional Requirements

### 6.1 Authentication & Accounts
- Google OAuth 2.0 sign-in (primary). Email/password as fallback for invited team members without Google accounts.
- Workspace model: a user belongs to one or more workspaces. A workspace owns properties, agents, and integrations.
- Role-based access: Owner, Manager, Staff, Read-only, Vendor (limited scope).
- Mandatory 2FA for Owner role on any workspace containing a payment integration.

### 6.2 Property Management
- Add/edit/archive properties with: address (geocoded), property type, units, square footage, year built, purchase date, mortgage holder, insurance carrier, HOA (if applicable), tax parcel ID.
- Per-unit tracking: current tenant, lease start/end, rent amount, security deposit, pet policy.
- Document vault per property: upload, auto-classify (lease, inspection, receipt, HOA doc, tax, insurance), OCR, searchable.
- Key dates calendar surfaces lease renewals, insurance renewals, HOA dues, tax deadlines.

### 6.3 AI Agent Framework (Modular)
The agent framework is the product's architectural core. Every agent conforms to a common interface so new agents can be added without changes to the runtime.

**Required agent capabilities:**
- **Trigger types**: scheduled (cron-like), event-driven (new email, new document), on-demand (user invoked).
- **Tool use**: agents can call a registry of tools — email read/send, document OCR, web search, public records lookup, vendor marketplace, payment execution, calendar, SMS.
- **Memory**: per-agent long-term memory scoped to workspace + property, retrievable across runs.
- **Guardrails**: each agent declares which actions require human approval vs. auto-execute, configurable per workspace.
- **Observability**: every agent run emits a structured trace (inputs, tool calls, reasoning, outputs, cost) viewable in the UI.
- **Modularity contract**: an agent is a package with `manifest.yaml` (name, triggers, required tools, permissions), `agent.py` (or TS equivalent) implementing `run(context)`, and optional `ui.tsx` for custom configuration panels.

**Core agents at launch:**
1. **Inbox Triage Agent** — continuously classifies incoming email (HOA, utility, tenant, vendor, municipal, spam), extracts action items, drafts replies, routes to specialist agents.
2. **Tenant Screening Agent** — ingests an application, runs credit/background checks through partners, performs public records and social searches, produces a 1–100 score with narrative justification.
3. **Maintenance Coordinator Agent** — diagnoses issues from tenant messages/photos, sources vendors (starts with a curated directory + Thumbtack/Angi API), requests quotes, schedules appointments, tracks completion.
4. **HOA Assistant Agent** — reads HOA emails and portal notifications, tracks dues and violation notices, summarizes meeting minutes, alerts on deadlines.
5. **Bills & Utilities Agent** — monitors for utility (water, power, gas, internet), tax, and insurance bills; verifies against history; schedules or executes payment per user rules.

### 6.4 Managed Inbox
- Every workspace gets a dedicated inbox (`<workspace>@inbox.propstealth.com`). Users forward or alias bills, HOA notices, and vendor correspondence to this address.
- Agents monitor this inbox in real time. Users can also connect their personal Gmail via OAuth for read + scoped send.
- Users see a unified activity feed: inbound email → classification → agent action → result.

### 6.5 Tenant Evaluation
- Upload or email a rental application.
- Optional consent-based credit/background check via partner integration.
- Public search module aggregates: LinkedIn profile match, eviction records (where legally permitted), social media sentiment, employer verification attempts.
- Output: risk score, summary card with evidence citations, red/yellow/green recommendation. All outputs clearly marked as AI-generated and advisory; user makes final decision.
- **Compliance note:** must honor Fair Housing Act and Fair Credit Reporting Act. Public search module must be opt-in and geo-aware; certain signals (e.g., protected class inferences) are blocked by policy.

### 6.6 Maintenance & Vendor Sourcing
- Tenant submits issue via tenant portal or email; Maintenance agent creates a work order.
- Agent matches to vendor category, pulls 3 quotes from curated vendor marketplace, presents options.
- User approves one quote → agent schedules and sends vendor instructions.
- Post-job: agent follows up for completion photos and tenant confirmation before releasing payment.

### 6.7 HOA Document & Email Management
- Bulk upload HOA bylaws, CC&Rs, meeting minutes.
- Agent indexes documents into a property-scoped knowledge base.
- Agent parses HOA portal emails (Associa, FirstService, etc.) and surfaces violations, dues, architectural requests.
- Natural-language query: "what does the HOA say about exterior paint colors?" → cites relevant document section.

### 6.8 Bills, Utilities & Municipal
- Bill ingestion via managed inbox + account scraping (where user provides credentials).
- Amount anomaly detection ("this water bill is 3x your 12-month average — review before paying").
- Payment execution through integrated ACH provider (user confirms limit rules).
- Municipal notices (property tax, code enforcement, registration) are classified and summarized with deadlines.

### 6.9 Scheduling & Automation
- Cron-style scheduler UI for any agent.
- Pre-built automation templates ("every Monday 7am, run Inbox Triage across all properties and send me a digest").
- Per-property and per-workspace overrides.

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
- 99.5% uptime target for MVP; 99.9% for payment execution path.
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

- Google (OAuth, Gmail, Calendar, Drive)
- Stripe (billing)
- Plaid (bank linking for bill pay)
- TransUnion SmartMove or Experian RentBureau (tenant screening)
- Thumbtack or Angi (vendor sourcing)
- Twilio (SMS)
- Postmark (transactional + inbound email)
- QuickBooks Online (Phase 2)

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

- **Starter** — $29/mo per workspace, up to 5 properties, 500 agent actions/mo.
- **Pro** — $99/mo, up to 25 properties, 5,000 agent actions/mo, vendor marketplace.
- **Scale** — $299/mo, unlimited properties, priority support, custom agents.
- Tenant screening passed through at cost + margin; bill pay free up to a cap then $0.50/transaction.

## 12. Milestones & Phasing

### Phase 0 — Foundations (weeks 0–4)
Auth, workspace model, property CRUD, document vault, agent framework scaffolding, managed inbox plumbing.

### Phase 1 — MVP Alpha (weeks 5–12)
Inbox Triage + Tenant Screening + Bills & Utilities agents. Private alpha with 10 design-partner landlords.

### Phase 2 — MVP Beta (weeks 13–20)
Maintenance Coordinator + HOA Assistant. Scheduled automations. Public waitlist onboarding.

### Phase 3 — GA (weeks 21–28)
Vendor marketplace, QuickBooks integration, team roles, audit exports. Public launch.

### Phase 4+ — Expansion
Mobile apps, MLS/listing agents, international support, custom agent builder for power users.

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LLM hallucination causes wrong agent action (e.g., paying wrong bill) | Medium | High | Mandatory human approval for payments > threshold; amount-anomaly detection; idempotency keys |
| Fair Housing / FCRA violation in tenant screening | Medium | Severe | Legal review of screening prompts; partner with licensed CRA; policy layer blocks protected-class outputs |
| Users unwilling to grant broad Gmail access | High | Medium | Offer managed inbox as primary path; Gmail connect optional |
| Vendor marketplace liquidity (chicken-and-egg) | High | Medium | Start with Thumbtack/Angi API; curate top vendors per metro manually |
| Cost of LLM usage at scale | Medium | Medium | Prompt caching, smaller models (Haiku) for classification, per-plan usage caps |
| Data breach involving tenant PII | Low | Severe | SOC 2, encryption, least-privilege, bug bounty, cyber insurance |

## 14. Open Questions

1. Do we build our own vendor marketplace or partner exclusively in year 1?
2. Which states/metros do we support first given HOA and landlord-tenant law variation?
3. How do we handle multi-owner properties where two users must both approve an action?
4. Should the Tenant Screening agent gate output behind a CRA-issued disclosure to comply with adverse-action requirements?
5. What is our stance on agents composing and sending email autonomously vs. always drafting-for-approval in the first 90 days of a workspace?

## 15. Glossary

- **Workspace**: the top-level tenant of the product — a company, a landlord, or an individual agent.
- **Agent**: an autonomous AI worker that performs a class of tasks, defined by a manifest and runtime code.
- **Managed Inbox**: the PropStealth-provided email address per workspace, monitored by agents.
- **Tool**: a capability (email send, payment, web search) that agents may call, registered in the tool registry.
- **Approval gate**: a configurable checkpoint requiring human confirmation before an agent action executes.

---

*End of document.*
