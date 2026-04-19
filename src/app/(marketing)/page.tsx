import Link from "next/link";

// ─── Nav ────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav className="flex items-center justify-between px-12 py-4 border-b border-gray-100">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-brand rounded-[7px]" />
        <span className="font-bold text-lg text-gray-900">PropStealth</span>
      </div>

      {/* Links + CTA */}
      <div className="flex items-center gap-7">
        <a href="#how-it-works" className="text-[13px] text-gray-500 hover:text-gray-700">
          How It Works
        </a>
        <a href="#for-agents" className="text-[13px] text-gray-500 hover:text-gray-700">
          For Agents
        </a>
        <a href="#pricing" className="text-[13px] text-gray-500 hover:text-gray-700">
          Pricing
        </a>
        <Link
          href="/login"
          className="bg-brand text-white px-4.5 py-2 rounded-[7px] text-[13px] font-medium hover:opacity-90"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="pt-20 max-w-[1100px] mx-auto text-center px-6">
      {/* Alpha badge */}
      <span className="inline-block text-[11px] text-brand bg-brand-light border border-brand-border px-3.5 py-1 rounded-full font-medium mb-5">
        Now in private alpha · Florida
      </span>

      {/* H1 */}
      <h1 className="text-[44px] font-extrabold leading-[1.15] tracking-tight text-gray-900 mb-5">
        Your rental properties, managed by{" "}
        <span className="text-brand">AI agents</span>
      </h1>

      {/* Subtitle */}
      <p className="text-[17px] text-gray-500 max-w-[580px] mx-auto mb-8">
        PropStealth reads your email, screens tenants, and keeps you on top of
        every property — so you can stop managing and start growing.
      </p>

      {/* CTAs */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <Link
          href="/login"
          className="bg-brand text-white px-7 py-3 rounded-lg text-[15px] font-semibold hover:opacity-90"
        >
          Get Started Free
        </Link>
        <a
          href="#how-it-works"
          className="bg-white border border-gray-300 text-gray-700 px-7 py-3 rounded-lg text-[15px] font-semibold hover:bg-gray-50"
        >
          See How It Works
        </a>
      </div>

      {/* Sub text */}
      <p className="text-xs text-gray-400">
        Free for up to 1 property · No credit card required
      </p>
    </section>
  );
}

// ─── App Preview ─────────────────────────────────────────────────────────────

function AppPreview() {
  return (
    <section className="max-w-[900px] mx-auto mt-12 px-6">
      <div className="rounded-t-xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Browser chrome bar */}
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <div className="ml-4 flex-1 bg-white rounded px-3 py-0.5 text-[11px] text-gray-400 border border-gray-200">
            app.propstealth.com
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="flex h-[340px]">
          {/* Mini sidebar */}
          <div className="w-[180px] bg-sidebar border-r border-gray-100 flex flex-col p-3 gap-1 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-brand rounded-md" />
              <span className="text-xs font-semibold text-gray-800">PropStealth</span>
            </div>
            {["Dashboard", "Inbox", "Tenants", "Properties", "Documents"].map(
              (item, i) => (
                <div
                  key={item}
                  className={`text-[11px] px-2 py-1.5 rounded-md ${
                    i === 0
                      ? "bg-brand text-white font-medium"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {item}
                </div>
              )
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 bg-white p-6 overflow-hidden">
            <p className="text-[11px] text-gray-400 mb-0.5">Sunday, April 19</p>
            <h2 className="text-lg font-bold text-gray-900 mb-0.5">
              Good morning, Dana
            </h2>
            <p className="text-[13px] text-gray-500 mb-4">
              3 items need your attention
            </p>

            {/* Attention cards */}
            <div className="flex flex-col gap-2">
              {/* Blue card */}
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="w-2 h-2 mt-1 rounded-full bg-blue-400 shrink-0" />
                <div>
                  <p className="text-[12px] font-semibold text-blue-900">
                    New rental application received
                  </p>
                  <p className="text-[11px] text-blue-600">
                    James T. applied for 412 Oak Ave — review tenant eval
                  </p>
                </div>
              </div>

              {/* Amber card 1 */}
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <div className="w-2 h-2 mt-1 rounded-full bg-amber-400 shrink-0" />
                <div>
                  <p className="text-[12px] font-semibold text-amber-900">
                    Lease renewal due in 14 days
                  </p>
                  <p className="text-[11px] text-amber-600">
                    Unit 3B at Sunset Ridge — draft renewal or notify tenant
                  </p>
                </div>
              </div>

              {/* Amber card 2 */}
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <div className="w-2 h-2 mt-1 rounded-full bg-amber-400 shrink-0" />
                <div>
                  <p className="text-[12px] font-semibold text-amber-900">
                    HOA invoice needs approval
                  </p>
                  <p className="text-[11px] text-amber-600">
                    $245 quarterly fee — tap to approve payment
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Social Proof ─────────────────────────────────────────────────────────────

function SocialProof() {
  const stats = [
    { value: "6hrs", label: "saved per week" },
    { value: "142", label: "emails auto-classified" },
    { value: "<10min", label: "tenant screening" },
  ];

  return (
    <section className="bg-gray-50 py-12 mt-12">
      <div className="max-w-[900px] mx-auto text-center px-6">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-8">
          Early results from alpha users
        </p>
        <div className="flex justify-center gap-16">
          {stats.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-[28px] font-bold text-gray-900">{value}</span>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      n: 1,
      title: "Connect your Gmail",
      desc: "Link your Google account in one click. PropStealth starts reading and classifying your property-related emails immediately — no setup required.",
    },
    {
      n: 2,
      title: "Add your properties",
      desc: "Enter your properties in minutes. Agents automatically associate incoming emails, documents, and actions with the right address.",
    },
    {
      n: 3,
      title: "Let agents work for you",
      desc: "AI agents triage your inbox, screen applicants, and flag decisions. You review and approve — spending minutes, not hours, each week.",
    },
  ];

  return (
    <section id="how-it-works" className="py-[72px]">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-[28px] font-bold text-gray-900 mb-3">How it works</h2>
          <p className="text-[15px] text-gray-500">
            Set up in 5 minutes. AI agents start working immediately.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {steps.map(({ n, title, desc }) => (
            <div
              key={n}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <div className="w-7 h-7 bg-brand-light text-brand rounded-[7px] flex items-center justify-center text-[13px] font-bold mb-4">
                {n}
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Inbox Agent Showcase ─────────────────────────────────────────────────────

function InboxAgentShowcase() {
  const bullets = [
    "Auto-classifies every email by property, urgency, and action type",
    "Drafts replies for your review — send with one click",
    "Surfaces only the emails that need a human decision",
    "Learns your preferences over time to get smarter",
  ];

  return (
    <section className="bg-gray-50 py-[72px]">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="flex items-center gap-12">
          {/* Text */}
          <div className="flex-1">
            <p className="text-[11px] text-brand uppercase tracking-widest font-semibold mb-2">
              Inbox Agent
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your email, sorted and summarized
            </h2>
            <p className="text-[14px] text-gray-500 mb-5 leading-relaxed">
              Stop drowning in tenant emails. The Inbox Agent reads your
              connected Gmail, classifies every message, and prepares concise
              summaries — so you always know what&apos;s happening across all your
              properties.
            </p>
            <ul className="flex flex-col gap-2">
              {bullets.map((b) => (
                <li
                  key={b}
                  className="text-[13px] text-gray-700 pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-brand before:font-semibold"
                >
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Visual: Mini inbox mockup */}
          <div className="w-[320px] shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-gray-800">Inbox</span>
              <span className="text-[10px] text-gray-400">3 unread</span>
            </div>

            {/* Email rows */}
            {[
              {
                dot: "bg-blue-400",
                sender: "James T.",
                subject: "Rental application — 412 Oak Ave",
                time: "9:14 AM",
                tag: "Tenant",
              },
              {
                dot: "bg-purple-400",
                sender: "Sunset Ridge HOA",
                subject: "Q2 dues invoice attached",
                time: "Yesterday",
                tag: "HOA",
              },
              {
                dot: "bg-gray-300",
                sender: "City Water Dept.",
                subject: "Monthly statement ready",
                time: "Mon",
                tag: "Utility",
              },
            ].map(({ dot, sender, subject, time, tag }) => (
              <div
                key={subject}
                className="px-4 py-3 border-b border-gray-50 flex items-start gap-3 hover:bg-gray-50"
              >
                <div className={`w-2 h-2 mt-1.5 rounded-full ${dot} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-semibold text-gray-800 truncate">
                      {sender}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-2 shrink-0">
                      {time}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{subject}</p>
                  <span className="inline-block mt-1 text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                </div>
              </div>
            ))}

            {/* Auto-respond button */}
            <div className="px-4 py-3">
              <button className="w-full bg-brand text-white text-[11px] font-medium py-2 rounded-lg hover:opacity-90">
                Auto-respond to 2 emails →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Tenant Evaluation Showcase ───────────────────────────────────────────────

function TenantEvalShowcase() {
  const bullets = [
    "Upload application, ID, income docs, and references",
    "AI cross-references all documents for consistency",
    "1–100 risk score with narrative justification",
    "Fair Housing & FCRA compliant — never flags protected attributes",
    "Delivers results in under 10 minutes",
  ];

  return (
    <section className="bg-white py-[72px]">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="flex flex-row-reverse items-center gap-12">
          {/* Text */}
          <div className="flex-1">
            <p className="text-[11px] text-brand uppercase tracking-widest font-semibold mb-2">
              Tenant Evaluation
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Screen tenants in minutes, not days
            </h2>
            <p className="text-[14px] text-gray-500 mb-5 leading-relaxed">
              Upload an application and supporting documents. The Tenant
              Evaluation Agent analyzes everything and returns a scored,
              justified recommendation — so you make confident decisions fast.
            </p>
            <ul className="flex flex-col gap-2">
              {bullets.map((b) => (
                <li
                  key={b}
                  className="text-[13px] text-gray-700 pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-brand before:font-semibold"
                >
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Visual: Mini tenant eval card */}
          <div className="w-[300px] shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Score header */}
            <div className="bg-brand-light px-5 py-4 border-b border-brand-border">
              <p className="text-[10px] text-brand uppercase tracking-widest font-semibold mb-1">
                Risk Score
              </p>
              <div className="flex items-end gap-2">
                <span className="text-[40px] font-extrabold text-brand leading-none">
                  82
                </span>
                <span className="text-[13px] text-brand mb-1">/ 100</span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-px bg-gray-100 border-b border-gray-100">
              {[
                ["Income", "Strong"],
                ["Credit", "Good"],
                ["References", "Verified"],
                ["ID", "Confirmed"],
              ].map(([label, val]) => (
                <div key={label} className="bg-white px-3 py-2">
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-0.5">
                    {label}
                  </p>
                  <p className="text-[11px] font-semibold text-gray-800">{val}</p>
                </div>
              ))}
            </div>

            {/* Recommendation badge */}
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Recommended — Approve
              </span>
            </div>

            {/* Summary */}
            <div className="px-4 py-3">
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Applicant demonstrates stable employment (3+ yrs), income
                3.2× rent, and positive landlord references. No significant
                inconsistencies found.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── For Agents Showcase ──────────────────────────────────────────────────────

function ForAgentsShowcase() {
  const bullets = [
    "Offer ongoing portfolio management to investor clients",
    "Turn one-time commissions into recurring relationships",
    "White-label reports and insights for your clients",
    "Get alerts when clients may be ready to buy or sell",
  ];

  return (
    <section id="for-agents" className="bg-gray-50 py-[72px]">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="flex items-center gap-12">
          {/* Text */}
          <div className="flex-1">
            <p className="text-[11px] text-brand uppercase tracking-widest font-semibold mb-2">
              For Real Estate Agents
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Help your clients grow wealth — not just buy a home
            </h2>
            <p className="text-[14px] text-gray-500 mb-5 leading-relaxed">
              PropStealth gives real estate agents a platform to stay
              relevant after the sale — delivering ongoing value to investor
              clients without adding headcount.
            </p>
            <ul className="flex flex-col gap-2">
              {bullets.map((b) => (
                <li
                  key={b}
                  className="text-[13px] text-gray-700 pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-brand before:font-semibold"
                >
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Visual: placeholder */}
          <div className="w-[320px] shrink-0 bg-gray-200 h-[300px] rounded-xl flex items-center justify-center">
            <span className="text-[13px] text-gray-400 font-medium">
              Agent dashboard preview
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Personas ─────────────────────────────────────────────────────────────────

function Personas() {
  const cards = [
    {
      label: "Property Owners",
      title: "Manage your portfolio",
      subtitle: "For landlords with 1–5 rental properties",
      items: [
        "Triage your inbox in minutes each week",
        "Screen tenants with AI-generated risk scores",
        "Never miss a lease renewal or utility bill",
        "Build equity faster with portfolio analytics",
      ],
    },
    {
      label: "Real Estate Agents",
      title: "Grow your clients' wealth",
      subtitle: "For agents who want recurring client relationships",
      items: [
        "Offer property management as a service",
        "Stay top-of-mind between transactions",
        "Get alerts when clients are ready to expand",
        "Branded client reports and performance insights",
      ],
    },
  ];

  return (
    <section className="bg-gray-50 py-[72px]">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-[28px] font-bold text-gray-900 mb-2">
            Built for both sides
          </h2>
          <p className="text-[15px] text-gray-500">
            Whether you own the property or help someone buy it.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {cards.map(({ label, title, subtitle, items }) => (
            <div
              key={label}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Placeholder image */}
              <div className="h-[180px] bg-gray-200" />
              {/* Body */}
              <div className="p-6">
                <p className="text-[10px] text-brand uppercase tracking-widest font-semibold mb-1">
                  {label}
                </p>
                <h3 className="text-[16px] font-bold text-gray-900 mb-1">
                  {title}
                </h3>
                <p className="text-[13px] text-gray-500 mb-4">{subtitle}</p>
                <ul className="flex flex-col gap-2">
                  {items.map((item) => (
                    <li
                      key={item}
                      className="text-[13px] text-gray-700 pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-brand before:font-semibold"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonial ──────────────────────────────────────────────────────────────

function Testimonial() {
  return (
    <section className="py-[72px] text-center">
      <div className="max-w-[640px] mx-auto px-6">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-gray-200 mx-auto mb-5" />
        {/* Quote */}
        <blockquote className="italic text-lg text-gray-700 mb-5 leading-relaxed">
          &ldquo;I used to spend Sunday nights going through 30+ emails about my
          three properties. Now I open PropStealth and everything&apos;s already
          sorted — I just review and approve.&rdquo;
        </blockquote>
        {/* Attribution */}
        <p className="text-[13px] text-gray-400">
          Michael R. · 3 properties in Tampa · Alpha user
        </p>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="py-[72px] text-center bg-gradient-to-b from-gray-50 to-brand-light">
      <div className="max-w-[640px] mx-auto px-6">
        <h2 className="text-[32px] font-bold text-gray-900 mb-3">
          Stop managing. Start growing.
        </h2>
        <p className="text-[16px] text-gray-500 mb-8">
          Join the private alpha — free for your first property.
        </p>
        <Link
          href="/login"
          className="inline-block bg-brand text-white px-7 py-3 rounded-lg text-[15px] font-semibold hover:opacity-90 mb-4"
        >
          Get Started Free
        </Link>
        <p className="text-xs text-gray-400">
          Florida only during alpha · No credit card required
        </p>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-gray-200 px-12 py-6 flex justify-between items-center">
      <p className="text-xs text-gray-400">
        © 2026 PropStealth. All rights reserved.
      </p>
      <div className="flex items-center gap-5">
        <a href="#" className="text-xs text-gray-400 hover:text-gray-600">
          Privacy
        </a>
        <a href="#" className="text-xs text-gray-400 hover:text-gray-600">
          Terms
        </a>
        <a href="#" className="text-xs text-gray-400 hover:text-gray-600">
          Contact
        </a>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Nav />
      <Hero />
      <AppPreview />
      <SocialProof />
      <HowItWorks />
      <InboxAgentShowcase />
      <TenantEvalShowcase />
      <ForAgentsShowcase />
      <Personas />
      <Testimonial />
      <CTA />
      <Footer />
    </div>
  );
}
