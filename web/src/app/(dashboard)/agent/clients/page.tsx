"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ClientRow {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  client_since: string;
  properties: { id: string }[];
}

interface PendingInvite {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export default function AgentClientsPage() {
  const [clients, setClients] = useState<ClientRow[] | null>(null);
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load clients");
        const data = await r.json();
        setClients(data.clients);
        setPending(data.pendingInvitations || []);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  async function cancelInvite(id: string) {
    if (!confirm("Cancel this invitation?")) return;
    setBusyId(id);
    setError(null);
    try {
      const r = await fetch(`/api/clients/invitations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to cancel invitation");
      setPending((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Clients</h1>
          <p className="text-xs text-gray-500">Owners you manage and pending invites.</p>
        </div>
        <Link
          href="/agent/invite"
          className="bg-brand text-white px-3.5 py-1.5 rounded-md text-xs font-medium"
        >
          + Invite Client
        </Link>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <section className="mb-6">
        <h2 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Clients</h2>
        {!clients && <p className="text-sm text-gray-500">Loading…</p>}
        {clients && clients.length === 0 && (
          <p className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg p-4">
            No clients yet. Invite an owner to get started.
          </p>
        )}
        {clients && clients.length > 0 && (
          <ul className="space-y-2">
            {clients.map((c) => (
              <li
                key={c.id}
                className="border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Link
                  href={`/agent/clients/${c.id}`}
                  className="flex items-center justify-between p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {c.name || c.email}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {c.email} · client since{" "}
                      {new Date(c.client_since).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {c.properties.length}{" "}
                    {c.properties.length === 1 ? "property" : "properties"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-wide text-gray-500 mb-2">
          Pending invites
        </h2>
        {pending.length === 0 && (
          <p className="text-xs text-gray-400">No pending invites.</p>
        )}
        {pending.length > 0 && (
          <ul className="space-y-2">
            {pending.map((inv) => (
              <li
                key={inv.id}
                className="border border-gray-200 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{inv.name}</p>
                  <p className="text-[11px] text-gray-500">
                    {inv.email} · invited{" "}
                    {new Date(inv.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => cancelInvite(inv.id)}
                  disabled={busyId === inv.id}
                  className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {busyId === inv.id ? "Canceling…" : "Cancel"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
