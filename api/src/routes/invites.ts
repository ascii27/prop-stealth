import { Router, Request, Response } from "express";
import { db } from "../db/client.js";
import { isInviteValid } from "../invites/tokens.js";

const router = Router();

// GET /:token — public lookup for the invite landing page
router.get("/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const result = await db.query(
      `SELECT i.id, i.email, i.name, i.message, i.invite_token,
              i.invite_token_expires_at, i.invite_consumed_at,
              u.name AS agent_name, u.avatar_url AS agent_avatar_url
         FROM invitations i
         JOIN users u ON u.id = i.agent_id
        WHERE i.invite_token = $1`,
      [token],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }

    const row = result.rows[0];
    if (!isInviteValid(row)) {
      res.status(410).json({ error: "Invitation has expired or already been used" });
      return;
    }

    res.json({
      invitation: {
        email: row.email,
        name: row.name,
        message: row.message,
        agent_name: row.agent_name,
        agent_avatar_url: row.agent_avatar_url,
      },
    });
  } catch (err) {
    console.error("Get invite error:", err);
    res.status(500).json({ error: "Failed to look up invitation" });
  }
});

export default router;
