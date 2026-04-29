"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/user-context";

export default function SettingsPage() {
  const { user, loading: userLoading } = useUser();
  const [gmailStatus, setGmailStatus] = useState<{
    connected: boolean;
    email?: string;
    label?: string;
  } | null>(null);
  const [label, setLabel] = useState("PropStealth");
  const [labelSaving, setLabelSaving] = useState(false);
  const [labelSaved, setLabelSaved] = useState(false);

  useEffect(() => {
    fetch("/api/gmail/status", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { connected: false }))
      .then((data) => {
        setGmailStatus(data);
        if (data.label) setLabel(data.label);
      })
      .catch(() => setGmailStatus({ connected: false }));
  }, []);

  async function handleDisconnect() {
    await fetch("/api/gmail/disconnect", {
      method: "DELETE",
      credentials: "include",
    });
    setGmailStatus({ connected: false });
  }

  async function handleSaveLabel() {
    setLabelSaving(true);
    setLabelSaved(false);
    try {
      const res = await fetch("/api/gmail/label", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ label }),
      });
      if (res.ok) setLabelSaved(true);
    } catch {
      // ignore
    } finally {
      setLabelSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900 mb-5">Settings</h1>

      <div className="max-w-[560px]">
        {/* Gmail Connection */}
        <div className="border rounded-lg p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Gmail Connection
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Connect your Gmail account so the Inbox Agent can monitor your
            property emails.
          </p>
          <div className="flex items-center gap-2">
            {gmailStatus?.connected ? (
              <>
                <span className="text-[11px] px-2.5 py-1 rounded bg-green-50 border border-green-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  <span className="text-green-700 font-medium">
                    {gmailStatus.email}
                  </span>
                </span>
                <button
                  onClick={handleDisconnect}
                  className="text-[11px] text-red-600 hover:text-red-700"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <a
                href="/api/gmail/connect"
                className="bg-brand text-white px-3 py-1.5 rounded-md text-xs font-medium"
              >
                Connect Gmail
              </a>
            )}
          </div>
        </div>

        {/* Gmail Label */}
        <div className="border rounded-lg p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Gmail Label
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            The Inbox Agent monitors emails under this Gmail label. Apply the
            label manually or set up a Gmail filter to route property emails
            automatically.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setLabelSaved(false);
              }}
              className="w-[240px] border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <button
              onClick={handleSaveLabel}
              disabled={labelSaving}
              className="bg-brand text-white px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-50"
            >
              {labelSaving ? "Saving..." : "Save"}
            </button>
            {labelSaved && (
              <span className="text-[11px] text-green-600">Saved</span>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="border rounded-lg p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Notifications
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Choose how you want to be notified about activity.
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                defaultChecked
                className="accent-brand"
              />
              <span className="text-xs text-gray-700">Email digest (daily)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-brand" />
              <span className="text-xs text-gray-700">Push notifications</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-brand" />
              <span className="text-xs text-gray-700">
                SMS alerts for urgent items
              </span>
            </label>
          </div>
        </div>

        {/* Account */}
        <div className="border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Account</h2>
          {userLoading ? (
            <div className="text-xs text-gray-400">Loading...</div>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input
                  type="text"
                  defaultValue={user?.name || ""}
                  className="w-[240px] border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue={user?.email || ""}
                  disabled
                  className="w-[240px] border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-400 bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
