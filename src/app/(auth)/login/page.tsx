"use client";

import { useState } from "react";
import Link from "next/link";

type Role = "owner" | "agent";

const messaging: Record<Role, { headline: string; sub: string }> = {
  owner: {
    headline: "Manage your rental properties with AI",
    sub: "Automate inbox triage, screen tenants, and stay on top of your portfolio.",
  },
  agent: {
    headline: "Grow your clients' wealth with AI",
    sub: "Source tenants, manage client portfolios, and offer ongoing property services.",
  },
};

export default function LoginPage() {
  const [role, setRole] = useState<Role>("owner");

  const { headline, sub } = messaging[role];
  const dashboardHref = role === "owner" ? "/owner" : "/agent";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-[340px] p-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 bg-brand rounded-lg" />
          <span className="font-bold text-xl text-gray-900">PropStealth</span>
        </div>

        {/* Role toggle */}
        <div className="flex flex-row bg-gray-100 rounded-lg p-0.5 mb-6">
          <button
            onClick={() => setRole("owner")}
            className={`flex-1 text-center py-2 text-[13px] rounded-md transition-colors ${
              role === "owner"
                ? "bg-white font-medium text-gray-900 shadow-sm"
                : "text-gray-500 cursor-pointer"
            }`}
          >
            Property Owner
          </button>
          <button
            onClick={() => setRole("agent")}
            className={`flex-1 text-center py-2 text-[13px] rounded-md transition-colors ${
              role === "agent"
                ? "bg-white font-medium text-gray-900 shadow-sm"
                : "text-gray-500 cursor-pointer"
            }`}
          >
            Real Estate Agent
          </button>
        </div>

        {/* Messaging */}
        <p className="text-sm font-medium text-gray-900 text-center mb-1">{headline}</p>
        <p className="text-xs text-gray-500 text-center mb-6">{sub}</p>

        {/* Google OAuth button */}
        <button className="w-full border border-gray-300 rounded-lg py-2.5 flex items-center justify-center gap-2.5 mb-4">
          <span className="w-[18px] h-[18px] bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">G</span>
          </span>
          <span className="text-[13px] font-medium text-gray-700">Continue with Google</span>
        </button>

        {/* Divider */}
        <p className="text-center text-[11px] text-gray-400 mb-4">or</p>

        {/* Email input */}
        <input
          type="email"
          placeholder="Email address"
          className="w-full border border-gray-300 rounded-md py-2 px-3 text-xs text-gray-900 placeholder:text-gray-400 mb-3"
        />

        {/* Password input */}
        <input
          type="password"
          placeholder="Password"
          className="w-full border border-gray-300 rounded-md py-2 px-3 text-xs text-gray-900 placeholder:text-gray-400 mb-4"
        />

        {/* Sign Up button */}
        <Link
          href={dashboardHref}
          className="block w-full bg-brand text-white py-2.5 rounded-lg text-center text-[13px] font-medium mb-4"
        >
          Sign Up
        </Link>

        {/* Sign in link */}
        <p className="text-center text-xs text-gray-500">
          Already have an account?{" "}
          <span className="text-brand">Sign in</span>
        </p>
      </div>
    </div>
  );
}
