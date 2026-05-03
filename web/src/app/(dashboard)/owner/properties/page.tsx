"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Property } from "@/lib/types";

export default function OwnerPropertiesPage() {
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/properties", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load properties");
        const data = await r.json();
        setProperties(data.properties);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900 mb-1">Properties</h1>
      <p className="text-xs text-gray-500 mb-5">Properties you own.</p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!properties && !error && <p className="text-sm text-gray-500">Loading…</p>}

      {properties && properties.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">
            No properties yet. Your agent will add properties for you.
          </p>
        </div>
      )}

      {properties && properties.length > 0 && (
        <ul className="space-y-2">
          {properties.map((p) => (
            <li key={p.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <Link href={`/owner/properties/${p.id}`} className="block">
                <p className="text-sm font-medium text-gray-900">{p.address}</p>
                <p className="text-xs text-gray-500">
                  {p.city}, {p.state} {p.zip || ""} · {p.beds} bd / {p.baths} ba
                  {p.property_type ? ` · ${p.property_type}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
