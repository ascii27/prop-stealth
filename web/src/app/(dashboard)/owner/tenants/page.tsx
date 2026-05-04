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
  shared_at: string | null;
}

export default function OwnerTenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[] | null>(null);

  useEffect(() => {
    fetch("/api/tenants", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setTenants(data.tenants || []));
  }, []);

  if (!tenants) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Tenants</h1>
      {tenants.length === 0 ? (
        <p className="text-sm text-gray-500">
          No tenants shared with you yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {tenants.map((t) => (
            <li key={t.id} className="border border-gray-200 rounded">
              <Link
                href={`/owner/tenants/${t.id}`}
                className="block p-3 hover:bg-gray-50"
              >
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {t.applicant_name || "(unnamed)"}
                  </p>
                  <span className="text-[10px] uppercase text-gray-500">
                    {t.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {t.property_address}, {t.property_city}, {t.property_state}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
