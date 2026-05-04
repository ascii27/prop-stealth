import { describe, it, expect } from "vitest";
import { parseExtractionJson, parseEvaluationJson } from "../src/agents/tenant-eval/parse.js";

describe("parseExtractionJson", () => {
  it("parses well-formed JSON", () => {
    const out = parseExtractionJson(
      '{"applicant_name":"Jane","email":null,"phone":null,"employer":null,"monthly_income":4200,"move_in_date":null}',
    );
    expect(out.applicant_name).toBe("Jane");
    expect(out.monthly_income).toBe(4200);
  });

  it("strips ```json fences", () => {
    const wrapped =
      "```json\n{\"applicant_name\":\"Jane\",\"email\":null,\"phone\":null,\"employer\":null,\"monthly_income\":null,\"move_in_date\":null}\n```";
    const out = parseExtractionJson(wrapped);
    expect(out.applicant_name).toBe("Jane");
  });

  it("throws on malformed JSON", () => {
    expect(() => parseExtractionJson("not json")).toThrow();
  });
});

describe("parseEvaluationJson", () => {
  const valid = JSON.stringify({
    overall_score: 78,
    recommendation: "review",
    category_scores: {
      income: { score: 80, summary: "ok" },
      credit: { score: 70, summary: "ok" },
      history: { score: 85, summary: "ok" },
      identity: { score: 90, summary: "ok" },
    },
    summary: "looks fine",
    concerns: [{ text: "small late payment", source_document_id: "doc-1" }],
    verified_facts: [{ text: "income ok", source_document_id: "doc-2" }],
  });

  it("parses a valid response", () => {
    const out = parseEvaluationJson(valid);
    expect(out.overall_score).toBe(78);
    expect(out.recommendation).toBe("review");
    expect(out.category_scores.income.score).toBe(80);
    expect(out.concerns).toHaveLength(1);
  });

  it("rejects missing categories", () => {
    const broken = JSON.parse(valid);
    delete broken.category_scores.identity;
    expect(() => parseEvaluationJson(JSON.stringify(broken))).toThrow();
  });

  it("rejects unknown recommendation", () => {
    const broken = JSON.parse(valid);
    broken.recommendation = "definitely_yes";
    expect(() => parseEvaluationJson(JSON.stringify(broken))).toThrow();
  });
});
