"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  async function loadProperties() {
    try {
      const res = await fetch("/api/properties", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties);
      }
    } catch (err) {
      console.error("Failed to load properties:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProperties();
  }, []);

  const uniqueAddresses = new Set(properties.map((p) => p.address)).size;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Properties</h1>
          <p className="text-xs text-gray-500">
            {properties.length} units across {uniqueAddresses} properties
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-brand text-white px-3.5 py-1.5 rounded-md text-xs font-medium"
        >
          + Add Property
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <p className="text-xs text-gray-400">Loading properties...</p>
      )}

      {/* Empty state */}
      {!loading && properties.length === 0 && (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">No properties yet</p>
          <p className="text-xs text-gray-400 mb-4">
            Add your first property to get started
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-brand text-white px-3.5 py-1.5 rounded-md text-xs font-medium"
          >
            + Add Property
          </button>
        </div>
      )}

      {/* Property list */}
      <div className="space-y-2">
        {properties.map((property) => (
          <Link
            key={property.id}
            href={`/owner/properties/${property.id}`}
            className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {property.address}
                {property.unit ? `, ${property.unit}` : ""}
              </p>
              <p className="text-[11px] text-gray-500">
                {property.beds}bd / {property.baths}ba &middot; {property.city}, {property.state}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge variant={property.occupied ? "occupied" : "vacant"}>
                {property.occupied ? "Occupied" : "Vacant"}
              </StatusBadge>
              {property.tenant_name && (
                <p className="text-[11px] text-gray-500">{property.tenant_name}</p>
              )}
              <span className="text-[11px] text-brand">View &rarr;</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Add Property Modal */}
      {showAdd && (
        <AddPropertyModal
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            loadProperties();
          }}
        />
      )}
    </div>
  );
}

function AddPropertyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const body = {
      address: form.get("address"),
      city: form.get("city"),
      state: form.get("state"),
      beds: Number(form.get("beds")) || 0,
      baths: Number(form.get("baths")) || 0,
      unit: form.get("unit") || null,
      occupied: form.get("occupied") === "on",
      tenant_name: form.get("tenant_name") || null,
    };

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create property");
        return;
      }
      onCreated();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[420px] p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Add Property
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Address *
            </label>
            <input
              name="address"
              required
              className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">
                City *
              </label>
              <input
                name="city"
                required
                className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div className="w-16">
              <label className="block text-xs text-gray-500 mb-1">
                State *
              </label>
              <input
                name="state"
                required
                maxLength={2}
                placeholder="FL"
                className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Unit</label>
              <input
                name="unit"
                placeholder="e.g. Unit 3B"
                className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div className="w-16">
              <label className="block text-xs text-gray-500 mb-1">Beds</label>
              <input
                name="beds"
                type="number"
                min={0}
                defaultValue={0}
                className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div className="w-16">
              <label className="block text-xs text-gray-500 mb-1">Baths</label>
              <input
                name="baths"
                type="number"
                min={0}
                defaultValue={0}
                className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input name="occupied" type="checkbox" className="accent-brand" />
              <span className="text-xs text-gray-700">Occupied</span>
            </label>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Tenant Name
            </label>
            <input
              name="tenant_name"
              className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-brand text-white px-3.5 py-1.5 rounded-md text-xs font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
