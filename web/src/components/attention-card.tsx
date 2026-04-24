import type { AttentionItem } from "@/lib/types";

const bgByType: Record<AttentionItem["type"], string> = {
  proposal: "bg-blue-50 border-blue-200",
  hoa: "bg-amber-50 border-amber-200",
  "tenant-request": "bg-amber-50 border-amber-200",
};

const tagColorClass: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
};

export function AttentionCard({ item }: { item: AttentionItem }) {
  const isProposal = item.type === "proposal";

  return (
    <div className={`border rounded-lg p-3 mb-2 flex flex-row justify-between items-start ${bgByType[item.type]}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-medium text-gray-900">{item.title}</span>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded-sm ${tagColorClass[item.tagColor] ?? "bg-gray-100 text-gray-700"}`}
          >
            {item.tag}
          </span>
        </div>
        {item.detail.split("\n").map((line, i) => (
          <p key={i} className="text-[11px] text-gray-500 mt-0.5">
            {line}
          </p>
        ))}
      </div>
      <div className="ml-3 flex-shrink-0">
        {isProposal ? (
          <button className="bg-brand text-white px-2.5 py-1 rounded-[5px] text-[11px]">
            {item.linkText}
          </button>
        ) : (
          <button className="bg-white border border-gray-300 text-gray-700 px-2.5 py-1 rounded-[5px] text-[11px]">
            {item.linkText}
          </button>
        )}
      </div>
    </div>
  );
}
