import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { JwtPayload } from "../types.js";
import { db } from "../db/client.js";

const router = Router();

const TENANT_COLS = `id, property_id, created_by_agent_id, status, applicant_name,
                     email, phone, employer, monthly_income, move_in_date, notes,
                     shared_at, decided_at, decision_by_user_id, decision_note,
                     created_at, updated_at`;

// Returns access info if the caller can see the tenant.
//   - owner: only when the tenant's property belongs to them AND status is shared/approved/rejected
//   - agent: only when they are linked to the property's owner
async function tenantAccess(
  userId: string,
  role: string,
  tenantId: string,
): Promise<
  | { allowed: false }
  | { allowed: true; ownerId: string; status: string; propertyId: string }
> {
  const result = await db.query(
    `SELECT t.id, t.status, t.property_id, p.owner_id
       FROM tenants t
       JOIN properties p ON p.id = t.property_id
      WHERE t.id = $1`,
    [tenantId],
  );
  if (result.rows.length === 0) return { allowed: false };
  const row = result.rows[0];

  if (role === "owner") {
    if (row.owner_id !== userId) return { allowed: false };
    if (!["shared", "approved", "rejected"].includes(row.status)) {
      return { allowed: false };
    }
    return {
      allowed: true,
      ownerId: row.owner_id,
      status: row.status,
      propertyId: row.property_id,
    };
  }

  // agent
  const link = await db.query(
    "SELECT 1 FROM agent_clients WHERE agent_id = $1 AND owner_id = $2",
    [userId, row.owner_id],
  );
  if (link.rows.length === 0) return { allowed: false };
  return {
    allowed: true,
    ownerId: row.owner_id,
    status: row.status,
    propertyId: row.property_id,
  };
}

// GET / — list tenants
//   - owner: only their shared/decided tenants
//   - agent: tenants for any property of any linked owner
//     supports ?owner_id, ?property_id, ?status filters.
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    const ownerId = req.query.owner_id as string | undefined;
    const propertyId = req.query.property_id as string | undefined;
    const status = req.query.status as string | undefined;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let join = "JOIN properties p ON p.id = t.property_id";

    if (role === "owner") {
      conditions.push(`p.owner_id = $${params.push(userId)}`);
      conditions.push(`t.status IN ('shared','approved','rejected')`);
    } else {
      // agent — must be linked to the property's owner
      join += ` JOIN agent_clients ac ON ac.owner_id = p.owner_id AND ac.agent_id = $${params.push(userId)}`;
      if (ownerId) conditions.push(`p.owner_id = $${params.push(ownerId)}`);
    }

    if (propertyId) conditions.push(`t.property_id = $${params.push(propertyId)}`);
    if (status) conditions.push(`t.status = $${params.push(status)}`);

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await db.query(
      `SELECT t.${TENANT_COLS.replace(/,\s+/g, ", t.")},
              p.address AS property_address, p.city AS property_city, p.state AS property_state
         FROM tenants t
         ${join}
         ${where}
         ORDER BY t.created_at DESC`,
      params,
    );
    res.json({ tenants: result.rows });
  } catch (err) {
    console.error("List tenants error:", err);
    res.status(500).json({ error: "Failed to list tenants" });
  }
});

// GET /:id
router.get("/:id", requireAuth, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    const access = await tenantAccess(userId, role, req.params.id);
    if (!access.allowed) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const result = await db.query(
      `SELECT ${TENANT_COLS} FROM tenants WHERE id = $1`,
      [req.params.id],
    );
    res.json({ tenant: result.rows[0] });
  } catch (err) {
    console.error("Get tenant error:", err);
    res.status(500).json({ error: "Failed to get tenant" });
  }
});

// POST / — create a tenant (agent only)
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "agent") {
      res.status(403).json({ error: "Only agents can create tenants" });
      return;
    }

    const { property_id, applicant_name, notes } = req.body;
    if (!property_id) {
      res.status(400).json({ error: "property_id is required" });
      return;
    }

    // Verify the agent is linked to the property's owner
    const link = await db.query(
      `SELECT p.id
         FROM properties p
         JOIN agent_clients ac ON ac.owner_id = p.owner_id AND ac.agent_id = $1
        WHERE p.id = $2`,
      [userId, property_id],
    );
    if (link.rows.length === 0) {
      res.status(403).json({ error: "Not your client's property" });
      return;
    }

    const result = await db.query(
      `INSERT INTO tenants
         (property_id, created_by_agent_id, status, applicant_name, notes)
       VALUES ($1, $2, 'draft', $3, $4)
       RETURNING ${TENANT_COLS}`,
      [property_id, userId, applicant_name || null, notes || null],
    );
    res.status(201).json({ tenant: result.rows[0] });
  } catch (err) {
    console.error("Create tenant error:", err);
    res.status(500).json({ error: "Failed to create tenant" });
  }
});

// PATCH /:id — update basic fields (agent only)
router.patch("/:id", requireAuth, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "agent") {
      res.status(403).json({ error: "Only agents can edit tenants" });
      return;
    }
    const access = await tenantAccess(userId, role, req.params.id);
    if (!access.allowed) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const {
      applicant_name,
      email,
      phone,
      employer,
      monthly_income,
      move_in_date,
      notes,
    } = req.body;

    const result = await db.query(
      `UPDATE tenants
          SET applicant_name = COALESCE($1, applicant_name),
              email = COALESCE($2, email),
              phone = COALESCE($3, phone),
              employer = COALESCE($4, employer),
              monthly_income = COALESCE($5, monthly_income),
              move_in_date = COALESCE($6, move_in_date),
              notes = COALESCE($7, notes),
              updated_at = NOW()
        WHERE id = $8
        RETURNING ${TENANT_COLS}`,
      [
        applicant_name ?? null,
        email ?? null,
        phone ?? null,
        employer ?? null,
        monthly_income ?? null,
        move_in_date ?? null,
        notes ?? null,
        req.params.id,
      ],
    );
    res.json({ tenant: result.rows[0] });
  } catch (err) {
    console.error("Update tenant error:", err);
    res.status(500).json({ error: "Failed to update tenant" });
  }
});

export default router;
