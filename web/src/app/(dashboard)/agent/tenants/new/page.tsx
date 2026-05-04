"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ClientWithProperties {
  id: string;
  name: string | null;
  email: string;
  properties: { id: string; address: string; city: string; state: string }[];
}

export default function AgentNewTenantPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientWithProperties[] | null>(null);
  const [clientId, setClientId] = useState<string>("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [applicantName, setApplicantName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setClients(data.clients || []));
  }, []);

  const selected = clients?.find((c) => c.id === clientId);
  const properties = selected?.properties || [];

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!propertyId) {
      setError("Pick a property");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const r = await fetch("/api/tenants", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          applicant_name: applicantName || null,
        }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create tenant");
      }
      const data = await r.json();
      router.push(`/agent/tenants/${data.tenant.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-[560px] space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">New tenant</h1>

      <form onSubmit={onCreate} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Client
          </label>
          <select
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setPropertyId("");
            }}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
          >
            <option value="">Select a client…</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Property
          </label>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            required
            disabled={!clientId}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs disabled:opacity-50"
          >
            <option value="">Select a property…</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address}, {p.city}, {p.state}
              </option>
            ))}
          </select>
          {clientId && properties.length === 0 && (
            <p className="text-[11px] text-gray-500 mt-1">
              This client has no properties yet. Add one first.
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Applicant name (optional — AI can extract from docs later)
          </label>
          <input
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={creating}
          className="bg-brand text-white px-4 py-2 rounded-md text-xs font-medium disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create draft"}
        </button>
      </form>

      <p className="text-[11px] text-gray-500">
        After creating the draft you&rsquo;ll upload documents, run AI
        extraction, review, and run the full evaluation — all on the next page.
      </p>
    </div>
  );
}
