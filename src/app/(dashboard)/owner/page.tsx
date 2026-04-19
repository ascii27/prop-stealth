import Link from "next/link";
import { attentionItems, timelineGroups } from "@/lib/mock-data";
import { AttentionCard } from "@/components/attention-card";
import { TimelineEntry } from "@/components/timeline-entry";

export default function OwnerHome() {
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Good morning, Dana</h1>
          <p className="text-xs text-gray-500">3 items need your attention</p>
        </div>
        <Link
          href="/owner/tenant-eval"
          className="bg-white border border-gray-300 text-gray-700 px-3.5 py-1.5 rounded-md text-xs font-medium"
        >
          + Evaluate Tenant
        </Link>
      </div>

      {/* Needs Your Attention */}
      <div className="mb-6">
        <h2 className="text-[13px] font-semibold text-gray-900 mb-2.5">Needs Your Attention</h2>
        {attentionItems.map((item) => (
          <AttentionCard key={item.id} item={item} />
        ))}
      </div>

      {/* Timeline */}
      {timelineGroups.map((group) => (
        <div key={group.label}>
          <h2 className="text-[13px] font-semibold text-gray-900 mb-2.5">{group.label}</h2>
          <div className="border-l-2 border-gray-200 pl-4 ml-1 mb-5">
            {group.entries.map((entry) => (
              <TimelineEntry key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
