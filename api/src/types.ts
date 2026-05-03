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
