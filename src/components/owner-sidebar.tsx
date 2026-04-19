"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";

const navItems = [
  { label: "Activity Feed", href: "/owner", badge: "3", exact: true },
  { label: "Inbox Agent", href: "/owner/inbox" },
  { label: "Tenant Eval", href: "/owner/tenant-eval" },
  { label: "Properties", href: "/owner/properties" },
  { label: "Documents", href: "/owner/documents" },
];

const bottomItems = [{ label: "Settings", href: "/owner/settings" }];

export function OwnerSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-[200px] bg-sidebar border-r border-gray-200 p-4 flex-shrink-0 flex flex-col min-h-screen">
      <div className="mb-6">
        <Logo />
      </div>

      <nav className="flex-1 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-2 py-1.5 rounded-md text-sm ${
                active
                  ? "bg-brand-light text-brand font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span className="bg-brand text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 pt-3 flex flex-col gap-0.5">
        {bottomItems.map((item) => {
          const active = isActive(item.href);
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
