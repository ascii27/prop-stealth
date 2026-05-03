import { config } from "../../config.js";
import { escapeHtml as escape } from "./_escape.js";

export interface SharedTenantSummary {
  id: string;
  applicant_name: string | null;
  property_address: string;
  overall_score: number | null;
}

export function renderTenantsShared(p: {
  ownerName: string | null;
  agentName: string | null;
  tenants: SharedTenantSummary[];
}) {
  const count = p.tenants.length;
  const subject =
    count === 1
      ? `${p.agentName || "Your agent"} shared a tenant candidate with you`
      : `${p.agentName || "Your agent"} shared ${count} tenant candidates with you`;

  const tenantsList = p.tenants
    .map((t) => {
      const link = `${config.appBaseUrl}/owner/tenants/${t.id}`;
      const score =
        t.overall_score != null ? ` — score ${t.overall_score}/100` : "";
      return `<li><a href="${link}">${escape(t.applicant_name || "(unnamed applicant)")}</a> · ${escape(t.property_address)}${score}</li>`;
    })
    .join("");

  const html = `<p>Hi ${escape(p.ownerName || "there")},</p>
<p>${escape(p.agentName || "Your agent")} shared the following tenant ${count === 1 ? "candidate" : "candidates"} with you for review:</p>
<ul>${tenantsList}</ul>
<p>Open PropStealth to read the AI summary, ask questions, or approve.</p>`;

  const text =
    `${p.agentName || "Your agent"} shared ${count} tenant ${count === 1 ? "candidate" : "candidates"} with you:\n\n` +
    p.tenants
      .map(
        (t) =>
          `- ${t.applicant_name || "(unnamed)"} — ${t.property_address} (${config.appBaseUrl}/owner/tenants/${t.id})`,
      )
      .join("\n");

  return { subject, html, text };
}
