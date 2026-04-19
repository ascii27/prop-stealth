import Link from "next/link";
import { notFound } from "next/navigation";
import { ownerProperties, ownerDocuments } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";

export default async function PropertyDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = ownerProperties.find((p) => p.id === id);

  if (!property) {
    notFound();
  }

  const docs = ownerDocuments.filter((d) => d.propertyId === id);

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
            {property.beds}bd / {property.baths}ba &middot; {property.city}
          </p>
        </div>
        <StatusBadge variant={property.occupied ? "occupied" : "vacant"}>
          {property.occupied ? "Occupied" : "Vacant"}
        </StatusBadge>
      </div>

      {/* Tenant card */}
      {property.occupied && property.tenantName && (
        <div className="border rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-gray-900">
            {property.tenantName}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Lease: Jan 1, 2026 &ndash; Dec 31, 2026
          </p>
        </div>
      )}

      {/* Documents section */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Documents</h2>
        {docs.length === 0 ? (
          <p className="text-xs text-gray-400">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📄</span>
                  <div>
                    <p className="text-xs font-medium text-gray-900">
                      {doc.name}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {doc.type} &middot; {doc.uploadDate}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-gray-500">{doc.size}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
