import Link from "next/link";
import { ownerProperties } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";

export default function PropertiesPage() {
  const uniqueAddresses = new Set(ownerProperties.map((p) => p.address)).size;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Properties</h1>
          <p className="text-xs text-gray-500">
            {ownerProperties.length} units across {uniqueAddresses} properties
          </p>
        </div>
        <button className="bg-brand text-white px-3.5 py-1.5 rounded-md text-xs font-medium">
          + Add Property
        </button>
      </div>

      {/* Property list */}
      <div className="space-y-2">
        {ownerProperties.map((property) => (
          <Link
            key={property.id}
            href={`/owner/properties/${property.id}`}
            className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
          >
            {/* Left */}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {property.address}
                {property.unit ? `, ${property.unit}` : ""}
              </p>
              <p className="text-[11px] text-gray-500">
                {property.beds}bd / {property.baths}ba &middot; {property.city}
              </p>
            </div>

            {/* Right */}
            <div className="flex flex-col items-end gap-1">
              <StatusBadge variant={property.occupied ? "occupied" : "vacant"}>
                {property.occupied ? "Occupied" : "Vacant"}
              </StatusBadge>
              {property.tenantName && (
                <p className="text-[11px] text-gray-500">{property.tenantName}</p>
              )}
              <span className="text-[11px] text-brand">View &rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
