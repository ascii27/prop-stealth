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
        Free for up to 1 property · No credit card required
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
          <h2 className="text-[28px] font-bold text-gray-900 mb-3">How it works</h2>
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
              <p className="text-[13px] text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
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
      <SocialProof />
      <HowItWorks />
      <TenantEvalShowcase />
      <ForAgentsShowcase />
      <Personas />
      <CTA />
      <Footer />
    </div>
  );
}
