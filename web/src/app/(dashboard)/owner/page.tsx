"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TenantRow {
  id: string;
  applicant_name: string | null;
  status: string;
  property_address: string;
  property_city: string;
  property_state: string;
}

interface PropertyRow {
  id: string;
  address: string;
  city: string;
  state: string;
}

export default function OwnerDashboardPage() {
  const [shared, setShared] = useState<TenantRow[] | null>(null);
  const [properties, setProperties] = useState<PropertyRow[]>([]);

  useEffect(() => {
    fetch("/api/tenants?status=shared", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setShared(data.tenants || []));
    fetch("/api/properties", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setProperties(data.properties || []));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>

      <section>
        <h2 className="text-sm font-medium text-gray-900 mb-2">
          Tenants to review
        </h2>
        {!shared && <p className="text-sm text-gray-500">Loading…</p>}
        {shared && shared.length === 0 && (
          <p className="text-sm text-gray-500">
            Nothing shared with you right now.
          </p>
        )}
        {shared && shared.length > 0 && (
          <ul className="space-y-2">
            {shared.map((t) => (
              <li
                key={t.id}
                className="border border-gray-200 rounded p-3 hover:bg-gray-50"
              >
                <Link href={`/owner/tenants/${t.id}`} className="block">
                  <p className="text-sm font-medium text-gray-900">
                    {t.applicant_name || "(unnamed)"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t.property_address}, {t.property_city},{" "}
                    {t.property_state}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-gray-900 mb-2">
          Your properties
        </h2>
        {properties.length === 0 ? (
          <p className="text-sm text-gray-500">
            Your agent will add properties for you.
          </p>
        ) : (
          <ul className="space-y-2">
            {properties.map((p) => (
              <li key={p.id} className="border border-gray-200 rounded p-3">
                <Link href={`/owner/properties/${p.id}`} className="block">
                  <p className="text-sm font-medium text-gray-900">
                    {p.address}
                  </p>
                  <p className="text-xs text-gray-500">
                    {p.city}, {p.state}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
