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
