import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { JwtPayload } from "../types.js";
import { db } from "../db/client.js";

const router = Router();

// GET / — list all evaluations for the current user
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    const result = await db.query(
      "SELECT * FROM evaluations WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
    );
    res.json({ evaluations: result.rows });
  } catch (err) {
    console.error("List evaluations error:", err);
    res.status(500).json({ error: "Failed to list evaluations" });
  }
});

// GET /:id — get a single evaluation
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    const result = await db.query(
      "SELECT * FROM evaluations WHERE id = $1 AND user_id = $2",
      [req.params.id, userId],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Evaluation not found" });
      return;
    }
    res.json({ evaluation: result.rows[0] });
  } catch (err) {
    console.error("Get evaluation error:", err);
    res.status(500).json({ error: "Failed to get evaluation" });
  }
});

// POST / — create a new evaluation (simulates AI scoring for MVP)
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    const { applicant_name, property_id, property_address } = req.body;

    if (!applicant_name || !property_address) {
      res.status(400).json({ error: "applicant_name and property_address are required" });
      return;
    }

    // For MVP, generate placeholder AI scoring
    const score = Math.floor(Math.random() * 30) + 65; // 65-94
    const riskLevel = score >= 80 ? "low" : score >= 70 ? "medium" : "high";
    const recommendation =
      riskLevel === "low"
        ? "Recommended — strong application"
        : riskLevel === "medium"
        ? "Proceed with caution — review flagged items"
        : "Not recommended — significant concerns";

    const breakdown = [
      { category: "Income", score: Math.floor(Math.random() * 25) + 70, detail: "Meets income threshold" },
      { category: "Credit", score: Math.floor(Math.random() * 30) + 60, detail: "Credit check reviewed" },
      { category: "Rental History", score: Math.floor(Math.random() * 25) + 70, detail: "Prior landlord references" },
      { category: "Employment", score: Math.floor(Math.random() * 20) + 75, detail: "Employment verified" },
    ];

    const summary = `Based on the submitted documents, ${applicant_name} presents a ${riskLevel}-risk profile for ${property_address}. ` +
      `Income verification shows adequate earnings relative to rent. ` +
      `Credit history and rental references have been reviewed. ` +
      `This assessment is AI-generated and advisory — the final decision rests with the property owner.`;

    const evidence = [
      { name: "Application Form", description: "Submitted rental application", type: "file" },
      { name: "Income Verification", description: "Pay stubs reviewed", type: "file" },
    ];

    const result = await db.query(
      `INSERT INTO evaluations (user_id, property_id, applicant_name, property_address, status, overall_score, risk_level, recommendation, summary, breakdown, evidence)
       VALUES ($1, $2, $3, $4, 'complete', $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [userId, property_id || null, applicant_name, property_address, score, riskLevel, recommendation, summary, JSON.stringify(breakdown), JSON.stringify(evidence)],
    );
    res.status(201).json({ evaluation: result.rows[0] });
  } catch (err) {
    console.error("Create evaluation error:", err);
    res.status(500).json({ error: "Failed to create evaluation" });
  }
});

// PUT /:id/status — update evaluation status (approve/decline)
router.put("/:id/status", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    const { status } = req.body;

    if (status !== "approved" && status !== "declined") {
      res.status(400).json({ error: "status must be 'approved' or 'declined'" });
      return;
    }

    const result = await db.query(
      `UPDATE evaluations SET status = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, req.params.id, userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Evaluation not found" });
      return;
    }
    res.json({ evaluation: result.rows[0] });
  } catch (err) {
    console.error("Update evaluation status error:", err);
    res.status(500).json({ error: "Failed to update evaluation" });
  }
});

// DELETE /:id — delete an evaluation
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    const result = await db.query(
      "DELETE FROM evaluations WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, userId],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Evaluation not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Delete evaluation error:", err);
    res.status(500).json({ error: "Failed to delete evaluation" });
  }
});

export default router;
