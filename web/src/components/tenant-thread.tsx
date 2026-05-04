"use client";

import { useEffect, useState } from "react";

interface ThreadEvent {
  id: string;
  type:
    | "message"
    | "shared"
    | "unshared"
    | "approved"
    | "rejected"
    | "reopened";
  author_user_id: string;
  author_name: string | null;
  author_role: "owner" | "agent";
  body: string | null;
  created_at: string;
}

const SYSTEM_LABELS: Record<string, string> = {
  shared: "shared this candidate",
  unshared: "unshared this candidate",
  approved: "approved",
  rejected: "rejected",
  reopened: "re-opened the decision",
};

export function TenantThread({
  tenantId,
  canPost,
}: {
  tenantId: string;
  canPost: boolean;
}) {
  const [events, setEvents] = useState<ThreadEvent[] | null>(null);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const r = await fetch(`/api/tenants/${tenantId}/thread`, {
      credentials: "include",
    });
    if (r.ok) {
      const data = await r.json();
      setEvents(data.events);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  async function onPost(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const r = await fetch(`/api/tenants/${tenantId}/thread`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send");
      }
      setBody("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPosting(false);
    }
  }

  if (!events) return <p className="text-sm text-gray-500">Loading thread…</p>;

  return (
    <div className="space-y-3">
      {events.length === 0 && (
        <p className="text-xs text-gray-500">No activity yet.</p>
      )}
      <ol className="space-y-3">
        {events.map((e) => (
          <li key={e.id} className="border border-gray-200 rounded-md p-3">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs font-medium text-gray-700">
                {e.author_name || "(unknown)"}
                <span className="text-gray-400 ml-2">{e.author_role}</span>
              </span>
              <span className="text-[10px] text-gray-400">
                {new Date(e.created_at).toLocaleString()}
              </span>
            </div>
            {e.type === "message" ? (
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {e.body}
              </p>
            ) : (
              <p className="text-xs text-gray-500 italic">
                {SYSTEM_LABELS[e.type] || e.type}
                {e.body && <span> — &ldquo;{e.body}&rdquo;</span>}
              </p>
            )}
          </li>
        ))}
      </ol>

      {canPost && (
        <form onSubmit={onPost} className="border-t border-gray-200 pt-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Ask a question or reply…"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={posting || !body.trim()}
            className="bg-brand text-white px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50 mt-2"
          >
            {posting ? "Sending…" : "Send"}
          </button>
        </form>
      )}
    </div>
  );
}
