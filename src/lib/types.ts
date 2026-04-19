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
