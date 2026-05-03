# Agent — Clients Management — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-05-03-agent-clients-management-design.md`
**Branch:** `feat/tenant-review-mvp`

Five small changes, three commits.

---

## Step 1 — API endpoints (commit 1)

**File:** `api/src/routes/clients.ts`

Append two endpoints below the existing `GET /invitations/list`. Both use `requireAuth`, both check `role === "agent"` (mirrors the existing endpoints' pattern), both return 404 when nothing was deleted (so we never leak existence of other agents' rows).

```ts
// DELETE /:id — agent removes the agent_clients link with this owner
router.delete("/:id", requireAuth, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "agent") {
      res.status(403).json({ error: "Only agents can remove clients" });
      return;
    }
    const result = await db.query(
      "DELETE FROM agent_clients WHERE agent_id = $1 AND owner_id = $2 RETURNING owner_id",
      [userId, req.params.id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Client not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Remove client error:", err);
    res.status(500).json({ error: "Failed to remove client" });
  }
});

// DELETE /invitations/:id — agent cancels a pending invitation
router.delete("/invitations/:id", requireAuth, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "agent") {
      res.status(403).json({ error: "Only agents can cancel invitations" });
      return;
    }
    const result = await db.query(
      "DELETE FROM invitations WHERE id = $1 AND agent_id = $2 AND status = 'pending' RETURNING id",
      [req.params.id, userId],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Cancel invitation error:", err);
    res.status(500).json({ error: "Failed to cancel invitation" });
  }
});
```

Note: `DELETE /:id` must be registered AFTER `DELETE /invitations/:id` is *not* required — Express matches routes in registration order and `/invitations/:id` doesn't collide with `/:id` once the segments differ in count. But to be safe and match other routes, register the more-specific path first.

Verify: `npm run -w api build` clean.

Commit message:

```
feat(api): DELETE endpoints for agent_clients link and pending invitations
```

---

## Step 2 — Web: list page (commit 2 part)

**Create:** `web/src/app/(dashboard)/agent/clients/page.tsx`

Client component. Fetches `GET /api/clients` once on mount. Renders two sections.

Shape from API:
- `clients[]` — `{ id, email, name, avatar_url, client_since, properties: Property[] }`
- `pendingInvitations[]` — full invitation rows (`id, email, name, message, status, invite_token_expires_at, created_at, ...`)

Sketch:

```tsx
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

  async function load() {
    try {
      const r = await fetch("/api/clients", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load clients");
      const data = await r.json();
      setClients(data.clients);
      setPending(data.pendingInvitations || []);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => { load(); }, []);

  async function cancelInvite(id: string) {
    if (!confirm("Cancel this invitation?")) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/clients/invitations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to cancel");
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

      {/* Accepted clients */}
      <section className="mb-6">
        <h2 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Clients</h2>
        {!clients && <p className="text-sm text-gray-500">Loading…</p>}
        {clients && clients.length === 0 && (
          <p className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg p-4">
            No clients yet. Invite an owner to get started.
          </p>
        )}
        <ul className="space-y-2">
          {clients?.map((c) => (
            <li key={c.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
              <Link href={`/agent/clients/${c.id}`} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.name || c.email}</p>
                  <p className="text-[11px] text-gray-500">
                    {c.email} · client since {new Date(c.client_since).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-[11px] text-gray-500">
                  {c.properties.length} {c.properties.length === 1 ? "property" : "properties"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Pending invites */}
      <section>
        <h2 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Pending invites</h2>
        {pending.length === 0 && (
          <p className="text-xs text-gray-400">No pending invites.</p>
        )}
        <ul className="space-y-2">
          {pending.map((inv) => (
            <li key={inv.id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{inv.name}</p>
                <p className="text-[11px] text-gray-500">
                  {inv.email} · invited {new Date(inv.created_at).toLocaleDateString()}
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
      </section>
    </div>
  );
}
```

---

## Step 3 — Web: detail page (commit 2 part)

**Create:** `web/src/app/(dashboard)/agent/clients/[id]/page.tsx`

Client component. Fetches `GET /api/clients/:id` on mount. The API already returns `{ client: { id, email, name, avatar_url, properties: Property[] } }`.

Renders the header card, the properties list, and a Remove button at the bottom that confirms and DELETEs. Use the `Property` type from `@/lib/types`.

```tsx
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
    if (!confirm(`Remove ${client.name || client.email} as a client? Their account and properties stay; you'll lose access until they're re-invited.`)) {
      return;
    }
    setRemoving(true);
    try {
      const r = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to remove");
      router.push("/agent/clients");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setRemoving(false);
    }
  }

  if (error) {
    return (
      <div>
        <Link href="/agent/clients" className="text-xs text-brand inline-block mb-4">← Back to clients</Link>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }
  if (!client) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <Link href="/agent/clients" className="text-xs text-brand inline-block mb-4">← Back to clients</Link>

      <div className="flex items-center gap-3 mb-6">
        {client.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={client.avatar_url} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-brand text-white text-sm flex items-center justify-center font-medium">
            {(client.name || client.email).charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{client.name || client.email}</h1>
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
```

---

## Step 4 — Sidebar (commit 2 part)

**Modify:** `web/src/components/agent-sidebar.tsx`

Replace the existing `<span className="px-2 text-sm text-gray-500">Clients</span>` with a `<Link>` to `/agent/clients`. Keep the surrounding `<div className="mt-2">` and the per-client `<Link>` items inside it untouched.

```tsx
<Link
  href="/agent/clients"
  className={`px-2 py-1 rounded text-sm block ${
    isActive("/agent/clients")
      ? "bg-brand-light text-brand font-medium"
      : "text-gray-500 hover:text-gray-700"
  }`}
>
  Clients
</Link>
```

`isActive("/agent/clients")` already returns true for `/agent/clients` and any nested path (default branch uses `pathname.startsWith`).

Commit message for steps 2–4:

```
feat(web): agent clients list, detail page, and sidebar entry
```

---

## Step 5 — Verify, commit, deploy

- `npm run -w api build` — clean.
- `npm run build -w web` — clean.
- `npm run lint -w web` — same pre-existing errors only (no new ones from added files).
- Push branch.
- `./scripts/sandbox-deploy.sh feat/tenant-review-mvp`.

Smoke test (manual on sandbox): see spec §Testing.

---

## Out of scope reminders

- No changes to `agent_clients` table schema (no nickname / notes column).
- No property add/edit/delete from the client detail page.
- No tenants list under the client.
- No URL rename to `/agent/owners/*`.
