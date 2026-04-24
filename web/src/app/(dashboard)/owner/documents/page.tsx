import { ownerDocuments, ownerProperties } from "@/lib/mock-data";

export default function DocumentsPage() {
  // Group documents by property
  const propertiesWithDocs = ownerProperties.filter((p) =>
    ownerDocuments.some((d) => d.propertyId === p.id)
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Documents</h1>
          <p className="text-xs text-gray-500">
            {ownerDocuments.length} documents across your properties
          </p>
        </div>
        <button className="bg-brand text-white px-3.5 py-1.5 rounded-md text-xs font-medium">
          + Upload Document
        </button>
      </div>

      {/* Grouped by property */}
      <div className="space-y-6">
        {propertiesWithDocs.map((property) => {
          const docs = ownerDocuments.filter((d) => d.propertyId === property.id);
          return (
            <div key={property.id}>
              <h2 className="text-sm font-semibold mb-3">
                {property.address}
                {property.unit ? `, ${property.unit}` : ""}
              </h2>
              <div className="space-y-1.5">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
