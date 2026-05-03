import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { JwtPayload } from "../types.js";
import { db } from "../db/client.js";

const router = Router();

const SELECT_COLS = `id, owner_id, created_by_agent_id, address, city, state, zip,
                     beds, baths, property_type, monthly_rent_target, notes,
                     created_at, updated_at`;

// Authorization: a property is accessible to its owner OR to any agent linked
// to that owner via agent_clients.
async function userCanAccessProperty(
  userId: string,
  propertyId: string,
): Promise<{ allowed: boolean; ownerId?: string }> {
  const result = await db.query(
    `SELECT p.owner_id
       FROM properties p
       LEFT JOIN agent_clients ac
         ON ac.owner_id = p.owner_id AND ac.agent_id = $1
      WHERE p.id = $2
        AND (p.owner_id = $3 OR ac.agent_id IS NOT NULL)`,
    [userId, propertyId, userId],
  );
  if (result.rows.length === 0) return { allowed: false };
  return { allowed: true, ownerId: result.rows[0].owner_id };
}

// GET / — list properties scoped to the caller
//   - owner: their own properties
//   - agent: properties of any owner they're linked to
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    const ownerIdQuery = req.query.owner_id as string | undefined;

    let result;
    if (role === "owner") {
      result = await db.query(
        `SELECT ${SELECT_COLS} FROM properties WHERE owner_id = $1 ORDER BY created_at DESC`,
        [userId],
      );
    } else {
      // agent
      if (ownerIdQuery) {
        // Verify the agent is linked to this owner
        const link = await db.query(
          "SELECT 1 FROM agent_clients WHERE agent_id = $1 AND owner_id = $2",
          [userId, ownerIdQuery],
        );
        if (link.rows.length === 0) {
          res.status(403).json({ error: "Not your client" });
          return;
        }
        result = await db.query(
          `SELECT ${SELECT_COLS} FROM properties WHERE owner_id = $1 ORDER BY created_at DESC`,
          [ownerIdQuery],
        );
      } else {
        // All properties for any of the agent's owners
        result = await db.query(
          `SELECT ${SELECT_COLS}
             FROM properties p
             JOIN agent_clients ac ON ac.owner_id = p.owner_id AND ac.agent_id = $1
            ORDER BY p.created_at DESC`,
          [userId],
        );
      }
    }

    res.json({ properties: result.rows });
  } catch (err) {
    console.error("List properties error:", err);
    res.status(500).json({ error: "Failed to list properties" });
  }
});

// GET /:id
router.get("/:id", requireAuth, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    const access = await userCanAccessProperty(userId, req.params.id);
    if (!access.allowed) {
      res.status(404).json({ error: "Property not found" });
      return;
    }

    const result = await db.query(
      `SELECT ${SELECT_COLS} FROM properties WHERE id = $1`,
      [req.params.id],
    );
    res.json({ property: result.rows[0] });
  } catch (err) {
    console.error("Get property error:", err);
    res.status(500).json({ error: "Failed to get property" });
  }
});

// POST / — create
//   - owner: creates for themself
//   - agent: must include owner_id; the agent must be linked to that owner
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    const {
      address,
      city,
      state,
      zip,
      beds,
      baths,
      property_type,
      monthly_rent_target,
      notes,
      owner_id: bodyOwnerId,
    } = req.body;

    if (!address || !city || !state) {
      res.status(400).json({ error: "address, city, and state are required" });
      return;
    }

    let ownerId: string;
    let createdByAgentId: string | null = null;

    if (role === "owner") {
      ownerId = userId;
    } else {
      // agent
      if (!bodyOwnerId) {
        res.status(400).json({ error: "owner_id is required for agents" });
        return;
      }
      const link = await db.query(
        "SELECT 1 FROM agent_clients WHERE agent_id = $1 AND owner_id = $2",
        [userId, bodyOwnerId],
      );
      if (link.rows.length === 0) {
        res.status(403).json({ error: "Not your client" });
        return;
      }
      ownerId = bodyOwnerId;
      createdByAgentId = userId;
    }

    const result = await db.query(
      `INSERT INTO properties
         (owner_id, created_by_agent_id, address, city, state, zip, beds, baths,
          property_type, monthly_rent_target, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING ${SELECT_COLS}`,
      [
        ownerId,
        createdByAgentId,
        address,
        city,
        state,
        zip || null,
        beds ?? 0,
        baths ?? 0,
        property_type || null,
        monthly_rent_target ?? null,
        notes || null,
      ],
    );
    res.status(201).json({ property: result.rows[0] });
  } catch (err) {
    console.error("Create property error:", err);
    res.status(500).json({ error: "Failed to create property" });
  }
});

// PUT /:id — update (owner OR linked agent)
router.put("/:id", requireAuth, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    const access = await userCanAccessProperty(userId, req.params.id);
    if (!access.allowed) {
      res.status(404).json({ error: "Property not found" });
      return;
    }

    const {
      address,
      city,
      state,
      zip,
      beds,
      baths,
      property_type,
      monthly_rent_target,
      notes,
    } = req.body;

    const result = await db.query(
      `UPDATE properties
          SET address = COALESCE($1, address),
              city = COALESCE($2, city),
              state = COALESCE($3, state),
              zip = $4,
              beds = COALESCE($5, beds),
              baths = COALESCE($6, baths),
              property_type = $7,
              monthly_rent_target = $8,
              notes = $9,
              updated_at = NOW()
        WHERE id = $10
        RETURNING ${SELECT_COLS}`,
      [
        address,
        city,
        state,
        zip ?? null,
        beds,
        baths,
        property_type ?? null,
        monthly_rent_target ?? null,
        notes ?? null,
        req.params.id,
      ],
    );
    res.json({ property: result.rows[0] });
  } catch (err) {
    console.error("Update property error:", err);
    res.status(500).json({ error: "Failed to update property" });
  }
});

// DELETE /:id — owner only
router.delete("/:id", requireAuth, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "owner") {
      res.status(403).json({ error: "Only owners can delete properties" });
      return;
    }
    const result = await db.query(
      "DELETE FROM properties WHERE id = $1 AND owner_id = $2 RETURNING id",
      [req.params.id, userId],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Property not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Delete property error:", err);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

export default router;
