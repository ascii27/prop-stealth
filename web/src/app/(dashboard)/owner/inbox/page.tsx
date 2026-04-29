"use client";

import { useEffect, useState } from "react";
import type { EmailTheme } from "@/lib/types";
import { ThemeDot } from "@/components/theme-dot";
import { EmailCard } from "@/components/email-card";

interface InboxEmail {
  id: string;
  sender: string;
  subject: string;
  theme: EmailTheme;
  key_points: string;
  full_content: string;
  show_auto_respond: boolean;
  violation_tag: string | null;
  email_date: string;
  property_id: string | null;
  property_unit: string | null;
}

interface PropertyGroup {
  propertyId: string | null;
  address: string;
  city: string;
  emails: InboxEmail[];
}

const themeOrder: EmailTheme[] = ["tenant", "hoa", "bill", "maintenance", "other"];

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

function formatLastScanned(dateStr: string | null): string {
  if (!dateStr) return "Never scanned";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function InboxPage() {
  const [groups, setGroups] = useState<PropertyGroup[]>([]);
  const [lastScannedAt, setLastScannedAt] = useState<string | null>(null);
  const [activeProperty, setActiveProperty] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  function fetchEmails() {
    fetch("/api/inbox/emails", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { groups: [], lastScannedAt: null }))
      .then((data) => {
        setGroups(data.groups);
        setLastScannedAt(data.lastScannedAt);
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchEmails();
  }, []);

  async function handleScan() {
    setScanning(true);
    setScanMessage(null);
    try {
      const res = await fetch("/api/inbox/scan", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setScanMessage(data.result.summary);
        fetchEmails();
      } else {
        setScanMessage(data.error || "Scan failed");
      }
    } catch {
      setScanMessage("Network error");
    } finally {
      setScanning(false);
    }
  }

  async function handleAutoRespond(emailId: string) {
    const res = await fetch(`/api/inbox/emails/${emailId}/draft`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to create draft");
    }
  }

  const filteredGroups =
    activeProperty === null
      ? groups
      : groups.filter((g) => g.propertyId === activeProperty);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-1.5">
        <h1 className="text-lg font-semibold text-gray-900">Inbox Agent</h1>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded">
            {formatLastScanned(lastScannedAt)}
          </span>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="bg-brand text-white px-3 py-1 rounded-md text-[11px] font-medium disabled:opacity-50"
          >
            {scanning ? "Scanning..." : "Scan Now"}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Emails from your Gmail label, classified and summarized by AI.
      </p>

      {scanMessage && (
        <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 mb-4">
          {scanMessage}
        </div>
      )}

      {loading && <p className="text-xs text-gray-400">Loading emails...</p>}

      {!loading && groups.length === 0 && (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">No emails yet</p>
          <p className="text-xs text-gray-400 mb-4">
            Connect Gmail in Settings, then click Scan Now to process your emails.
          </p>
        </div>
      )}

      {/* Property filter tabs */}
      {groups.length > 0 && (
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
          {groups.map((group) => (
            <button
              key={group.propertyId || "unmatched"}
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
      )}

      {/* Email groups */}
      {filteredGroups.map((group) => (
        <div key={group.propertyId || "unmatched"} className="mb-6">
          {/* Property header */}
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            {group.address}
            {group.city && (
              <span className="text-[10px] text-gray-500 font-normal">
                {group.city}
              </span>
            )}
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
                  <EmailCard
                    key={email.id}
                    email={{
                      id: email.id,
                      sender: email.sender,
                      propertyId: email.property_id || "",
                      unit: email.property_unit || undefined,
                      theme: email.theme,
                      timestamp: formatTimestamp(email.email_date),
                      keyPoints: email.key_points || "",
                      fullContent: email.full_content || "",
                      showAutoRespond: email.show_auto_respond,
                      violationTag: email.violation_tag || undefined,
                    }}
                    onAutoRespond={handleAutoRespond}
                  />
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
