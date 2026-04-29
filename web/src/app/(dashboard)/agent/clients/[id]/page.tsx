"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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

interface Evaluation {
  id: string;
  applicant_name: string;
  property_address: string;
  overall_score: number | null;
  status: string;
}

interface ClientData {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  properties: Property[];
  evaluations: Evaluation[];
  vacancyCount: number;
}

export default function ClientDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/clients/${id}`, { credentials: "include" })
      .then((res) => {
        if (res.status === 404 || res.status === 403) {
          setNotFound(true);
          return null;
        }
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        if (data) setClient(data.client);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="text-xs text-gray-400 p-5">Loading...</p>;
  }

  if (notFound || !client) {
    return (
      <div>
        <Link href="/agent" className="text-xs text-brand block mb-4">
          &larr; Back to dashboard
        </Link>
        <p className="text-sm text-gray-500">Client not found.</p>
      </div>
    );
  }

  const initials = client.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2) || "?";

  return (
    <div>
      {/* Back link */}
      <Link href="/agent" className="text-xs text-brand block mb-4">
        &larr; Back to dashboard
      </Link>

      {/* Client header */}
      <div className="flex items-center gap-3 mb-6">
        {client.avatar_url ? (
          <img
            src={client.avatar_url}
            alt=""
            className="w-10 h-10 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-blue-700">{initials}</span>
          </div>
        )}
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
      <h2 className="text-[13px] font-semibold text-gray-900 mb-3">Properties</h2>
      {client.properties.length === 0 ? (
        <p className="text-xs text-gray-400 mb-6">No properties added yet.</p>
      ) : (
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
                  {property.beds}bd · {property.baths}ba · {property.city}, {property.state}
                </p>
              </div>
              <StatusBadge variant={property.occupied ? "occupied" : "vacant"}>
                {property.occupied ? "Occupied" : "Vacant"}
              </StatusBadge>
            </div>
          ))}
        </div>
      )}

      {/* Evaluations section */}
      {client.evaluations.length > 0 && (
        <>
          <h2 className="text-[13px] font-semibold text-gray-900 mb-3">
            Tenant Evaluations
          </h2>
          <div className="space-y-2">
            {client.evaluations.map((evaluation) => (
              <div
                key={evaluation.id}
                className="border border-gray-200 rounded-lg p-3 flex justify-between items-start"
              >
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    {evaluation.applicant_name}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {evaluation.property_address}
                    {evaluation.overall_score != null && ` · ${evaluation.overall_score}/100`}
                  </p>
                </div>
                <StatusBadge variant={evaluation.status as "approved" | "evaluating"}>
                  {evaluation.status.charAt(0).toUpperCase() + evaluation.status.slice(1)}
                </StatusBadge>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
