"use client";

import { useState } from "react";
import { ownerPropertyGroups } from "@/lib/mock-data";
import type { EmailTheme } from "@/lib/types";
import { ThemeDot } from "@/components/theme-dot";
import { EmailCard } from "@/components/email-card";

const themeOrder: EmailTheme[] = ["tenant", "hoa", "bill", "other"];

export default function InboxPage() {
  const [activeProperty, setActiveProperty] = useState<string | null>(null);

  const filteredGroups =
    activeProperty === null
      ? ownerPropertyGroups
      : ownerPropertyGroups.filter((g) => g.propertyId === activeProperty);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-1.5">
        <h1 className="text-lg font-semibold text-gray-900">Inbox Agent</h1>
        <span className="text-[11px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded">
          Last scanned: 12 min ago
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Emails from your Gmail label, classified and summarized by AI.
      </p>

      {/* Property filter tabs */}
      <div className="flex gap-0 mb-5 border-b border-gray-200">
        <button
          className={`px-3 py-1.5 text-xs ${
            activeProperty === null
              ? "text-brand border-b-2 border-brand font-medium"
              : "text-gray-500"
          }`}
          onClick={() => setActiveProperty(null)}
        >
          All Properties
        </button>
        {ownerPropertyGroups.map((group) => (
          <button
            key={group.propertyId}
            className={`px-3 py-1.5 text-xs ${
              activeProperty === group.propertyId
                ? "text-brand border-b-2 border-brand font-medium"
                : "text-gray-500"
            }`}
            onClick={() => setActiveProperty(group.propertyId)}
          >
            {group.address}
          </button>
        ))}
      </div>

      {/* Email groups */}
      {filteredGroups.map((group) => (
        <div key={group.propertyId} className="mb-6">
          {/* Property header */}
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            {group.address}
            <span className="text-[10px] text-gray-500 font-normal">
              {group.city}
            </span>
          </h2>

          {/* Theme sections */}
          {themeOrder.map((theme) => {
            const themeEmails = group.emails.filter((e) => e.theme === theme);
            if (themeEmails.length === 0) return null;

            return (
              <div key={theme} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <ThemeDot theme={theme} />
                  <span className="text-[10px] text-gray-500">
                    {themeEmails.length}
                  </span>
                </div>
                {themeEmails.map((email) => (
                  <EmailCard key={email.id} email={email} />
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
