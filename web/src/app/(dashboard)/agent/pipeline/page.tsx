import Link from "next/link";
import { pipelineTenants } from "@/lib/mock-data";
import { ScoreBadge } from "@/components/score-badge";

const STAGES = [
  { key: "evaluating" as const, label: "Evaluating" },
  { key: "proposed" as const, label: "Proposed" },
  { key: "approved" as const, label: "Approved" },
];

export default function PipelinePage() {
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Tenant Pipeline
          </h1>
          <p className="text-xs text-gray-500">
            All active tenant evaluations across clients
          </p>
        </div>
        <Link
          href="/agent/pipeline"
          className="bg-brand text-white px-3.5 py-1.5 rounded-md text-xs font-medium"
        >
          + New Evaluation
        </Link>
      </div>

      {/* Stages */}
      <div className="space-y-6">
        {STAGES.map((stage) => {
          const tenants = pipelineTenants.filter(
            (t) => t.status === stage.key
          );
          if (tenants.length === 0) return null;

          return (
            <div key={stage.key}>
              <h2 className="text-[13px] font-semibold text-gray-900 mb-2.5">
                {stage.label}{" "}
                <span className="text-gray-400 font-normal">
                  ({tenants.length})
                </span>
              </h2>
              <div className="space-y-2">
                {tenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="border border-gray-200 rounded-lg p-3 flex justify-between items-center"
                  >
                    {/* Left */}
                    <div className="flex items-center gap-2.5">
                      <ScoreBadge score={tenant.overallScore} size="small" />
                      <div>
                        <p className="text-xs font-medium text-gray-900">
                          {tenant.applicantName}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {tenant.propertyAddress} · {tenant.clientName} ·{" "}
                          {tenant.evaluationDate}
                        </p>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-1.5">
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
      </div>
    </div>
  );
}
