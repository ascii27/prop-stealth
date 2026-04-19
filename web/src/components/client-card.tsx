import Link from "next/link";
import { Client } from "@/lib/types";
import { pipelineTenants } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";

interface ClientCardProps {
  client: Client;
}

export function ClientCard({ client }: ClientCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-2.5">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div
            className={`w-8 h-8 rounded-full ${client.initialsBg} flex items-center justify-center`}
          >
            <span className={`text-xs font-semibold ${client.initialsColor}`}>
              {client.initials}
            </span>
          </div>
          {/* Name + property info */}
          <div>
            <p className="text-[13px] font-medium text-gray-900">{client.name}</p>
            <p className="text-[11px] text-gray-500">
              {client.properties.length} propert{client.properties.length === 1 ? "y" : "ies"}
              {client.vacancyCount > 0 ? ` · ${client.vacancyCount} vacant` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge variant={client.vacancyCount > 0 ? "vacant" : "all-occupied"}>
            {client.vacancyCount > 0 ? "Vacant" : "All Occupied"}
          </StatusBadge>
          <Link
            href={`/agent/clients/${client.id}`}
            className="text-[11px] text-brand"
          >
            View →
          </Link>
        </div>
      </div>

      {/* Property list */}
      <div className="px-4">
        {client.properties.map((property, index) => {
          const baseAddress = property.address.split(",")[0];
          const propertyPipeline = pipelineTenants.filter((t) =>
            t.propertyAddress.startsWith(baseAddress)
          );
          const proposedCount = propertyPipeline.filter(
            (t) => t.status === "proposed"
          ).length;
          const evaluatingCount = propertyPipeline.filter(
            (t) => t.status === "evaluating"
          ).length;

          return (
            <div
              key={property.id}
              className={`flex items-center justify-between py-2.5 ${
                index < client.properties.length - 1
                  ? "border-b border-gray-100"
                  : ""
              }`}
            >
              {/* Left: address + details */}
              <div>
                <p className="text-xs text-gray-900">
                  {property.address}
                  {property.unit ? `, ${property.unit}` : ""}
                </p>
                <p className="text-[10px] text-gray-500">
                  {property.beds}bd · {property.baths}ba · {property.city}
                </p>
              </div>

              {/* Right: status + pipeline badges */}
              <div className="flex items-center gap-1.5">
                <StatusBadge variant={property.occupied ? "occupied" : "vacant"}>
                  {property.occupied ? "Occupied" : "Vacant"}
                </StatusBadge>
                {proposedCount > 0 && (
                  <StatusBadge variant="proposed">
                    {proposedCount} proposed
                  </StatusBadge>
                )}
                {evaluatingCount > 0 && (
                  <StatusBadge variant="evaluating">
                    {evaluatingCount} evaluating
                  </StatusBadge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
