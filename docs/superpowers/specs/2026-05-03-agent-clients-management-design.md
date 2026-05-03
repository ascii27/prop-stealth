# Agent — Clients Management — Design

**Date:** 2026-05-03
**Status:** approved by user (in-chat); pending written review.
**Branch:** `feat/tenant-review-mvp`
**Scope:** ahead-of-schedule slice of work the master plan groups into Phase J1 (sidebar) and Phase J5 (owner detail page). The master plan calls these `/agent/owners/*`; we are intentionally building under `/agent/clients/*` first to match the existing sidebar links and the user's term, and the URL rename is deferred to J1.

---

## What this is

The agent sidebar already lists clients (accepted) and pending invites and renders links to `/agent/clients/:id` — but no such page exists yet, so the links 404. There is also no list view of clients (the sidebar is the only entry point). This design adds:

1. A clients list page (existing + pending).
2. A client detail / management page with the client's properties and a "Remove client" action.
3. A "Cancel invite" action on pending rows.
4. Two API endpoints to back those destructive actions.
5. The sidebar "Clients" header becomes a link to the list page.

The master plan still owns property add/edit under a client (J5), tenants under a client (J/H), and the URL rename (J1). Those are out of scope here.

---

## Pages

### `/agent/clients` — list

Two sections:

- **Clients** — accepted clients (`agent_clients` rows that resolve to `users` rows). Each row is a link to `/agent/clients/:id`. Row content: name, email, "client since" date, property count.
- **Pending invites** — `invitations` where `status = 'pending'`. Not links. Row content: name, email, "invited X days ago", and a Cancel button.

Empty states for each section. A `+ Invite Client` CTA at the top links to the existing `/agent/invite`.

### `/agent/clients/[id]` — client detail / management

For accepted clients only. 404 if the id is not in the agent's `agent_clients`.

- Header: name, email, "client since", avatar.
- **Properties** — read-only list. Each row: address, "city, ST zip", "beds bd / baths ba" plus property type if set. No links (agent property pages do not exist yet).
- **Remove client** — bottom-right red button. `window.confirm()` → `DELETE /api/clients/:id` → on success, navigate back to `/agent/clients`.

There are no editable client fields. The owner's name/email come from their Google account; the relationship row stores no agent-editable data in v1.

---

## API

Both new endpoints live in `api/src/routes/clients.ts`.

### `DELETE /api/clients/:id`

Removes the `agent_clients` row linking this agent to this owner.

- Auth: requireAuth, role must be `agent`.
- Lookup: `DELETE FROM agent_clients WHERE agent_id = $1 AND owner_id = $2 RETURNING id`.
- 404 if no row was deleted (not their client).
- Owner's `users` row, properties, tenants, and historical evaluations are NOT touched. Re-inviting later restores access cleanly via the invite flow.
- Response: `{ success: true }`.

### `DELETE /api/clients/invitations/:id`

Cancels a pending invitation.

- Auth: requireAuth, role must be `agent`.
- Lookup: `DELETE FROM invitations WHERE id = $1 AND agent_id = $2 AND status = 'pending' RETURNING id`.
- 404 if no row was deleted (not theirs or already accepted/expired).
- Hard delete is acceptable here — there is no audit trail requirement on canceled invites in v1.
- Response: `{ success: true }`.

---

## Sidebar change

`web/src/components/agent-sidebar.tsx`:

- Wrap the existing `<span>Clients</span>` header in a `<Link href="/agent/clients">` so the section header is clickable.
- Active state: highlight when `pathname === "/agent/clients"` OR the pathname starts with `/agent/clients/`.
- Per-client link items inside the section keep their existing behavior (link to `/agent/clients/:id`, active when pathname starts with that href).
- Pending entries stay as plain text rows (they have no detail page).

---

## Authorization summary

| Action | Allowed for |
|---|---|
| `GET /api/clients` | agent (their own clients + pending invites) |
| `GET /api/clients/:id` | agent who owns the link |
| `DELETE /api/clients/:id` | agent who owns the link (404 otherwise) |
| `DELETE /api/clients/invitations/:id` | agent who owns the invitation, only if status='pending' (404 otherwise) |

Owners cannot reach any of these routes — the role check rejects them with 403. (Existing pattern in `clients.ts`.)

---

## Testing

- API type-check.
- Web production build.
- Sandbox smoke test (manual):
  1. Agent logs in → clicks "Clients" header in sidebar → list page loads with both sections populated.
  2. Click into an accepted client → detail page renders properties.
  3. Click Remove → confirm → redirect to list → client gone.
  4. Cancel a pending invite → it disappears from the list.
  5. Try to hit `/agent/clients/<some-other-agent's-client-id>` → 404.

No new vitest coverage is added in this slice — the existing tests cover the invite-token plumbing; the two new DELETE endpoints are thin SQL passthroughs that the manual sandbox checks above will exercise. (If we add a tests/clients.test.ts later, that is fine but not blocking.)

---

## Out of scope

- Editable client fields (settled: option A — no edits).
- Resend / copy invite link on pending rows (settled: option A — cancel only).
- Property add / edit / delete from the client detail page (Phase J5).
- Tenants list under a client (Phase H/J).
- URL rename `/agent/clients/*` → `/agent/owners/*` (Phase J1).
- Bulk actions, search, sorting on the list (not asked for).

---

## Risks / follow-ups

- **`DELETE /api/clients/:id` cascade behavior** — `agent_clients(agent_id, owner_id)` is a simple link table; deleting one row does not touch `properties` (whose `created_by_agent_id` may still reference this agent). That is intentional: we keep historical authorship even after a relationship ends.
- **Already-accepted invitations remain visible only as the linked client** — once accepted, the `invitations` row is no longer "pending", so cancel never applies. Removing the linked client uses the other endpoint.
- **No optimistic UI** — list and detail pages re-fetch after destructive actions for simplicity. Acceptable at this scale.
