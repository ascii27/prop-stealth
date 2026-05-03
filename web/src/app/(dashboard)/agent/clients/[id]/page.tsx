"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { Property } from "@/lib/types";

interface ClientDetail {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  properties: Property[];
}

export default function AgentClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    fetch(`/api/clients/${params.id}`, { credentials: "include" })
      .then(async (r) => {
        if (r.status === 404) throw new Error("Client not found");
        if (!r.ok) throw new Error("Failed to load client");
        const data = await r.json();
        setClient(data.client);
      })
      .catch((e) => setError((e as Error).message));
  }, [params.id]);

  async function onRemove() {
    if (!client) return;
    const label = client.name || client.email;
    if (
      !confirm(
        `Remove ${label} as a client? Their account and properties stay; you'll lose access until they're re-invited.`,
      )
    ) {
      return;
    }
    setRemoving(true);
    setError(null);
    try {
      const r = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to remove client");
      router.push("/agent/clients");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setRemoving(false);
    }
  }

  if (error && !client) {
    return (
      <div>
        <Link
          href="/agent/clients"
          className="text-xs text-brand inline-block mb-4"
        >
          ← Back to clients
        </Link>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }
  if (!client) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <Link
        href="/agent/clients"
        className="text-xs text-brand inline-block mb-4"
      >
        ← Back to clients
      </Link>

      <div className="flex items-center gap-3 mb-6">
        {client.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={client.avatar_url}
            alt=""
            className="w-10 h-10 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-brand text-white text-sm flex items-center justify-center font-medium">
            {(client.name || client.email).charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {client.name || client.email}
          </h1>
          <p className="text-xs text-gray-500">{client.email}</p>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Properties</h2>
        {client.properties.length === 0 ? (
          <p className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg p-4">
            No properties yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {client.properties.map((p) => (
              <li key={p.id} className="border border-gray-200 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">{p.address}</p>
                <p className="text-[11px] text-gray-500">
                  {p.city}, {p.state} {p.zip || ""} · {p.beds} bd / {p.baths} ba
                  {p.property_type ? ` · ${p.property_type}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="border-t border-gray-200 pt-4 flex justify-end">
        <button
          onClick={onRemove}
          disabled={removing}
          className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {removing ? "Removing…" : "Remove client"}
        </button>
      </div>
    </div>
  );
}
