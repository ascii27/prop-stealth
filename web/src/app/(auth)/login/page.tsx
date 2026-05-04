"use client";

import { useState, useEffect } from "react";

type Role = "owner" | "agent";

const messaging: Record<Role, { headline: string; sub: string }> = {
  owner: {
    headline: "Review tenant candidates from your agent",
    sub: "AI-summarized applications, your decision.",
  },
  agent: {
    headline: "Screen tenants for your clients",
    sub: "Upload docs, share AI evaluations, manage decisions in one place.",
  },
};

export default function LoginPage() {
  const [role, setRole] = useState<Role>("owner");

  const { headline, sub } = messaging[role];
  const googleAuthUrl = `/api/auth/google?role=${role}`;

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
        <p className="text-sm font-medium text-gray-900 text-center mb-1">
          {headline}
        </p>
        <p className="text-xs text-gray-500 text-center mb-6">{sub}</p>

        {/* Google OAuth button */}
        <a
          href={googleAuthUrl}
          className="w-full border border-gray-300 rounded-lg py-2.5 flex items-center justify-center gap-2.5 mb-4 hover:bg-gray-50 transition-colors"
        >
          <span className="w-[18px] h-[18px] bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">G</span>
          </span>
          <span className="text-[13px] font-medium text-gray-700">
            Continue with Google
          </span>
        </a>

        {/* Divider */}
        <p className="text-center text-[11px] text-gray-400 mb-4">or</p>

        {/* Email — disabled for MVP */}
        <input
          type="email"
          placeholder="Email address"
          disabled
          className="w-full border border-gray-300 rounded-md py-2 px-3 text-xs text-gray-900 placeholder:text-gray-400 mb-3 opacity-50 cursor-not-allowed"
        />

        {/* Password — disabled for MVP */}
        <input
          type="password"
          placeholder="Password"
          disabled
          className="w-full border border-gray-300 rounded-md py-2 px-3 text-xs text-gray-900 placeholder:text-gray-400 mb-4 opacity-50 cursor-not-allowed"
        />

        {/* Sign Up — disabled for MVP */}
        <button
          disabled
          className="block w-full bg-gray-300 text-white py-2.5 rounded-lg text-center text-[13px] font-medium mb-4 cursor-not-allowed"
        >
          Sign Up with Email
        </button>

        {/* Sign in link */}
        <p className="text-center text-xs text-gray-500">
          Already have an account?{" "}
          <a href={googleAuthUrl} className="text-brand hover:underline">
            Sign in with Google
          </a>
        </p>

        <ErrorMessage />
      </div>
    </div>
  );
}

function ErrorMessage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setError(params.get("error"));
  }, []);

  if (!error) return null;

  const messages: Record<string, string> = {
    auth_failed: "Google sign-in failed. Please try again.",
    invalid_state: "Something went wrong. Please try again.",
    server_error: "Server error. Please try again later.",
    invite_invalid: "That invite link is not valid. Ask your agent to resend.",
    invite_expired: "That invite link has expired. Ask your agent to resend.",
    invite_email_mismatch:
      "That invite was for a different Google account. Sign in with the email your agent invited.",
  };

  return (
    <p className="text-center text-xs text-red-500 mt-4">
      {messages[error] || "An error occurred. Please try again."}
    </p>
  );
}
