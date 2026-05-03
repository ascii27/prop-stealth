"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface InvitationView {
  email: string;
  name: string;
  message: string | null;
  agent_name: string | null;
  agent_avatar_url: string | null;
}

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "valid"; invitation: InvitationView }
    | { kind: "invalid"; reason: string }
  >({ kind: "loading" });

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setState({ kind: "valid", invitation: data.invitation });
        } else if (res.status === 404 || res.status === 410) {
          const data = await res.json().catch(() => ({}));
          setState({
            kind: "invalid",
            reason: data.error || "This invite link is no longer valid.",
          });
        } else {
          setState({ kind: "invalid", reason: "Could not load invitation." });
        }
      })
      .catch(() =>
        setState({ kind: "invalid", reason: "Could not load invitation." }),
      );
  }, [token]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-[380px] p-8">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 bg-brand rounded-lg" />
          <span className="font-bold text-xl text-gray-900">PropStealth</span>
        </div>

        {state.kind === "loading" && (
          <p className="text-sm text-gray-500 text-center">Loading…</p>
        )}

        {state.kind === "invalid" && (
          <>
            <h1 className="text-base font-semibold text-gray-900 text-center mb-2">
              Invitation unavailable
            </h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              {state.reason} Ask your agent to send a new one.
            </p>
            <a
              href="/login"
              className="block w-full border border-gray-300 rounded-lg py-2.5 text-center text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to sign-in
            </a>
          </>
        )}

        {state.kind === "valid" && (
          <>
            <h1 className="text-base font-semibold text-gray-900 text-center mb-2">
              {state.invitation.agent_name || "Your agent"} invited you to PropStealth
            </h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              Sign in with Google as <span className="font-medium">{state.invitation.email}</span> to review tenant candidates.
            </p>

            {state.invitation.message && (
              <p className="text-xs text-gray-600 italic border-l-2 border-gray-200 pl-3 mb-6">
                &ldquo;{state.invitation.message}&rdquo;
              </p>
            )}

            <a
              href={`/api/auth/google?role=owner&invite_token=${encodeURIComponent(token)}`}
              className="w-full border border-gray-300 rounded-lg py-2.5 flex items-center justify-center gap-2.5 hover:bg-gray-50"
            >
              <span className="w-[18px] h-[18px] bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">G</span>
              </span>
              <span className="text-[13px] font-medium text-gray-700">
                Continue with Google
              </span>
            </a>
          </>
        )}
      </div>
    </div>
  );
}
