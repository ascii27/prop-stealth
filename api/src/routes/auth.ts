import { Router, Request, Response } from "express";
import crypto from "crypto";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { JwtPayload } from "../types.js";
import { requireAuth } from "../middleware/auth.js";
import { db } from "../db/client.js";

// ---------------------------------------------------------------------------
// Passport setup
// ---------------------------------------------------------------------------

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
    },
    (_accessToken, _refreshToken, profile, done) => {
      const googleId = profile.id;
      const email = profile.emails?.[0]?.value ?? "";
      const name = profile.displayName || null;
      const avatarUrl = profile.photos?.[0]?.value || null;
      done(null, { googleId, email, name, avatarUrl } as unknown as Express.User);
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: Express.User, done) => {
  done(null, user);
});

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function createState(role: string, inviteToken?: string): string {
  const csrf = crypto.randomBytes(16).toString("hex");
  const payload = JSON.stringify({ role, csrf, inviteToken: inviteToken || null });
  return Buffer.from(payload).toString("base64url");
}

function parseState(
  state: string,
): { role: string; csrf: string; inviteToken: string | null } | null {
  try {
    const json = Buffer.from(state, "base64url").toString("utf-8");
    const parsed = JSON.parse(json);
    if (
      parsed &&
      typeof parsed.role === "string" &&
      typeof parsed.csrf === "string"
    ) {
      return {
        role: parsed.role,
        csrf: parsed.csrf,
        inviteToken:
          typeof parsed.inviteToken === "string" ? parsed.inviteToken : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function findOrCreateUser(
  googleId: string,
  email: string,
  name: string | null,
  avatarUrl: string | null,
  role: string,
) {
  const existing = await db.query("SELECT * FROM users WHERE google_id = $1", [googleId]);
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const result = await db.query(
    `INSERT INTO users (google_id, email, name, avatar_url, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [googleId, email, name, avatarUrl, role],
  );
  return result.rows[0];
}

async function createSession(userId: string): Promise<string> {
  const result = await db.query(
    `INSERT INTO sessions (user_id, expires_at)
     VALUES ($1, NOW() + INTERVAL '7 days')
     RETURNING id`,
    [userId],
  );
  return result.rows[0].id;
}

function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });
}

function setSessionCookie(res: Response, token: string): void {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    maxAge: config.sessionMaxAge,
  });
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const router = Router();

// GET /google — initiate OAuth flow
router.get("/google", (req: Request, res: Response, next) => {
  const role = req.query.role as string | undefined;
  const inviteToken = (req.query.invite_token as string | undefined) || undefined;

  if (role !== "owner" && role !== "agent") {
    res.status(400).json({ error: "role query param must be 'owner' or 'agent'" });
    return;
  }

  const state = createState(role, inviteToken);

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state,
    session: false,
  })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login?error=auth_failed",
    session: false,
  }),
  async (req: Request, res: Response) => {
    try {
      const stateParam = req.query.state as string | undefined;
      if (!stateParam) {
        res.redirect("/login?error=missing_state");
        return;
      }

      const state = parseState(stateParam);
      if (!state || (state.role !== "owner" && state.role !== "agent")) {
        res.redirect("/login?error=invalid_state");
        return;
      }

      const profile = req.user as unknown as {
        googleId: string;
        email: string;
        name: string | null;
        avatarUrl: string | null;
      };

      // If an invite token is present, validate and attach it
      let invitation: {
        id: string;
        agent_id: string;
        email: string;
      } | null = null;
      let effectiveRole = state.role;

      if (state.inviteToken) {
        const inv = await db.query(
          `SELECT id, agent_id, email, invite_token, invite_token_expires_at,
                  invite_consumed_at
             FROM invitations
            WHERE invite_token = $1`,
          [state.inviteToken],
        );
        if (inv.rows.length === 0) {
          res.redirect("/login?error=invite_invalid");
          return;
        }
        const row = inv.rows[0];
        if (
          row.invite_consumed_at ||
          !row.invite_token_expires_at ||
          new Date(row.invite_token_expires_at).getTime() <= Date.now()
        ) {
          res.redirect("/login?error=invite_expired");
          return;
        }
        if (row.email.toLowerCase() !== profile.email.toLowerCase()) {
          res.redirect("/login?error=invite_email_mismatch");
          return;
        }
        invitation = { id: row.id, agent_id: row.agent_id, email: row.email };
        effectiveRole = "owner"; // invite always creates an owner
      }

      const user = await findOrCreateUser(
        profile.googleId,
        profile.email,
        profile.name,
        profile.avatarUrl,
        effectiveRole,
      );

      if (invitation) {
        await db.query(
          `INSERT INTO agent_clients (agent_id, owner_id)
             VALUES ($1, $2)
             ON CONFLICT (agent_id, owner_id) DO NOTHING`,
          [invitation.agent_id, user.id],
        );
        await db.query(
          `UPDATE invitations
              SET status = 'accepted',
                  invite_consumed_at = NOW()
            WHERE id = $1`,
          [invitation.id],
        );
      }

      const sessionId = await createSession(user.id);

      const token = signJwt({
        userId: user.id,
        role: user.role,
        sessionId,
      });

      setSessionCookie(res, token);

      res.redirect(user.role === "owner" ? "/owner" : "/agent");
    } catch (err) {
      console.error("OAuth callback error:", err);
      res.redirect("/login?error=server_error");
    }
  },
);

// POST /logout — destroy session
router.post("/logout", requireAuth, async (req: Request, res: Response) => {
  try {
    const payload = req.user as JwtPayload;
    await db.query("DELETE FROM sessions WHERE id = $1", [payload.sessionId]);
    res.clearCookie(config.cookieName);
    res.json({ success: true });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Failed to logout" });
  }
});

// GET /me — return current user
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const payload = req.user as JwtPayload;
    const result = await db.query(
      "SELECT id, email, name, avatar_url, role FROM users WHERE id = $1",
      [payload.userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Failed to get user" });
  }
});

export default router;
