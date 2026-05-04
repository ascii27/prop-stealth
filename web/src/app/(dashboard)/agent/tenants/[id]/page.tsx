"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DocUpload } from "@/components/doc-upload";
import { EvalSummary } from "@/components/eval-summary";
import { TenantThread } from "@/components/tenant-thread";
import type { Tenant, TenantDocument, TenantEvaluation } from "@/lib/types";

export default function AgentTenantDetailPage() {
  const params = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [documents, setDocuments] = useState<TenantDocument[]>([]);
  const [evaluation, setEvaluation] = useState<TenantEvaluation | null>(null);
  const [tab, setTab] = useState<"docs" | "eval" | "thread">("docs");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadTenant() {
    const r = await fetch(`/api/tenants/${params.id}`, {
      credentials: "include",
    });
    if (r.ok) setTenant((await r.json()).tenant);
  }
  async function loadDocs() {
    const r = await fetch(`/api/tenant-documents/${params.id}`, {
      credentials: "include",
    });
    if (r.ok) setDocuments((await r.json()).documents);
  }
  async function loadEval() {
    const r = await fetch(`/api/tenants/${params.id}/evaluation`, {
      credentials: "include",
    });
    if (r.ok) setEvaluation((await r.json()).evaluation);
  }

  useEffect(() => {
    loadTenant();
    loadDocs();
    loadEval();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Poll while evaluating so the UI updates as soon as it finishes.
  useEffect(() => {
    if (tenant?.status !== "evaluating") return;
    const id = setInterval(() => {
      loadTenant();
      loadEval();
    }, 2000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.status]);

  async function runExtract() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/tenants/${params.id}/extract`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      await loadTenant();
      setMsg("Extracted. Review fields below and run the full evaluation.");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function runEvaluate() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/tenants/${params.id}/evaluate`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      await loadTenant();
      await loadEval();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function shareTenant() {
    setBusy(true);
    try {
      const r = await fetch(`/api/tenants/share`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_ids: [params.id] }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      await loadTenant();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function unshareTenant() {
    setBusy(true);
    try {
      const r = await fetch(`/api/tenants/${params.id}/unshare`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      await loadTenant();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveBasics(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenant) return;
    const f = new FormData(e.currentTarget);
    const body = {
      applicant_name: f.get("applicant_name") || null,
      email: f.get("email") || null,
      phone: f.get("phone") || null,
      employer: f.get("employer") || null,
      monthly_income: f.get("monthly_income")
        ? Number(f.get("monthly_income"))
        : null,
      move_in_date: f.get("move_in_date") || null,
      notes: f.get("notes") || null,
    };
    const r = await fetch(`/api/tenants/${params.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      const data = await r.json();
      setTenant(data.tenant);
    }
  }

  if (!tenant) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {tenant.applicant_name || "(unnamed candidate)"}
          </h1>
          <p className="text-xs text-gray-500">
            Status: <span className="uppercase">{tenant.status}</span>
          </p>
        </div>

        <div className="flex gap-2">
          {tenant.status === "draft" && documents.length > 0 && (
            <button
              onClick={runExtract}
              disabled={busy}
              className="text-xs border border-gray-300 px-3 py-1.5 rounded disabled:opacity-50"
            >
              Run AI extraction
            </button>
          )}
          {(tenant.status === "draft" || tenant.status === "ready") &&
            documents.length > 0 && (
              <button
                onClick={runEvaluate}
                disabled={busy}
                className="text-xs bg-brand text-white px-3 py-1.5 rounded disabled:opacity-50"
              >
                {tenant.status === "ready"
                  ? "Re-run evaluation"
                  : "Run evaluation"}
              </button>
            )}
          {tenant.status === "ready" && (
            <button
              onClick={shareTenant}
              disabled={busy}
              className="text-xs bg-brand text-white px-3 py-1.5 rounded disabled:opacity-50"
            >
              Share with owner
            </button>
          )}
          {tenant.status === "shared" && (
            <button
              onClick={unshareTenant}
              disabled={busy}
              className="text-xs border border-gray-300 px-3 py-1.5 rounded disabled:opacity-50"
            >
              Unshare
            </button>
          )}
        </div>
      </div>

      {msg && <p className="text-xs text-amber-700">{msg}</p>}

      <form
        onSubmit={saveBasics}
        className="border border-gray-200 rounded-lg p-4 space-y-3"
      >
        <h2 className="text-sm font-medium text-gray-900">Basics</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Name"
            name="applicant_name"
            defaultValue={tenant.applicant_name || ""}
          />
          <Field
            label="Email"
            name="email"
            defaultValue={tenant.email || ""}
          />
          <Field
            label="Phone"
            name="phone"
            defaultValue={tenant.phone || ""}
          />
          <Field
            label="Employer"
            name="employer"
            defaultValue={tenant.employer || ""}
          />
          <Field
            label="Monthly income"
            name="monthly_income"
            type="number"
            defaultValue={
              tenant.monthly_income ? String(tenant.monthly_income) : ""
            }
          />
          <Field
            label="Target move-in"
            name="move_in_date"
            type="date"
            defaultValue={tenant.move_in_date || ""}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Notes
          </label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={tenant.notes || ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
          />
        </div>
        <button className="text-xs bg-gray-100 px-3 py-1.5 rounded">
          Save basics
        </button>
      </form>

      <div className="border-b border-gray-200">
        <TabBtn
          label="Documents"
          active={tab === "docs"}
          onClick={() => setTab("docs")}
        />
        <TabBtn
          label="Evaluation"
          active={tab === "eval"}
          onClick={() => setTab("eval")}
        />
        <TabBtn
          label="Thread"
          active={tab === "thread"}
          onClick={() => setTab("thread")}
        />
      </div>

      {tab === "docs" && (
        <div className="space-y-3">
          <DocUpload
            tenantId={params.id}
            onUploaded={(d) => setDocuments((arr) => [...arr, d])}
          />
          <ul className="space-y-1">
            {documents.map((d) => (
              <li
                key={d.id}
                className="text-xs text-gray-700 flex justify-between border border-gray-200 rounded px-3 py-2"
              >
                <span>
                  <span className="text-gray-400 mr-2 uppercase text-[10px]">
                    {d.category}
                  </span>
                  <a
                    href={`/api/tenant-documents/${params.id}/${d.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand"
                  >
                    {d.filename}
                  </a>
                </span>
                <span className="text-gray-400">
                  {(d.size_bytes / 1024).toFixed(0)} KB
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "eval" && (
        <EvalSummary evaluation={evaluation} documents={documents} />
      )}

      {tab === "thread" && <TenantThread tenantId={params.id} canPost={true} />}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
      />
    </div>
  );
}

function TabBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs py-2 px-3 -mb-px border-b-2 ${active ? "border-brand text-brand font-medium" : "border-transparent text-gray-500"}`}
    >
      {label}
    </button>
  );
}
