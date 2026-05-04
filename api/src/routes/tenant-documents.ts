import { Router, Request, Response } from "express";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import { requireAuth } from "../middleware/auth.js";
import { JwtPayload, DocumentCategory } from "../types.js";
import { db } from "../db/client.js";
import { config } from "../config.js";
import { createLocalStorage } from "../storage/local.js";

const router = Router();
const storage = createLocalStorage(config.uploadDir);

const ALLOWED_CATEGORIES: DocumentCategory[] = [
  "application",
  "id",
  "income",
  "credit",
  "reference",
  "other",
];

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error("Unsupported file type"));
      return;
    }
    cb(null, true);
  },
});

async function tenantOwnedByAgent(
  agentId: string,
  tenantId: string,
): Promise<boolean> {
  const r = await db.query(
    `SELECT 1
       FROM tenants t
       JOIN properties p ON p.id = t.property_id
       JOIN agent_clients ac ON ac.owner_id = p.owner_id AND ac.agent_id = $1
      WHERE t.id = $2`,
    [agentId, tenantId],
  );
  return r.rows.length > 0;
}

async function tenantOwnedByOwnerForView(
  ownerId: string,
  tenantId: string,
): Promise<boolean> {
  const r = await db.query(
    `SELECT 1
       FROM tenants t
       JOIN properties p ON p.id = t.property_id
      WHERE t.id = $1 AND p.owner_id = $2 AND t.status IN ('shared','approved','rejected')`,
    [tenantId, ownerId],
  );
  return r.rows.length > 0;
}

// POST /:tenantId — upload one file (agent only)
router.post(
  "/:tenantId",
  requireAuth,
  upload.single("file"),
  async (req: Request<{ tenantId: string }>, res: Response) => {
    try {
      const { userId, role } = req.user as JwtPayload;
      if (role !== "agent") {
        res.status(403).json({ error: "Only agents can upload documents" });
        return;
      }
      const ok = await tenantOwnedByAgent(userId, req.params.tenantId);
      if (!ok) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }
      const category = req.body.category as DocumentCategory;
      if (!ALLOWED_CATEGORIES.includes(category)) {
        res.status(400).json({ error: "Invalid category" });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: "file is required" });
        return;
      }

      const ext = path.extname(req.file.originalname).slice(0, 10) || "";
      const id = crypto.randomUUID();
      const storageKey = `tenants/${req.params.tenantId}/${id}${ext}`;
      await storage.put(storageKey, req.file.buffer);

      const insert = await db.query(
        `INSERT INTO tenant_documents
           (id, tenant_id, category, filename, storage_key, mime_type, size_bytes, uploaded_by_user_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [
          id,
          req.params.tenantId,
          category,
          req.file.originalname,
          storageKey,
          req.file.mimetype,
          req.file.size,
          userId,
        ],
      );
      res.status(201).json({ document: insert.rows[0] });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: (err as Error).message || "Upload failed" });
    }
  },
);

// GET /:tenantId — list documents (agent or shared-tenant owner)
router.get(
  "/:tenantId",
  requireAuth,
  async (req: Request<{ tenantId: string }>, res: Response) => {
    try {
      const { userId, role } = req.user as JwtPayload;
      const ok =
        role === "agent"
          ? await tenantOwnedByAgent(userId, req.params.tenantId)
          : await tenantOwnedByOwnerForView(userId, req.params.tenantId);
      if (!ok) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }
      const result = await db.query(
        `SELECT * FROM tenant_documents WHERE tenant_id = $1 ORDER BY uploaded_at`,
        [req.params.tenantId],
      );
      res.json({ documents: result.rows });
    } catch (err) {
      console.error("List documents error:", err);
      res.status(500).json({ error: "Failed to list documents" });
    }
  },
);

// GET /:tenantId/:documentId/file — download
router.get(
  "/:tenantId/:documentId/file",
  requireAuth,
  async (
    req: Request<{ tenantId: string; documentId: string }>,
    res: Response,
  ) => {
    try {
      const { userId, role } = req.user as JwtPayload;
      const ok =
        role === "agent"
          ? await tenantOwnedByAgent(userId, req.params.tenantId)
          : await tenantOwnedByOwnerForView(userId, req.params.tenantId);
      if (!ok) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }
      const docResult = await db.query(
        `SELECT * FROM tenant_documents WHERE id = $1 AND tenant_id = $2`,
        [req.params.documentId, req.params.tenantId],
      );
      if (docResult.rows.length === 0) {
        res.status(404).json({ error: "Document not found" });
        return;
      }
      const doc = docResult.rows[0];
      const buf = await storage.get(doc.storage_key);
      res.setHeader("Content-Type", doc.mime_type);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(doc.filename)}"`,
      );
      res.send(buf);
    } catch (err) {
      console.error("Download error:", err);
      res.status(500).json({ error: "Failed to fetch document" });
    }
  },
);

// DELETE /:tenantId/:documentId — agent only
router.delete(
  "/:tenantId/:documentId",
  requireAuth,
  async (
    req: Request<{ tenantId: string; documentId: string }>,
    res: Response,
  ) => {
    try {
      const { userId, role } = req.user as JwtPayload;
      if (role !== "agent") {
        res.status(403).json({ error: "Only agents can delete documents" });
        return;
      }
      const ok = await tenantOwnedByAgent(userId, req.params.tenantId);
      if (!ok) {
        res.status(404).json({ error: "Tenant not found" });
        return;
      }
      const docResult = await db.query(
        `DELETE FROM tenant_documents
            WHERE id = $1 AND tenant_id = $2
        RETURNING storage_key`,
        [req.params.documentId, req.params.tenantId],
      );
      if (docResult.rows.length === 0) {
        res.status(404).json({ error: "Document not found" });
        return;
      }
      try {
        await storage.delete(docResult.rows[0].storage_key);
      } catch (e) {
        console.warn("Failed to delete storage key after row delete:", e);
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Delete document error:", err);
      res.status(500).json({ error: "Failed to delete document" });
    }
  },
);

export default router;
