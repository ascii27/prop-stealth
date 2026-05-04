"use client";

import type { TenantEvaluation, TenantDocument } from "@/lib/types";

const REC_LABEL: Record<string, { label: string; classes: string }> = {
  low_risk: {
    label: "Recommended — Low Risk",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  review: {
    label: "Review Carefully",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  high_risk: {
    label: "High Risk",
    classes: "bg-red-50 text-red-700 border-red-200",
  },
};

export function EvalSummary({
  evaluation,
  documents,
}: {
  evaluation: TenantEvaluation | null;
  documents: TenantDocument[];
}) {
  if (!evaluation) {
    return <p className="text-sm text-gray-500">No evaluation yet.</p>;
  }
  if (evaluation.status === "running") {
    return (
      <p className="text-sm text-gray-500">
        Evaluation running… this can take 10–30 seconds.
      </p>
    );
  }
  if (evaluation.status === "failed") {
    return (
      <div className="border border-red-200 bg-red-50 rounded p-3">
        <p className="text-sm text-red-700 font-medium">Evaluation failed</p>
        <p className="text-xs text-red-600 mt-1">{evaluation.error}</p>
      </div>
    );
  }

  const docMap = new Map(documents.map((d) => [d.id, d]));
  const rec = evaluation.recommendation
    ? REC_LABEL[evaluation.recommendation]
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold text-gray-900">
          {evaluation.overall_score}
          <span className="text-sm text-gray-400">/100</span>
        </div>
        {rec && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded border ${rec.classes}`}
          >
            {rec.label}
          </span>
        )}
      </div>
      <p className="text-[11px] text-gray-500">
        AI-generated and advisory. The final decision is yours.
      </p>

      {evaluation.category_scores && (
        <div className="grid grid-cols-2 gap-3">
          {(["income", "credit", "history", "identity"] as const).map((k) => {
            const cs = evaluation.category_scores![k];
            return (
              <div key={k} className="border border-gray-200 rounded p-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700 capitalize">
                    {k}
                  </span>
                  <span className="text-xs text-gray-900">{cs.score}</span>
                </div>
                <p className="text-[11px] text-gray-500">{cs.summary}</p>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <h3 className="text-xs font-medium text-gray-700 mb-1">AI Summary</h3>
        <p className="text-sm text-gray-700 whitespace-pre-line">
          {evaluation.summary}
        </p>
      </div>

      {evaluation.concerns.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-700 mb-1">Concerns</h3>
          <ul className="space-y-1">
            {evaluation.concerns.map((c, i) => (
              <li key={i} className="text-xs text-gray-600">
                <span className="text-amber-600">●</span> {c.text}
                {c.source_document_id &&
                  docMap.has(c.source_document_id) && (
                    <span className="text-gray-400">
                      {" "}
                      — {docMap.get(c.source_document_id)!.filename}
                    </span>
                  )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {evaluation.verified_facts.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-700 mb-1">
            Verified facts
          </h3>
          <ul className="space-y-1">
            {evaluation.verified_facts.map((c, i) => (
              <li key={i} className="text-xs text-gray-600">
                <span className="text-emerald-600">●</span> {c.text}
                {c.source_document_id &&
                  docMap.has(c.source_document_id) && (
                    <span className="text-gray-400">
                      {" "}
                      — {docMap.get(c.source_document_id)!.filename}
                    </span>
                  )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
