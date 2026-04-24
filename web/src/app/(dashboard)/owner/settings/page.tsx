export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900 mb-5">Settings</h1>

      <div className="max-w-[560px]">
        {/* Gmail Connection */}
        <div className="border rounded-lg p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Gmail Connection
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Connect your Gmail account so the Inbox Agent can monitor your
            property emails.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-1 rounded bg-brand-light border border-brand-border flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              <span className="text-brand font-medium">Connected</span>
            </span>
            <span className="text-xs text-gray-500">dana.martinez@gmail.com</span>
          </div>
        </div>

        {/* Gmail Label */}
        <div className="border rounded-lg p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Gmail Label
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            The Inbox Agent monitors emails under this Gmail label. Apply the
            label manually or set up a Gmail filter to route property emails
            automatically.
          </p>
          <input
            type="text"
            defaultValue="PropStealth"
            className="w-[240px] border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        {/* Notifications */}
        <div className="border rounded-lg p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Notifications
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Choose how you want to be notified about activity.
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                defaultChecked
                className="accent-brand"
              />
              <span className="text-xs text-gray-700">Email digest (daily)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-brand"
              />
              <span className="text-xs text-gray-700">Push notifications</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-brand"
              />
              <span className="text-xs text-gray-700">
                SMS alerts for urgent items
              </span>
            </label>
          </div>
        </div>

        {/* Account */}
        <div className="border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Account</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input
                type="text"
                defaultValue="Dana Martinez"
                className="w-[240px] border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input
                type="email"
                defaultValue="dana.martinez@gmail.com"
                disabled
                className="w-[240px] border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-400 bg-gray-50 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
