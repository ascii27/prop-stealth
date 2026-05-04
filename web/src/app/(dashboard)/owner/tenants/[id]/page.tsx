"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EvalSummary } from "@/components/eval-summary";
import { TenantThread } from "@/components/tenant-thread";
import type { Tenant, TenantDocument, TenantEvaluation } from "@/lib/types";

export default function OwnerTenantDetailPage() {
  const params = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [documents, setDocuments] = useState<TenantDocument[]>([]);
  const [evaluation, setEvaluation] = useState<TenantEvaluation | null>(null);
  const [tab, setTab] = useState<"docs" | "eval" | "thread">("eval");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadAll() {
    const [t, d, e] = await Promise.all([
      fetch(`/api/tenants/${params.id}`, { credentials: "include" }).then(
        (r) => r.json(),
      ),
      fetch(`/api/tenant-documents/${params.id}`, {
        credentials: "include",
      }).then((r) => r.json()),
      fetch(`/api/tenants/${params.id}/evaluation`, {
        credentials: "include",
      }).then((r) => r.json()),
    ]);
    setTenant(t.tenant);
    setDocuments(d.documents || []);
    setEvaluation(e.evaluation);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function decide(decision: "approved" | "rejected") {
    setBusy(true);
    try {
      const r = await fetch(`/api/tenants/${params.id}/decision`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      await loadAll();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function reopen() {
    setBusy(true);
    try {
      const r = await fetch(`/api/tenants/${params.id}/reopen`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      await loadAll();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
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
          {tenant.status === "shared" && (
            <>
              <button
                onClick={() => decide("approved")}
                disabled={busy}
                className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => decide("rejected")}
                disabled={busy}
                className="text-xs bg-red-600 text-white px-3 py-1.5 rounded disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}
          {(tenant.status === "approved" || tenant.status === "rejected") && (
            <button
              onClick={reopen}
              disabled={busy}
              className="text-xs border border-gray-300 px-3 py-1.5 rounded disabled:opacity-50"
            >
              Reopen
            </button>
          )}
        </div>
      </div>

      {msg && <p className="text-xs text-amber-700">{msg}</p>}

      <div className="border-b border-gray-200">
        <TabBtn
          label="Evaluation"
          active={tab === "eval"}
          onClick={() => setTab("eval")}
        />
        <TabBtn
          label="Documents"
          active={tab === "docs"}
          onClick={() => setTab("docs")}
        />
        <TabBtn
          label="Thread"
          active={tab === "thread"}
          onClick={() => setTab("thread")}
        />
      </div>

      {tab === "eval" && (
        <EvalSummary evaluation={evaluation} documents={documents} />
      )}

      {tab === "docs" && (
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
          {documents.length === 0 && (
            <p className="text-xs text-gray-500">No documents.</p>
          )}
        </ul>
      )}

      {tab === "thread" && <TenantThread tenantId={params.id} canPost={true} />}
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
