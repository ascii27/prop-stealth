import type { TimelineEntry } from "@/lib/types";

export function TimelineEntry({ entry }: { entry: TimelineEntry }) {
  return (
    <div className="mb-3.5 relative">
      <span
        className={`absolute -left-[21px] top-1 w-2 h-2 rounded-full ${entry.isToday ? "bg-brand" : "bg-gray-300"}`}
      />
      <p className="text-xs font-medium text-gray-900">{entry.title}</p>
      <p className="text-[11px] text-gray-500">{entry.detail}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{entry.timestamp}</p>
    </div>
  );
}
