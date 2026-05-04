"use client";

import { useState } from "react";
import type { DocumentCategory, TenantDocument } from "@/lib/types";

const CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: "application", label: "Application" },
  { value: "id", label: "ID" },
  { value: "income", label: "Income" },
  { value: "credit", label: "Credit/Background" },
  { value: "reference", label: "Reference" },
  { value: "other", label: "Other" },
];

export function DocUpload({
  tenantId,
  onUploaded,
}: {
  tenantId: string;
  onUploaded: (doc: TenantDocument) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<DocumentCategory>("application");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("category", category);
      fd.append("file", file);
      const r = await fetch(`/api/tenant-documents/${tenantId}`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      const data = await r.json();
      onUploaded(data.document);
      e.target.value = "";
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-4">
      <div className="flex gap-2 items-center">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as DocumentCategory)}
          className="border border-gray-300 rounded-md px-2 py-1 text-xs"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={onChange}
          disabled={busy}
          className="text-xs"
        />
      </div>
      {busy && <p className="text-xs text-gray-500 mt-2">Uploading…</p>}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
