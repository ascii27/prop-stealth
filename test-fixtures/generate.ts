/* eslint-disable @typescript-eslint/no-require-imports */
// Generates fake tenant-application PDFs into test-fixtures/tenants/<persona>/
// for manual smoke testing of the AI extraction + evaluation pipeline.
//
// Run:
//   npx tsx test-fixtures/generate.ts
//
// All names, addresses, phone numbers, account numbers, and SSNs are
// fabricated. The personas only carry financial-fitness signals (income,
// credit, rental history) — no protected-class attributes are referenced,
// because the AI guardrails forbid acting on them anyway.

import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "tenants");

// ─── Persona definitions ─────────────────────────────────────────────────────

interface Persona {
  slug: string;
  name: string;
  email: string;
  phone: string;
  employer: string;
  monthly_income: number;
  move_in_date: string; // YYYY-MM-DD
  application_notes: string;

  // ID
  license_no: string;
  license_state: string;
  dob: string; // for the ID card display only

  // Income
  pay_stub_period: string;
  pay_stub_gross: number;
  pay_stub_net: number;
  pay_stub_ytd_gross: number;

  // Credit
  fico: number;
  open_accounts: number;
  late_30_days: number;
  late_60_days: number;
  collections: { creditor: string; amount: number; opened: string }[];
  derogatory_notes: string;

  // Reference
  reference_landlord: string;
  reference_property: string;
  reference_phone: string;
  reference_tenancy: string;
  reference_body: string;
}

const PERSONAS: Persona[] = [
  {
    slug: "alex-morgan",
    name: "Alex Morgan",
    email: "alex.morgan@example.test",
    phone: "(305) 555-0142",
    employer: "Northwind Software, Inc.",
    monthly_income: 9000,
    move_in_date: "2026-07-01",
    application_notes:
      "Looking for a 12-month lease. Quiet professional, no pets. Currently moving from Brickell to be closer to work.",

    license_no: "M462-189-77-510-0",
    license_state: "FL",
    dob: "1991-04-22",

    pay_stub_period: "Apr 1 – Apr 30, 2026",
    pay_stub_gross: 9000,
    pay_stub_net: 6420,
    pay_stub_ytd_gross: 36000,

    fico: 762,
    open_accounts: 6,
    late_30_days: 0,
    late_60_days: 0,
    collections: [],
    derogatory_notes: "No derogatory items in the past 24 months.",

    reference_landlord: "Margaret Chen",
    reference_property: "1450 SW 14th Ave, Miami, FL 33145",
    reference_phone: "(305) 555-0188",
    reference_tenancy: "August 2023 – present (current tenant)",
    reference_body:
      "Alex has rented from us for nearly three years. Rent is paid early every month, the unit is kept in immaculate condition, and we have never received a noise complaint. Alex notified us 60 days in advance of moving out and has been a model tenant. We would happily rent to Alex again.",
  },
  {
    slug: "casey-brooks",
    name: "Casey Brooks",
    email: "casey.brooks@example.test",
    phone: "(786) 555-0303",
    employer: "Self-employed (Brooks Design Studio LLC)",
    monthly_income: 5500,
    move_in_date: "2026-06-15",
    application_notes:
      "Freelance graphic designer; income varies month-to-month but averages $5,500. Will provide last 6 months of bank statements on request.",

    license_no: "B260-720-86-330-1",
    license_state: "FL",
    dob: "1989-11-09",

    pay_stub_period: "Apr 1 – Apr 30, 2026 (1099 / self-reported)",
    pay_stub_gross: 5800,
    pay_stub_net: 4350,
    pay_stub_ytd_gross: 22200,

    fico: 681,
    open_accounts: 4,
    late_30_days: 1,
    late_60_days: 1,
    collections: [],
    derogatory_notes:
      "One 60-day-late payment on a credit card account in October 2024 (since paid current). No collections, no charge-offs.",

    reference_landlord: "Daniel Park",
    reference_property: "318 NE 27th St, Apt 4, Miami, FL 33137",
    reference_phone: "(305) 555-0451",
    reference_tenancy: "September 2022 – present (current tenant)",
    reference_body:
      "Casey has been a generally reliable tenant for the past three and a half years. Rent has been paid on time most months, with two late payments during a slow business stretch in late 2024 — both fully paid by the end of the following month. The unit has been kept in good condition. We are not raising any concerns about renewing the lease, and Casey has been straightforward to communicate with.",
  },
  {
    slug: "jordan-reese",
    name: "Jordan Reese",
    email: "jordan.reese@example.test",
    phone: "(954) 555-0099",
    employer: "Tide & Table Restaurant Group",
    monthly_income: 3000,
    move_in_date: "2026-06-01",
    application_notes:
      "Currently working two server shifts; income figure is base wages plus reported tips averaged over the last quarter. Looking to relocate from a roommate situation into my own place.",

    license_no: "R519-846-11-002-3",
    license_state: "FL",
    dob: "1996-02-18",

    pay_stub_period: "Apr 16 – Apr 30, 2026",
    pay_stub_gross: 1450,
    pay_stub_net: 1185,
    pay_stub_ytd_gross: 11800,

    fico: 583,
    open_accounts: 3,
    late_30_days: 4,
    late_60_days: 2,
    collections: [
      {
        creditor: "Capital Recovery Services",
        amount: 2400,
        opened: "2025-08-12",
      },
    ],
    derogatory_notes:
      "Active collection account ($2,400, opened Aug 2025). Several late payments on the auto loan in 2024–2025. No formal eviction filings reported.",

    reference_landlord: "(no current landlord — applicant has been in shared housing for the past 14 months)",
    reference_property: "—",
    reference_phone: "—",
    reference_tenancy: "—",
    reference_body:
      "No prior-landlord reference provided. Applicant indicates last formal lease was March 2023 – August 2024 with a roommate; the lease was held in the roommate's name.",
  },
];

// ─── Document renderers ──────────────────────────────────────────────────────

function newDoc(outPath: string): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: "LETTER", margin: 54 });
  doc.pipe(fs.createWriteStream(outPath));
  return doc;
}

function header(doc: PDFKit.PDFDocument, title: string, subtitle?: string) {
  doc.fontSize(18).font("Helvetica-Bold").text(title, { align: "left" });
  if (subtitle) {
    doc.moveDown(0.3);
    doc.fontSize(11).font("Helvetica-Oblique").fillColor("#555").text(subtitle);
    doc.fillColor("black");
  }
  doc.moveDown(1);
  doc
    .strokeColor("#cccccc")
    .lineWidth(1)
    .moveTo(54, doc.y)
    .lineTo(558, doc.y)
    .stroke();
  doc.moveDown(1);
  doc.fontSize(11).font("Helvetica");
}

function field(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
  doc.font("Helvetica").text(value);
  doc.moveDown(0.4);
}

function section(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.6);
  doc.fontSize(12).font("Helvetica-Bold").text(title);
  doc.moveDown(0.3);
  doc.fontSize(11).font("Helvetica");
}

function footer(doc: PDFKit.PDFDocument, text: string) {
  doc.moveDown(2);
  doc
    .fontSize(8)
    .font("Helvetica-Oblique")
    .fillColor("#999")
    .text(text, { align: "center" });
  doc.fillColor("black");
}

// ─── Application ──

function renderApplication(p: Persona, dir: string) {
  const doc = newDoc(path.join(dir, "application.pdf"));
  header(
    doc,
    "Rental Application",
    "Coastline Property Management · 4400 Biscayne Blvd, Miami FL 33137",
  );

  section(doc, "Applicant");
  field(doc, "Full name", p.name);
  field(doc, "Email", p.email);
  field(doc, "Phone", p.phone);
  field(doc, "Date of birth", p.dob);

  section(doc, "Employment");
  field(doc, "Employer", p.employer);
  field(
    doc,
    "Stated monthly income",
    `$${p.monthly_income.toLocaleString()} (gross)`,
  );

  section(doc, "Move-in");
  field(doc, "Desired move-in date", p.move_in_date);
  field(doc, "Lease term requested", "12 months");

  section(doc, "Notes");
  doc.text(p.application_notes, { align: "left" });

  footer(
    doc,
    "Generated for PropStealth manual smoke testing. Not a real application.",
  );
  doc.end();
}

// ─── ID ──

function renderId(p: Persona, dir: string) {
  const doc = newDoc(path.join(dir, "id.pdf"));
  header(
    doc,
    "Driver License (sample)",
    "State of Florida — Department of Highway Safety and Motor Vehicles",
  );
  field(doc, "License number", p.license_no);
  field(doc, "Issuing state", p.license_state);
  field(doc, "Class", "E (operator)");
  field(doc, "Name", p.name);
  field(doc, "Date of birth", p.dob);
  field(doc, "Address on file", "On file with state — withheld on this copy");
  field(doc, "Issued", "2024-03-10");
  field(doc, "Expires", "2032-04-22");

  footer(
    doc,
    "Sample ID page generated for testing. Image data has been omitted; this PDF stands in for a scanned ID.",
  );
  doc.end();
}

// ─── Pay stub ──

function renderPayStub(p: Persona, dir: string) {
  const doc = newDoc(path.join(dir, "income.pdf"));
  header(doc, "Earnings Statement", `Pay period: ${p.pay_stub_period}`);

  field(doc, "Employee", p.name);
  field(doc, "Employer", p.employer);
  field(
    doc,
    "Federal employer ID",
    "**-***1234 (last 4 digits shown for sample)",
  );

  section(doc, "Earnings (this period)");
  field(doc, "Gross pay", `$${p.pay_stub_gross.toLocaleString()}.00`);
  field(
    doc,
    "Federal income tax withheld",
    `$${Math.round(p.pay_stub_gross * 0.16).toLocaleString()}.00`,
  );
  field(
    doc,
    "Social Security & Medicare",
    `$${Math.round(p.pay_stub_gross * 0.0765).toLocaleString()}.00`,
  );
  field(
    doc,
    "Health insurance",
    `$${Math.round((p.pay_stub_gross - p.pay_stub_net) * 0.2).toLocaleString()}.00`,
  );
  field(doc, "Net pay", `$${p.pay_stub_net.toLocaleString()}.00`);

  section(doc, "Year to date");
  field(doc, "YTD gross", `$${p.pay_stub_ytd_gross.toLocaleString()}.00`);

  footer(
    doc,
    "Sample earnings statement for PropStealth testing. Not a real pay stub.",
  );
  doc.end();
}

// ─── Credit ──

function renderCredit(p: Persona, dir: string) {
  const doc = newDoc(path.join(dir, "credit.pdf"));
  header(
    doc,
    "Credit Report Summary",
    "ConsumerCreditCheck (sample) · Pulled 2026-05-01",
  );

  field(doc, "Subject", p.name);
  field(doc, "FICO Score 8", String(p.fico));

  section(doc, "Account summary");
  field(doc, "Open accounts", String(p.open_accounts));
  field(doc, "Late payments (30 days)", String(p.late_30_days));
  field(doc, "Late payments (60 days)", String(p.late_60_days));
  field(doc, "Collections", String(p.collections.length));

  if (p.collections.length > 0) {
    section(doc, "Collection accounts");
    p.collections.forEach((c) => {
      doc.font("Helvetica").text(
        `• ${c.creditor} — $${c.amount.toLocaleString()} (opened ${c.opened})`,
      );
      doc.moveDown(0.2);
    });
  }

  section(doc, "Notes");
  doc.text(p.derogatory_notes);

  footer(
    doc,
    "Sample credit summary for PropStealth testing. Not a real consumer report.",
  );
  doc.end();
}

// ─── Reference ──

function renderReference(p: Persona, dir: string) {
  const doc = newDoc(path.join(dir, "reference.pdf"));
  header(
    doc,
    "Landlord Reference",
    `Subject: ${p.name}`,
  );

  field(doc, "Prior landlord", p.reference_landlord);
  field(doc, "Property", p.reference_property);
  field(doc, "Contact", p.reference_phone);
  field(doc, "Tenancy", p.reference_tenancy);

  section(doc, "Reference statement");
  doc.text(p.reference_body, { align: "left" });

  footer(
    doc,
    "Sample reference letter for PropStealth testing. Not a real reference.",
  );
  doc.end();
}

// ─── Driver ──

for (const p of PERSONAS) {
  const dir = path.join(ROOT, p.slug);
  fs.mkdirSync(dir, { recursive: true });
  renderApplication(p, dir);
  renderId(p, dir);
  renderPayStub(p, dir);
  renderCredit(p, dir);
  renderReference(p, dir);
  console.log(`wrote 5 PDFs to ${dir}`);
}
