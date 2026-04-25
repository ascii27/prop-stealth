import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { JwtPayload } from "../types.js";
import { db } from "../db/client.js";

const router = Router();

// GET / — list all properties for the current user
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    const result = await db.query(
      "SELECT * FROM properties WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
    );
    res.json({ properties: result.rows });
  } catch (err) {
    console.error("List properties error:", err);
    res.status(500).json({ error: "Failed to list properties" });
  }
});

// GET /:id — get a single property
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    const result = await db.query(
      "SELECT * FROM properties WHERE id = $1 AND user_id = $2",
      [req.params.id, userId],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Property not found" });
      return;
    }
    res.json({ property: result.rows[0] });
  } catch (err) {
    console.error("Get property error:", err);
    res.status(500).json({ error: "Failed to get property" });
  }
});

// POST / — create a new property
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    const { address, city, state, beds, baths, unit, occupied, tenant_name } = req.body;

    if (!address || !city || !state) {
      res.status(400).json({ error: "address, city, and state are required" });
      return;
    }

    const result = await db.query(
      `INSERT INTO properties (user_id, address, city, state, beds, baths, unit, occupied, tenant_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, address, city, state, beds || 0, baths || 0, unit || null, occupied || false, tenant_name || null],
    );
    res.status(201).json({ property: result.rows[0] });
  } catch (err) {
    console.error("Create property error:", err);
    res.status(500).json({ error: "Failed to create property" });
  }
});

// PUT /:id — update a property
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    const { address, city, state, beds, baths, unit, occupied, tenant_name } = req.body;

    const result = await db.query(
      `UPDATE properties
       SET address = COALESCE($1, address),
           city = COALESCE($2, city),
           state = COALESCE($3, state),
           beds = COALESCE($4, beds),
           baths = COALESCE($5, baths),
           unit = $6,
           occupied = COALESCE($7, occupied),
           tenant_name = $8,
           updated_at = NOW()
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [address, city, state, beds, baths, unit, occupied, tenant_name, req.params.id, userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Property not found" });
      return;
    }
    res.json({ property: result.rows[0] });
  } catch (err) {
    console.error("Update property error:", err);
    res.status(500).json({ error: "Failed to update property" });
  }
});

// DELETE /:id — delete a property
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    const result = await db.query(
      "DELETE FROM properties WHERE id = $1 AND user_id = $2 RETURNING id",
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
