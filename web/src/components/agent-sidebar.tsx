"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { useUser, logout } from "@/lib/user-context";

interface SidebarClient {
  id: string;
  name: string;
}

interface PendingInvite {
  id: string;
  name: string;
}

export function AgentSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [clients, setClients] = useState<SidebarClient[]>([]);
  const [pending, setPending] = useState<PendingInvite[]>([]);

  useEffect(() => {
    fetch("/api/clients", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { clients: [], pendingInvitations: [] }))
      .then((data) => {
        setClients(data.clients);
        setPending(data.pendingInvitations || []);
      })
      .catch(() => {});
  }, []);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-[200px] bg-sidebar border-r border-gray-200 p-4 flex-shrink-0 flex flex-col min-h-screen">
      <div className="mb-4">
        <Logo />
      </div>

      <div className="mb-4">
        <span className="text-[10px] text-brand bg-brand-light px-2 py-0.5 rounded">
          Agent Account
        </span>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5">
        {/* Dashboard */}
        <Link
          href="/agent"
          className={`px-2 py-1.5 rounded-md text-sm ${
            isActive("/agent", true)
              ? "bg-brand-light text-brand font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Dashboard
        </Link>

        {/* Clients */}
        <div className="mt-2">
          <Link
            href="/agent/clients"
            className={`block px-2 py-1.5 rounded-md text-sm ${
              isActive("/agent/clients")
                ? "bg-brand-light text-brand font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Clients
          </Link>
          <div className="mt-1 flex flex-col gap-0.5 pl-2">
            {clients.length === 0 && pending.length === 0 && (
              <span className="px-2 py-1 text-[11px] text-gray-300">None yet</span>
            )}
            {clients.map((client) => {
              const clientHref = `/agent/clients/${client.id}`;
              const active = pathname.startsWith(clientHref);
              return (
                <Link
                  key={client.id}
                  href={clientHref}
                  className={`px-2 py-1 rounded text-[11px] ${
                    active ? "text-brand" : "text-gray-400"
                  }`}
                >
                  {client.name}
                </Link>
              );
            })}
            {pending.map((inv) => (
              <span
                key={inv.id}
                className="px-2 py-1 text-[11px] text-gray-300 italic"
              >
                {inv.name} (pending)
              </span>
            ))}
          </div>
        </div>

      </nav>

      <div className="border-t border-gray-200 pt-3 flex flex-col gap-1">
        <Link
          href="/agent/invite"
          className={`px-2 py-1.5 rounded-md text-sm ${
            isActive("/agent/invite")
              ? "bg-brand-light text-brand font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Invite Client
        </Link>

        {user && (
          <div className="flex items-center gap-2 px-2 pt-2">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="w-6 h-6 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-brand text-white text-[10px] flex items-center justify-center font-medium">
                {user.name?.charAt(0) || "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-700 font-medium truncate">
                {user.name || user.email}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="px-2 py-1.5 rounded-md text-sm text-gray-500 hover:text-gray-700 text-left"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
