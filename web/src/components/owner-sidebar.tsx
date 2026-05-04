"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { useUser, logout } from "@/lib/user-context";

const navItems: { label: string; href: string; exact?: boolean }[] = [
  { label: "Dashboard", href: "/owner", exact: true },
  { label: "Tenants", href: "/owner/tenants" },
  { label: "Properties", href: "/owner/properties" },
];

export function OwnerSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

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
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 pt-3 flex flex-col gap-1">
        <Link
          href="/owner/settings"
          className={`px-2 py-1.5 rounded-md text-sm ${
            isActive("/owner/settings")
              ? "bg-brand-light text-brand font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Settings
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
