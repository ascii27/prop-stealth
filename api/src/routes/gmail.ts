import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { JwtPayload } from "../types.js";
import { db } from "../db/client.js";
import { getGmailAuthUrl, exchangeGmailCode } from "../agents/inbox/gmail.js";

const router = Router();

// GET /connect — initiate Gmail OAuth
router.get("/connect", requireAuth, (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload;
  const url = getGmailAuthUrl(userId);
  res.redirect(url);
});

// GET /callback — handle Gmail OAuth callback
router.get("/callback", async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string | undefined;
    const stateParam = req.query.state as string | undefined;

    if (!code || !stateParam) {
      res.redirect("/owner/settings?error=gmail_auth_failed");
      return;
    }

    const state = JSON.parse(Buffer.from(stateParam, "base64url").toString("utf-8"));
    const userId = state.userId as string;

    if (!userId) {
      res.redirect("/owner/settings?error=gmail_auth_failed");
      return;
    }

    const { tokens, email } = await exchangeGmailCode(code);

    // Upsert gmail connection
    await db.query(
      `INSERT INTO gmail_connections (user_id, gmail_email, access_token, refresh_token, token_expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         gmail_email = EXCLUDED.gmail_email,
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         token_expires_at = EXCLUDED.token_expires_at`,
      [userId, email, tokens.access_token, tokens.refresh_token, tokens.token_expires_at],
    );

    res.redirect("/owner/settings?gmail=connected");
  } catch (err) {
    console.error("Gmail OAuth callback error:", err);
    res.redirect("/owner/settings?error=gmail_auth_failed");
  }
});

// GET /status — connection status
router.get("/status", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    const result = await db.query(
      "SELECT gmail_email, label, created_at FROM gmail_connections WHERE user_id = $1",
      [userId],
    );

    if (result.rows.length === 0) {
      res.json({ connected: false });
      return;
    }

    res.json({
      connected: true,
      email: result.rows[0].gmail_email,
      label: result.rows[0].label,
      connectedAt: result.rows[0].created_at,
    });
  } catch (err) {
    console.error("Gmail status error:", err);
    res.status(500).json({ error: "Failed to get Gmail status" });
  }
});

// PUT /label — update monitored label
router.put("/label", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    const { label } = req.body;

    if (!label || typeof label !== "string") {
      res.status(400).json({ error: "label is required" });
      return;
    }

    const result = await db.query(
      "UPDATE gmail_connections SET label = $1 WHERE user_id = $2 RETURNING label",
      [label.trim(), userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Gmail not connected" });
      return;
    }

    res.json({ label: result.rows[0].label });
  } catch (err) {
    console.error("Update label error:", err);
    res.status(500).json({ error: "Failed to update label" });
  }
});

// DELETE /disconnect — remove Gmail connection
router.delete("/disconnect", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    await db.query("DELETE FROM gmail_connections WHERE user_id = $1", [userId]);
    res.json({ success: true });
  } catch (err) {
    console.error("Gmail disconnect error:", err);
    res.status(500).json({ error: "Failed to disconnect Gmail" });
  }
});

export default router;
