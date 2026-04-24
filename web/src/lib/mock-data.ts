import type {
  Property,
  Email,
  PropertyGroup,
  AttentionItem,
  TimelineGroup,
  TenantEvaluation,
  Client,
  HelpRequest,
  Document,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Owner Properties
// ---------------------------------------------------------------------------

export const ownerProperties: Property[] = [
  {
    id: "prop-1",
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
    id: "prop-2",
    address: "742 Evergreen Terr",
    city: "Tampa",
    state: "FL",
    beds: 2,
    baths: 1,
    unit: "Unit 2",
    occupied: false,
  },
  {
    id: "prop-3",
    address: "1500 Bay Shore Dr",
    city: "Clearwater",
    state: "FL",
    beds: 4,
    baths: 3,
    occupied: true,
    tenantName: "Lisa Park",
  },
];

// ---------------------------------------------------------------------------
// Attention Items
// ---------------------------------------------------------------------------

export const attentionItems: AttentionItem[] = [
  {
    id: "attn-1",
    title: "Tenant proposal from Priya",
    detail: "Sarah Chen for Unit 2 — Score 82/100",
    type: "proposal",
    tag: "Your Agent",
    tagColor: "blue",
    linkText: "Review proposal",
  },
  {
    id: "attn-2",
    title: "HOA violation notice deadline May 3",
    detail: "742 Evergreen Terr — landscaping violation requires response",
    type: "hoa",
    tag: "HOA",
    tagColor: "amber",
    linkText: "View notice",
  },
  {
    id: "attn-3",
    title: "Tenant requesting early lease renewal",
    detail: "John Rivera — 742 Evergreen Terr, Unit 1",
    type: "tenant-request",
    tag: "Tenant",
    tagColor: "amber",
    linkText: "View request",
  },
];

// ---------------------------------------------------------------------------
// Timeline Groups
// ---------------------------------------------------------------------------

export const timelineGroups: TimelineGroup[] = [
  {
    label: "Today",
    entries: [
      {
        id: "tl-1",
        title: "Inbox processed 4 emails",
        detail: "742 Evergreen Terr: 3 items • 1500 Bay Shore Dr: 1 item",
        timestamp: "9:14 AM",
        isToday: true,
      },
      {
        id: "tl-2",
        title: "FPL bill — $142.30",
        detail: "742 Evergreen Terr, Unit 2 — due Apr 28",
        timestamp: "9:14 AM",
        isToday: true,
      },
      {
        id: "tl-3",
        title: "Tax assessment filed",
        detail: "1500 Bay Shore Dr — assessed value $485,000",
        timestamp: "9:14 AM",
        isToday: true,
      },
    ],
  },
  {
    label: "Yesterday",
    entries: [
      {
        id: "tl-4",
        title: "Tenant eval completed — Sarah Chen 82/100",
        detail: "742 Evergreen Terr, Unit 2 — Low risk, recommended",
        timestamp: "Apr 18",
        isToday: false,
      },
      {
        id: "tl-5",
        title: "Inbox processed 1 email",
        detail: "1500 Bay Shore Dr: 1 item",
        timestamp: "Apr 18",
        isToday: false,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Inbox Emails
// ---------------------------------------------------------------------------

export const ownerInboxEmails: Email[] = [
  // 742 Evergreen Terr
  {
    id: "email-1",
    sender: "John Rivera",
    propertyId: "prop-1",
    unit: "Unit 1",
    theme: "tenant",
    timestamp: "8:47 AM",
    keyPoints:
      "Requesting early lease renewal and asking about adding a dog to the unit.",
    fullContent:
      "Hi, I wanted to reach out about renewing my lease early — I love the place and want to stay long-term. I also wanted to ask if pets are allowed. I have a small dog, a beagle mix, very well-behaved. Please let me know what the process looks like. Thanks, John.",
    showAutoRespond: true,
  },
  {
    id: "email-2",
    sender: "Maria Santos",
    propertyId: "prop-1",
    unit: "Unit 2",
    theme: "tenant",
    timestamp: "7:23 AM",
    keyPoints: "Reporting a slow drain in the bathroom sink.",
    fullContent:
      "Good morning! Just wanted to flag that the bathroom sink has been draining very slowly for the past week. I tried using a drain cleaner but it didn't help much. Could you send someone to take a look? Thanks, Maria.",
    showAutoRespond: true,
  },
  {
    id: "email-3",
    sender: "Evergreen HOA Board",
    propertyId: "prop-1",
    theme: "hoa",
    timestamp: "Yesterday",
    keyPoints:
      "Violation notice: overgrown landscaping. Response required by May 3.",
    fullContent:
      "Dear Property Owner, This is an official notice that the property at 742 Evergreen Terrace is in violation of HOA Rule 4.2 regarding landscaping maintenance. The front lawn and hedges have not been maintained to community standards. Please remedy this situation by May 3rd or a fine of $150 will be assessed. Sincerely, Evergreen HOA Board.",
    showAutoRespond: true,
    violationTag: "Violation",
  },
  {
    id: "email-4",
    sender: "FPL",
    propertyId: "prop-2",
    unit: "Unit 2",
    theme: "bill",
    timestamp: "9:01 AM",
    keyPoints: "Electric bill $142.30 due Apr 28.",
    fullContent:
      "Your Florida Power & Light bill for account #8842-001 is ready. Amount due: $142.30. Due date: April 28, 2026. Service address: 742 Evergreen Terrace, Unit 2, Tampa FL. To pay online visit fpl.com/pay or call 1-800-226-3545.",
    showAutoRespond: false,
  },
  // 1500 Bay Shore Dr
  {
    id: "email-5",
    sender: "Pinellas County Tax Collector",
    propertyId: "prop-3",
    theme: "other",
    timestamp: "9:02 AM",
    keyPoints: "Annual tax assessment notice — assessed value $485,000.",
    fullContent:
      "This is your official property tax assessment notice for the 2026 tax year. Property: 1500 Bay Shore Drive, Clearwater, FL. Assessed value: $485,000. Estimated annual tax: $6,248.50. Assessment appeals must be filed by June 15, 2026. Contact the Pinellas County Property Appraiser's office for more information.",
    showAutoRespond: false,
  },
];

export const ownerPropertyGroups: PropertyGroup[] = [
  {
    propertyId: "prop-1",
    address: "742 Evergreen Terr",
    city: "Tampa, FL",
    emails: ownerInboxEmails.filter(
      (e) => e.propertyId === "prop-1" || e.propertyId === "prop-2"
    ),
  },
  {
    propertyId: "prop-3",
    address: "1500 Bay Shore Dr",
    city: "Clearwater, FL",
    emails: ownerInboxEmails.filter((e) => e.propertyId === "prop-3"),
  },
];

// ---------------------------------------------------------------------------
// Tenant Evaluations
// ---------------------------------------------------------------------------

export const tenantEvaluations: TenantEvaluation[] = [
  {
    id: "eval-1",
    applicantName: "Sarah Chen",
    propertyAddress: "742 Evergreen Terr, Unit 2 — Tampa, FL",
    evaluationDate: "Apr 18, 2026",
    overallScore: 82,
    recommendation:
      "Strong candidate. Income and employment are solid; minor rental history gap is low concern given references.",
    riskLevel: "low",
    breakdown: [
      {
        category: "Income Verification",
        score: 90,
        detail:
          "Monthly income of $6,200 is 3.7x the $1,675 monthly rent. Pay stubs verified for past 3 months.",
      },
      {
        category: "Employment Stability",
        score: 85,
        detail:
          "Full-time software developer at Accenture for 2.5 years. Stable employer, no gaps.",
      },
      {
        category: "Rental History",
        score: 72,
        detail:
          "Previous landlord reference positive. 4-month gap between tenancies explained by relocation.",
      },
      {
        category: "Credit Check",
        score: 81,
        detail:
          "Credit score 724. No evictions or collections. Two late payments over 3 years, both resolved.",
      },
    ],
    summary:
      "Sarah Chen presents as a low-risk applicant with strong financials and stable employment. Her income comfortably covers the rent at a 3.7x ratio. The minor rental history gap is explained by a cross-state relocation and does not indicate instability. Credit history shows responsibility with minor past blemishes. Overall recommendation: approve.",
    evidence: [
      {
        name: "pay_stub_march_2026.pdf",
        description: "Pay stub — March 2026",
        type: "file",
      },
      {
        name: "pay_stub_feb_2026.pdf",
        description: "Pay stub — February 2026",
        type: "file",
      },
      {
        name: "rental_application.pdf",
        description: "Signed rental application",
        type: "file",
      },
      {
        name: "credit_report.pdf",
        description: "Credit report — TransUnion",
        type: "file",
      },
      {
        name: "landlord_reference.pdf",
        description: "Previous landlord reference letter",
        type: "file",
      },
    ],
    status: "proposed",
    proposedBy: "Priya",
    clientName: "Dana Martinez",
  },
];

// ---------------------------------------------------------------------------
// Agent Clients
// ---------------------------------------------------------------------------

export const agentClients: Client[] = [
  {
    id: "client-1",
    name: "Dana Martinez",
    initials: "DM",
    initialsColor: "text-blue-700",
    initialsBg: "bg-blue-100",
    vacancyCount: 1,
    properties: [
      {
        id: "c1-prop-1",
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
        id: "c1-prop-2",
        address: "742 Evergreen Terr",
        city: "Tampa",
        state: "FL",
        beds: 2,
        baths: 1,
        unit: "Unit 2",
        occupied: false,
      },
      {
        id: "c1-prop-3",
        address: "1500 Bay Shore Dr",
        city: "Clearwater",
        state: "FL",
        beds: 4,
        baths: 3,
        occupied: true,
        tenantName: "Lisa Park",
      },
    ],
  },
  {
    id: "client-2",
    name: "Robert Kim",
    initials: "RK",
    initialsColor: "text-pink-700",
    initialsBg: "bg-pink-100",
    vacancyCount: 1,
    properties: [
      {
        id: "c2-prop-1",
        address: "3310 Palms Ave",
        city: "St. Petersburg",
        state: "FL",
        beds: 3,
        baths: 2,
        occupied: true,
        tenantName: "Carlos Mendez",
      },
      {
        id: "c2-prop-2",
        address: "3310 Palms Ave",
        city: "St. Petersburg",
        state: "FL",
        beds: 2,
        baths: 1,
        unit: "Unit 3",
        occupied: false,
      },
    ],
  },
  {
    id: "client-3",
    name: "Lisa Torres",
    initials: "LT",
    initialsColor: "text-indigo-700",
    initialsBg: "bg-indigo-100",
    vacancyCount: 0,
    properties: [
      {
        id: "c3-prop-1",
        address: "901 Harbor View Blvd",
        city: "Sarasota",
        state: "FL",
        beds: 3,
        baths: 2,
        occupied: true,
        tenantName: "Angela Wright",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Pipeline Tenants
// ---------------------------------------------------------------------------

export const pipelineTenants: TenantEvaluation[] = [
  {
    id: "pipeline-1",
    applicantName: "Sarah Chen",
    propertyAddress: "742 Evergreen Terr, Unit 2 — Tampa, FL",
    evaluationDate: "Apr 18, 2026",
    overallScore: 82,
    recommendation: "Strong candidate. Recommended.",
    riskLevel: "low",
    breakdown: [],
    summary: "",
    evidence: [],
    status: "proposed",
    proposedBy: "Priya",
    clientName: "Dana Martinez",
  },
  {
    id: "pipeline-2",
    applicantName: "Marcus Johnson",
    propertyAddress: "3310 Palms Ave, Unit 3 — St. Petersburg, FL",
    evaluationDate: "Apr 19, 2026",
    overallScore: 74,
    recommendation: "Moderate risk. Review recommended.",
    riskLevel: "medium",
    breakdown: [],
    summary: "",
    evidence: [],
    status: "evaluating",
    clientName: "Robert Kim",
  },
  {
    id: "pipeline-3",
    applicantName: "Emily Tran",
    propertyAddress: "742 Evergreen Terr, Unit 2 — Tampa, FL",
    evaluationDate: "Apr 17, 2026",
    overallScore: 91,
    recommendation: "Excellent candidate. Highly recommended.",
    riskLevel: "low",
    breakdown: [],
    summary: "",
    evidence: [],
    status: "proposed",
    proposedBy: "Priya",
    clientName: "Dana Martinez",
  },
  {
    id: "pipeline-4",
    applicantName: "David Park",
    propertyAddress: "3310 Palms Ave — St. Petersburg, FL",
    evaluationDate: "Apr 15, 2026",
    overallScore: 88,
    recommendation: "Strong candidate. Approved.",
    riskLevel: "low",
    breakdown: [],
    summary: "",
    evidence: [],
    status: "approved",
    clientName: "Robert Kim",
  },
];

// ---------------------------------------------------------------------------
// Help Requests
// ---------------------------------------------------------------------------

export const helpRequests: HelpRequest[] = [
  {
    id: "help-1",
    clientName: "Dana Martinez",
    clientInitials: "DM",
    message:
      "Hey, quick question — Sarah Chen mentioned she might be a few days late on her first month. Is that something we should flag?",
    timestamp: "10:32 AM",
    propertyAddress: "742 Evergreen Terr, Unit 2",
  },
  {
    id: "help-2",
    clientName: "Robert Kim",
    clientInitials: "RK",
    message:
      "I need help finding tenants for Unit 3. It's been vacant for 6 weeks. Can we speed up the search?",
    timestamp: "Yesterday",
    propertyAddress: "3310 Palms Ave, Unit 3",
  },
];

// ---------------------------------------------------------------------------
// Owner Documents
// ---------------------------------------------------------------------------

export const ownerDocuments: Document[] = [
  {
    id: "doc-1",
    name: "Lease Agreement — John Rivera",
    type: "PDF",
    propertyId: "prop-1",
    uploadDate: "Jan 15, 2026",
    size: "342 KB",
  },
  {
    id: "doc-2",
    name: "HOA Rules & Regulations",
    type: "PDF",
    propertyId: "prop-1",
    uploadDate: "Mar 2, 2026",
    size: "1.2 MB",
  },
  {
    id: "doc-3",
    name: "Homeowners Insurance Policy",
    type: "PDF",
    propertyId: "prop-1",
    uploadDate: "Feb 10, 2026",
    size: "894 KB",
  },
  {
    id: "doc-4",
    name: "Lease Agreement — Lisa Park",
    type: "PDF",
    propertyId: "prop-3",
    uploadDate: "Nov 1, 2025",
    size: "318 KB",
  },
  {
    id: "doc-5",
    name: "Tax Assessment Notice 2026",
    type: "PDF",
    propertyId: "prop-3",
    uploadDate: "Apr 19, 2026",
    size: "156 KB",
  },
];
