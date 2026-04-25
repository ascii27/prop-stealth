"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
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

interface ClientData {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  properties: Property[];
  vacancyCount: number;
}

interface PendingInvitation {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

export default function AgentHome() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [pending, setPending] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/clients", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { clients: [], pendingInvitations: [] }))
      .then((data) => {
        setClients(data.clients);
        setPending(data.pendingInvitations || []);
      })
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  const totalProperties = clients.reduce((sum, c) => sum + c.properties.length, 0);
  const totalOccupied = clients.reduce(
    (sum, c) => sum + c.properties.filter((p) => p.occupied).length,
    0,
  );
  const totalVacant = totalProperties - totalOccupied;
  const occupancyRate = totalProperties > 0
    ? Math.round((totalOccupied / totalProperties) * 100)
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Portfolio Overview</h1>
          <p className="text-xs text-gray-500">Across all clients</p>
        </div>
        <div className="flex items-center gap-2">
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
        <StatCard label="Clients" value={clients.length} />
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

      {loading && <p className="text-xs text-gray-400">Loading clients...</p>}

      {/* Empty state */}
      {!loading && clients.length === 0 && (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">No clients yet</p>
          <p className="text-xs text-gray-400 mb-4">
            Invite property owners to manage their portfolio
          </p>
          <Link
            href="/agent/invite"
            className="bg-brand text-white px-3.5 py-1.5 rounded-md text-xs font-medium"
          >
            + Invite Client
          </Link>
        </div>
      )}

      {/* Clients */}
      {clients.length > 0 && (
        <>
          <h2 className="text-[13px] font-semibold text-gray-900 mb-2.5">Clients</h2>
          {clients.map((client) => (
            <div key={client.id} className="border border-gray-200 rounded-lg overflow-hidden mb-2.5">
              {/* Header */}
              <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {client.avatar_url ? (
                    <img
                      src={client.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-700">
                        {client.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?"}
                      </span>
                    </div>
                  )}
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
                {client.properties.map((property, index) => (
                  <div
                    key={property.id}
                    className={`flex items-center justify-between py-2.5 ${
                      index < client.properties.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <div>
                      <p className="text-xs text-gray-900">
                        {property.address}
                        {property.unit ? `, ${property.unit}` : ""}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {property.beds}bd · {property.baths}ba · {property.city}, {property.state}
                      </p>
                    </div>
                    <StatusBadge variant={property.occupied ? "occupied" : "vacant"}>
                      {property.occupied ? "Occupied" : "Vacant"}
                    </StatusBadge>
                  </div>
                ))}
                {client.properties.length === 0 && (
                  <p className="text-xs text-gray-400 py-3">No properties added yet</p>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Pending Invitations */}
      {pending.length > 0 && (
        <>
          <h2 className="text-[13px] font-semibold text-gray-900 mb-2.5 mt-6">
            Pending Invitations
          </h2>
          <div className="space-y-2">
            {pending.map((inv) => (
              <div
                key={inv.id}
                className="border border-dashed border-gray-200 rounded-lg p-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-xs font-medium text-gray-900">{inv.name}</p>
                  <p className="text-[10px] text-gray-500">{inv.email}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-600">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
