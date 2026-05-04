"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ClientRow {
  id: string;
  email: string;
  name: string | null;
  properties: { id: string }[];
}

interface PendingInvite {
  id: string;
  email: string;
  name: string;
}

export default function AgentDashboardPage() {
  const [clients, setClients] = useState<ClientRow[] | null>(null);
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [tenantCounts, setTenantCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/clients", { credentials: "include" })
      .then((r) => r.json())
      .then(async (data) => {
        const list: ClientRow[] = data.clients || [];
        setClients(list);
        setPending(data.pendingInvitations || []);

        const counts: Record<string, number> = {};
        await Promise.all(
          list.map(async (c) => {
            const tr = await fetch(
              `/api/tenants?owner_id=${c.id}&status=shared`,
              { credentials: "include" },
            ).then((r) => r.json());
            counts[c.id] = (tr.tenants || []).length;
          }),
        );
        setTenantCounts(counts);
      });
  }, []);

  if (!clients) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-baseline">
        <h1 className="text-lg font-semibold text-gray-900">Clients</h1>
        <Link
          href="/agent/invite"
          className="bg-brand text-white text-xs font-medium px-3 py-1.5 rounded"
        >
          + Invite client
        </Link>
      </div>

      {clients.length === 0 && pending.length === 0 && (
        <p className="text-sm text-gray-500">
          No clients yet. Invite your first one.
        </p>
      )}

      <ul className="space-y-2">
        {clients.map((c) => (
          <li
            key={c.id}
            className="border border-gray-200 rounded p-3 hover:bg-gray-50"
          >
            <Link href={`/agent/clients/${c.id}`} className="block">
              <div className="flex justify-between">
                <p className="text-sm font-medium text-gray-900">
                  {c.name || c.email}
                </p>
                <p className="text-xs text-gray-500">
                  {c.properties.length}{" "}
                  {c.properties.length === 1 ? "property" : "properties"}
                  {tenantCounts[c.id] > 0 && (
                    <span className="ml-2 text-amber-600">
                      · {tenantCounts[c.id]} awaiting review
                    </span>
                  )}
                </p>
              </div>
            </Link>
          </li>
        ))}
        {pending.map((p) => (
          <li
            key={p.id}
            className="border border-gray-200 rounded p-3 italic text-gray-400"
          >
            <p className="text-sm">
              {p.name} <span className="text-xs">— invite pending</span>
            </p>
            <p className="text-xs">{p.email}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
