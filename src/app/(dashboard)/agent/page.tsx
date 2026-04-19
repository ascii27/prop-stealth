import Link from "next/link";
import { agentClients, pipelineTenants } from "@/lib/mock-data";
import { StatCard } from "@/components/stat-card";
import { ClientCard } from "@/components/client-card";

export default function AgentHome() {
  // Compute stats
  const totalProperties = agentClients.reduce(
    (sum, c) => sum + c.properties.length,
    0
  );
  const totalOccupied = agentClients.reduce(
    (sum, c) => sum + c.properties.filter((p) => p.occupied).length,
    0
  );
  const totalVacant = totalProperties - totalOccupied;
  const occupancyRate =
    totalProperties > 0
      ? Math.round((totalOccupied / totalProperties) * 100)
      : 0;

  // Pipeline counts
  const evaluatingCount = pipelineTenants.filter(
    (t) => t.status === "evaluating"
  ).length;
  const proposedCount = pipelineTenants.filter(
    (t) => t.status === "proposed"
  ).length;
  const approvedCount = pipelineTenants.filter(
    (t) => t.status === "approved"
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Portfolio Overview
          </h1>
          <p className="text-xs text-gray-500">Across all clients</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/agent/pipeline"
            className="bg-white border border-gray-300 text-gray-700 px-3.5 py-1.5 rounded-md text-xs font-medium"
          >
            + Evaluate Tenant
          </Link>
          <Link
            href="/agent/invite"
            className="bg-brand text-white px-3.5 py-1.5 rounded-md text-xs font-medium"
          >
            + Invite Client
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard label="Clients" value={agentClients.length} />
        <StatCard label="Properties" value={totalProperties} />
        <StatCard
          label="Occupancy Rate"
          value={`${occupancyRate}%`}
          detail={`${totalOccupied} of ${totalProperties} occupied`}
          variant="success"
        />
        <StatCard
          label="Vacant Units"
          value={totalVacant}
          detail="needs tenants"
          variant="danger"
        />
      </div>

      {/* Tenant Pipeline */}
      <h2 className="text-[13px] font-semibold text-gray-900 mb-2.5">
        Tenant Pipeline
      </h2>
      <div className="grid grid-cols-3 gap-px bg-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="bg-white p-3.5 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">
            Evaluating
          </p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">
            {evaluatingCount}
          </p>
        </div>
        <div className="bg-white p-3.5 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">
            Proposed
          </p>
          <p className="text-xl font-bold text-amber-600 mt-0.5">
            {proposedCount}
          </p>
        </div>
        <div className="bg-white p-3.5 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">
            Approved
          </p>
          <p className="text-xl font-bold text-brand mt-0.5">{approvedCount}</p>
        </div>
      </div>

      {/* Clients */}
      <h2 className="text-[13px] font-semibold text-gray-900 mb-2.5">
        Clients
      </h2>
      {agentClients.map((client) => (
        <ClientCard key={client.id} client={client} />
      ))}
    </div>
  );
}
