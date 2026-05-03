import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { JwtPayload } from "../types.js";
import { db } from "../db/client.js";
import { generateInviteToken, inviteExpiry } from "../invites/tokens.js";

const router = Router();

// GET / — list all clients for the current agent (with their properties)
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "agent") {
      res.status(403).json({ error: "Only agents can list clients" });
      return;
    }

    const result = await db.query(
      `SELECT u.id, u.email, u.name, u.avatar_url, ac.created_at as client_since
       FROM agent_clients ac
       JOIN users u ON u.id = ac.owner_id
       WHERE ac.agent_id = $1
       ORDER BY u.name`,
      [userId],
    );

    // For each client, fetch their properties
    const clients = await Promise.all(
      result.rows.map(async (client) => {
        const propsResult = await db.query(
          "SELECT * FROM properties WHERE owner_id = $1 ORDER BY created_at DESC",
          [client.id],
        );
        return {
          ...client,
          properties: propsResult.rows,
        };
      }),
    );

    // Also fetch pending invitations
    const invResult = await db.query(
      "SELECT * FROM invitations WHERE agent_id = $1 AND status = 'pending' ORDER BY created_at DESC",
      [userId],
    );

    res.json({ clients, pendingInvitations: invResult.rows });
  } catch (err) {
    console.error("List clients error:", err);
    res.status(500).json({ error: "Failed to list clients" });
  }
});

// GET /:id — get a single client with their properties
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "agent") {
      res.status(403).json({ error: "Only agents can view clients" });
      return;
    }

    // Verify this is the agent's client
    const acResult = await db.query(
      "SELECT * FROM agent_clients WHERE agent_id = $1 AND owner_id = $2",
      [userId, req.params.id],
    );
    if (acResult.rows.length === 0) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    const userResult = await db.query(
      "SELECT id, email, name, avatar_url FROM users WHERE id = $1",
      [req.params.id],
    );
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    const propsResult = await db.query(
      "SELECT * FROM properties WHERE owner_id = $1 ORDER BY created_at DESC",
      [req.params.id],
    );

    const client = {
      ...userResult.rows[0],
      properties: propsResult.rows,
    };

    res.json({ client });
  } catch (err) {
    console.error("Get client error:", err);
    res.status(500).json({ error: "Failed to get client" });
  }
});

// POST /invitations — create a client invitation with magic-link token
router.post("/invitations", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "agent") {
      res.status(403).json({ error: "Only agents can invite clients" });
      return;
    }

    const { name, email: rawEmail, message } = req.body;
    if (!name || !rawEmail) {
      res.status(400).json({ error: "name and email are required" });
      return;
    }
    // Normalize email to avoid case-mismatch duplicates and to make later
    // comparisons (Google profile email vs invitation email) consistent.
    const email = String(rawEmail).trim().toLowerCase();

    // Check for an existing pending invite from THIS agent for THIS email
    const existing = await db.query(
      "SELECT * FROM invitations WHERE agent_id = $1 AND LOWER(email) = $2 AND status = 'pending'",
      [userId, email],
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Invitation already sent to this email" });
      return;
    }

    // Already a linked client?
    const existingUser = await db.query(
      `SELECT u.id FROM users u
       JOIN agent_clients ac ON ac.owner_id = u.id AND ac.agent_id = $1
       WHERE LOWER(u.email) = $2`,
      [userId, email],
    );
    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: "This user is already your client" });
      return;
    }

    const token = generateInviteToken();
    const expiresAt = inviteExpiry();

    const result = await db.query(
      `INSERT INTO invitations
         (agent_id, email, name, message, invite_token, invite_token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, email, name, message || null, token, expiresAt],
    );

    // Auto-link if the user already exists as an owner — skip token, mark accepted
    const ownerResult = await db.query(
      "SELECT id FROM users WHERE LOWER(email) = $1 AND role = 'owner'",
      [email],
    );
    if (ownerResult.rows.length > 0) {
      await db.query(
        `INSERT INTO agent_clients (agent_id, owner_id)
         VALUES ($1, $2)
         ON CONFLICT (agent_id, owner_id) DO NOTHING`,
        [userId, ownerResult.rows[0].id],
      );
      await db.query(
        `UPDATE invitations
            SET status = 'accepted',
                invite_consumed_at = NOW()
          WHERE id = $1`,
        [result.rows[0].id],
      );
      result.rows[0].status = "accepted";
      result.rows[0].invite_consumed_at = new Date();
    }

    res.status(201).json({ invitation: result.rows[0] });
  } catch (err) {
    console.error("Create invitation error:", err);
    res.status(500).json({ error: "Failed to create invitation" });
  }
});

// GET /invitations — list invitations for the current agent
router.get("/invitations/list", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "agent") {
      res.status(403).json({ error: "Only agents can list invitations" });
      return;
    }

    const result = await db.query(
      "SELECT * FROM invitations WHERE agent_id = $1 ORDER BY created_at DESC",
      [userId],
    );
    res.json({ invitations: result.rows });
  } catch (err) {
    console.error("List invitations error:", err);
    res.status(500).json({ error: "Failed to list invitations" });
  }
});

// DELETE /invitations/:id — agent cancels a pending invitation
router.delete(
  "/invitations/:id",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { userId, role } = req.user as JwtPayload;
      if (role !== "agent") {
        res.status(403).json({ error: "Only agents can cancel invitations" });
        return;
      }
      const result = await db.query(
        "DELETE FROM invitations WHERE id = $1 AND agent_id = $2 AND status = 'pending' RETURNING id",
        [req.params.id, userId],
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: "Invitation not found" });
        return;
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Cancel invitation error:", err);
      res.status(500).json({ error: "Failed to cancel invitation" });
    }
  },
);

// DELETE /:id — agent removes the agent_clients link with this owner
router.delete(
  "/:id",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { userId, role } = req.user as JwtPayload;
      if (role !== "agent") {
        res.status(403).json({ error: "Only agents can remove clients" });
        return;
      }
      const result = await db.query(
        "DELETE FROM agent_clients WHERE agent_id = $1 AND owner_id = $2 RETURNING owner_id",
        [userId, req.params.id],
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: "Client not found" });
        return;
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Remove client error:", err);
      res.status(500).json({ error: "Failed to remove client" });
    }
  },
);

export default router;
