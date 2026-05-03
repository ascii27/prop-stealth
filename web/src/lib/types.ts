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
