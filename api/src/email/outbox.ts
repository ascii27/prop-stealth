import { db } from "../db/client.js";

export interface OutboxEnqueueParams {
  toEmail: string;
  toUserId?: string | null;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  templateKey: string;
}

export async function enqueueEmail(p: OutboxEnqueueParams): Promise<string> {
  const result = await db.query(
    `INSERT INTO email_outbox
       (to_email, to_user_id, subject, body_html, body_text, template_key)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      p.toEmail,
      p.toUserId || null,
      p.subject,
      p.bodyHtml,
      p.bodyText,
      p.templateKey,
    ],
  );
  return result.rows[0].id;
}

export interface ClaimedRow {
  id: string;
  to_email: string;
  subject: string;
  body_html: string;
  body_text: string;
}

interface QueryRunner {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

// Atomically claim up to `limit` pending rows. Concurrency-safe via FOR UPDATE
// SKIP LOCKED so a second worker (or a stuck transaction) cannot double-claim
// the same row.
export async function claimPendingForUpdate(
  runner: QueryRunner,
  limit: number,
): Promise<ClaimedRow[]> {
  const sql = `
    UPDATE email_outbox
       SET attempts = attempts + 1,
           last_attempt_at = NOW()
     WHERE id IN (
       SELECT id
         FROM email_outbox
        WHERE status = 'pending' AND attempts < 5
        ORDER BY created_at
        LIMIT $1
        FOR UPDATE SKIP LOCKED
     )
   RETURNING id, to_email, subject, body_html, body_text;`;
  const result = await runner.query<ClaimedRow>(sql, [limit]);
  return result.rows;
}

export async function markSent(id: string): Promise<void> {
  await db.query(
    `UPDATE email_outbox
        SET status = 'sent', sent_at = NOW(), error = NULL
      WHERE id = $1`,
    [id],
  );
}

// attempts already incremented by the claim; promote to 'failed' when we hit 5.
export async function markFailedTransient(
  id: string,
  err: string,
): Promise<void> {
  await db.query(
    `UPDATE email_outbox
        SET error = $1,
            status = CASE WHEN attempts >= 5 THEN 'failed' ELSE status END
      WHERE id = $2`,
    [err, id],
  );
}
