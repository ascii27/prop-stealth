# Phase 1: Static UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all PropStealth screens as static Next.js pages with hardcoded mock data — no backend, no API calls, no auth logic.

**Architecture:** Next.js 15 App Router with route groups for marketing `(marketing)`, auth `(auth)`, owner dashboard `(dashboard)/owner`, and agent dashboard `(dashboard)/agent`. Shared sidebar layout component per role. All data comes from a single `lib/mock-data.ts` file.

**Tech Stack:** Next.js 15, React 19, TailwindCSS 4, TypeScript

**Design Spec:** `docs/superpowers/specs/2026-04-19-ui-design.md`
**Mockup Reference:** `.superpowers/brainstorm/30339-1776588305/content/` (HTML mockups)

---

## File Structure

```
src/
  app/
    layout.tsx                          # Root layout: font stack, global styles
    (marketing)/
      page.tsx                          # Homepage (unauthenticated landing page)
    (auth)/
      login/page.tsx                    # Login / Sign Up with role toggle
    (dashboard)/
      owner/
        layout.tsx                      # Owner sidebar + main content wrapper
        page.tsx                        # Activity Feed (owner home)
        inbox/page.tsx                  # Inbox Agent
        tenant-eval/page.tsx            # Tenant Evaluation list + new evaluation form
        tenant-eval/[id]/page.tsx       # Tenant Evaluation results view
        properties/page.tsx             # Properties list
        properties/[id]/page.tsx        # Property detail
        documents/page.tsx              # Documents vault
        settings/page.tsx               # Settings
      agent/
        layout.tsx                      # Agent sidebar + main content wrapper
        page.tsx                        # Portfolio Overview (agent home)
        clients/[id]/page.tsx           # Client detail
        pipeline/page.tsx               # Tenant Pipeline
        help-requests/page.tsx          # Help Requests
        invite/page.tsx                 # Invite Client form
  components/
    logo.tsx                            # PropStealth logo (icon + text)
    owner-sidebar.tsx                   # Owner sidebar navigation
    agent-sidebar.tsx                   # Agent sidebar navigation
    stat-card.tsx                       # Reusable stat card (used in agent dashboard)
    score-badge.tsx                     # Tenant eval score badge (82/100)
    status-badge.tsx                    # Status badges (Occupied, Vacant, etc.)
    email-card.tsx                      # Inbox agent email card with expand/auto-respond
    attention-card.tsx                  # Activity feed attention item card
    timeline-entry.tsx                  # Activity feed timeline entry
    theme-dot.tsx                       # Color-coded theme dot (Tenant/HOA/Bill/Other)
    client-card.tsx                     # Agent dashboard client card with property list
  lib/
    mock-data.ts                        # All hardcoded data: properties, emails, tenants, clients, timeline
    types.ts                            # TypeScript types for all data structures
tailwind.config.ts                      # Tailwind config with custom colors
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --yes
```

If it prompts about existing files, say yes to proceed. This gives us the full Next.js + Tailwind + TypeScript scaffolding.

- [ ] **Step 2: Configure Tailwind with project colors**

Update `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#059669",
          light: "#ecfdf5",
          border: "#a7f3d0",
        },
        sidebar: "#f8faf8",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 3: Set up root layout with system font stack**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropStealth",
  description: "Your rental properties, managed by AI agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Set up globals.css**

Replace `src/app/globals.css`:

```css
@import "tailwindcss";
```

- [ ] **Step 5: Verify the app runs**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
npm run dev
```

Open `http://localhost:3000` in a browser. Confirm the default Next.js page loads with no errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with Tailwind and TypeScript"
```

---

## Task 2: Types and Mock Data

**Files:**
- Create: `src/lib/types.ts`, `src/lib/mock-data.ts`

- [ ] **Step 1: Define TypeScript types**

Create `src/lib/types.ts`:

```ts
export type EmailTheme = "tenant" | "hoa" | "bill" | "other";

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  beds: number;
  baths: number;
  unit?: string;
  occupied: boolean;
  tenantName?: string;
}

export interface Email {
  id: string;
  sender: string;
  propertyId: string;
  unit?: string;
  theme: EmailTheme;
  timestamp: string;
  keyPoints: string;
  fullContent: string;
  showAutoRespond: boolean;
  violationTag?: string;
}

export interface PropertyGroup {
  propertyId: string;
  address: string;
  city: string;
  emails: Email[];
}

export interface AttentionItem {
  id: string;
  title: string;
  detail: string;
  type: "proposal" | "hoa" | "tenant-request";
  tag: string;
  tagColor: string;
  linkText: string;
}

export interface TimelineEntry {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  isToday: boolean;
}

export interface TimelineGroup {
  label: string;
  entries: TimelineEntry[];
}

export interface ScoreBreakdown {
  category: string;
  score: number;
  detail: string;
}

export interface EvidenceItem {
  name: string;
  description: string;
  type: "file" | "link";
}

export interface TenantEvaluation {
  id: string;
  applicantName: string;
  propertyAddress: string;
  evaluationDate: string;
  overallScore: number;
  recommendation: string;
  riskLevel: "low" | "medium" | "high";
  breakdown: ScoreBreakdown[];
  summary: string;
  evidence: EvidenceItem[];
  status: "evaluating" | "proposed" | "approved" | "declined";
  proposedBy?: string;
  clientName?: string;
}

export interface Client {
  id: string;
  name: string;
  initials: string;
  initialsColor: string;
  initialsBg: string;
  properties: Property[];
  vacancyCount: number;
}

export interface HelpRequest {
  id: string;
  clientName: string;
  clientInitials: string;
  message: string;
  timestamp: string;
  propertyAddress: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  propertyId: string;
  uploadDate: string;
  size: string;
}
```

- [ ] **Step 2: Create mock data**

Create `src/lib/mock-data.ts`:

```ts
import {
  Property,
  PropertyGroup,
  AttentionItem,
  TimelineGroup,
  TenantEvaluation,
  Client,
  HelpRequest,
  Document,
} from "./types";

// === Owner Data ===

export const ownerProperties: Property[] = [
  {
    id: "p1",
    address: "742 Evergreen Terr",
    city: "Tampa",
    state: "FL",
    beds: 3,
    baths: 2,
    unit: "Unit 1",
    occupied: true,
    tenantName: "John Rivera",
  },
  {
    id: "p2",
    address: "742 Evergreen Terr",
    city: "Tampa",
    state: "FL",
    beds: 2,
    baths: 1,
    unit: "Unit 2",
    occupied: false,
  },
  {
    id: "p3",
    address: "1500 Bay Shore Dr",
    city: "Clearwater",
    state: "FL",
    beds: 4,
    baths: 3,
    occupied: true,
    tenantName: "Lisa Park",
  },
];

export const attentionItems: AttentionItem[] = [
  {
    id: "a1",
    title: "Tenant proposal from Priya",
    detail:
      'Sarah Chen for 742 Evergreen Terr, Unit 2 — Score: 82/100\nPriya: "Strong candidate — stable income, clean record. One prior late payment but has a good explanation."',
    type: "proposal",
    tag: "Your Agent",
    tagColor: "text-blue-800 bg-blue-100",
    linkText: "Review",
  },
  {
    id: "a2",
    title: "HOA violation notice — deadline May 3",
    detail: "742 Evergreen Terr — Lawn maintenance. $50 fine if unresolved.",
    type: "hoa",
    tag: "HOA",
    tagColor: "text-purple-700 bg-purple-100",
    linkText: "View in Inbox",
  },
  {
    id: "a3",
    title: "Tenant requesting early lease renewal",
    detail:
      "John Rivera, Unit 1 — wants same rate + pet policy change (adding dog)",
    type: "tenant-request",
    tag: "Tenant",
    tagColor: "text-blue-700 bg-blue-100",
    linkText: "View in Inbox",
  },
];

export const timelineGroups: TimelineGroup[] = [
  {
    label: "Today",
    entries: [
      {
        id: "t1",
        title: "Inbox Agent processed 4 new emails",
        detail: "2 tenant, 1 HOA, 1 bill · 742 Evergreen Terr",
        timestamp: "9:30 AM",
        isToday: true,
      },
      {
        id: "t2",
        title: "FPL bill classified — $142.30",
        detail: "742 Evergreen Terr · Due May 5 · Slightly above average",
        timestamp: "9:30 AM",
        isToday: true,
      },
      {
        id: "t3",
        title: "Tax assessment notice filed",
        detail: "1500 Bay Shore Dr · Assessed $385,000 · Informational",
        timestamp: "9:30 AM",
        isToday: true,
      },
    ],
  },
  {
    label: "Yesterday",
    entries: [
      {
        id: "t4",
        title: "Tenant evaluation completed",
        detail: "Sarah Chen — Score: 82/100 · Proposed by Priya",
        timestamp: "4:15 PM",
        isToday: false,
      },
      {
        id: "t5",
        title: "Inbox Agent processed 1 new email",
        detail: "1 other · 1500 Bay Shore Dr",
        timestamp: "10:00 AM",
        isToday: false,
      },
    ],
  },
];

export const inboxEmails: PropertyGroup[] = [
  {
    propertyId: "p1",
    address: "742 Evergreen Terr",
    city: "Tampa, FL",
    emails: [
      {
        id: "e1",
        sender: "John Rivera",
        propertyId: "p1",
        unit: "Unit 1",
        theme: "tenant",
        timestamp: "Today 9:14 AM",
        keyPoints:
          "Requesting early lease renewal (current lease ends Aug 30). Wants to lock in same rate. Asking about pet policy change — wants to add a dog.",
        fullContent:
          "Hi Dana,\n\nHope you're doing well. I wanted to reach out early about my lease renewal. My current lease ends August 30 and I'd love to stay if we can keep the same rate.\n\nAlso, I've been thinking about getting a dog — a medium-sized golden retriever. I know the current lease doesn't allow pets, but I'm happy to put down an additional deposit or pay a monthly pet fee. Would you be open to discussing this?\n\nThanks,\nJohn",
        showAutoRespond: true,
      },
      {
        id: "e2",
        sender: "Maria Santos",
        propertyId: "p1",
        unit: "Unit 2",
        theme: "tenant",
        timestamp: "Yesterday 3:42 PM",
        keyPoints:
          "Reporting a slow drain in kitchen sink. Not urgent but wants it looked at. Available weekday mornings for a plumber visit.",
        fullContent:
          "Hello,\n\nThe kitchen sink in Unit 2 has been draining slowly for the past week. It's not backing up completely but it's getting worse. I'm available most weekday mornings if you'd like to send a plumber.\n\nThanks,\nMaria",
        showAutoRespond: true,
      },
      {
        id: "e3",
        sender: "Evergreen HOA Board",
        propertyId: "p1",
        theme: "hoa",
        timestamp: "Yesterday 11:00 AM",
        keyPoints:
          "Lawn maintenance violation notice. Must resolve within 14 days (deadline: May 3). $50 fine if unresolved. Specific issue: grass height exceeds 6 inches in front yard.",
        fullContent:
          "Dear Property Owner,\n\nThis notice is to inform you that your property at 742 Evergreen Terrace is in violation of HOA Community Standard 4.2 — Lawn Maintenance.\n\nSpecifically, the grass height in the front yard exceeds the 6-inch maximum. You have 14 days from the date of this notice (April 19, 2026) to resolve this issue.\n\nFailure to resolve will result in a $50 fine.\n\nEvergreen Community HOA Board",
        showAutoRespond: true,
        violationTag: "Violation",
      },
      {
        id: "e4",
        sender: "Florida Power & Light",
        propertyId: "p1",
        theme: "bill",
        timestamp: "Apr 17",
        keyPoints:
          "Monthly bill — $142.30. Due May 5. Slightly above 12-month average ($128.40). Likely seasonal AC increase.",
        fullContent:
          "Your FPL bill for service period March 18 - April 17, 2026.\n\nAccount: 742 Evergreen Terrace\nAmount Due: $142.30\nDue Date: May 5, 2026\n\nUsage: 1,247 kWh\n12-month average: 1,085 kWh ($128.40)",
        showAutoRespond: false,
      },
    ],
  },
  {
    propertyId: "p3",
    address: "1500 Bay Shore Dr",
    city: "Clearwater, FL",
    emails: [
      {
        id: "e5",
        sender: "Pinellas County Tax Collector",
        propertyId: "p3",
        theme: "other",
        timestamp: "Apr 15",
        keyPoints:
          "Property tax assessment notice for 2026. Assessed value: $385,000. No action required — informational. Appeal deadline June 1 if you disagree.",
        fullContent:
          "Notice of Assessed Value — 2026 Tax Year\n\nProperty: 1500 Bay Shore Drive, Clearwater, FL\nAssessed Value: $385,000\nPrevious Year: $362,000\n\nIf you wish to appeal, you must file by June 1, 2026.\n\nPinellas County Property Appraiser",
        showAutoRespond: false,
      },
    ],
  },
];

export const tenantEvaluations: TenantEvaluation[] = [
  {
    id: "eval1",
    applicantName: "Sarah Chen",
    propertyAddress: "742 Evergreen Terr, Unit 2",
    evaluationDate: "Apr 19, 2026",
    overallScore: 82,
    recommendation: "Recommended — Low Risk",
    riskLevel: "low",
    breakdown: [
      { category: "Income", score: 90, detail: "3.2x rent ratio" },
      { category: "Employment", score: 85, detail: "2 yrs same employer" },
      { category: "Rental History", score: 72, detail: "1 late payment" },
      { category: "Credit Check", score: 81, detail: "Via TransUnion" },
    ],
    summary:
      "Sarah Chen is a strong applicant with stable employment at Bayshore Medical Group for 2+ years, earning $5,800/mo gross (3.2x the $1,800 monthly rent). Her pay stubs from March and April are consistent. Credit check via TransUnion shows a 710 score with no collections or judgments. One prior late rent payment reported by a previous landlord (30 days, Feb 2025) — she noted in her application this was due to a payroll error at her prior employer. Two references provided, both positive. No eviction history found in Florida public records.",
    evidence: [
      {
        name: "rental_application.pdf",
        description: "employment info, references, rental history",
        type: "file",
      },
      {
        name: "pay_stubs_mar_apr.pdf",
        description: "income verification ($5,800/mo gross)",
        type: "file",
      },
      {
        name: "drivers_license.jpg",
        description: "identity verification",
        type: "file",
      },
      {
        name: "TransUnion SmartMove Report",
        description: "credit score 710, no collections",
        type: "link",
      },
    ],
    status: "proposed",
    proposedBy: "Priya",
  },
];

// === Agent Data ===

export const agentClients: Client[] = [
  {
    id: "c1",
    name: "Dana Martinez",
    initials: "DM",
    initialsColor: "text-blue-600",
    initialsBg: "bg-blue-100",
    vacancyCount: 1,
    properties: [
      {
        id: "p1",
        address: "742 Evergreen Terr, Unit 1",
        city: "Tampa",
        state: "FL",
        beds: 3,
        baths: 2,
        occupied: true,
      },
      {
        id: "p2",
        address: "742 Evergreen Terr, Unit 2",
        city: "Tampa",
        state: "FL",
        beds: 2,
        baths: 1,
        occupied: false,
      },
      {
        id: "p3",
        address: "1500 Bay Shore Dr",
        city: "Clearwater",
        state: "FL",
        beds: 4,
        baths: 3,
        occupied: true,
      },
    ],
  },
  {
    id: "c2",
    name: "Robert Kim",
    initials: "RK",
    initialsColor: "text-pink-700",
    initialsBg: "bg-pink-100",
    vacancyCount: 1,
    properties: [
      {
        id: "p4",
        address: "1200 Palm Ave, Unit 1",
        city: "St. Petersburg",
        state: "FL",
        beds: 2,
        baths: 2,
        occupied: true,
      },
      {
        id: "p5",
        address: "1200 Palm Ave, Unit 3",
        city: "St. Petersburg",
        state: "FL",
        beds: 1,
        baths: 1,
        occupied: false,
      },
    ],
  },
  {
    id: "c3",
    name: "Lisa Torres",
    initials: "LT",
    initialsColor: "text-indigo-700",
    initialsBg: "bg-indigo-100",
    vacancyCount: 0,
    properties: [
      {
        id: "p6",
        address: "890 Sunset Blvd",
        city: "Sarasota",
        state: "FL",
        beds: 3,
        baths: 2,
        occupied: true,
      },
    ],
  },
];

export const pipelineTenants: TenantEvaluation[] = [
  {
    id: "eval1",
    applicantName: "Sarah Chen",
    propertyAddress: "742 Evergreen Terr, Unit 2",
    evaluationDate: "Apr 19, 2026",
    overallScore: 82,
    recommendation: "Recommended — Low Risk",
    riskLevel: "low",
    breakdown: [
      { category: "Income", score: 90, detail: "3.2x rent ratio" },
      { category: "Employment", score: 85, detail: "2 yrs same employer" },
      { category: "Rental History", score: 72, detail: "1 late payment" },
      { category: "Credit Check", score: 81, detail: "Via TransUnion" },
    ],
    summary: "",
    evidence: [],
    status: "proposed",
    proposedBy: "Priya",
    clientName: "Dana Martinez",
  },
  {
    id: "eval2",
    applicantName: "Marcus Johnson",
    propertyAddress: "1200 Palm Ave, Unit 3",
    evaluationDate: "Apr 18, 2026",
    overallScore: 74,
    recommendation: "Review Carefully",
    riskLevel: "medium",
    breakdown: [
      { category: "Income", score: 78, detail: "2.5x rent ratio" },
      { category: "Employment", score: 70, detail: "8 months" },
      { category: "Rental History", score: 68, detail: "2 late payments" },
      { category: "Credit Check", score: 80, detail: "Via TransUnion" },
    ],
    summary: "",
    evidence: [],
    status: "evaluating",
    clientName: "Robert Kim",
  },
  {
    id: "eval3",
    applicantName: "Emily Tran",
    propertyAddress: "742 Evergreen Terr, Unit 2",
    evaluationDate: "Apr 17, 2026",
    overallScore: 91,
    recommendation: "Recommended — Low Risk",
    riskLevel: "low",
    breakdown: [
      { category: "Income", score: 95, detail: "4.1x rent ratio" },
      { category: "Employment", score: 92, detail: "5 yrs same employer" },
      { category: "Rental History", score: 88, detail: "No issues" },
      { category: "Credit Check", score: 89, detail: "Via TransUnion" },
    ],
    summary: "",
    evidence: [],
    status: "proposed",
    clientName: "Dana Martinez",
  },
  {
    id: "eval4",
    applicantName: "David Park",
    propertyAddress: "1200 Palm Ave, Unit 3",
    evaluationDate: "Apr 15, 2026",
    overallScore: 88,
    recommendation: "Recommended — Low Risk",
    riskLevel: "low",
    breakdown: [
      { category: "Income", score: 92, detail: "3.8x rent ratio" },
      { category: "Employment", score: 85, detail: "3 yrs" },
      { category: "Rental History", score: 85, detail: "No issues" },
      { category: "Credit Check", score: 90, detail: "Via TransUnion" },
    ],
    summary: "",
    evidence: [],
    status: "approved",
    clientName: "Robert Kim",
  },
];

export const helpRequests: HelpRequest[] = [
  {
    id: "hr1",
    clientName: "Dana Martinez",
    clientInitials: "DM",
    message:
      "I got the Sarah Chen evaluation — score looks good but I'm unsure about the late payment. Can you look into it?",
    timestamp: "Today 10:30 AM",
    propertyAddress: "742 Evergreen Terr, Unit 2",
  },
  {
    id: "hr2",
    clientName: "Robert Kim",
    clientInitials: "RK",
    message:
      "Need help finding tenants for Unit 3. It's been vacant for 3 weeks now.",
    timestamp: "Yesterday 2:15 PM",
    propertyAddress: "1200 Palm Ave, Unit 3",
  },
];

export const ownerDocuments: Document[] = [
  {
    id: "d1",
    name: "Lease Agreement — Unit 1",
    type: "Lease",
    propertyId: "p1",
    uploadDate: "Jan 15, 2026",
    size: "2.4 MB",
  },
  {
    id: "d2",
    name: "HOA Rules & Guidelines",
    type: "HOA",
    propertyId: "p1",
    uploadDate: "Mar 2, 2026",
    size: "1.1 MB",
  },
  {
    id: "d3",
    name: "Insurance Policy",
    type: "Insurance",
    propertyId: "p1",
    uploadDate: "Feb 10, 2026",
    size: "3.2 MB",
  },
  {
    id: "d4",
    name: "Lease Agreement",
    type: "Lease",
    propertyId: "p3",
    uploadDate: "Dec 1, 2025",
    size: "2.1 MB",
  },
  {
    id: "d5",
    name: "Property Tax Assessment 2026",
    type: "Tax",
    propertyId: "p3",
    uploadDate: "Apr 15, 2026",
    size: "890 KB",
  },
];
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts src/lib/mock-data.ts
git commit -m "feat: add TypeScript types and mock data for all screens"
```

---

## Task 3: Shared Components

**Files:**
- Create: `src/components/logo.tsx`, `src/components/owner-sidebar.tsx`, `src/components/agent-sidebar.tsx`, `src/components/stat-card.tsx`, `src/components/score-badge.tsx`, `src/components/status-badge.tsx`, `src/components/theme-dot.tsx`

- [ ] **Step 1: Create Logo component**

Create `src/components/logo.tsx`:

```tsx
import Link from "next/link";

export function Logo({ size = "default" }: { size?: "small" | "default" }) {
  const iconSize = size === "small" ? "w-5 h-5" : "w-6 h-6";
  const textSize = size === "small" ? "text-xs" : "text-sm";

  return (
    <Link href="/" className="flex items-center gap-2">
      <div className={`${iconSize} bg-brand rounded-md`} />
      <span className={`font-semibold ${textSize} text-gray-900`}>
        PropStealth
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: Create Owner Sidebar**

Create `src/components/owner-sidebar.tsx`:

```tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "./logo";

const navItems = [
  { label: "Activity Feed", href: "/owner", badge: "3" },
  { label: "Inbox Agent", href: "/owner/inbox" },
  { label: "Tenant Eval", href: "/owner/tenant-eval" },
  { label: "Properties", href: "/owner/properties" },
  { label: "Documents", href: "/owner/documents" },
];

const bottomItems = [{ label: "Settings", href: "/owner/settings" }];

export function OwnerSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/owner") return pathname === "/owner";
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-[200px] bg-sidebar border-r border-gray-200 p-4 flex-shrink-0 flex flex-col min-h-screen">
      <div className="mb-6">
        <Logo />
      </div>

      <nav className="flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between px-2.5 py-2 rounded-md text-xs mb-1 ${
              isActive(item.href)
                ? "bg-brand-light text-brand font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{item.label}</span>
            {item.badge && (
              <span className="bg-brand text-white text-[9px] px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="border-t border-gray-200 pt-3">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-2.5 py-2 text-xs ${
              isActive(item.href)
                ? "bg-brand-light text-brand font-medium rounded-md"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Create Agent Sidebar**

Create `src/components/agent-sidebar.tsx`:

```tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "./logo";
import { agentClients } from "@/lib/mock-data";

const navItems = [
  { label: "Dashboard", href: "/agent" },
];

const bottomItems = [
  { label: "Invite Client", href: "/agent/invite" },
  { label: "Settings", href: "#" },
];

export function AgentSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/agent") return pathname === "/agent";
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-[210px] bg-sidebar border-r border-gray-200 p-4 flex-shrink-0 flex flex-col min-h-screen">
      <div className="mb-2">
        <Logo />
      </div>
      <span className="text-[10px] text-brand bg-brand-light px-2 py-0.5 rounded inline-block mb-5 w-fit">
        Agent Account
      </span>

      <nav className="flex-1">
        <Link
          href="/agent"
          className={`block px-2.5 py-2 rounded-md text-xs mb-1 ${
            isActive("/agent")
              ? "bg-brand-light text-brand font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Dashboard
        </Link>

        <Link
          href="#"
          className="block px-2.5 py-2 text-xs text-gray-500 mb-0.5"
        >
          Clients
        </Link>
        <div className="pl-6">
          {agentClients.map((client) => (
            <Link
              key={client.id}
              href={`/agent/clients/${client.id}`}
              className={`block px-2.5 py-1 text-[11px] ${
                pathname === `/agent/clients/${client.id}`
                  ? "text-brand font-medium"
                  : "text-gray-400"
              }`}
            >
              {client.name}
            </Link>
          ))}
        </div>

        <Link
          href="/agent/pipeline"
          className={`flex items-center justify-between px-2.5 py-2 rounded-md text-xs mt-1 mb-1 ${
            isActive("/agent/pipeline")
              ? "bg-brand-light text-brand font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span>Tenant Pipeline</span>
          <span className="bg-brand text-white text-[9px] px-1.5 py-0.5 rounded-full">
            4
          </span>
        </Link>

        <Link
          href="/agent/help-requests"
          className={`block px-2.5 py-2 text-xs mb-4 ${
            isActive("/agent/help-requests")
              ? "bg-brand-light text-brand font-medium rounded-md"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Help Requests
        </Link>
      </nav>

      <div className="border-t border-gray-200 pt-3">
        {bottomItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`block px-2.5 py-2 text-xs ${
              isActive(item.href)
                ? "bg-brand-light text-brand font-medium rounded-md"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Create utility components**

Create `src/components/stat-card.tsx`:

```tsx
export function StatCard({
  label,
  value,
  detail,
  variant = "default",
}: {
  label: string;
  value: string | number;
  detail?: string;
  variant?: "default" | "success" | "danger";
}) {
  const styles = {
    default: "bg-gray-50 border-gray-200",
    success: "bg-gray-50 border-gray-200",
    danger: "bg-red-50 border-red-200",
  };
  const valueColor = {
    default: "text-gray-900",
    success: "text-brand",
    danger: "text-red-600",
  };
  const labelColor = {
    default: "text-gray-500",
    success: "text-gray-500",
    danger: "text-red-800",
  };

  return (
    <div className={`border rounded-lg p-3.5 ${styles[variant]}`}>
      <div
        className={`text-[10px] uppercase tracking-wider ${labelColor[variant]}`}
      >
        {label}
      </div>
      <div className={`text-[22px] font-bold mt-0.5 ${valueColor[variant]}`}>
        {value}
      </div>
      {detail && (
        <div className={`text-[10px] ${labelColor[variant]}`}>{detail}</div>
      )}
    </div>
  );
}
```

Create `src/components/score-badge.tsx`:

```tsx
export function ScoreBadge({
  score,
  size = "large",
}: {
  score: number;
  size?: "small" | "large";
}) {
  const color =
    score >= 80
      ? "text-brand border-brand bg-brand-light"
      : score >= 60
        ? "text-yellow-600 border-yellow-500 bg-yellow-50"
        : "text-red-600 border-red-500 bg-red-50";

  if (size === "small") {
    return (
      <div
        className={`text-center border-2 rounded-lg px-3 py-1.5 ${color}`}
      >
        <div className="text-lg font-extrabold">{score}</div>
        <div className="text-[8px] font-medium">/ 100</div>
      </div>
    );
  }

  return (
    <div
      className={`text-center border-2 rounded-xl px-5 py-3 ${color}`}
    >
      <div className="text-3xl font-extrabold">{score}</div>
      <div className="text-[10px] font-medium">/ 100</div>
    </div>
  );
}
```

Create `src/components/status-badge.tsx`:

```tsx
const variants = {
  occupied: "text-brand bg-brand-light",
  vacant: "text-red-600 bg-red-50",
  proposed: "text-amber-600 bg-amber-50",
  evaluating: "text-gray-500 bg-gray-100",
  approved: "text-brand bg-brand-light",
  "all-occupied": "text-brand bg-brand-light",
} as const;

export function StatusBadge({
  variant,
  children,
}: {
  variant: keyof typeof variants;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
```

Create `src/components/theme-dot.tsx`:

```tsx
import { EmailTheme } from "@/lib/types";

const themeColors: Record<EmailTheme, string> = {
  tenant: "bg-blue-600",
  hoa: "bg-purple-600",
  bill: "bg-brand",
  other: "bg-gray-500",
};

const themeLabels: Record<EmailTheme, string> = {
  tenant: "TENANT",
  hoa: "HOA",
  bill: "BILL",
  other: "OTHER",
};

export function ThemeDot({ theme }: { theme: EmailTheme }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-sm ${themeColors[theme]}`} />
      <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
        {themeLabels[theme]}
      </span>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/
git commit -m "feat: add shared UI components — sidebar, logo, badges, stat cards"
```

---

## Task 4: Dashboard Layouts

**Files:**
- Create: `src/app/(dashboard)/owner/layout.tsx`, `src/app/(dashboard)/agent/layout.tsx`

- [ ] **Step 1: Create Owner dashboard layout**

Create `src/app/(dashboard)/owner/layout.tsx`:

```tsx
import { OwnerSidebar } from "@/components/owner-sidebar";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <OwnerSidebar />
      <main className="flex-1 p-5 bg-white overflow-y-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create Agent dashboard layout**

Create `src/app/(dashboard)/agent/layout.tsx`:

```tsx
import { AgentSidebar } from "@/components/agent-sidebar";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AgentSidebar />
      <main className="flex-1 p-5 bg-white overflow-y-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Add placeholder pages to verify layouts**

Create `src/app/(dashboard)/owner/page.tsx`:

```tsx
export default function OwnerHome() {
  return <div className="text-lg font-semibold">Owner Activity Feed (placeholder)</div>;
}
```

Create `src/app/(dashboard)/agent/page.tsx`:

```tsx
export default function AgentHome() {
  return <div className="text-lg font-semibold">Agent Portfolio Overview (placeholder)</div>;
}
```

- [ ] **Step 4: Verify both layouts render**

```bash
npm run dev
```

Visit `http://localhost:3000/owner` — should show sidebar with "Activity Feed" active and placeholder content.
Visit `http://localhost:3000/agent` — should show agent sidebar with "Agent Account" badge and placeholder content.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(dashboard\)/
git commit -m "feat: add owner and agent dashboard layouts with sidebar navigation"
```

---

## Task 5: Homepage (Unauthenticated Landing Page)

**Files:**
- Create: `src/app/(marketing)/page.tsx`

Reference mockup: `.superpowers/brainstorm/30339-1776588305/content/homepage-v2.html`

- [ ] **Step 1: Build the homepage**

Create `src/app/(marketing)/page.tsx`:

```tsx
import Link from "next/link";

function Nav() {
  return (
    <nav className="flex items-center justify-between px-12 py-4 border-b border-gray-100">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-brand rounded-[7px]" />
        <span className="font-bold text-lg text-gray-900">PropStealth</span>
      </div>
      <div className="flex items-center gap-7">
        <a href="#how-it-works" className="text-[13px] text-gray-500">
          How It Works
        </a>
        <a href="#for-agents" className="text-[13px] text-gray-500">
          For Agents
        </a>
        <a href="#" className="text-[13px] text-gray-500">
          Pricing
        </a>
        <Link
          href="/login"
          className="bg-brand text-white px-4.5 py-2 rounded-[7px] text-[13px] font-medium"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-20 pb-0 px-12 max-w-[1100px] mx-auto text-center">
      <span className="inline-block text-[11px] text-brand bg-brand-light border border-brand-border px-3.5 py-1 rounded-full mb-5 font-medium">
        Now in private alpha · Florida
      </span>
      <h1 className="text-[44px] font-extrabold leading-[1.15] text-gray-900 mb-4 tracking-tight">
        Your rental properties,
        <br />
        managed by <span className="text-brand">AI agents</span>
      </h1>
      <p className="text-[17px] text-gray-500 max-w-[580px] mx-auto mb-8 leading-relaxed">
        PropStealth reads your email, screens tenants, and keeps you on top of
        every property — so you can stop managing and start growing.
      </p>
      <div className="flex gap-3 justify-center mb-3">
        <Link
          href="/login"
          className="bg-brand text-white px-7 py-3 rounded-lg text-[15px] font-semibold"
        >
          Get Started Free
        </Link>
        <a
          href="#how-it-works"
          className="bg-white border border-gray-300 text-gray-700 px-7 py-3 rounded-lg text-[15px] font-medium"
        >
          See How It Works
        </a>
      </div>
      <p className="text-xs text-gray-400 mt-2.5">
        Free for up to 1 property · No credit card required
      </p>
    </section>
  );
}

function AppPreview() {
  return (
    <div className="max-w-[900px] mx-auto mt-12 rounded-t-xl overflow-hidden shadow-[0_-4px_40px_rgba(0,0,0,0.08)] border border-gray-200 border-b-0">
      <div className="flex min-h-[280px]">
        <div className="w-[180px] bg-sidebar border-r border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center gap-1.5 mb-5">
            <div className="w-5 h-5 bg-brand rounded-[5px]" />
            <span className="font-semibold text-xs text-gray-900">
              PropStealth
            </span>
          </div>
          <div className="px-2 py-1.5 bg-brand-light rounded-[5px] text-brand text-[11px] font-medium mb-0.5">
            Activity Feed
          </div>
          <div className="px-2 py-1.5 text-gray-500 text-[11px] mb-0.5">
            Inbox Agent
          </div>
          <div className="px-2 py-1.5 text-gray-500 text-[11px] mb-0.5">
            Tenant Eval
          </div>
          <div className="px-2 py-1.5 text-gray-500 text-[11px] mb-0.5">
            Properties
          </div>
          <div className="px-2 py-1.5 text-gray-500 text-[11px]">
            Documents
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="text-sm font-semibold text-gray-900 mb-0.5">
            Good morning, Dana
          </div>
          <div className="text-[10px] text-gray-500 mb-3.5">
            3 items need your attention
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-md px-2.5 py-2 mb-1.5">
            <div className="text-[10px] font-medium text-gray-900">
              Tenant proposal from Priya — Sarah Chen, Score: 82
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2 mb-1.5">
            <div className="text-[10px] font-medium text-gray-900">
              HOA violation notice — deadline May 3
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2">
            <div className="text-[10px] font-medium text-gray-900">
              Tenant requesting early lease renewal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialProof() {
  return (
    <section className="bg-gray-50 py-12 px-12">
      <div className="max-w-[900px] mx-auto">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-4 text-center">
          Early results from alpha users
        </p>
        <div className="flex justify-center gap-12">
          {[
            { number: "6hrs", label: "saved per week" },
            { number: "142", label: "emails auto-classified" },
            { number: "<10min", label: "tenant screening" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-[28px] font-bold text-gray-900">
                {stat.number}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Connect your Gmail",
      description:
        "Label your property emails in Gmail. Our Inbox Agent monitors that label, classifies every email, and surfaces key points — no more digging through threads.",
    },
    {
      number: "2",
      title: "Add your properties",
      description:
        "Enter your addresses and upload key documents — leases, insurance, HOA rules. PropStealth organizes everything by property and unit.",
    },
    {
      number: "3",
      title: "Let agents work for you",
      description:
        "AI agents classify your inbox, screen tenant applications, and surface what needs your attention. You approve — they handle the rest.",
    },
  ];

  return (
    <section id="how-it-works" className="py-[72px] px-12">
      <div className="max-w-[900px] mx-auto">
        <h2 className="text-[28px] font-bold text-center mb-2">
          How it works
        </h2>
        <p className="text-sm text-gray-500 text-center mb-12">
          Set up in 5 minutes. AI agents start working immediately.
        </p>
        <div className="grid grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <div className="w-7 h-7 bg-brand-light text-brand rounded-[7px] flex items-center justify-center text-[13px] font-bold mb-3">
                {step.number}
              </div>
              <h3 className="text-[15px] font-semibold mb-1.5">
                {step.title}
              </h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureShowcase({
  label,
  title,
  description,
  bullets,
  visual,
  reverse = false,
  bgGray = false,
}: {
  label: string;
  title: string;
  description: string;
  bullets: string[];
  visual: React.ReactNode;
  reverse?: boolean;
  bgGray?: boolean;
}) {
  return (
    <section className={`py-[72px] px-12 ${bgGray ? "bg-gray-50" : ""}`}>
      <div
        className={`max-w-[900px] mx-auto flex items-center gap-12 ${reverse ? "flex-row-reverse" : ""}`}
      >
        <div className="flex-1">
          <div className="text-[11px] text-brand uppercase tracking-widest font-semibold mb-2">
            {label}
          </div>
          <h2 className="text-2xl font-bold mb-3 leading-snug">{title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">
            {description}
          </p>
          <ul className="space-y-1">
            {bullets.map((b) => (
              <li
                key={b}
                className="text-[13px] text-gray-700 pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-brand before:font-semibold"
              >
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1 rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-200">
          {visual}
        </div>
      </div>
    </section>
  );
}

function InboxMockup() {
  return (
    <div className="bg-white p-4">
      <div className="text-[13px] font-semibold text-gray-900 mb-2.5">
        742 Evergreen Terr
      </div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className="w-[7px] h-[7px] bg-blue-600 rounded-sm" />
        <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">
          Tenant
        </span>
      </div>
      <div className="border border-gray-200 rounded-md p-2.5 mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px] font-medium text-gray-900">
            John Rivera
          </span>
          <span className="text-[9px] text-gray-500">Unit 1 · 9:14 AM</span>
        </div>
        <div className="text-[10px] text-gray-700 leading-snug">
          <strong>Key points:</strong> Requesting early lease renewal. Wants
          same rate + adding a dog.
        </div>
        <div className="flex gap-1 mt-1.5">
          <div className="bg-brand text-white px-2 py-0.5 rounded text-[9px]">
            Auto-respond
          </div>
          <div className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[9px]">
            Expand
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className="w-[7px] h-[7px] bg-purple-600 rounded-sm" />
        <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">
          HOA
        </span>
      </div>
      <div className="border border-gray-200 rounded-md p-2.5">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px] font-medium text-gray-900">
            Evergreen HOA Board
          </span>
          <span className="text-[8px] text-red-600 bg-red-50 px-1 py-0.5 rounded-sm">
            Violation
          </span>
        </div>
        <div className="text-[10px] text-gray-700 leading-snug">
          <strong>Key points:</strong> Lawn violation. 14 days to resolve. $50
          fine.
        </div>
      </div>
    </div>
  );
}

function TenantEvalMockup() {
  return (
    <div className="bg-white p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Sarah Chen</div>
          <div className="text-[10px] text-gray-500">
            742 Evergreen Terr, Unit 2
          </div>
        </div>
        <div className="text-center bg-brand-light border-2 border-brand rounded-[10px] px-3.5 py-2">
          <div className="text-[22px] font-extrabold text-brand">82</div>
          <div className="text-[8px] text-brand">/ 100</div>
        </div>
      </div>
      <div className="inline-flex items-center gap-1 bg-brand-light border border-brand-border px-2.5 py-0.5 rounded mb-3">
        <div className="w-[7px] h-[7px] bg-brand rounded-full" />
        <span className="text-[10px] font-medium text-emerald-800">
          Recommended — Low Risk
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {[
          { label: "Income", score: 90, color: "text-brand" },
          { label: "Employment", score: 85, color: "text-brand" },
          { label: "History", score: 72, color: "text-yellow-500" },
          { label: "Credit", score: 81, color: "text-brand" },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-gray-50 rounded-md p-2 text-center"
          >
            <div className="text-[8px] text-gray-500">{item.label}</div>
            <div className={`text-sm font-bold ${item.color}`}>
              {item.score}
            </div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-gray-700 leading-relaxed bg-gray-50 rounded-md p-2.5">
        Strong applicant with stable employment at Bayshore Medical Group for 2+
        years, earning $5,800/mo (3.2x rent). Credit score 710, no
        collections...
      </div>
    </div>
  );
}

function Personas() {
  return (
    <section className="bg-gray-50 py-[72px] px-12">
      <div className="max-w-[900px] mx-auto">
        <h2 className="text-[28px] font-bold text-center mb-2">
          Built for both sides
        </h2>
        <p className="text-sm text-gray-500 text-center mb-12">
          Whether you own the property or help someone buy it.
        </p>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="h-[180px] bg-gray-200" />
            <div className="p-6">
              <div className="text-[10px] text-brand uppercase tracking-widest font-semibold mb-2">
                Property Owners
              </div>
              <h3 className="text-lg font-semibold mb-1">
                Manage your portfolio
              </h3>
              <p className="text-[13px] text-gray-500 mb-3">
                For landlords with 1–5 rental properties
              </p>
              <ul className="space-y-1">
                {[
                  "AI reads and classifies your property email",
                  "Screen tenants in under 10 minutes",
                  "Never miss a bill, lease renewal, or HOA deadline",
                  "Ask your agent for help with one click",
                ].map((item) => (
                  <li
                    key={item}
                    className="text-[13px] text-gray-700 pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-brand before:font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="h-[180px] bg-gray-200" />
            <div className="p-6">
              <div className="text-[10px] text-brand uppercase tracking-widest font-semibold mb-2">
                Real Estate Agents
              </div>
              <h3 className="text-lg font-semibold mb-1">
                Grow your clients&apos; wealth
              </h3>
              <p className="text-[13px] text-gray-500 mb-3">
                For agents who want recurring client relationships
              </p>
              <ul className="space-y-1">
                {[
                  "See all clients' properties and vacancy status",
                  "Source and evaluate tenants for your clients",
                  "Propose scored candidates with evidence",
                  "Be there when your clients need help",
                ].map((item) => (
                  <li
                    key={item}
                    className="text-[13px] text-gray-700 pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-brand before:font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section className="py-[72px] px-12 text-center">
      <div className="max-w-[640px] mx-auto">
        <div className="w-14 h-14 rounded-full bg-gray-200 mx-auto mb-4" />
        <blockquote className="text-lg text-gray-700 leading-relaxed italic mb-4">
          &ldquo;I used to spend Sunday nights going through 30+ emails about my
          three properties. Now I open PropStealth and everything&apos;s already
          sorted — I just review and approve.&rdquo;
        </blockquote>
        <div className="text-[13px] text-gray-500">
          <strong className="text-gray-900 font-semibold">Michael R.</strong> ·
          3 properties in Tampa · Alpha user
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-[72px] px-12 text-center bg-gradient-to-b from-gray-50 to-brand-light">
      <h2 className="text-[32px] font-bold mb-2">
        Stop managing. Start growing.
      </h2>
      <p className="text-[15px] text-gray-500 mb-7">
        Join the private alpha — free for your first property.
      </p>
      <div className="flex justify-center">
        <Link
          href="/login"
          className="bg-brand text-white px-7 py-3 rounded-lg text-[15px] font-semibold"
        >
          Get Started Free
        </Link>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Florida only during alpha · No credit card required
      </p>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 px-12 py-6 flex justify-between items-center">
      <div className="text-xs text-gray-400">
        © 2026 PropStealth. All rights reserved.
      </div>
      <div className="flex gap-5">
        <a href="#" className="text-xs text-gray-400">
          Privacy
        </a>
        <a href="#" className="text-xs text-gray-400">
          Terms
        </a>
        <a href="#" className="text-xs text-gray-400">
          Contact
        </a>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <>
      <Nav />
      <Hero />
      <AppPreview />
      <SocialProof />
      <HowItWorks />
      <FeatureShowcase
        label="Inbox Agent"
        title="Your email, sorted and summarized"
        description="Every property email classified by theme — tenant, HOA, bill, or other. Key points extracted so you scan in seconds instead of reading for minutes."
        bullets={[
          "Grouped by property and theme",
          "AI-generated key points summary",
          "Expand to read the full email",
          "One-click auto-respond when you're ready",
        ]}
        visual={<InboxMockup />}
        bgGray
      />
      <FeatureShowcase
        label="Tenant Evaluation"
        title="Screen tenants in minutes, not days"
        description="Upload an application with pay stubs, ID, and references. AI analyzes everything, runs a credit check, and delivers a clear score with evidence you can trust."
        bullets={[
          "1–100 risk score with breakdown",
          "AI narrative explaining the reasoning",
          "Credit check via TransUnion partner",
          "Evidence linked to source documents",
          "FCRA compliant — you make the final call",
        ]}
        visual={<TenantEvalMockup />}
        reverse
      />
      <FeatureShowcase
        label="For Real Estate Agents"
        title="Help your clients grow wealth — not just buy a home"
        description="Turn one-time commissions into recurring relationships. Source tenants for your clients, propose scored candidates, and be there when they need expert help — all from one dashboard."
        bullets={[
          "See all clients' properties and vacancy rates",
          "Run tenant evaluations and propose candidates",
          "Track proposals through approval pipeline",
          "Respond to client help requests",
        ]}
        visual={
          <div className="bg-gray-200 h-[300px] flex items-center justify-center text-gray-400 text-sm">
            Agent dashboard preview
          </div>
        }
        bgGray
      />
      <Personas />
      <Testimonial />
      <CTA />
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Visit `http://localhost:3000`. Confirm the full landing page renders: nav, hero, app preview, social proof, how it works, feature showcases, personas, testimonial, CTA, footer.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(marketing\)/
git commit -m "feat: build homepage landing page with all sections"
```

---

## Task 6: Login / Sign Up Page

**Files:**
- Create: `src/app/(auth)/login/page.tsx`

Reference mockup: `.superpowers/brainstorm/30339-1776588305/content/login-page.html`

- [ ] **Step 1: Build the login page with role toggle**

Create `src/app/(auth)/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

type Role = "owner" | "agent";

export default function LoginPage() {
  const [role, setRole] = useState<Role>("owner");

  const messaging = {
    owner: {
      headline: "Manage your rental properties with AI",
      sub: "Automate inbox triage, screen tenants, and stay on top of your portfolio.",
      dashboard: "/owner",
    },
    agent: {
      headline: "Grow your clients' wealth with AI",
      sub: "Source tenants, manage client portfolios, and offer ongoing property services.",
      dashboard: "/agent",
    },
  };

  const current = messaging[role];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-[340px] p-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 bg-brand rounded-lg" />
          <span className="font-bold text-xl text-gray-900">PropStealth</span>
        </div>

        {/* Role toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 mb-6">
          <button
            onClick={() => setRole("owner")}
            className={`flex-1 text-center py-2 text-[13px] rounded-md transition-all ${
              role === "owner"
                ? "bg-white font-medium text-gray-900 shadow-sm"
                : "text-gray-500 cursor-pointer"
            }`}
          >
            Property Owner
          </button>
          <button
            onClick={() => setRole("agent")}
            className={`flex-1 text-center py-2 text-[13px] rounded-md transition-all ${
              role === "agent"
                ? "bg-white font-medium text-gray-900 shadow-sm"
                : "text-gray-500 cursor-pointer"
            }`}
          >
            Real Estate Agent
          </button>
        </div>

        {/* Messaging */}
        <div className="text-sm font-medium text-gray-900 mb-1 text-center">
          {current.headline}
        </div>
        <div className="text-xs text-gray-500 mb-6 text-center">
          {current.sub}
        </div>

        {/* Google OAuth */}
        <button className="w-full border border-gray-300 rounded-lg py-2.5 flex items-center justify-center gap-2.5 mb-4 cursor-pointer hover:bg-gray-50">
          <div className="w-[18px] h-[18px] bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
            G
          </div>
          <span className="text-[13px] font-medium text-gray-700">
            Continue with Google
          </span>
        </button>

        <div className="text-center text-[11px] text-gray-400 mb-4">or</div>

        {/* Email fallback */}
        <input
          type="email"
          placeholder="Email address"
          className="w-full border border-gray-300 rounded-md py-2 px-3 text-xs text-gray-900 placeholder:text-gray-400 mb-3"
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border border-gray-300 rounded-md py-2 px-3 text-xs text-gray-900 placeholder:text-gray-400 mb-4"
        />

        {/* Submit */}
        <Link
          href={current.dashboard}
          className="block w-full bg-brand text-white py-2.5 rounded-lg text-center text-[13px] font-medium mb-4"
        >
          Sign Up
        </Link>

        <div className="text-center text-xs text-gray-500">
          Already have an account?{" "}
          <button className="text-brand cursor-pointer">Sign in</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Visit `http://localhost:3000/login`. Toggle between "Property Owner" and "Real Estate Agent" — messaging should change. Click "Sign Up" — should navigate to `/owner` or `/agent`.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/
git commit -m "feat: build login/signup page with role toggle"
```

---

## Task 7: Owner — Activity Feed

**Files:**
- Modify: `src/app/(dashboard)/owner/page.tsx`
- Create: `src/components/attention-card.tsx`, `src/components/timeline-entry.tsx`

Reference mockup: `.superpowers/brainstorm/30339-1776588305/content/owner-activity-feed.html`

- [ ] **Step 1: Create attention card component**

Create `src/components/attention-card.tsx`:

```tsx
import { AttentionItem } from "@/lib/types";

const bgColors = {
  proposal: "bg-blue-50 border-blue-200",
  hoa: "bg-amber-50 border-amber-200",
  "tenant-request": "bg-amber-50 border-amber-200",
};

export function AttentionCard({ item }: { item: AttentionItem }) {
  return (
    <div className={`border rounded-lg p-3 mb-2 ${bgColors[item.type]}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-medium text-gray-900">
              {item.title}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-sm ${item.tagColor}`}
            >
              {item.tag}
            </span>
          </div>
          {item.detail.split("\n").map((line, i) => (
            <div key={i} className="text-[11px] text-gray-500 mt-0.5">
              {line}
            </div>
          ))}
        </div>
        <div className="ml-3 flex-shrink-0">
          {item.type === "proposal" ? (
            <button className="bg-brand text-white px-2.5 py-1 rounded-[5px] text-[11px]">
              {item.linkText}
            </button>
          ) : (
            <button className="bg-white border border-gray-300 text-gray-700 px-2.5 py-1 rounded-[5px] text-[11px]">
              {item.linkText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create timeline entry component**

Create `src/components/timeline-entry.tsx`:

```tsx
import { TimelineEntry as TimelineEntryType } from "@/lib/types";

export function TimelineEntry({ entry }: { entry: TimelineEntryType }) {
  return (
    <div className="mb-3.5 relative">
      <div
        className={`absolute -left-[21px] top-1 w-2 h-2 rounded-full ${
          entry.isToday ? "bg-brand" : "bg-gray-300"
        }`}
      />
      <div className="text-xs font-medium text-gray-900">{entry.title}</div>
      <div className="text-[11px] text-gray-500">{entry.detail}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">
        {entry.timestamp}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build the Activity Feed page**

Replace `src/app/(dashboard)/owner/page.tsx`:

```tsx
import { AttentionCard } from "@/components/attention-card";
import { TimelineEntry } from "@/components/timeline-entry";
import { attentionItems, timelineGroups } from "@/lib/mock-data";
import Link from "next/link";

export default function OwnerHome() {
  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Good morning, Dana
          </h1>
          <p className="text-xs text-gray-500">
            {attentionItems.length} items need your attention
          </p>
        </div>
        <Link
          href="/owner/tenant-eval"
          className="bg-white border border-gray-300 text-gray-700 px-3.5 py-1.5 rounded-md text-xs font-medium"
        >
          + Evaluate Tenant
        </Link>
      </div>

      {/* Needs attention */}
      <h2 className="text-[13px] font-semibold text-gray-900 mb-2.5">
        Needs Your Attention
      </h2>
      <div className="mb-6">
        {attentionItems.map((item) => (
          <AttentionCard key={item.id} item={item} />
        ))}
      </div>

      {/* Timeline */}
      {timelineGroups.map((group) => (
        <div key={group.label}>
          <h2 className="text-[13px] font-semibold text-gray-900 mb-2.5">
            {group.label}
          </h2>
          <div className="border-l-2 border-gray-200 pl-4 ml-1 mb-5">
            {group.entries.map((entry) => (
              <TimelineEntry key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
```

- [ ] **Step 4: Verify in browser**

Visit `http://localhost:3000/owner`. Confirm: greeting, 3 attention items with correct colors, timeline with today/yesterday grouping, green/gray dots.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(dashboard\)/owner/page.tsx src/components/attention-card.tsx src/components/timeline-entry.tsx
git commit -m "feat: build owner activity feed with attention items and timeline"
```

---

## Task 8: Owner — Inbox Agent

**Files:**
- Create: `src/app/(dashboard)/owner/inbox/page.tsx`, `src/components/email-card.tsx`

Reference mockup: `.superpowers/brainstorm/30339-1776588305/content/inbox-agent.html`

- [ ] **Step 1: Create email card component**

Create `src/components/email-card.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Email } from "@/lib/types";

export function EmailCard({ email }: { email: Email }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-3 mb-1.5">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-900">
              {email.sender}
            </span>
            <span className="text-[10px] text-gray-500">
              {email.unit ? `${email.unit} · ` : ""}
              {email.timestamp}
            </span>
            {email.violationTag && (
              <span className="text-[9px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded-sm">
                {email.violationTag}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-700 leading-relaxed">
            <strong className="text-gray-900">Key points:</strong>{" "}
            {email.keyPoints}
          </div>
          {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <pre className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap font-sans">
                {email.fullContent}
              </pre>
            </div>
          )}
        </div>
        <div className="flex gap-1.5 ml-3 flex-shrink-0">
          {email.showAutoRespond && (
            <button className="bg-brand text-white px-2.5 py-1 rounded-[5px] text-[11px] whitespace-nowrap">
              Auto-respond
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-[5px] text-[11px]"
          >
            {expanded ? "Collapse ▴" : "Expand ▾"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build the Inbox Agent page**

Create `src/app/(dashboard)/owner/inbox/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { EmailCard } from "@/components/email-card";
import { ThemeDot } from "@/components/theme-dot";
import { inboxEmails } from "@/lib/mock-data";
import { EmailTheme } from "@/lib/types";

export default function InboxAgent() {
  const [activeProperty, setActiveProperty] = useState<string | null>(null);

  const properties = [
    { id: null, label: "All Properties" },
    ...inboxEmails.map((pg) => ({ id: pg.propertyId, label: pg.address })),
  ];

  const filteredGroups = activeProperty
    ? inboxEmails.filter((g) => g.propertyId === activeProperty)
    : inboxEmails;

  const themeOrder: EmailTheme[] = ["tenant", "hoa", "bill", "other"];

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-1.5">
        <h1 className="text-lg font-semibold text-gray-900">Inbox Agent</h1>
        <span className="text-[11px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded">
          Last scanned: 12 min ago
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Emails from your Gmail label, classified and summarized by AI.
      </p>

      {/* Property filter tabs */}
      <div className="flex gap-0 mb-5 border-b border-gray-200">
        {properties.map((prop) => (
          <button
            key={prop.id ?? "all"}
            onClick={() => setActiveProperty(prop.id)}
            className={`px-4 py-2 text-xs ${
              activeProperty === prop.id
                ? "text-brand border-b-2 border-brand font-medium"
                : "text-gray-500"
            }`}
          >
            {prop.label}
          </button>
        ))}
      </div>

      {/* Email groups by property */}
      {filteredGroups.map((group) => (
        <div key={group.propertyId} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-gray-900">
              {group.address}
            </h2>
            <span className="text-[10px] text-gray-500 font-normal">
              {group.city}
            </span>
          </div>

          {/* Group emails by theme */}
          {themeOrder.map((theme) => {
            const themeEmails = group.emails.filter(
              (e) => e.theme === theme
            );
            if (themeEmails.length === 0) return null;

            return (
              <div key={theme} className="mb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <ThemeDot theme={theme} />
                  <span className="text-[10px] text-gray-500">
                    {themeEmails.length} email
                    {themeEmails.length > 1 ? "s" : ""}
                  </span>
                </div>
                {themeEmails.map((email) => (
                  <EmailCard key={email.id} email={email} />
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}
```

- [ ] **Step 3: Verify in browser**

Visit `http://localhost:3000/owner/inbox`. Confirm: property filter tabs work, emails grouped by theme with color dots, expand/collapse works, auto-respond button shows on tenant/HOA but not bills.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/owner/inbox/ src/components/email-card.tsx
git commit -m "feat: build inbox agent page with email grouping and expand/collapse"
```

---

## Task 9: Owner — Tenant Evaluation

**Files:**
- Create: `src/app/(dashboard)/owner/tenant-eval/page.tsx`, `src/app/(dashboard)/owner/tenant-eval/[id]/page.tsx`

Reference mockup: `.superpowers/brainstorm/30339-1776588305/content/tenant-eval.html`

- [ ] **Step 1: Build the tenant eval list + new evaluation form page**

Create `src/app/(dashboard)/owner/tenant-eval/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ScoreBadge } from "@/components/score-badge";
import { tenantEvaluations, ownerProperties } from "@/lib/mock-data";

export default function TenantEvalPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Tenant Evaluation
          </h1>
          <p className="text-xs text-gray-500">
            Upload applicant documents for AI-powered risk assessment
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-brand text-white px-3.5 py-1.5 rounded-md text-xs font-medium"
        >
          + New Evaluation
        </button>
      </div>

      {showForm && (
        <div className="border border-gray-200 rounded-lg p-5 max-w-[560px] mb-6">
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Applicant Name
            </label>
            <input
              type="text"
              placeholder="Enter applicant name"
              className="w-full border border-gray-300 rounded-md py-2 px-3 text-[13px] text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Property
            </label>
            <select className="w-full border border-gray-300 rounded-md py-2 px-3 text-[13px] text-gray-700 bg-white">
              {ownerProperties.map((p) => (
                <option key={p.id}>
                  {p.address}
                  {p.unit ? `, ${p.unit}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-5">
            <label className="text-xs font-medium text-gray-700 mb-2 block">
              Upload Documents
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg py-6 px-4 text-center bg-gray-50">
              <p className="text-[13px] text-gray-500 mb-1">
                Drag & drop files or click to browse
              </p>
              <p className="text-[11px] text-gray-400">
                Application form, pay stubs, ID, references, etc.
              </p>
            </div>
            {/* Mock uploaded files */}
            <div className="mt-2.5 space-y-1">
              {[
                { name: "rental_application.pdf", size: "2.1 MB" },
                { name: "pay_stubs_mar_apr.pdf", size: "1.4 MB" },
                { name: "drivers_license.jpg", size: "890 KB" },
              ].map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between px-2.5 py-1.5 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500">📄</span>
                    <span className="text-xs text-gray-700">{file.name}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">{file.size}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/owner/tenant-eval/eval1"
              className="bg-brand text-white px-5 py-2 rounded-md text-[13px] font-medium"
            >
              Run Evaluation
            </Link>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-100 text-gray-700 px-5 py-2 rounded-md text-[13px]"
            >
              Cancel
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            Evaluation typically completes within 10 minutes. Results include a
            CRA disclosure per FCRA requirements.
          </p>
        </div>
      )}

      {/* Past evaluations list */}
      <h2 className="text-[13px] font-semibold text-gray-900 mb-3">
        Recent Evaluations
      </h2>
      <div className="space-y-2">
        {tenantEvaluations.map((evaluation) => (
          <Link
            key={evaluation.id}
            href={`/owner/tenant-eval/${evaluation.id}`}
            className="flex items-center justify-between border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <ScoreBadge score={evaluation.overallScore} size="small" />
              <div>
                <div className="text-xs font-medium text-gray-900">
                  {evaluation.applicantName}
                </div>
                <div className="text-[11px] text-gray-500">
                  {evaluation.propertyAddress} · {evaluation.evaluationDate}
                </div>
              </div>
            </div>
            <span className="text-[11px] text-brand">View →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Build the tenant eval results page**

Create `src/app/(dashboard)/owner/tenant-eval/[id]/page.tsx`:

```tsx
import Link from "next/link";
import { ScoreBadge } from "@/components/score-badge";
import { tenantEvaluations } from "@/lib/mock-data";
import { notFound } from "next/navigation";

export default async function TenantEvalResults({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const evaluation = tenantEvaluations.find((e) => e.id === id);

  if (!evaluation) return notFound();

  const riskStyles = {
    low: "bg-brand-light border-brand-border text-emerald-800",
    medium: "bg-yellow-50 border-yellow-200 text-yellow-800",
    high: "bg-red-50 border-red-200 text-red-800",
  };

  const riskDot = {
    low: "bg-brand",
    medium: "bg-yellow-500",
    high: "bg-red-500",
  };

  const scoreColor = (score: number) =>
    score >= 80 ? "text-brand" : score >= 60 ? "text-yellow-500" : "text-red-500";

  return (
    <>
      {/* Back link */}
      <Link
        href="/owner/tenant-eval"
        className="text-xs text-brand mb-4 inline-block"
      >
        ← Back to evaluations
      </Link>

      {/* Header with score */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {evaluation.applicantName}
          </h1>
          <p className="text-xs text-gray-500">
            Applying for {evaluation.propertyAddress} · Evaluated{" "}
            {evaluation.evaluationDate}
          </p>
        </div>
        <ScoreBadge score={evaluation.overallScore} />
      </div>

      {/* Recommendation badge */}
      <div
        className={`inline-flex items-center gap-1.5 border px-3.5 py-1.5 rounded-md mb-5 ${riskStyles[evaluation.riskLevel]}`}
      >
        <div
          className={`w-2.5 h-2.5 rounded-full ${riskDot[evaluation.riskLevel]}`}
        />
        <span className="text-xs font-medium">{evaluation.recommendation}</span>
      </div>
      <p className="text-[10px] text-gray-400 -mt-3 mb-5">
        This assessment is AI-generated and advisory. You make the final
        decision.
      </p>

      {/* Score Breakdown */}
      <h2 className="text-[13px] font-semibold text-gray-900 mb-2.5">
        Score Breakdown
      </h2>
      <div className="grid grid-cols-4 gap-2.5 mb-5">
        {evaluation.breakdown.map((item) => (
          <div
            key={item.category}
            className="bg-gray-50 border border-gray-200 rounded-lg p-3"
          >
            <div className="text-[10px] text-gray-500">{item.category}</div>
            <div className={`text-lg font-bold ${scoreColor(item.score)}`}>
              {item.score}
            </div>
            <div className="text-[10px] text-gray-500">{item.detail}</div>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      <h2 className="text-[13px] font-semibold text-gray-900 mb-2">
        AI Summary
      </h2>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
        <p className="text-xs text-gray-700 leading-relaxed">
          {evaluation.summary}
        </p>
      </div>

      {/* Evidence */}
      <h2 className="text-[13px] font-semibold text-gray-900 mb-2">
        Evidence
      </h2>
      <div className="mb-5">
        {evaluation.evidence.map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0"
          >
            <span className="text-[11px] text-gray-500">
              {item.type === "file" ? "📄" : "🔗"}
            </span>
            <span className="text-xs text-blue-600 cursor-pointer">
              {item.name}
            </span>
            <span className="text-[10px] text-gray-500">
              — {item.description}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <button className="bg-brand text-white px-5 py-2 rounded-md text-[13px] font-medium">
          Approve Tenant
        </button>
        <button className="bg-red-50 text-red-600 px-5 py-2 rounded-md text-[13px] font-medium">
          Decline
        </button>
        <button className="bg-gray-100 text-gray-700 px-5 py-2 rounded-md text-[13px]">
          Ask Agent for Help
        </button>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Verify in browser**

Visit `http://localhost:3000/owner/tenant-eval`. Confirm: new evaluation form toggles, file list shows, past evaluations listed.
Click into `eval1`. Confirm: score badge (82), breakdown grid, AI summary, evidence list, action buttons.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/owner/tenant-eval/
git commit -m "feat: build tenant evaluation upload form and results view"
```

---

## Task 10: Owner — Properties, Documents, Settings

**Files:**
- Create: `src/app/(dashboard)/owner/properties/page.tsx`, `src/app/(dashboard)/owner/properties/[id]/page.tsx`, `src/app/(dashboard)/owner/documents/page.tsx`, `src/app/(dashboard)/owner/settings/page.tsx`

- [ ] **Step 1: Build Properties list page**

Create `src/app/(dashboard)/owner/properties/page.tsx`:

```tsx
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { ownerProperties } from "@/lib/mock-data";

export default function PropertiesPage() {
  // Group properties by address (for multi-unit)
  const uniqueAddresses = [
    ...new Set(ownerProperties.map((p) => p.address)),
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Properties</h1>
          <p className="text-xs text-gray-500">
            {ownerProperties.length} units across {uniqueAddresses.length}{" "}
            properties
          </p>
        </div>
        <button className="bg-brand text-white px-3.5 py-1.5 rounded-md text-xs font-medium">
          + Add Property
        </button>
      </div>

      <div className="space-y-2">
        {ownerProperties.map((property) => (
          <Link
            key={property.id}
            href={`/owner/properties/${property.id}`}
            className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
          >
            <div>
              <div className="text-sm font-medium text-gray-900">
                {property.address}
                {property.unit ? `, ${property.unit}` : ""}
              </div>
              <div className="text-[11px] text-gray-500">
                {property.beds}bd/{property.baths}ba · {property.city},{" "}
                {property.state}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge variant={property.occupied ? "occupied" : "vacant"}>
                {property.occupied ? "Occupied" : "Vacant"}
              </StatusBadge>
              {property.tenantName && (
                <span className="text-[11px] text-gray-500">
                  {property.tenantName}
                </span>
              )}
              <span className="text-[11px] text-brand">View →</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Build Property detail page**

Create `src/app/(dashboard)/owner/properties/[id]/page.tsx`:

```tsx
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { ownerProperties, ownerDocuments } from "@/lib/mock-data";
import { notFound } from "next/navigation";

export default async function PropertyDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = ownerProperties.find((p) => p.id === id);
  if (!property) return notFound();

  const docs = ownerDocuments.filter((d) => d.propertyId === id);

  return (
    <>
      <Link
        href="/owner/properties"
        className="text-xs text-brand mb-4 inline-block"
      >
        ← Back to properties
      </Link>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {property.address}
            {property.unit ? `, ${property.unit}` : ""}
          </h1>
          <p className="text-xs text-gray-500">
            {property.beds}bd/{property.baths}ba · {property.city},{" "}
            {property.state}
          </p>
        </div>
        <StatusBadge variant={property.occupied ? "occupied" : "vacant"}>
          {property.occupied ? "Occupied" : "Vacant"}
        </StatusBadge>
      </div>

      {property.tenantName && (
        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <h2 className="text-[13px] font-semibold text-gray-900 mb-2">
            Current Tenant
          </h2>
          <div className="text-sm text-gray-700">{property.tenantName}</div>
          <div className="text-[11px] text-gray-500 mt-1">
            Lease: Jan 1, 2026 – Dec 31, 2026
          </div>
        </div>
      )}

      <h2 className="text-[13px] font-semibold text-gray-900 mb-3">
        Documents
      </h2>
      {docs.length > 0 ? (
        <div className="space-y-1.5">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px]">📄</span>
                <div>
                  <div className="text-xs font-medium text-gray-900">
                    {doc.name}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {doc.type} · Uploaded {doc.uploadDate}
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-gray-400">{doc.size}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No documents uploaded yet.</p>
      )}
    </>
  );
}
```

- [ ] **Step 3: Build Documents page**

Create `src/app/(dashboard)/owner/documents/page.tsx`:

```tsx
import { ownerDocuments, ownerProperties } from "@/lib/mock-data";

export default function DocumentsPage() {
  // Group documents by property
  const grouped = ownerProperties.map((property) => ({
    property,
    docs: ownerDocuments.filter((d) => d.propertyId === property.id),
  })).filter((g) => g.docs.length > 0);

  return (
    <>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Documents</h1>
          <p className="text-xs text-gray-500">
            {ownerDocuments.length} documents across your properties
          </p>
        </div>
        <button className="bg-brand text-white px-3.5 py-1.5 rounded-md text-xs font-medium">
          + Upload Document
        </button>
      </div>

      {grouped.map(({ property, docs }) => (
        <div key={property.id} className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            {property.address}
            {property.unit ? `, ${property.unit}` : ""}
          </h2>
          <div className="space-y-1.5">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px]">📄</span>
                  <div>
                    <div className="text-xs font-medium text-gray-900">
                      {doc.name}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {doc.type} · Uploaded {doc.uploadDate}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400">{doc.size}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
```

- [ ] **Step 4: Build Settings page**

Create `src/app/(dashboard)/owner/settings/page.tsx`:

```tsx
export default function SettingsPage() {
  return (
    <>
      <h1 className="text-lg font-semibold text-gray-900 mb-5">Settings</h1>

      {/* Gmail Connection */}
      <div className="border border-gray-200 rounded-lg p-5 mb-4 max-w-[560px]">
        <h2 className="text-[13px] font-semibold text-gray-900 mb-1">
          Gmail Connection
        </h2>
        <p className="text-[11px] text-gray-500 mb-3">
          Connect your Gmail account so the Inbox Agent can monitor your
          property emails.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-brand-light border border-brand-border rounded-md px-3 py-1.5">
            <div className="w-2 h-2 bg-brand rounded-full" />
            <span className="text-xs text-emerald-800 font-medium">
              Connected
            </span>
          </div>
          <span className="text-xs text-gray-500">dana.martinez@gmail.com</span>
        </div>
      </div>

      {/* Gmail Label */}
      <div className="border border-gray-200 rounded-lg p-5 mb-4 max-w-[560px]">
        <h2 className="text-[13px] font-semibold text-gray-900 mb-1">
          Gmail Label
        </h2>
        <p className="text-[11px] text-gray-500 mb-3">
          Which Gmail label should the Inbox Agent monitor? Create this label in
          Gmail and apply it to your property emails.
        </p>
        <input
          type="text"
          defaultValue="PropStealth"
          className="border border-gray-300 rounded-md py-2 px-3 text-xs text-gray-900 w-[240px]"
        />
      </div>

      {/* Notifications */}
      <div className="border border-gray-200 rounded-lg p-5 mb-4 max-w-[560px]">
        <h2 className="text-[13px] font-semibold text-gray-900 mb-1">
          Notifications
        </h2>
        <p className="text-[11px] text-gray-500 mb-3">
          How would you like to be notified about attention items?
        </p>
        <div className="space-y-2">
          {[
            { label: "Email digest (daily)", checked: true },
            { label: "Push notifications", checked: false },
            { label: "SMS alerts for urgent items", checked: false },
          ].map((item) => (
            <label key={item.label} className="flex items-center gap-2">
              <input
                type="checkbox"
                defaultChecked={item.checked}
                className="rounded border-gray-300 text-brand accent-brand"
              />
              <span className="text-xs text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Account */}
      <div className="border border-gray-200 rounded-lg p-5 max-w-[560px]">
        <h2 className="text-[13px] font-semibold text-gray-900 mb-1">
          Account
        </h2>
        <div className="space-y-3 mt-3">
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Name</label>
            <input
              type="text"
              defaultValue="Dana Martinez"
              className="border border-gray-300 rounded-md py-2 px-3 text-xs text-gray-900 w-[240px]"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">
              Email
            </label>
            <input
              type="email"
              defaultValue="dana.martinez@gmail.com"
              className="border border-gray-300 rounded-md py-2 px-3 text-xs text-gray-900 w-[240px]"
              disabled
            />
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 5: Verify in browser**

Visit `/owner/properties` — property list with occupied/vacant badges.
Click a property — detail view with tenant info and documents.
Visit `/owner/documents` — documents grouped by property.
Visit `/owner/settings` — Gmail connection, label config, notifications, account.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(dashboard\)/owner/properties/ src/app/\(dashboard\)/owner/documents/ src/app/\(dashboard\)/owner/settings/
git commit -m "feat: build owner properties, documents, and settings pages"
```

---

## Task 11: Agent — Portfolio Overview

**Files:**
- Modify: `src/app/(dashboard)/agent/page.tsx`
- Create: `src/components/client-card.tsx`

Reference mockup: `.superpowers/brainstorm/30339-1776588305/content/agent-dashboard-v3.html`

- [ ] **Step 1: Create client card component**

Create `src/components/client-card.tsx`:

```tsx
import Link from "next/link";
import { StatusBadge } from "./status-badge";
import { Client } from "@/lib/types";
import { pipelineTenants } from "@/lib/mock-data";

export function ClientCard({ client }: { client: Client }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-2.5">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 ${client.initialsBg} rounded-full flex items-center justify-center text-xs font-semibold ${client.initialsColor}`}
          >
            {client.initials}
          </div>
          <div>
            <div className="text-[13px] font-medium text-gray-900">
              {client.name}
            </div>
            <div className="text-[11px] text-gray-500">
              {client.properties.length} properties ·{" "}
              {client.vacancyCount > 0
                ? `${client.vacancyCount} vacant`
                : "fully occupied"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {client.vacancyCount > 0 ? (
            <StatusBadge variant="vacant">
              {client.vacancyCount} vacancy
            </StatusBadge>
          ) : (
            <StatusBadge variant="all-occupied">All occupied</StatusBadge>
          )}
          <Link
            href={`/agent/clients/${client.id}`}
            className="text-[11px] text-brand"
          >
            View →
          </Link>
        </div>
      </div>

      {/* Property list */}
      {client.properties.length > 0 && (
        <div className="px-4">
          {client.properties.map((property, i) => {
            const pipelineItems = pipelineTenants.filter(
              (t) => t.propertyAddress.startsWith(property.address.split(",")[0])
            );
            const proposed = pipelineItems.filter(
              (t) => t.status === "proposed"
            ).length;
            const evaluating = pipelineItems.filter(
              (t) => t.status === "evaluating"
            ).length;

            return (
              <div
                key={property.id}
                className={`flex justify-between items-center py-2.5 ${
                  i < client.properties.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                <div>
                  <div className="text-xs text-gray-900">
                    {property.address}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {property.beds}bd/{property.baths}ba · {property.city},{" "}
                    {property.state}
                  </div>
                </div>
                <div className="flex gap-1.5 items-center">
                  <StatusBadge
                    variant={property.occupied ? "occupied" : "vacant"}
                  >
                    {property.occupied ? "Occupied" : "Vacant"}
                  </StatusBadge>
                  {proposed > 0 && (
                    <StatusBadge variant="proposed">
                      {proposed} proposed
                    </StatusBadge>
                  )}
                  {evaluating > 0 && (
                    <StatusBadge variant="evaluating">
                      {evaluating} evaluating
                    </StatusBadge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build the Portfolio Overview page**

Replace `src/app/(dashboard)/agent/page.tsx`:

```tsx
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { ClientCard } from "@/components/client-card";
import { agentClients, pipelineTenants } from "@/lib/mock-data";

export default function AgentHome() {
  const totalProperties = agentClients.reduce(
    (sum, c) => sum + c.properties.length,
    0
  );
  const totalOccupied = agentClients.reduce(
    (sum, c) => sum + c.properties.filter((p) => p.occupied).length,
    0
  );
  const totalVacant = totalProperties - totalOccupied;
  const occupancyRate = Math.round((totalOccupied / totalProperties) * 100);

  const evaluating = pipelineTenants.filter(
    (t) => t.status === "evaluating"
  ).length;
  const proposed = pipelineTenants.filter(
    (t) => t.status === "proposed"
  ).length;
  const approved = pipelineTenants.filter(
    (t) => t.status === "approved"
  ).length;

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Portfolio Overview
          </h1>
          <p className="text-xs text-gray-500">Across all clients</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/agent/pipeline"
            className="bg-white border border-gray-300 text-gray-700 px-3.5 py-1.5 rounded-md text-xs font-medium"
          >
            + Evaluate Tenant
          </Link>
          <Link
            href="/agent/invite"
            className="bg-brand text-white px-3.5 py-1.5 rounded-md text-xs font-medium"
          >
            + Invite Client
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard label="Clients" value={agentClients.length} />
        <StatCard label="Properties" value={totalProperties} />
        <StatCard
          label="Occupancy Rate"
          value={`${occupancyRate}%`}
          detail={`${totalOccupied} of ${totalProperties} occupied`}
          variant="success"
        />
        <StatCard
          label="Vacant Units"
          value={totalVacant}
          detail="needs tenants"
          variant="danger"
        />
      </div>

      {/* Tenant Pipeline */}
      <h2 className="text-[13px] font-semibold text-gray-900 mb-2.5">
        Tenant Pipeline
      </h2>
      <div className="grid grid-cols-3 gap-px bg-gray-200 rounded-lg overflow-hidden mb-6">
        {[
          { label: "Evaluating", count: evaluating, color: "text-gray-900" },
          { label: "Proposed", count: proposed, color: "text-amber-600" },
          { label: "Approved", count: approved, color: "text-brand" },
        ].map((stage) => (
          <div key={stage.label} className="bg-white p-3.5 text-center">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">
              {stage.label}
            </div>
            <div className={`text-xl font-bold mt-0.5 ${stage.color}`}>
              {stage.count}
            </div>
          </div>
        ))}
      </div>

      {/* Clients */}
      <h2 className="text-[13px] font-semibold text-gray-900 mb-2.5">
        Clients
      </h2>
      {agentClients.map((client) => (
        <ClientCard key={client.id} client={client} />
      ))}
    </>
  );
}
```

- [ ] **Step 3: Verify in browser**

Visit `http://localhost:3000/agent`. Confirm: 4 stat cards, tenant pipeline funnel, client cards with property details and status badges.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/agent/page.tsx src/components/client-card.tsx
git commit -m "feat: build agent portfolio overview with stats, pipeline, and client cards"
```

---

## Task 12: Agent — Client Detail, Pipeline, Help Requests, Invite

**Files:**
- Create: `src/app/(dashboard)/agent/clients/[id]/page.tsx`, `src/app/(dashboard)/agent/pipeline/page.tsx`, `src/app/(dashboard)/agent/help-requests/page.tsx`, `src/app/(dashboard)/agent/invite/page.tsx`

- [ ] **Step 1: Build Client Detail page**

Create `src/app/(dashboard)/agent/clients/[id]/page.tsx`:

```tsx
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { agentClients, pipelineTenants } from "@/lib/mock-data";
import { notFound } from "next/navigation";

export default async function ClientDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = agentClients.find((c) => c.id === id);
  if (!client) return notFound();

  const clientTenants = pipelineTenants.filter(
    (t) => t.clientName === client.name
  );

  return (
    <>
      <Link href="/agent" className="text-xs text-brand mb-4 inline-block">
        ← Back to dashboard
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div
          className={`w-10 h-10 ${client.initialsBg} rounded-full flex items-center justify-center text-sm font-semibold ${client.initialsColor}`}
        >
          {client.initials}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {client.name}
          </h1>
          <p className="text-xs text-gray-500">
            {client.properties.length} properties ·{" "}
            {client.vacancyCount > 0
              ? `${client.vacancyCount} vacant`
              : "fully occupied"}
          </p>
        </div>
      </div>

      {/* Properties */}
      <h2 className="text-[13px] font-semibold text-gray-900 mb-3">
        Properties
      </h2>
      <div className="space-y-2 mb-6">
        {client.properties.map((property) => (
          <div
            key={property.id}
            className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
          >
            <div>
              <div className="text-xs font-medium text-gray-900">
                {property.address}
              </div>
              <div className="text-[10px] text-gray-500">
                {property.beds}bd/{property.baths}ba · {property.city},{" "}
                {property.state}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge variant={property.occupied ? "occupied" : "vacant"}>
                {property.occupied ? "Occupied" : "Vacant"}
              </StatusBadge>
              {!property.occupied && (
                <Link
                  href="/agent/pipeline"
                  className="text-[10px] text-brand"
                >
                  Find tenant →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tenant activity */}
      {clientTenants.length > 0 && (
        <>
          <h2 className="text-[13px] font-semibold text-gray-900 mb-3">
            Tenant Pipeline
          </h2>
          <div className="space-y-2">
            {clientTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
              >
                <div>
                  <div className="text-xs font-medium text-gray-900">
                    {tenant.applicantName}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {tenant.propertyAddress} · Score: {tenant.overallScore}
                  </div>
                </div>
                <StatusBadge
                  variant={
                    tenant.status === "proposed"
                      ? "proposed"
                      : tenant.status === "approved"
                        ? "approved"
                        : "evaluating"
                  }
                >
                  {tenant.status.charAt(0).toUpperCase() +
                    tenant.status.slice(1)}
                </StatusBadge>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
```

- [ ] **Step 2: Build Tenant Pipeline page**

Create `src/app/(dashboard)/agent/pipeline/page.tsx`:

```tsx
import { ScoreBadge } from "@/components/score-badge";
import { StatusBadge } from "@/components/status-badge";
import { pipelineTenants } from "@/lib/mock-data";

export default function PipelinePage() {
  const stages = [
    { key: "evaluating" as const, label: "Evaluating" },
    { key: "proposed" as const, label: "Proposed" },
    { key: "approved" as const, label: "Approved" },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Tenant Pipeline
          </h1>
          <p className="text-xs text-gray-500">
            All tenants being evaluated, proposed, or approved
          </p>
        </div>
        <button className="bg-brand text-white px-3.5 py-1.5 rounded-md text-xs font-medium">
          + New Evaluation
        </button>
      </div>

      {stages.map((stage) => {
        const tenants = pipelineTenants.filter(
          (t) => t.status === stage.key
        );
        if (tenants.length === 0) return null;

        return (
          <div key={stage.key} className="mb-6">
            <h2 className="text-[13px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
              {stage.label}
              <span className="text-[10px] text-gray-400 font-normal">
                {tenants.length}
              </span>
            </h2>
            <div className="space-y-2">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <ScoreBadge score={tenant.overallScore} size="small" />
                    <div>
                      <div className="text-xs font-medium text-gray-900">
                        {tenant.applicantName}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {tenant.propertyAddress} · {tenant.clientName} ·{" "}
                        {tenant.evaluationDate}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {stage.key === "evaluating" && (
                      <button className="bg-brand text-white px-2.5 py-1 rounded-[5px] text-[11px]">
                        Propose
                      </button>
                    )}
                    <button className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-[5px] text-[11px]">
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
```

- [ ] **Step 3: Build Help Requests page**

Create `src/app/(dashboard)/agent/help-requests/page.tsx`:

```tsx
import { helpRequests } from "@/lib/mock-data";

export default function HelpRequestsPage() {
  return (
    <>
      <h1 className="text-lg font-semibold text-gray-900 mb-1">
        Help Requests
      </h1>
      <p className="text-xs text-gray-500 mb-5">
        Client-initiated requests for your help
      </p>

      <div className="space-y-2">
        {helpRequests.map((request) => (
          <div
            key={request.id}
            className="border border-gray-200 rounded-lg p-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                  {request.clientInitials}
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-900">
                    {request.clientName}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {request.propertyAddress} · {request.timestamp}
                  </div>
                </div>
              </div>
              <button className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-[5px] text-[11px]">
                View
              </button>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed ml-[42px]">
              {request.message}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 4: Build Invite Client page**

Create `src/app/(dashboard)/agent/invite/page.tsx`:

```tsx
export default function InviteClientPage() {
  return (
    <>
      <h1 className="text-lg font-semibold text-gray-900 mb-1">
        Invite Client
      </h1>
      <p className="text-xs text-gray-500 mb-5">
        Send an invitation to a property owner to join PropStealth as your
        client.
      </p>

      <div className="border border-gray-200 rounded-lg p-5 max-w-[480px]">
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Client Name
          </label>
          <input
            type="text"
            placeholder="Full name"
            className="w-full border border-gray-300 rounded-md py-2 px-3 text-[13px] text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Email Address
          </label>
          <input
            type="email"
            placeholder="client@example.com"
            className="w-full border border-gray-300 rounded-md py-2 px-3 text-[13px] text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <div className="mb-5">
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Personal Message (optional)
          </label>
          <textarea
            placeholder="Add a personal note to the invitation..."
            rows={3}
            className="w-full border border-gray-300 rounded-md py-2 px-3 text-[13px] text-gray-900 placeholder:text-gray-400 resize-none"
          />
        </div>
        <button className="bg-brand text-white px-5 py-2 rounded-md text-[13px] font-medium">
          Send Invitation
        </button>
        <p className="text-[10px] text-gray-400 mt-2">
          Your client will receive an email with a link to sign up as a Property
          Owner on PropStealth.
        </p>
      </div>
    </>
  );
}
```

- [ ] **Step 5: Verify all agent pages in browser**

Visit `/agent/clients/c1` — Dana Martinez detail page with properties and pipeline.
Visit `/agent/pipeline` — tenant pipeline grouped by stage.
Visit `/agent/help-requests` — two help requests from clients.
Visit `/agent/invite` — invitation form.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(dashboard\)/agent/
git commit -m "feat: build agent client detail, pipeline, help requests, and invite pages"
```

---

## Task 13: Final Polish and Verification

**Files:**
- Possibly modify any files where visual issues are found

- [ ] **Step 1: Run type check**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
npx tsc --noEmit
```

Fix any type errors that surface.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Fix any linting issues.

- [ ] **Step 3: Full browser walkthrough**

Open the dev server and walk through every page:

1. `http://localhost:3000` — Homepage (landing page)
2. `http://localhost:3000/login` — Login with role toggle
3. `http://localhost:3000/owner` — Owner Activity Feed
4. `http://localhost:3000/owner/inbox` — Inbox Agent
5. `http://localhost:3000/owner/tenant-eval` — Tenant Eval list
6. `http://localhost:3000/owner/tenant-eval/eval1` — Eval results
7. `http://localhost:3000/owner/properties` — Properties list
8. `http://localhost:3000/owner/properties/p1` — Property detail
9. `http://localhost:3000/owner/documents` — Documents
10. `http://localhost:3000/owner/settings` — Settings
11. `http://localhost:3000/agent` — Agent Portfolio Overview
12. `http://localhost:3000/agent/clients/c1` — Client detail
13. `http://localhost:3000/agent/pipeline` — Tenant Pipeline
14. `http://localhost:3000/agent/help-requests` — Help Requests
15. `http://localhost:3000/agent/invite` — Invite Client

For each page, confirm: layout renders correctly, sidebar navigation highlights the active page, content matches the approved mockups.

- [ ] **Step 4: Fix any visual issues found during walkthrough**

Address any spacing, color, or layout issues.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "fix: polish UI and resolve type/lint issues"
```
