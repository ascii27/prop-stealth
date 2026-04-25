"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScoreBadge } from "@/components/score-badge";

interface Property {
  id: string;
  address: string;
  unit: string | null;
}

interface Evaluation {
  id: string;
  applicant_name: string;
  property_address: string;
  overall_score: number | null;
  risk_level: string | null;
  status: string;
  created_at: string;
}

export default function TenantEvalPage() {
  const [showForm, setShowForm] = useState(false);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [evalRes, propRes] = await Promise.all([
        fetch("/api/evaluations", { credentials: "include" }),
        fetch("/api/properties", { credentials: "include" }),
      ]);
      if (evalRes.ok) {
        const data = await evalRes.json();
        setEvaluations(data.evaluations);
      }
      if (propRes.ok) {
        const data = await propRes.json();
        setProperties(data.properties);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

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
        <NewEvaluationForm
          properties={properties}
          onCancel={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            loadData();
          }}
        />
      )}

      {/* Loading */}
      {loading && <p className="text-xs text-gray-400">Loading evaluations...</p>}

      {/* Empty state */}
      {!loading && evaluations.length === 0 && !showForm && (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">No evaluations yet</p>
          <p className="text-xs text-gray-400 mb-4">
            Run your first tenant evaluation to get started
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-brand text-white px-3.5 py-1.5 rounded-md text-xs font-medium"
          >
            + New Evaluation
          </button>
        </div>
      )}

      {/* Recent Evaluations */}
      {evaluations.length > 0 && (
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 mb-3">Recent Evaluations</h2>
          <div className="flex flex-col gap-2">
            {evaluations.map((evaluation) => (
              <Link
                key={evaluation.id}
                href={`/owner/tenant-eval/${evaluation.id}`}
                className="block border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {evaluation.overall_score != null && (
                      <ScoreBadge score={evaluation.overall_score} size="small" />
                    )}
                    <div>
                      <p className="text-xs font-medium text-gray-900">
                        {evaluation.applicant_name}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {evaluation.property_address} &middot;{" "}
                        {new Date(evaluation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {evaluation.status !== "complete" && evaluation.status !== "evaluating" && (
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        evaluation.status === "approved"
                          ? "bg-brand-light text-brand"
                          : "bg-red-50 text-red-600"
                      }`}>
                        {evaluation.status}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">View &rarr;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NewEvaluationForm({
  properties,
  onCancel,
  onCreated,
}: {
  properties: Property[];
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const propertyId = form.get("property_id") as string;
    const selectedProperty = properties.find((p) => p.id === propertyId);
    const propertyAddress = selectedProperty
      ? `${selectedProperty.address}${selectedProperty.unit ? `, ${selectedProperty.unit}` : ""}`
      : (form.get("property_address") as string) || "";

    const body = {
      applicant_name: form.get("applicant_name"),
      property_id: propertyId || null,
      property_address: propertyAddress,
    };

    if (!body.applicant_name || !body.property_address) {
      setError("Applicant name and property are required");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create evaluation");
        return;
      }
      onCreated();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-5 max-w-[560px] mb-6">
      <form onSubmit={handleSubmit}>
        {/* Applicant Name */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Applicant Name
          </label>
          <input
            name="applicant_name"
            type="text"
            required
            placeholder="Enter applicant name"
            className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:ring-1 focus:ring-brand focus:border-brand"
          />
        </div>

        {/* Property */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Property
          </label>
          {properties.length > 0 ? (
            <select
              name="property_id"
              required
              className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-brand focus:border-brand bg-white"
            >
              <option value="">Select a property</option>
              {properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.address}
                  {prop.unit ? `, ${prop.unit}` : ""}
                </option>
              ))}
            </select>
          ) : (
            <input
              name="property_address"
              type="text"
              required
              placeholder="Enter property address"
              className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:ring-1 focus:ring-brand focus:border-brand"
            />
          )}
        </div>

        {/* Upload Documents — placeholder for now */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Upload Documents
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg py-6 px-4 bg-gray-50 text-center">
            <p className="text-xs text-gray-600 mb-0.5">
              Drag &amp; drop files or click to browse
            </p>
            <p className="text-[10px] text-gray-400">
              Application form, pay stubs, ID, references, etc.
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              (File upload coming soon — evaluation uses placeholder AI scoring for MVP)
            </p>
          </div>
        </div>

        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

        {/* Action Buttons */}
        <div className="flex gap-2 mb-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand text-white px-4 py-1.5 rounded-md text-xs font-medium disabled:opacity-50"
          >
            {saving ? "Running..." : "Run Evaluation"}
          </button>
          <button
            type="button"
            className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-md text-xs font-medium"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>

        {/* FCRA Note */}
        <p className="text-[10px] text-gray-400 mt-2">
          This evaluation is for informational purposes only. Decisions must comply with the Fair
          Housing Act and FCRA. Do not consider protected class attributes.
        </p>
      </form>
    </div>
  );
}
