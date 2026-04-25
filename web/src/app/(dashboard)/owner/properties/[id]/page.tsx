"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  beds: number;
  baths: number;
  unit: string | null;
  occupied: boolean;
  tenant_name: string | null;
}

export default function PropertyDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/properties/${id}`, { credentials: "include" })
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        if (data) setProperty(data.property);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this property? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        router.push("/owner/properties");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="text-xs text-gray-400 p-5">Loading...</p>;
  }

  if (notFound || !property) {
    return (
      <div>
        <Link href="/owner/properties" className="text-xs text-brand inline-block mb-4">
          &larr; Back to properties
        </Link>
        <p className="text-sm text-gray-500">Property not found.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/owner/properties"
        className="text-xs text-brand inline-block mb-4"
      >
        &larr; Back to properties
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {property.address}
            {property.unit ? `, ${property.unit}` : ""}
          </h1>
          <p className="text-[11px] text-gray-500">
            {property.beds}bd / {property.baths}ba &middot; {property.city}, {property.state}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge variant={property.occupied ? "occupied" : "vacant"}>
            {property.occupied ? "Occupied" : "Vacant"}
          </StatusBadge>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Tenant card */}
      {property.occupied && property.tenant_name && (
        <div className="border rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-gray-900">
            {property.tenant_name}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Current tenant</p>
        </div>
      )}

      {/* Documents section — placeholder until documents API is built */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Documents</h2>
        <p className="text-xs text-gray-400">No documents uploaded yet.</p>
      </div>
    </div>
  );
}
