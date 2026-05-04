"use client";

import { useUser } from "@/lib/user-context";

export default function OwnerSettingsPage() {
  const { user } = useUser();
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
      {user && (
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            Signed in as <strong>{user.name || user.email}</strong>
          </p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      )}
      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-900">Email notifications</p>
        <p className="text-xs text-gray-500 mt-1">
          You&rsquo;ll receive an email when your agent shares a tenant or
          replies on a thread.
        </p>
      </div>
    </div>
  );
}
