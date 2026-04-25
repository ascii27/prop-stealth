"use client";

import { useState } from "react";

export default function InvitePage() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      email: form.get("email"),
      message: form.get("message") || null,
    };

    try {
      const res = await fetch("/api/clients/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send invitation");
        return;
      }
      if (data.invitation.status === "accepted") {
        setSuccess(`${body.name} is already on PropStealth — they've been added as your client!`);
      } else {
        setSuccess(`Invitation sent to ${body.email}`);
      }
      e.currentTarget.reset();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-gray-900">Invite Client</h1>
        <p className="text-xs text-gray-500">
          Send an invitation to a property owner to join PropStealth as your
          client.
        </p>
      </div>

      {/* Form */}
      <div className="border border-gray-200 rounded-lg p-5 max-w-[480px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Client Name
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="Full name"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="client@example.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
            />
          </div>

          {/* Personal Message */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Personal Message
            </label>
            <textarea
              name="message"
              placeholder="Add a personal note..."
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand resize-none"
            />
          </div>

          {error && !success && <p className="text-xs text-red-600">{error}</p>}
          {success && <p className="text-xs text-brand">{success}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="bg-brand text-white px-4 py-2 rounded-md text-xs font-medium w-full disabled:opacity-50"
          >
            {saving ? "Sending..." : "Send Invitation"}
          </button>

          {/* Note */}
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Your client will receive an email with a link to sign up as a
            Property Owner on PropStealth. If they already have an account,
            they'll be linked automatically.
          </p>
        </form>
      </div>
    </div>
  );
}
