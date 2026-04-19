"use client";

import { useState } from "react";
import Link from "next/link";
import { ownerProperties, tenantEvaluations } from "@/lib/mock-data";
import { ScoreBadge } from "@/components/score-badge";

const mockUploadedFiles = [
  { name: "rental_application.pdf", size: "2.1 MB" },
  { name: "pay_stubs_mar_apr.pdf", size: "1.4 MB" },
  { name: "drivers_license.jpg", size: "890 KB" },
];

export default function TenantEvalPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Tenant Evaluation</h1>
          <p className="text-xs text-gray-500">
            Upload applicant documents for AI-powered risk assessment
          </p>
        </div>
        <button
          className="bg-brand text-white px-3.5 py-1.5 rounded-md text-xs font-medium"
          onClick={() => setShowForm((v) => !v)}
        >
          + New Evaluation
        </button>
      </div>

      {/* New Evaluation Form */}
      {showForm && (
        <div className="border border-gray-200 rounded-lg p-5 max-w-[560px] mb-6">
          {/* Applicant Name */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Applicant Name
            </label>
            <input
              type="text"
              placeholder="Enter applicant name"
              className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:ring-1 focus:ring-brand focus:border-brand"
            />
          </div>

          {/* Property */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Property
            </label>
            <select className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-brand focus:border-brand bg-white">
              <option value="">Select a property</option>
              {ownerProperties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.address}
                  {prop.unit ? `, ${prop.unit}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Upload Documents */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Upload Documents
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg py-6 px-4 bg-gray-50 text-center mb-2">
              <p className="text-xs text-gray-600 mb-0.5">
                Drag &amp; drop files or click to browse
              </p>
              <p className="text-[10px] text-gray-400">
                Application form, pay stubs, ID, references, etc.
              </p>
            </div>

            {/* Mock uploaded files */}
            <div className="flex flex-col gap-1.5">
              {mockUploadedFiles.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between px-2.5 py-1.5 bg-gray-50 rounded"
                >
                  <span className="text-xs text-gray-700">{file.name}</span>
                  <span className="text-[10px] text-gray-400">{file.size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-2">
            <Link
              href="/owner/tenant-eval/eval1"
              className="bg-brand text-white px-4 py-1.5 rounded-md text-xs font-medium"
            >
              Run Evaluation
            </Link>
            <button
              className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md text-xs font-medium"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>

          {/* FCRA Note */}
          <p className="text-[10px] text-gray-400 mt-2">
            This evaluation is for informational purposes only. Decisions must comply with the Fair
            Housing Act and FCRA. Do not consider protected class attributes.
          </p>
        </div>
      )}

      {/* Recent Evaluations */}
      <div>
        <h2 className="text-[13px] font-semibold text-gray-900 mb-3">Recent Evaluations</h2>
        <div className="flex flex-col gap-2">
          {tenantEvaluations.map((evaluation) => (
            <Link
              key={evaluation.id}
              href={`/owner/tenant-eval/${evaluation.id}`}
              className="block border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ScoreBadge score={evaluation.overallScore} size="small" />
                  <div>
                    <p className="text-xs font-medium text-gray-900">
                      {evaluation.applicantName}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {evaluation.propertyAddress} &middot; {evaluation.evaluationDate}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">View &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
