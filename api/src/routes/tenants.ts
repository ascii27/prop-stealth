import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { JwtPayload } from "../types.js";
import { db } from "../db/client.js";
import { runExtraction } from "../agents/tenant-eval/extract.js";
import { runEvaluation } from "../agents/tenant-eval/evaluate.js";
import { createLocalStorage } from "../storage/local.js";
import { config as appConfig } from "../config.js";

const router = Router();
const storage = createLocalStorage(appConfig.uploadDir);

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

// POST /:id/extract — agent-only. Runs AI extraction inline, fills in any
// missing tenant fields (existing values are preserved), returns updated tenant.
router.post(
  "/:id/extract",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { userId, role } = req.user as JwtPayload;
      if (role !== "agent") {
        res.status(403).json({ error: "Only agents can run extraction" });
        return;
      }
      const access = await tenantAccess(userId, role, req.params.id);
      if (!access.allowed) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const docs = await db.query(
        `SELECT * FROM tenant_documents WHERE tenant_id = $1`,
        [req.params.id],
      );
      if (docs.rows.length === 0) {
        res.status(400).json({ error: "Upload at least one document first" });
        return;
      }

      const extracted = await runExtraction(storage, docs.rows);
      const updated = await db.query(
        `UPDATE tenants
            SET applicant_name = COALESCE(applicant_name, $1),
                email          = COALESCE(email, $2),
                phone          = COALESCE(phone, $3),
                employer       = COALESCE(employer, $4),
                monthly_income = COALESCE(monthly_income, $5),
                move_in_date   = COALESCE(move_in_date, $6),
                updated_at = NOW()
          WHERE id = $7
          RETURNING ${TENANT_COLS}`,
        [
          extracted.applicant_name,
          extracted.email,
          extracted.phone,
          extracted.employer,
          extracted.monthly_income,
          extracted.move_in_date,
          req.params.id,
        ],
      );
      res.json({ tenant: updated.rows[0], extracted });
    } catch (err) {
      console.error("Extraction error:", err);
      res
        .status(500)
        .json({ error: (err as Error).message || "Extraction failed" });
    }
  },
);

// POST /:id/evaluate — agent-only. Inserts a 'running' evaluation row, returns
// 202 immediately, then runs the model in the background and writes back the
// result. Client polls GET /:id/evaluation.
router.post(
  "/:id/evaluate",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { userId, role } = req.user as JwtPayload;
      if (role !== "agent") {
        res.status(403).json({ error: "Only agents can run evaluations" });
        return;
      }
      const access = await tenantAccess(userId, role, req.params.id);
      if (!access.allowed) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const tenant = await db.query(`SELECT * FROM tenants WHERE id = $1`, [
        req.params.id,
      ]);
      const property = await db.query(
        `SELECT * FROM properties WHERE id = $1`,
        [tenant.rows[0].property_id],
      );
      const docs = await db.query(
        `SELECT * FROM tenant_documents WHERE tenant_id = $1`,
        [req.params.id],
      );
      if (docs.rows.length === 0) {
        res.status(400).json({ error: "Upload documents first" });
        return;
      }

      const evalRow = await db.query(
        `INSERT INTO tenant_evaluations (tenant_id, status)
         VALUES ($1, 'running')
         RETURNING *`,
        [req.params.id],
      );
      await db.query(
        `UPDATE tenants SET status = 'evaluating', updated_at = NOW() WHERE id = $1`,
        [req.params.id],
      );

      // Fire-and-forget. Process restart drops in-flight evaluations — the
      // tenant_evaluations row stays in 'running' status until manually cleared
      // or re-run. Acceptable for MVP; revisit if reliability matters more.
      (async () => {
        try {
          const { result, modelUsed } = await runEvaluation(
            storage,
            tenant.rows[0],
            property.rows[0],
            docs.rows,
          );
          await db.query(
            `UPDATE tenant_evaluations
                SET status = 'complete',
                    overall_score = $1,
                    recommendation = $2,
                    category_scores = $3,
                    summary = $4,
                    concerns = $5,
                    verified_facts = $6,
                    model_used = $7,
                    completed_at = NOW()
              WHERE id = $8`,
            [
              result.overall_score,
              result.recommendation,
              JSON.stringify(result.category_scores),
              result.summary,
              JSON.stringify(result.concerns),
              JSON.stringify(result.verified_facts),
              modelUsed,
              evalRow.rows[0].id,
            ],
          );
          await db.query(
            `UPDATE tenants SET status = 'ready', updated_at = NOW() WHERE id = $1`,
            [req.params.id],
          );
        } catch (err) {
          await db.query(
            `UPDATE tenant_evaluations
                SET status = 'failed', error = $1, completed_at = NOW()
              WHERE id = $2`,
            [(err as Error).message, evalRow.rows[0].id],
          );
          await db.query(
            `UPDATE tenants SET status = 'draft', updated_at = NOW() WHERE id = $1`,
            [req.params.id],
          );
        }
      })();

      res.status(202).json({ evaluation: evalRow.rows[0] });
    } catch (err) {
      console.error("Evaluate error:", err);
      res.status(500).json({ error: "Failed to start evaluation" });
    }
  },
);

// GET /:id/evaluation — return the latest evaluation row for the tenant.
router.get(
  "/:id/evaluation",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { userId, role } = req.user as JwtPayload;
      const access = await tenantAccess(userId, role, req.params.id);
      if (!access.allowed) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }
      const result = await db.query(
        `SELECT * FROM tenant_evaluations
          WHERE tenant_id = $1
          ORDER BY created_at DESC
          LIMIT 1`,
        [req.params.id],
      );
      if (result.rows.length === 0) {
        res.json({ evaluation: null });
        return;
      }
      res.json({ evaluation: result.rows[0] });
    } catch (err) {
      console.error("Get evaluation error:", err);
      res.status(500).json({ error: "Failed to get evaluation" });
    }
  },
);

export default router;
