import { config } from "../../config.js";
import { escapeHtml as escape } from "./_escape.js";

export function renderDecision(p: {
  agentName: string | null;
  ownerName: string | null;
  applicantName: string | null;
  decision: "approved" | "rejected";
  note: string | null;
  tenantId: string;
}) {
  const verb = p.decision === "approved" ? "approved" : "rejected";
  const subject = `${p.ownerName || "Your client"} ${verb} ${p.applicantName || "the tenant"}`;
  const link = `${config.appBaseUrl}/agent/tenants/${p.tenantId}`;
  const html = `<p>Hi ${escape(p.agentName || "there")},</p>
<p><strong>${escape(p.ownerName || "Your client")}</strong> ${verb} <strong>${escape(p.applicantName || "the tenant")}</strong>.</p>
${p.note ? `<p><em>"${escape(p.note)}"</em></p>` : ""}
<p><a href="${link}">Open in PropStealth</a></p>`;
  const text = `${p.ownerName || "Your client"} ${verb} ${p.applicantName || "the tenant"}.${p.note ? `\n\n"${p.note}"` : ""}\n\n${link}`;
  return { subject, html, text };
}
