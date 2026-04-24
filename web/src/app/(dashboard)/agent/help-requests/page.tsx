import { helpRequests } from "@/lib/mock-data";

export default function HelpRequestsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-gray-900">Help Requests</h1>
        <p className="text-xs text-gray-500">
          Client-initiated requests for your help
        </p>
      </div>

      {/* Request list */}
      <div className="space-y-3">
        {helpRequests.map((request) => (
          <div
            key={request.id}
            className="border border-gray-200 rounded-lg p-4"
          >
            {/* Top row */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2.5">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-blue-600">
                    {request.clientInitials}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    {request.clientName}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {request.propertyAddress} · {request.timestamp}
                  </p>
                </div>
              </div>
              <button className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-md text-xs">
                View
              </button>
            </div>

            {/* Message — indented past avatar (8px gap + 32px avatar = 40px + gap ~2px) */}
            <p className="text-xs text-gray-700 leading-relaxed ml-[42px]">
              {request.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
