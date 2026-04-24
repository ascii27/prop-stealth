import Link from "next/link";
import { notFound } from "next/navigation";
import { agentClients, pipelineTenants } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = agentClients.find((c) => c.id === id);

  if (!client) {
    notFound();
  }

  const clientPipeline = pipelineTenants.filter(
    (t) => t.clientName === client.name
  );

  return (
    <div>
      {/* Back link */}
      <Link href="/agent" className="text-xs text-brand block mb-4">
        ← Back to dashboard
      </Link>

      {/* Client header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`w-10 h-10 rounded-full ${client.initialsBg} flex items-center justify-center flex-shrink-0`}
        >
          <span className={`text-sm font-semibold ${client.initialsColor}`}>
            {client.initials}
          </span>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{client.name}</h1>
          <p className="text-xs text-gray-500">
            {client.properties.length} propert
            {client.properties.length === 1 ? "y" : "ies"}
            {client.vacancyCount > 0
              ? ` · ${client.vacancyCount} vacant`
              : " · all occupied"}
          </p>
        </div>
      </div>

      {/* Properties section */}
      <h2 className="text-[13px] font-semibold text-gray-900 mb-3">
        Properties
      </h2>
      <div className="space-y-2 mb-6">
        {client.properties.map((property) => (
          <div
            key={property.id}
            className="border border-gray-200 rounded-lg p-3 flex justify-between items-start"
          >
            <div>
              <p className="text-xs font-medium text-gray-900">
                {property.address}
                {property.unit ? `, ${property.unit}` : ""}
              </p>
              <p className="text-[10px] text-gray-500">
                {property.beds}bd · {property.baths}ba · {property.city}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge variant={property.occupied ? "occupied" : "vacant"}>
                {property.occupied ? "Occupied" : "Vacant"}
              </StatusBadge>
              {!property.occupied && (
                <Link
                  href="/agent/pipeline"
                  className="text-[10px] text-brand"
                >
                  Find tenant →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tenant Pipeline section */}
      {clientPipeline.length > 0 && (
        <>
          <h2 className="text-[13px] font-semibold text-gray-900 mb-3">
            Tenant Pipeline
          </h2>
          <div className="space-y-2">
            {clientPipeline.map((tenant) => (
              <div
                key={tenant.id}
                className="border border-gray-200 rounded-lg p-3 flex justify-between items-start"
              >
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    {tenant.applicantName}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {tenant.propertyAddress} · {tenant.overallScore}/100
                  </p>
                </div>
                {tenant.status !== "declined" && (
                  <StatusBadge variant={tenant.status}>
                    {tenant.status.charAt(0).toUpperCase() +
                      tenant.status.slice(1)}
                  </StatusBadge>
                )}
                {tenant.status === "declined" && (
                  <span className="text-[10px] px-2 py-0.5 rounded text-red-600 bg-red-50">
                    Declined
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
