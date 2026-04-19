"use client";

import { useState } from "react";
import type { Email } from "@/lib/types";

interface EmailCardProps {
  email: Email;
}

export function EmailCard({ email }: EmailCardProps) {
  const [expanded, setExpanded] = useState(false);

  const context = email.unit
    ? `${email.unit} · ${email.timestamp}`
    : email.timestamp;

  return (
    <div className="border border-gray-200 rounded-lg p-3 mb-1.5">
      <div className="flex justify-between items-start">
        {/* Left */}
        <div className="flex-1">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-900">
              {email.sender}
            </span>
            <span className="text-[10px] text-gray-500">{context}</span>
            {email.violationTag && (
              <span className="text-[9px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded-sm">
                {email.violationTag}
              </span>
            )}
          </div>

          {/* Key points */}
          <p className="text-xs text-gray-700 leading-relaxed">
            <span className="font-bold text-gray-900">Key points:</span>{" "}
            {email.keyPoints}
          </p>

          {/* Expanded content */}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <pre className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap font-sans">
                {email.fullContent}
              </pre>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex gap-1.5 ml-3 flex-shrink-0">
          {email.showAutoRespond && (
            <button className="bg-brand text-white px-2.5 py-1 rounded-[5px] text-[11px] whitespace-nowrap">
              Auto-respond
            </button>
          )}
          <button
            className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-[5px] text-[11px]"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Collapse ▴" : "Expand ▾"}
          </button>
        </div>
      </div>
    </div>
  );
}
