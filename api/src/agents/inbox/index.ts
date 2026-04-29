import { AgentContext, AgentResult, registerAgent, logAgentRun } from "../framework.js";
import { getTokensForUser, refreshTokenIfNeeded, fetchEmailsByLabel } from "./gmail.js";
import { classifyEmail } from "./classify.js";
import { db } from "../../db/client.js";

async function inboxAgent(context: AgentContext): Promise<AgentResult> {
  const startTime = Date.now();
  const { userId } = context;

  try {
    // 1. Get Gmail connection
    const conn = await db.query(
      "SELECT * FROM gmail_connections WHERE user_id = $1",
      [userId],
    );
    if (conn.rows.length === 0) {
      const result: AgentResult = {
        status: "error",
        summary: "Gmail not connected. Go to Settings to connect your Gmail.",
        data: {},
        actions: 0,
      };
      await logAgentRun(userId, "inbox", result, Date.now() - startTime);
      return result;
    }

    const connection = conn.rows[0];
    const label = connection.label || "PropStealth";

    // 2. Refresh token if needed
    const tokens = await refreshTokenIfNeeded(userId, {
      access_token: connection.access_token,
      refresh_token: connection.refresh_token,
      token_expires_at: new Date(connection.token_expires_at),
    });

    // 3. Fetch emails from Gmail
    const rawEmails = await fetchEmailsByLabel(tokens, label);

    // 4. Filter out already-processed emails
    const existingIds = await db.query(
      "SELECT gmail_message_id FROM inbox_emails WHERE user_id = $1",
      [userId],
    );
    const processedSet = new Set(existingIds.rows.map((r: { gmail_message_id: string }) => r.gmail_message_id));
    const newEmails = rawEmails.filter((e) => !processedSet.has(e.gmailMessageId));

    if (newEmails.length === 0) {
      const result: AgentResult = {
        status: "success",
        summary: "No new emails to process.",
        data: { processed: 0 },
        actions: 0,
      };
      await logAgentRun(userId, "inbox", result, Date.now() - startTime);
      return result;
    }

    // 5. Get user's property addresses for classification context
    const propsResult = await db.query(
      "SELECT id, address, city, state, unit FROM properties WHERE user_id = $1",
      [userId],
    );
    const propertyAddresses = propsResult.rows.map(
      (p: { address: string; city: string; state: string; unit: string | null }) =>
        `${p.address}${p.unit ? `, ${p.unit}` : ""}, ${p.city}, ${p.state}`,
    );

    // 6. Classify each email and store
    let processedCount = 0;
    for (const email of newEmails) {
      const classification = await classifyEmail(
        email.sender,
        email.subject,
        email.body,
        propertyAddresses,
      );

      // Match property by address if possible
      let propertyId: string | null = null;
      if (classification.propertyMatch) {
        const match = propsResult.rows.find(
          (p: { id: string; address: string; city: string; state: string }) =>
            classification.propertyMatch!.toLowerCase().includes(p.address.toLowerCase()),
        );
        if (match) propertyId = match.id;
      }

      await db.query(
        `INSERT INTO inbox_emails
         (user_id, property_id, gmail_message_id, sender, subject, theme, key_points, full_content, show_auto_respond, violation_tag, email_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (gmail_message_id) DO NOTHING`,
        [
          userId,
          propertyId,
          email.gmailMessageId,
          email.sender,
          email.subject,
          classification.theme,
          classification.keyPoints,
          email.body,
          classification.showAutoRespond,
          classification.violationTag,
          email.date,
        ],
      );
      processedCount++;
    }

    const result: AgentResult = {
      status: "success",
      summary: `Processed ${processedCount} new email${processedCount === 1 ? "" : "s"}.`,
      data: { processed: processedCount },
      actions: processedCount,
    };
    await logAgentRun(userId, "inbox", result, Date.now() - startTime);
    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    const result: AgentResult = {
      status: "error",
      summary: errorMsg,
      data: {},
      actions: 0,
    };
    await logAgentRun(userId, "inbox", result, Date.now() - startTime);
    return result;
  }
}

// Register the agent
registerAgent("inbox", inboxAgent);

export { inboxAgent };
