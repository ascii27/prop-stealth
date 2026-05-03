import nodemailer from "nodemailer";
import { config } from "../config.js";

export const mailer = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false, // Mailpit is plain SMTP; production can override with TLS.
  auth: config.smtp.user
    ? { user: config.smtp.user, pass: config.smtp.pass }
    : undefined,
});

export async function sendMail(p: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  await mailer.sendMail({
    from: config.smtp.from,
    to: p.to,
    subject: p.subject,
    html: p.html,
    text: p.text,
  });
}
