import Link from "next/link";
import { notFound } from "next/navigation";
import { tenantEvaluations } from "@/lib/mock-data";
import { ScoreBadge } from "@/components/score-badge";

export default async function TenantEvalResults({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const evaluation = tenantEvaluations.find((e) => e.id === id);

  if (!evaluation) {
    notFound();
  }

  // Recommendation badge styles by risk level
  const riskStyles = {
    low: {
      container: "bg-brand-light border-brand-border text-emerald-800",
      dot: "bg-brand",
    },
    medium: {
      container: "bg-yellow-50 border-yellow-200 text-yellow-800",
      dot: "bg-yellow-500",
    },
    high: {
      container: "bg-red-50 border-red-200 text-red-800",
      dot: "bg-red-500",
    },
  };

  const risk = riskStyles[evaluation.riskLevel];

  const recommendationLabel =
    evaluation.riskLevel === "low"
      ? "Low Risk — Recommended"
      : evaluation.riskLevel === "medium"
      ? "Medium Risk — Review Recommended"
      : "High Risk — Not Recommended";

  return (
    <div>
      {/* Back Link */}
      <Link
        href="/owner/tenant-eval"
        className="text-xs text-brand mb-4 inline-block"
      >
        &larr; Back to evaluations
      </Link>

      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {evaluation.applicantName}
          </h1>
          <p className="text-xs text-gray-500">
            Applying for {evaluation.propertyAddress} &middot; Evaluated{" "}
            {evaluation.evaluationDate}
          </p>
        </div>
        <ScoreBadge score={evaluation.overallScore} size="large" />
      </div>

      {/* Recommendation Badge */}
      <div className="mb-5">
        <span
          className={`inline-flex items-center gap-1.5 border px-3.5 py-1.5 rounded-md ${risk.container}`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${risk.dot}`} />
          <span className="text-xs font-medium">{recommendationLabel}</span>
        </span>
        <p className="text-[10px] text-gray-400 mt-1.5">
          This assessment is AI-generated and advisory. You make the final decision.
        </p>
      </div>

      {/* Score Breakdown */}
      <h2 className="text-[13px] font-semibold text-gray-900 mb-2.5">
        Score Breakdown
      </h2>
      <div className="grid grid-cols-4 gap-2.5 mb-5">
        {evaluation.breakdown.map((item) => {
          const scoreColor =
            item.score >= 80
              ? "text-brand"
              : item.score >= 60
              ? "text-yellow-500"
              : "text-red-500";

          return (
            <div
              key={item.category}
              className="bg-gray-50 border border-gray-200 rounded-lg p-3"
            >
              <p className="text-[10px] text-gray-500 mb-1">{item.category}</p>
              <p className={`text-lg font-bold ${scoreColor}`}>{item.score}</p>
              <p className="text-[10px] text-gray-500 mt-1">{item.detail}</p>
            </div>
          );
        })}
      </div>

      {/* AI Summary */}
      <h2 className="text-[13px] font-semibold text-gray-900 mb-2.5">
        AI Summary
      </h2>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
        <p className="text-xs text-gray-700 leading-relaxed">{evaluation.summary}</p>
      </div>

      {/* Evidence */}
      <h2 className="text-[13px] font-semibold text-gray-900 mb-2.5">
        Evidence
      </h2>
      <div className="border border-gray-200 rounded-lg mb-5 divide-y divide-gray-100">
        {evaluation.evidence.map((item) => (
          <div key={item.name} className="flex items-center gap-2 px-3 py-2">
            <span className="text-[11px] text-gray-500">
              {item.type === "file" ? "📄" : "🔗"}
            </span>
            <span className="text-xs text-blue-600 cursor-pointer">{item.name}</span>
            <span className="text-[10px] text-gray-500">— {item.description}</span>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
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
    </div>
  );
}
