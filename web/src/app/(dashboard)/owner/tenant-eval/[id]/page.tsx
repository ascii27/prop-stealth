"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ScoreBadge } from "@/components/score-badge";

interface ScoreBreakdown {
  category: string;
  score: number;
  detail: string;
}

interface EvidenceItem {
  name: string;
  description: string;
  type: "file" | "link";
}

interface Evaluation {
  id: string;
  applicant_name: string;
  property_address: string;
  overall_score: number;
  risk_level: "low" | "medium" | "high";
  recommendation: string;
  summary: string;
  breakdown: ScoreBreakdown[];
  evidence: EvidenceItem[];
  status: string;
  created_at: string;
}

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

export default function TenantEvalResults() {
  const params = useParams();
  const id = params.id as string;

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/evaluations/${id}`, { credentials: "include" })
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        if (data) setEvaluation(data.evaluation);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(status: "approved" | "declined") {
    setUpdating(true);
    try {
      const res = await fetch(`/api/evaluations/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluation(data.evaluation);
      }
    } catch (err) {
      console.error("Status update failed:", err);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return <p className="text-xs text-gray-400 p-5">Loading...</p>;
  }

  if (notFound || !evaluation) {
    return (
      <div>
        <Link href="/owner/tenant-eval" className="text-xs text-brand inline-block mb-4">
          &larr; Back to evaluations
        </Link>
        <p className="text-sm text-gray-500">Evaluation not found.</p>
      </div>
    );
  }

  const risk = riskStyles[evaluation.risk_level];
  const recommendationLabel =
    evaluation.risk_level === "low"
      ? "Low Risk — Recommended"
      : evaluation.risk_level === "medium"
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
            {evaluation.applicant_name}
          </h1>
          <p className="text-xs text-gray-500">
            Applying for {evaluation.property_address} &middot; Evaluated{" "}
            {new Date(evaluation.created_at).toLocaleDateString()}
          </p>
        </div>
        <ScoreBadge score={evaluation.overall_score} size="large" />
      </div>

      {/* Recommendation Badge */}
      <div className="mb-5">
        <span
          className={`inline-flex items-center gap-1.5 border px-3.5 py-1.5 rounded-md ${risk.container}`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${risk.dot}`} />
          <span className="text-xs font-medium">{recommendationLabel}</span>
        </span>
        {evaluation.status === "approved" && (
          <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-brand-light text-brand font-medium">
            Approved
          </span>
        )}
        {evaluation.status === "declined" && (
          <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-600 font-medium">
            Declined
          </span>
        )}
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
              {item.type === "file" ? "\u{1F4C4}" : "\u{1F517}"}
            </span>
            <span className="text-xs text-blue-600 cursor-pointer">{item.name}</span>
            <span className="text-[10px] text-gray-500">— {item.description}</span>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      {evaluation.status === "complete" && (
        <div className="flex gap-2 pt-3 border-t border-gray-200">
          <button
            onClick={() => updateStatus("approved")}
            disabled={updating}
            className="bg-brand text-white px-5 py-2 rounded-md text-[13px] font-medium disabled:opacity-50"
          >
            Approve Tenant
          </button>
          <button
            onClick={() => updateStatus("declined")}
            disabled={updating}
            className="bg-red-50 text-red-600 px-5 py-2 rounded-md text-[13px] font-medium disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}
