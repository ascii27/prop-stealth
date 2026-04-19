# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PropStealth is an AI-native property management platform for real estate agents and small-portfolio landlords (1–5 properties). It uses a fleet of modular AI agents to automate operational work: inbox triage, tenant screening, maintenance coordination, portfolio analysis, and bill management.

The core value prop: a real estate agent can offer ongoing management and wealth-building services to investor clients — turning one-time commissions into recurring relationships — without hiring staff.

The product is a **system of action** (not just a system of record) — agents read, classify, and act on incoming information, surfacing only decisions requiring human input.

## Current State

This repo is in the **pre-code / planning phase**. The PRD lives at `spec/PRD.md`. No application code has been written yet.

## Planned Architecture

- **Frontend**: Next.js (React), TailwindCSS, responsive web
- **Backend**: Python (FastAPI) for agent runtime; TypeScript (Node) for API/BFF; monorepo structure
- **AI/Agent Runtime**: Claude (Anthropic) as primary LLM; Anthropic Agent SDK; tool registry with streaming
- **Data**: PostgreSQL + pgvector (embeddings), Redis (queues/caches), GCS/S3 (document storage)
- **Auth**: Google OAuth 2.0 + JWT sessions (Clerk or Auth.js)
- **Email**: Postmark/SendGrid inbound; Gmail API for user-connected accounts
- **Payments**: Stripe (platform billing) + Plaid/Dwolla (bill pay ACH)
- **Infra**: GCP or AWS, Terraform IaC, GitHub Actions CI/CD

## Agent Framework

The agent framework is the architectural core. Each agent conforms to a common interface:

- **Package structure**: `manifest.yaml` (name, triggers, required tools, permissions), `agent.py` (implements `run(context)`), optional `ui.tsx` for config panels
- **Trigger types**: scheduled (cron), event-driven (new email/document), on-demand (user invoked)
- **Tool use**: agents call a shared tool registry (email, OCR, web search, payments, calendar, SMS, etc.)
- **Memory**: per-agent long-term memory scoped to workspace + property
- **Guardrails**: configurable human approval gates per action type per workspace
- **Observability**: structured traces for every run (inputs, tool calls, reasoning, outputs, cost)

## MVP Agents (2)

1. **Inbox Agent** — monitors user's connected Gmail, classifies email, extracts action items, drafts replies for approval
2. **Tenant Evaluation Agent** — user uploads application documents, agent analyzes and cross-references them, produces 1–100 risk score with narrative justification

Phase 2 agents (planned): Maintenance Coordinator, Portfolio Analyst, Bills & Utilities.

## Key Compliance Constraints

- Fair Housing Act and FCRA compliance required for tenant screening — never reference protected class attributes
- Human approval gates mandatory for payments above configurable thresholds
- SOC 2 Type II readiness from day one
- Row-level security for per-workspace data isolation
- GDPR/CCPA data export and deletion flows required
