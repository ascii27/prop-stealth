"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AgentPropertyNewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      owner_id: params.id,
      address: f.get("address"),
      city: f.get("city"),
      state: f.get("state"),
      zip: f.get("zip") || null,
      beds: Number(f.get("beds") || 0),
      baths: Number(f.get("baths") || 0),
      property_type: f.get("property_type") || null,
      monthly_rent_target: f.get("monthly_rent_target")
        ? Number(f.get("monthly_rent_target"))
        : null,
      notes: f.get("notes") || null,
    };
    try {
      const r = await fetch("/api/properties", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create");
      }
      router.push(`/agent/clients/${params.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-[560px]">
      <h1 className="text-lg font-semibold text-gray-900 mb-4">Add property</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Address" name="address" required />
        <div className="grid grid-cols-3 gap-3">
          <Field label="City" name="city" required />
          <Field label="State" name="state" required maxLength={2} />
          <Field label="Zip" name="zip" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Beds" name="beds" type="number" />
          <Field label="Baths" name="baths" type="number" />
          <Field
            label="Type"
            name="property_type"
            placeholder="single-family, condo…"
          />
        </div>
        <Field
          label="Monthly rent target"
          name="monthly_rent_target"
          type="number"
        />
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="bg-brand text-white px-4 py-2 rounded-md text-xs font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Create"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  maxLength,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
      />
    </div>
  );
}
