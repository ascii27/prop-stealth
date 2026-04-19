"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { agentClients } from "@/lib/mock-data";

const bottomItems = [
  { label: "Invite Client", href: "/agent/invite" },
  { label: "Settings", href: "#" },
];

export function AgentSidebar() {
  const pathname = usePathname();

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

        {/* Clients — label only, not a link */}
        <div className="mt-2">
          <span className="px-2 text-sm text-gray-500">Clients</span>
          <div className="mt-1 flex flex-col gap-0.5 pl-2">
            {agentClients.map((client) => {
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
          </div>
        </div>

        {/* Tenant Pipeline */}
        <Link
          href="/agent/pipeline"
          className={`mt-2 flex items-center justify-between px-2 py-1.5 rounded-md text-sm ${
            isActive("/agent/pipeline")
              ? "bg-brand-light text-brand font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span>Tenant Pipeline</span>
          <span className="bg-brand text-white text-[9px] px-1.5 py-0.5 rounded-full">
            4
          </span>
        </Link>

        {/* Help Requests */}
        <Link
          href="/agent/help-requests"
          className={`px-2 py-1.5 rounded-md text-sm ${
            isActive("/agent/help-requests")
              ? "bg-brand-light text-brand font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Help Requests
        </Link>
      </nav>

      <div className="border-t border-gray-200 pt-3 flex flex-col gap-0.5">
        {bottomItems.map((item) => {
          const active = item.href !== "#" && isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-2 py-1.5 rounded-md text-sm ${
                active
                  ? "bg-brand-light text-brand font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
