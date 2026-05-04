"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Property } from "@/lib/types";

export default function OwnerPropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/properties/${params.id}`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Property not found");
        const data = await r.json();
        setProperty(data.property);
      })
      .catch((e) => setError(e.message));
  }, [params.id]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!property) return;
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const body = {
      address: form.get("address"),
      city: form.get("city"),
      state: form.get("state"),
      zip: form.get("zip") || null,
      beds: Number(form.get("beds")) || 0,
      baths: Number(form.get("baths")) || 0,
      property_type: form.get("property_type") || null,
      monthly_rent_target: form.get("monthly_rent_target")
        ? Number(form.get("monthly_rent_target"))
        : null,
      notes: form.get("notes") || null,
    };
    try {
      const r = await fetch(`/api/properties/${params.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Failed to save");
      router.push("/owner/properties");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (error && !property) return <p className="text-sm text-red-600">{error}</p>;
  if (!property) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="max-w-[560px]">
      <h1 className="text-lg font-semibold text-gray-900 mb-1">Edit property</h1>
      <p className="text-xs text-gray-500 mb-5">
        Update the basic details for this property.
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Address" name="address" defaultValue={property.address} required />
        <div className="grid grid-cols-3 gap-3">
          <Field label="City" name="city" defaultValue={property.city} required />
          <Field label="State" name="state" defaultValue={property.state} required maxLength={2} />
          <Field label="Zip" name="zip" defaultValue={property.zip || ""} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Beds" name="beds" type="number" defaultValue={String(property.beds)} />
          <Field label="Baths" name="baths" type="number" defaultValue={String(property.baths)} />
          <Field
            label="Type"
            name="property_type"
            defaultValue={property.property_type || ""}
            placeholder="single-family, condo…"
          />
        </div>
        <Field
          label="Monthly rent target"
          name="monthly_rent_target"
          type="number"
          defaultValue={property.monthly_rent_target ? String(property.monthly_rent_target) : ""}
        />
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={property.notes || ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="bg-brand text-white px-4 py-2 rounded-md text-xs font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  maxLength,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
      />
    </div>
  );
}
