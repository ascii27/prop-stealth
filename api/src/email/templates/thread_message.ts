import { config } from "../../config.js";
import { escapeHtml as escape } from "./_escape.js";

export function renderThreadMessage(p: {
  recipientName: string | null;
  authorName: string | null;
  applicantName: string | null;
  body: string;
  tenantId: string;
  recipientRole: "owner" | "agent";
}) {
  const link = `${config.appBaseUrl}/${p.recipientRole}/tenants/${p.tenantId}`;
  const applicantLabel = p.applicantName || "the tenant candidate";
  const subject = `${p.authorName || "Someone"} replied about ${applicantLabel}`;
  const excerpt =
    p.body.length > 240 ? p.body.slice(0, 237) + "…" : p.body;
  const html = `<p>Hi ${escape(p.recipientName || "there")},</p>
<p><strong>${escape(p.authorName || "Someone")}</strong> wrote about <strong>${escape(applicantLabel)}</strong>:</p>
<blockquote style="border-left:3px solid #e5e7eb;padding-left:12px;color:#374151">${escape(excerpt)}</blockquote>
<p><a href="${link}">View the conversation</a></p>`;
  const text = `${p.authorName || "Someone"} wrote about ${applicantLabel}:\n\n${excerpt}\n\nView: ${link}`;
  return { subject, html, text };
}
