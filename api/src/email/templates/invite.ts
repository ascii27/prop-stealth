import { config } from "../../config.js";
import { escapeHtml as escape } from "./_escape.js";

export function renderInvite(p: {
  ownerName: string;
  agentName: string | null;
  message: string | null;
  token: string;
}) {
  const link = `${config.appBaseUrl}/invite/${encodeURIComponent(p.token)}`;
  const agentLabel = p.agentName || "Your agent";
  const subject = `${agentLabel} invited you to PropStealth`;
  const text = `Hi ${p.ownerName},\n\n${agentLabel} invited you to PropStealth to review tenant candidates for your property.\n\nAccept the invite:\n${link}\n\n${p.message ? `Personal note: ${p.message}\n\n` : ""}This link expires in 14 days.`;
  const html = `<p>Hi ${escape(p.ownerName)},</p>
<p>${escape(agentLabel)} invited you to PropStealth to review tenant candidates for your property.</p>
<p><a href="${link}" style="display:inline-block;padding:10px 16px;background:#059669;color:#fff;text-decoration:none;border-radius:6px">Accept the invite</a></p>
${p.message ? `<p style="border-left:3px solid #e5e7eb;padding-left:12px;color:#6b7280"><em>${escape(p.message)}</em></p>` : ""}
<p style="color:#6b7280;font-size:12px">This link expires in 14 days.</p>`;
  return { subject, html, text };
}
