import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { JwtPayload } from "../types.js";
import { db } from "../db/client.js";
import { runExtraction } from "../agents/tenant-eval/extract.js";
import { runEvaluation } from "../agents/tenant-eval/evaluate.js";
import { createLocalStorage } from "../storage/local.js";
import { config as appConfig } from "../config.js";
import { enqueueEmail } from "../email/outbox.js";
import { renderTenantsShared } from "../email/templates/tenants_shared.js";
import { renderThreadMessage } from "../email/templates/thread_message.js";
import { renderDecision } from "../email/templates/decision.js";

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

// GET /:id/thread — list events (chronological)
router.get(
  "/:id/thread",
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
        `SELECT te.id, te.tenant_id, te.type, te.author_user_id, te.body, te.created_at,
                u.name AS author_name, u.role AS author_role
           FROM tenant_thread_events te
           JOIN users u ON u.id = te.author_user_id
          WHERE te.tenant_id = $1
          ORDER BY te.created_at ASC`,
        [req.params.id],
      );
      res.json({ events: result.rows });
    } catch (err) {
      console.error("List thread error:", err);
      res.status(500).json({ error: "Failed to list thread" });
    }
  },
);

// POST /:id/thread — post a message (agent or owner). Owners can only post
// when status is shared/approved/rejected (enforced via tenantAccess).
router.post(
  "/:id/thread",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { userId, role } = req.user as JwtPayload;
      const access = await tenantAccess(userId, role, req.params.id);
      if (!access.allowed) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }

      const body = (req.body.body as string | undefined)?.trim();
      if (!body) {
        res.status(400).json({ error: "body is required" });
        return;
      }

      const insert = await db.query(
        `INSERT INTO tenant_thread_events (tenant_id, type, author_user_id, body)
         VALUES ($1, 'message', $2, $3)
         RETURNING *`,
        [req.params.id, userId, body],
      );

      // Notify the OTHER party. If the agent posted, the owner gets the email
      // (and vice versa). Skips silently if the recipient row is missing.
      const tInfo = await db.query(
        `SELECT t.applicant_name, p.owner_id, t.created_by_agent_id
           FROM tenants t JOIN properties p ON p.id = t.property_id
          WHERE t.id = $1`,
        [req.params.id],
      );
      const recipientId =
        role === "agent"
          ? tInfo.rows[0].owner_id
          : tInfo.rows[0].created_by_agent_id;
      const recipientRole: "owner" | "agent" =
        role === "agent" ? "owner" : "agent";

      const recipient = await db.query(
        `SELECT email, name FROM users WHERE id = $1`,
        [recipientId],
      );
      const author = await db.query(
        `SELECT name FROM users WHERE id = $1`,
        [userId],
      );

      if (recipient.rows.length > 0) {
        const tpl = renderThreadMessage({
          recipientName: recipient.rows[0].name,
          authorName: author.rows[0]?.name || null,
          applicantName: tInfo.rows[0].applicant_name,
          body,
          tenantId: req.params.id,
          recipientRole,
        });
        await enqueueEmail({
          toEmail: recipient.rows[0].email,
          toUserId: recipientId,
          subject: tpl.subject,
          bodyHtml: tpl.html,
          bodyText: tpl.text,
          templateKey: "thread_message",
        });
      }

      res.status(201).json({ event: insert.rows[0] });
    } catch (err) {
      console.error("Post thread error:", err);
      res.status(500).json({ error: "Failed to post message" });
    }
  },
);

// POST /share — agent-only. Body: { tenant_ids: string[] }. Marks each tenant
// 'shared' and writes a 'shared' thread event. Returns by_owner so Phase I can
// batch the email per recipient.
router.post("/share", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as JwtPayload;
    if (role !== "agent") {
      res.status(403).json({ error: "Only agents can share" });
      return;
    }
    const tenantIds = req.body.tenant_ids;
    if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
      res.status(400).json({ error: "tenant_ids must be a non-empty array" });
      return;
    }

    // Each tenant must be 'ready' AND owned by one of the agent's clients.
    const verify = await db.query(
      `SELECT t.id, p.owner_id
         FROM tenants t
         JOIN properties p ON p.id = t.property_id
         JOIN agent_clients ac ON ac.owner_id = p.owner_id AND ac.agent_id = $1
        WHERE t.id = ANY($2::uuid[]) AND t.status = 'ready'`,
      [userId, tenantIds],
    );
    if (verify.rows.length !== tenantIds.length) {
      res.status(400).json({
        error: "Some tenants are not in 'ready' status or not your client's",
      });
      return;
    }

    await db.query(
      `UPDATE tenants
          SET status = 'shared', shared_at = NOW(), updated_at = NOW()
        WHERE id = ANY($1::uuid[])`,
      [tenantIds],
    );
    for (const id of tenantIds) {
      await db.query(
        `INSERT INTO tenant_thread_events (tenant_id, type, author_user_id)
         VALUES ($1, 'shared', $2)`,
        [id, userId],
      );
    }

    const byOwner = new Map<string, string[]>();
    for (const row of verify.rows) {
      if (!byOwner.has(row.owner_id)) byOwner.set(row.owner_id, []);
      byOwner.get(row.owner_id)!.push(row.id);
    }

    // One email per recipient owner. Picks up the latest complete evaluation
    // overall_score per tenant for the email body. Agent name is shared across
    // all owner emails.
    const agentRow = await db.query(`SELECT name FROM users WHERE id = $1`, [
      userId,
    ]);
    for (const [ownerId, ids] of byOwner.entries()) {
      const ownerRow = await db.query(
        `SELECT email, name FROM users WHERE id = $1`,
        [ownerId],
      );
      if (ownerRow.rows.length === 0) continue;

      const tenantsRes = await db.query(
        `SELECT t.id, t.applicant_name,
                p.address || ', ' || p.city || ', ' || p.state AS property_address,
                (SELECT te.overall_score FROM tenant_evaluations te
                  WHERE te.tenant_id = t.id AND te.status = 'complete'
                  ORDER BY te.created_at DESC LIMIT 1) AS overall_score
           FROM tenants t
           JOIN properties p ON p.id = t.property_id
          WHERE t.id = ANY($1::uuid[])`,
        [ids],
      );

      const tpl = renderTenantsShared({
        ownerName: ownerRow.rows[0].name,
        agentName: agentRow.rows[0]?.name || null,
        tenants: tenantsRes.rows,
      });
      await enqueueEmail({
        toEmail: ownerRow.rows[0].email,
        toUserId: ownerId,
        subject: tpl.subject,
        bodyHtml: tpl.html,
        bodyText: tpl.text,
        templateKey: "tenants_shared",
      });
    }

    res.json({ shared: tenantIds, by_owner: Array.from(byOwner.entries()) });
  } catch (err) {
    console.error("Share error:", err);
    res.status(500).json({ error: "Failed to share" });
  }
});

// POST /:id/unshare — agent-only. Tenant must currently be 'shared'.
router.post(
  "/:id/unshare",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { userId, role } = req.user as JwtPayload;
      if (role !== "agent") {
        res.status(403).json({ error: "Only agents can unshare" });
        return;
      }
      const access = await tenantAccess(userId, role, req.params.id);
      if (!access.allowed || access.status !== "shared") {
        res.status(400).json({ error: "Tenant is not in 'shared' status" });
        return;
      }
      await db.query(
        `UPDATE tenants SET status = 'ready', shared_at = NULL, updated_at = NOW()
          WHERE id = $1`,
        [req.params.id],
      );
      await db.query(
        `INSERT INTO tenant_thread_events (tenant_id, type, author_user_id)
         VALUES ($1, 'unshared', $2)`,
        [req.params.id, userId],
      );
      res.json({ success: true });
    } catch (err) {
      console.error("Unshare error:", err);
      res.status(500).json({ error: "Failed to unshare" });
    }
  },
);

// POST /:id/decision — owner-only. Body: { decision: 'approved'|'rejected', note?: string }.
router.post(
  "/:id/decision",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { userId, role } = req.user as JwtPayload;
      if (role !== "owner") {
        res.status(403).json({ error: "Only owners can decide" });
        return;
      }
      const access = await tenantAccess(userId, role, req.params.id);
      if (!access.allowed || access.status !== "shared") {
        res.status(400).json({ error: "Tenant is not in 'shared' status" });
        return;
      }
      const decision = req.body.decision;
      if (decision !== "approved" && decision !== "rejected") {
        res
          .status(400)
          .json({ error: "decision must be 'approved' or 'rejected'" });
        return;
      }
      const note = req.body.note ? String(req.body.note) : null;

      await db.query(
        `UPDATE tenants
            SET status = $1, decided_at = NOW(),
                decision_by_user_id = $2, decision_note = $3,
                updated_at = NOW()
          WHERE id = $4`,
        [decision, userId, note, req.params.id],
      );
      await db.query(
        `INSERT INTO tenant_thread_events (tenant_id, type, author_user_id, body)
         VALUES ($1, $2, $3, $4)`,
        [req.params.id, decision, userId, note],
      );

      const tInfo = await db.query(
        `SELECT t.applicant_name, t.created_by_agent_id
           FROM tenants t WHERE t.id = $1`,
        [req.params.id],
      );
      const agent = await db.query(
        `SELECT email, name FROM users WHERE id = $1`,
        [tInfo.rows[0].created_by_agent_id],
      );
      const owner = await db.query(`SELECT name FROM users WHERE id = $1`, [
        userId,
      ]);
      if (agent.rows.length > 0) {
        const tpl = renderDecision({
          agentName: agent.rows[0].name,
          ownerName: owner.rows[0]?.name || null,
          applicantName: tInfo.rows[0].applicant_name,
          decision,
          note,
          tenantId: req.params.id,
        });
        await enqueueEmail({
          toEmail: agent.rows[0].email,
          toUserId: tInfo.rows[0].created_by_agent_id,
          subject: tpl.subject,
          bodyHtml: tpl.html,
          bodyText: tpl.text,
          templateKey: "decision",
        });
      }

      res.json({ success: true });
    } catch (err) {
      console.error("Decision error:", err);
      res.status(500).json({ error: "Failed to record decision" });
    }
  },
);

// POST /:id/reopen — owner-only. Approved/rejected → shared.
router.post(
  "/:id/reopen",
  requireAuth,
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const { userId, role } = req.user as JwtPayload;
      if (role !== "owner") {
        res.status(403).json({ error: "Only owners can reopen" });
        return;
      }
      const access = await tenantAccess(userId, role, req.params.id);
      if (!access.allowed || !["approved", "rejected"].includes(access.status)) {
        res.status(400).json({ error: "Tenant is not in a decided state" });
        return;
      }
      await db.query(
        `UPDATE tenants
            SET status = 'shared',
                decided_at = NULL,
                decision_by_user_id = NULL,
                decision_note = NULL,
                updated_at = NOW()
          WHERE id = $1`,
        [req.params.id],
      );
      await db.query(
        `INSERT INTO tenant_thread_events (tenant_id, type, author_user_id)
         VALUES ($1, 'reopened', $2)`,
        [req.params.id, userId],
      );
      res.json({ success: true });
    } catch (err) {
      console.error("Reopen error:", err);
      res.status(500).json({ error: "Failed to reopen" });
    }
  },
);

export default router;
