import { db } from "../db/client.js";
import { config } from "../config.js";
import {
  claimPendingForUpdate,
  markSent,
  markFailedTransient,
} from "./outbox.js";
import { sendMail } from "./transport.js";

const POLL_INTERVAL_MS = 10_000;
const BATCH_SIZE = 10;

let timer: NodeJS.Timeout | null = null;
let running = false;

async function tick() {
  if (running) return; // skip if previous tick still working
  running = true;
  try {
    const claimed = await claimPendingForUpdate(db, BATCH_SIZE);
    for (const row of claimed) {
      try {
        await sendMail({
          to: row.to_email,
          subject: row.subject,
          html: row.body_html,
          text: row.body_text,
        });
        await markSent(row.id);
      } catch (err) {
        const message = (err as Error).message || String(err);
        console.error(`Outbox send failed for ${row.id}: ${message}`);
        await markFailedTransient(row.id, message);
      }
    }
  } catch (err) {
    console.error("Outbox poll error:", err);
  } finally {
    running = false;
  }
}

export function startEmailWorker() {
  if (timer) return;
  // Sentinel for environments without an SMTP server (e.g. the exe.dev sandbox).
  // Pending rows accumulate; they'll be picked up by a worker started elsewhere.
  if (config.smtp.host === "disabled") {
    console.log("Email worker not started: SMTP_HOST=disabled");
    return;
  }
  timer = setInterval(tick, POLL_INTERVAL_MS);
  // Run once on startup so we don't wait 10s for the first batch.
  tick();
}

export function stopEmailWorker() {
  if (timer) clearInterval(timer);
  timer = null;
}
