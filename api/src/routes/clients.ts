import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { JwtPayload } from "../types.js";
import { db } from "../db/client.js";

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
          "SELECT * FROM properties WHERE user_id = $1 ORDER BY created_at DESC",
          [client.id],
        );
        return {
          ...client,
          properties: propsResult.rows,
          vacancyCount: propsResult.rows.filter((p: { occupied: boolean }) => !p.occupied).length,
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
      "SELECT * FROM properties WHERE user_id = $1 ORDER BY created_at DESC",
      [req.params.id],
    );

    const evalsResult = await db.query(
      "SELECT * FROM evaluations WHERE user_id = $1 ORDER BY created_at DESC",
      [req.params.id],
    );

    const client = {
      ...userResult.rows[0],
      properties: propsResult.rows,
      evaluations: evalsResult.rows,
      vacancyCount: propsResult.rows.filter((p: { occupied: boolean }) => !p.occupied).length,
    };

    res.json({ client });
  } catch (err) {
    console.error("Get client error:", err);
    res.status(500).json({ error: "Failed to get client" });
  }
});

// POST /invitations — create a client invitation
router.post("/invitations", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "agent") {
      res.status(403).json({ error: "Only agents can invite clients" });
      return;
    }

    const { name, email, message } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: "name and email are required" });
      return;
    }

    // Check if already invited
    const existing = await db.query(
      "SELECT * FROM invitations WHERE agent_id = $1 AND email = $2 AND status = 'pending'",
      [userId, email],
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Invitation already sent to this email" });
      return;
    }

    // Check if already a client (user exists with this email and is linked)
    const existingUser = await db.query(
      `SELECT u.id FROM users u
       JOIN agent_clients ac ON ac.owner_id = u.id AND ac.agent_id = $1
       WHERE u.email = $2`,
      [userId, email],
    );
    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: "This user is already your client" });
      return;
    }

    const result = await db.query(
      `INSERT INTO invitations (agent_id, email, name, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, email, name, message || null],
    );

    // Auto-link if the user already exists as an owner
    const ownerResult = await db.query(
      "SELECT id FROM users WHERE email = $1 AND role = 'owner'",
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
        "UPDATE invitations SET status = 'accepted' WHERE id = $1",
        [result.rows[0].id],
      );
      result.rows[0].status = "accepted";
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

export default router;
