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
        <a
          href="#how-it-works"
          className="text-[13px] text-gray-500 hover:text-gray-700"
        >
          How It Works
        </a>
        <a
          href="#screens"
          className="text-[13px] text-gray-500 hover:text-gray-700"
        >
          Screenshots
        </a>
        <a
          href="#who-its-for"
          className="text-[13px] text-gray-500 hover:text-gray-700"
        >
          Who It&rsquo;s For
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
        Tenant evaluation,{" "}
        <span className="text-brand">shared with your client</span>
      </h1>

      {/* Subtitle */}
      <p className="text-[17px] text-gray-500 max-w-[620px] mx-auto mb-8">
        Your real estate agent runs the docs through AI, then shares the
        result with you in a single click. You ask questions, approve, or
        reject — all in one place.
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
        Built for real estate agents and the owners they work with.
      </p>
    </section>
  );
}

// ─── Social Proof ─────────────────────────────────────────────────────────────

function SocialProof() {
  const stats = [
    { value: "<10min", label: "tenant screening" },
    { value: "4", label: "scored categories per candidate" },
    { value: "100%", label: "every AI claim cites a document" },
  ];

  return (
    <section className="bg-gray-50 py-12 mt-12">
      <div className="max-w-[900px] mx-auto text-center px-6">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-8">
          What you get
        </p>
        <div className="flex justify-center gap-16">
          {stats.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-[28px] font-bold text-gray-900">
                {value}
              </span>
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
      title: "Your agent uploads the candidate's docs",
      desc: "Application, ID, income, credit, references — whatever you have. PDFs and photos both work.",
    },
    {
      n: 2,
      title: "AI generates a score and summary",
      desc: "A 0–100 risk score, 4-category breakdown, and plain-English summary — every claim cited back to a specific document.",
    },
    {
      n: 3,
      title: "You review and decide together",
      desc: "Owner reads the evaluation, asks questions in a per-tenant thread, and approves or rejects. The decision is always the human's.",
    },
  ];

  return (
    <section id="how-it-works" className="py-[72px]">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-[28px] font-bold text-gray-900 mb-3">
            How it works
          </h2>
          <p className="text-[15px] text-gray-500">
            From application to decision in under an hour.
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
              <p className="text-[13px] text-gray-500 leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Screenshots section ────────────────────────────────────────────────────

function Screenshots() {
  return (
    <section id="screens" className="bg-white py-[72px]">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[11px] text-brand uppercase tracking-widest font-semibold mb-2">
            See it
          </p>
          <h2 className="text-[28px] font-bold text-gray-900 mb-3">
            One product, two views
          </h2>
          <p className="text-[15px] text-gray-500 max-w-[640px] mx-auto">
            The agent runs the workflow; the owner reads the result and
            decides. Both sides share the same thread.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AgentSidePreview />
          <OwnerSidePreview />
        </div>
      </div>
    </section>
  );
}

// ─── Agent-side mockup ──

function AgentSidePreview() {
  return (
    <figure className="space-y-3">
      <figcaption className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold">
        Agent view · Tenant detail
      </figcaption>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Browser-chrome bar */}
        <BrowserChrome url="app.propstealth.com/agent/tenants/…" />

        <div className="p-5 space-y-4">
          {/* Header row: name + status pill + actions */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[14px] font-semibold text-gray-900">
                Alex Morgan
              </p>
              <p className="text-[10px] text-gray-500 uppercase">
                Status: ready
              </p>
            </div>
            <span className="text-[10px] bg-brand text-white px-2.5 py-1 rounded font-medium">
              Share with owner
            </span>
          </div>

          {/* Eval score card */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-brand-light px-4 py-3 border-b border-brand-border flex items-end gap-2">
              <span className="text-[28px] font-extrabold text-brand leading-none">
                86
              </span>
              <span className="text-[11px] text-brand mb-0.5">/100</span>
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Low Risk
              </span>
            </div>

            <div className="grid grid-cols-2 gap-px bg-gray-100">
              {[
                ["Income", "92"],
                ["Credit", "84"],
                ["History", "88"],
                ["Identity", "80"],
              ].map(([label, val]) => (
                <div
                  key={label}
                  className="bg-white px-3 py-2 flex justify-between items-center"
                >
                  <span className="text-[10px] text-gray-500 capitalize">
                    {label}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-800">
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Doc list (truncated) */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">
              Documents
            </p>
            <ul className="space-y-1">
              {[
                ["APPLICATION", "application.pdf"],
                ["INCOME", "april-pay-stub.pdf"],
                ["CREDIT", "credit-summary.pdf"],
              ].map(([cat, name]) => (
                <li
                  key={name}
                  className="text-[11px] text-gray-700 border border-gray-200 rounded px-2.5 py-1.5 flex justify-between"
                >
                  <span>
                    <span className="text-gray-400 mr-2 text-[9px] font-semibold">
                      {cat}
                    </span>
                    <span className="text-brand">{name}</span>
                  </span>
                  <span className="text-gray-400 text-[10px]">2 KB</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </figure>
  );
}

// ─── Owner-side mockup ──

function OwnerSidePreview() {
  return (
    <figure className="space-y-3">
      <figcaption className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold">
        Owner view · Review &amp; decide
      </figcaption>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <BrowserChrome url="app.propstealth.com/owner/tenants/…" />

        <div className="p-5 space-y-4">
          {/* Header row */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[14px] font-semibold text-gray-900">
                Alex Morgan
              </p>
              <p className="text-[10px] text-gray-500 uppercase">
                Status: shared
              </p>
            </div>
            <div className="flex gap-1.5">
              <span className="text-[10px] bg-emerald-600 text-white px-2.5 py-1 rounded font-medium">
                Approve
              </span>
              <span className="text-[10px] bg-red-600 text-white px-2.5 py-1 rounded font-medium">
                Reject
              </span>
            </div>
          </div>

          {/* AI summary preview */}
          <div className="border border-gray-200 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5">
              AI Summary
            </p>
            <p className="text-[11px] text-gray-700 leading-relaxed">
              Strong financial profile: stated income covers rent 3.0×,
              credit history is clean, and the prior-landlord reference
              describes consistent on-time rent payments over a 3-year
              tenancy. ID matches application.
            </p>
          </div>

          {/* Thread mockup */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">
              Thread
            </p>
            <div className="space-y-2">
              <div className="border border-gray-200 rounded p-2.5">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[10px] font-medium text-gray-700">
                    Sarah Park
                    <span className="text-gray-400 ml-1.5">owner</span>
                  </span>
                  <span className="text-[9px] text-gray-400">10:14 AM</span>
                </div>
                <p className="text-[11px] text-gray-700">
                  Income looks strong — was the employer verified?
                </p>
              </div>
              <div className="border border-gray-200 rounded p-2.5 bg-gray-50">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[10px] font-medium text-gray-700">
                    Diego Alvarez
                    <span className="text-gray-400 ml-1.5">agent</span>
                  </span>
                  <span className="text-[9px] text-gray-400">10:21 AM</span>
                </div>
                <p className="text-[11px] text-gray-700">
                  Pay stub is from Northwind Software, matches LinkedIn.
                  I&rsquo;ll request a verbal confirmation today.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

function BrowserChrome({ url }: { url: string }) {
  return (
    <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
      <span className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
      <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
      <span className="ml-3 flex-1 bg-white rounded text-[10px] text-gray-400 px-2 py-0.5 border border-gray-200 truncate">
        {url}
      </span>
    </div>
  );
}

// ─── Compliance + AI Detail ──────────────────────────────────────────────────

function ComplianceDetail() {
  const bullets = [
    "1–100 risk score with a plain-English summary",
    "Four scored categories: income, credit, history, identity",
    "Every concern and verified fact cites a specific document",
    "Fair Housing & FCRA compliant — never references protected attributes",
    "Output is advisory; the human owner makes the final decision",
  ];

  return (
    <section className="bg-gray-50 py-[72px]">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="flex flex-col md:flex-row-reverse items-start md:items-center gap-10">
          {/* Text */}
          <div className="flex-1">
            <p className="text-[11px] text-brand uppercase tracking-widest font-semibold mb-2">
              The evaluation
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Fast, defensible, and auditable
            </h2>
            <p className="text-[14px] text-gray-500 mb-5 leading-relaxed">
              Two passes through Claude: one to extract the basics from the
              uploaded documents, one to score the candidate against the
              property and produce a justified recommendation. The model is
              instructed to skip protected-class attributes and to cite a
              source document for every claim.
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

          {/* Visual */}
          <div className="w-full md:w-[300px] shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-brand-light px-5 py-4 border-b border-brand-border">
              <p className="text-[10px] text-brand uppercase tracking-widest font-semibold mb-1">
                Concerns
              </p>
              <p className="text-[11px] text-gray-700">
                <span className="text-amber-600">●</span> Stated income is
                self-reported (no W-2 provided)
                <span className="text-gray-400">
                  {" "}
                  — application.pdf
                </span>
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                Verified facts
              </p>
              <ul className="space-y-1.5">
                <li className="text-[11px] text-gray-700">
                  <span className="text-emerald-600">●</span> 3+ years at
                  current employer
                  <span className="text-gray-400"> — pay-stub.pdf</span>
                </li>
                <li className="text-[11px] text-gray-700">
                  <span className="text-emerald-600">●</span> Reference
                  confirms 3-year tenancy
                  <span className="text-gray-400"> — reference.pdf</span>
                </li>
                <li className="text-[11px] text-gray-700">
                  <span className="text-emerald-600">●</span> ID name matches
                  application
                  <span className="text-gray-400"> — id.pdf</span>
                </li>
              </ul>
            </div>
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
      label: "For Real Estate Agents",
      title: "Screen tenants without juggling email",
      subtitle: "You source the candidate, the platform handles the rest.",
      items: [
        "Upload all the docs in one place — PDFs or photos",
        "AI extracts the basics, then scores the candidate",
        "Share the eval with your owner-client in one click",
        "Reply to questions inline; the decision is logged",
      ],
      preview: <AgentMiniPreview />,
    },
    {
      label: "For Property Owners",
      title: "Make the call with the receipts in front of you",
      subtitle:
        "Read the AI summary, ask questions, approve or reject.",
      items: [
        "Every claim is cited back to a specific document",
        "Ask the agent anything in the per-tenant thread",
        "Approve, reject, or reopen — at any time",
        "No portal to learn — sign in with Google and go",
      ],
      preview: <OwnerMiniPreview />,
    },
  ];

  return (
    <section id="who-its-for" className="bg-white py-[72px]">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-[28px] font-bold text-gray-900 mb-2">
            Built for both sides
          </h2>
          <p className="text-[15px] text-gray-500">
            Same tenant, two roles, one shared thread.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map(({ label, title, subtitle, items, preview }) => (
            <div
              key={label}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Mini preview */}
              <div className="h-[180px] bg-gray-50 border-b border-gray-200 flex items-center justify-center p-4">
                {preview}
              </div>
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

// Tiny illustrations used as the persona-card headers.

function AgentMiniPreview() {
  return (
    <div className="w-[200px] bg-white border border-gray-200 rounded-md p-3 shadow-sm">
      <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1.5">
        Documents
      </p>
      <ul className="space-y-1">
        {[
          ["APPLICATION", "application.pdf"],
          ["INCOME", "april-pay-stub.pdf"],
          ["CREDIT", "credit-summary.pdf"],
        ].map(([cat, name]) => (
          <li
            key={name}
            className="text-[10px] flex justify-between border border-gray-200 rounded px-1.5 py-1"
          >
            <span>
              <span className="text-gray-400 mr-1 text-[8px] font-semibold">
                {cat}
              </span>
              <span className="text-brand">{name}</span>
            </span>
          </li>
        ))}
      </ul>
      <button className="mt-2 w-full bg-brand text-white text-[10px] py-1 rounded font-medium">
        Run evaluation →
      </button>
    </div>
  );
}

function OwnerMiniPreview() {
  return (
    <div className="w-[200px] bg-white border border-gray-200 rounded-md p-3 shadow-sm">
      <div className="flex items-end gap-1.5 mb-2">
        <span className="text-[24px] font-extrabold text-brand leading-none">
          86
        </span>
        <span className="text-[10px] text-brand mb-0.5">/100</span>
        <span className="ml-auto text-[8px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
          Low Risk
        </span>
      </div>
      <p className="text-[9px] text-gray-500 leading-snug mb-2">
        Income covers rent 3.0×, clean credit, references confirm 3-year
        tenancy.
      </p>
      <div className="flex gap-1.5">
        <button className="flex-1 bg-emerald-600 text-white text-[10px] py-1 rounded font-medium">
          Approve
        </button>
        <button className="flex-1 bg-red-600 text-white text-[10px] py-1 rounded font-medium">
          Reject
        </button>
      </div>
    </div>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="py-[72px] text-center bg-gradient-to-b from-gray-50 to-brand-light">
      <div className="max-w-[640px] mx-auto px-6">
        <h2 className="text-[32px] font-bold text-gray-900 mb-3">
          Better tenant decisions, faster.
        </h2>
        <p className="text-[16px] text-gray-500 mb-8">
          Join the private alpha — for agents and the owners they work with.
        </p>
        <Link
          href="/login"
          className="inline-block bg-brand text-white px-7 py-3 rounded-lg text-[15px] font-semibold hover:opacity-90 mb-4"
        >
          Get Started Free
        </Link>
        <p className="text-xs text-gray-400">
          Florida only during alpha · Sign in with Google
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
      <SocialProof />
      <HowItWorks />
      <Screenshots />
      <ComplianceDetail />
      <Personas />
      <CTA />
      <Footer />
    </div>
  );
}
