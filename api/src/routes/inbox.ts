import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { JwtPayload } from "../types.js";
import { db } from "../db/client.js";
import { getAgent } from "../agents/framework.js";
import "../agents/inbox/index.js"; // side-effect: registers the inbox agent
import { getTokensForUser, refreshTokenIfNeeded, createDraftReply } from "../agents/inbox/gmail.js";
import { generateReplyDraft } from "../agents/inbox/classify.js";

const router = Router();

// POST /scan — trigger inbox agent scan
router.post("/scan", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;

    const agent = getAgent("inbox");
    if (!agent) {
      res.status(500).json({ error: "Inbox agent not registered" });
      return;
    }

    const result = await agent({
      userId,
      agentName: "inbox",
      params: {},
    });

    res.json({ result });
  } catch (err) {
    console.error("Inbox scan error:", err);
    res.status(500).json({ error: "Scan failed" });
  }
});

// GET /emails — list processed emails, grouped by property
router.get("/emails", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;

    // Fetch all emails for this user, joined with property info
    const result = await db.query(
      `SELECT ie.*,
              p.address as property_address,
              p.city as property_city,
              p.state as property_state,
              p.unit as property_unit
       FROM inbox_emails ie
       LEFT JOIN properties p ON p.id = ie.property_id
       WHERE ie.user_id = $1
       ORDER BY ie.email_date DESC`,
      [userId],
    );

    // Group by property
    const propertyMap = new Map<string, {
      propertyId: string | null;
      address: string;
      city: string;
      emails: typeof result.rows;
    }>();

    for (const row of result.rows) {
      const key = row.property_id || "unmatched";
      if (!propertyMap.has(key)) {
        propertyMap.set(key, {
          propertyId: row.property_id,
          address: row.property_address || "Unmatched",
          city: row.property_city && row.property_state
            ? `${row.property_city}, ${row.property_state}`
            : "",
          emails: [],
        });
      }
      propertyMap.get(key)!.emails.push(row);
    }

    const groups = Array.from(propertyMap.values());

    // Also get the last scan time
    const lastScan = await db.query(
      "SELECT created_at FROM agent_runs WHERE user_id = $1 AND agent_name = 'inbox' ORDER BY created_at DESC LIMIT 1",
      [userId],
    );

    res.json({
      groups,
      lastScannedAt: lastScan.rows[0]?.created_at || null,
    });
  } catch (err) {
    console.error("List emails error:", err);
    res.status(500).json({ error: "Failed to list emails" });
  }
});

// POST /emails/:id/draft — generate auto-respond draft
router.post("/emails/:id/draft", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    const emailId = req.params.id;

    // Fetch the email
    const emailResult = await db.query(
      "SELECT * FROM inbox_emails WHERE id = $1 AND user_id = $2",
      [emailId, userId],
    );
    if (emailResult.rows.length === 0) {
      res.status(404).json({ error: "Email not found" });
      return;
    }
    const email = emailResult.rows[0];

    // Build property context
    let propertyContext = "No specific property context available.";
    if (email.property_id) {
      const propResult = await db.query(
        "SELECT address, city, state, unit, occupied, tenant_name FROM properties WHERE id = $1",
        [email.property_id],
      );
      if (propResult.rows.length > 0) {
        const p = propResult.rows[0];
        propertyContext = `Property: ${p.address}${p.unit ? `, ${p.unit}` : ""}, ${p.city}, ${p.state}. ${p.occupied ? `Occupied by ${p.tenant_name || "tenant"}.` : "Currently vacant."}`;
      }
    }

    // Generate draft text with Claude
    const draftText = await generateReplyDraft(
      {
        sender: email.sender,
        subject: email.subject || "",
        body: email.full_content || "",
        theme: email.theme,
      },
      propertyContext,
    );

    // Get Gmail tokens and create draft
    const tokens = await getTokensForUser(userId);
    if (!tokens) {
      res.status(400).json({ error: "Gmail not connected" });
      return;
    }

    const refreshedTokens = await refreshTokenIfNeeded(userId, tokens);

    await createDraftReply(
      refreshedTokens,
      email.gmail_message_id, // threadId — we stored message ID, use as thread reference
      email.gmail_message_id,
      email.sender,
      email.subject || "",
      draftText,
    );

    res.json({ draft: draftText });
  } catch (err) {
    console.error("Generate draft error:", err);
    res.status(500).json({ error: "Failed to generate draft" });
  }
});

export default router;
