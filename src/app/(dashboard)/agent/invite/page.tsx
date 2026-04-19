export default function InvitePage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-gray-900">Invite Client</h1>
        <p className="text-xs text-gray-500">
          Send an invitation to a property owner to join PropStealth as your
          client.
        </p>
      </div>

      {/* Form */}
      <div className="border border-gray-200 rounded-lg p-5 max-w-[480px]">
        <div className="space-y-4">
          {/* Client Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Client Name
            </label>
            <input
              type="text"
              placeholder="Full name"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              placeholder="client@example.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
            />
          </div>

          {/* Personal Message */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Personal Message
            </label>
            <textarea
              placeholder="Add a personal note..."
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand resize-none"
            />
          </div>

          {/* Submit */}
          <button className="bg-brand text-white px-4 py-2 rounded-md text-xs font-medium w-full">
            Send Invitation
          </button>

          {/* Note */}
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Your client will receive an email with a link to sign up as a
            Property Owner on PropStealth.
          </p>
        </div>
      </div>
    </div>
  );
}
