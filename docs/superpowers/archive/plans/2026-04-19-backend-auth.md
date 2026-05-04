# Backend & Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up an Express + TypeScript backend in a monorepo with the existing Next.js frontend, with working Google OAuth authentication, PostgreSQL database, and JWT session management.

**Architecture:** Monorepo with `web/` (Next.js) and `api/` (Express). The Next.js app proxies `/api/*` requests to the Express server via rewrites. Google OAuth flow uses Passport.js, with JWTs stored in HTTP-only cookies. Next.js middleware protects dashboard routes.

**Tech Stack:** Express, TypeScript, Passport.js, passport-google-oauth20, jsonwebtoken, pg, PostgreSQL 16, Docker Compose, Next.js middleware

**Design Spec:** `docs/superpowers/specs/2026-04-19-backend-auth-design.md`

---

## File Structure

```
prop-stealth/
├── package.json                    # Root: npm workspaces, concurrently scripts
├── docker-compose.yml              # PostgreSQL 16
├── .gitignore                      # Updated for monorepo
├── web/                            # Next.js app (moved from current root)
│   ├── package.json                # Moved from root
│   ├── tsconfig.json               # Moved from root
│   ├── next.config.ts              # Updated: add /api/* rewrites
│   ├── eslint.config.mjs           # Moved from root
│   ├── postcss.config.mjs          # Moved from root
│   ├── middleware.ts               # NEW: JWT verification, route protection
│   ├── src/                        # Moved from root
│   │   ├── app/
│   │   │   ├── (auth)/login/page.tsx   # MODIFIED: real Google OAuth link
│   │   │   └── ...
│   │   ├── components/
│   │   └── lib/
│   └── public/                     # Moved from root
├── api/                            # Express backend (all new)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example                # Template (committed)
│   ├── .env                        # Actual secrets (gitignored)
│   └── src/
│       ├── index.ts                # Express app entry
│       ├── config.ts               # Env vars, constants
│       ├── types.ts                # User, JwtPayload types
│       ├── db/
│       │   ├── client.ts           # pg Pool singleton
│       │   ├── migrate.ts          # Migration runner
│       │   └── migrations/
│       │       └── 001_create_users_sessions.sql
│       ├── routes/
│       │   └── auth.ts             # /api/auth/* routes
│       └── middleware/
│           └── auth.ts             # requireAuth middleware
```

---

## Task 1: Monorepo Restructure

**Files:**
- Create: `package.json` (root workspace), `web/package.json`
- Move: all Next.js files into `web/`
- Modify: `.gitignore`

- [ ] **Step 1: Create a new branch**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
git checkout -b feat/backend-auth
```

- [ ] **Step 2: Move Next.js files into `web/`**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
mkdir web
# Move Next.js source files
git mv src web/src
git mv public web/public
git mv next.config.ts web/next.config.ts
git mv tsconfig.json web/tsconfig.json
git mv eslint.config.mjs web/eslint.config.mjs
git mv postcss.config.mjs web/postcss.config.mjs
# Move package files
git mv package.json web/package.json
git mv package-lock.json web/package-lock.json
# Move Next.js generated files (not tracked but need to handle)
mv .next web/.next 2>/dev/null || true
mv next-env.d.ts web/next-env.d.ts 2>/dev/null || true
mv tsconfig.tsbuildinfo web/tsconfig.tsbuildinfo 2>/dev/null || true
# Move README
git mv README.md web/README.md
```

- [ ] **Step 3: Create root `package.json` with workspaces**

Create `package.json`:

```json
{
  "name": "prop-stealth",
  "version": "0.1.0",
  "private": true,
  "workspaces": ["web", "api"],
  "scripts": {
    "dev": "concurrently -n web,api -c blue,green \"npm run dev -w web\" \"npm run dev -w api\"",
    "build": "npm run build -w web && npm run build -w api",
    "lint": "npm run lint -w web"
  },
  "devDependencies": {
    "concurrently": "^9"
  }
}
```

- [ ] **Step 4: Update `.gitignore` for monorepo**

Replace `.gitignore`:

```
# dependencies
node_modules/

# next.js
.next/
out/

# production
build/
dist/

# misc
.DS_Store
*.pem

# debug
npm-debug.log*

# env files
.env
.env.local
.env.*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# playwright
.playwright-mcp/

# superpowers brainstorm
.superpowers/
```

- [ ] **Step 5: Update `web/tsconfig.json` paths**

Read current `web/tsconfig.json` and ensure the `paths` alias still works. The `@/*` alias should point to `./src/*` which is relative, so no change needed. Verify.

- [ ] **Step 6: Install root dependencies and verify**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
npm install
cd web && npm install && cd ..
npm run build -w web
```

Verify the Next.js app still builds from the monorepo root.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: move Next.js app into web/ for monorepo structure"
```

---

## Task 2: Docker Compose + PostgreSQL

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create `docker-compose.yml`**

Create `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: propstealth
      POSTGRES_USER: propstealth
      POSTGRES_PASSWORD: propstealth_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

- [ ] **Step 2: Start PostgreSQL**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
docker compose up -d
```

Verify it's running:

```bash
docker compose ps
```

Expected: postgres container running, port 5432 mapped.

- [ ] **Step 3: Test connection**

```bash
docker compose exec postgres psql -U propstealth -d propstealth -c "SELECT 1;"
```

Expected: returns `1`.

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add Docker Compose with PostgreSQL 16"
```

---

## Task 3: Express API Scaffolding

**Files:**
- Create: `api/package.json`, `api/tsconfig.json`, `api/.env.example`, `api/.env`, `api/src/config.ts`, `api/src/types.ts`, `api/src/index.ts`

- [ ] **Step 1: Create `api/package.json`**

Create `api/package.json`:

```json
{
  "name": "propstealth-api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "migrate": "tsx src/db/migrate.ts"
  },
  "dependencies": {
    "cookie-parser": "^1.4.7",
    "dotenv": "^16",
    "express": "^5",
    "helmet": "^8",
    "jsonwebtoken": "^9",
    "morgan": "^1.10",
    "passport": "^0.7",
    "passport-google-oauth20": "^2",
    "pg": "^8"
  },
  "devDependencies": {
    "@types/cookie-parser": "^1",
    "@types/express": "^5",
    "@types/jsonwebtoken": "^9",
    "@types/morgan": "^1",
    "@types/passport-google-oauth20": "^2",
    "@types/pg": "^8",
    "tsx": "^4",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create `api/tsconfig.json`**

Create `api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `api/.env.example` and `api/.env`**

Create `api/.env.example`:

```
DATABASE_URL=postgresql://propstealth:propstealth_dev@localhost:5432/propstealth
JWT_SECRET=change-me-to-a-random-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
PORT=4000
NODE_ENV=development
```

Copy to `api/.env` and set a random JWT_SECRET:

```bash
cp api/.env.example api/.env
# Replace JWT_SECRET with a random value
sed -i '' "s/change-me-to-a-random-secret/$(openssl rand -hex 32)/" api/.env
```

- [ ] **Step 4: Create `api/src/config.ts`**

Create `api/src/config.ts`:

```ts
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://propstealth:propstealth_dev@localhost:5432/propstealth",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      "http://localhost:3000/api/auth/google/callback",
  },
  cookieName: "propstealth_session",
  sessionMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
} as const;
```

- [ ] **Step 5: Create `api/src/types.ts`**

Create `api/src/types.ts`:

```ts
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: "owner" | "agent";
  google_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: Date;
  created_at: Date;
}

export interface JwtPayload {
  userId: string;
  role: "owner" | "agent";
  sessionId: string;
}
```

- [ ] **Step 6: Create `api/src/index.ts`**

Create `api/src/index.ts`:

```ts
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config.js";

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(config.port, () => {
  console.log(`API server running on http://localhost:${config.port}`);
});
```

- [ ] **Step 7: Install dependencies and verify**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
npm install
npm run dev -w api
```

In another terminal:

```bash
curl http://localhost:4000/api/health
```

Expected: `{"status":"ok"}`

Stop the server (Ctrl+C).

- [ ] **Step 8: Commit**

```bash
git add api/ package.json
git commit -m "feat: scaffold Express API server with TypeScript"
```

---

## Task 4: Database Client + Migrations

**Files:**
- Create: `api/src/db/client.ts`, `api/src/db/migrate.ts`, `api/src/db/migrations/001_create_users_sessions.sql`

- [ ] **Step 1: Create `api/src/db/client.ts`**

Create `api/src/db/client.ts`:

```ts
import pg from "pg";
import { config } from "../config.js";

const pool = new pg.Pool({
  connectionString: config.databaseUrl,
});

export const db = {
  query: (text: string, params?: unknown[]) => pool.query(text, params),
  pool,
};
```

- [ ] **Step 2: Create migration SQL**

Create `api/src/db/migrations/001_create_users_sessions.sql`:

```sql
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255),
  avatar_url    TEXT,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'agent')),
  google_id     VARCHAR(255) UNIQUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

- [ ] **Step 3: Create migration runner**

Create `api/src/db/migrate.ts`:

```ts
import fs from "fs";
import path from "path";
import { db } from "./client.js";

async function migrate() {
  // Create migrations tracking table
  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name VARCHAR(255) PRIMARY KEY,
      run_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const migrationsDir = path.resolve(__dirname, "migrations");
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (!file.endsWith(".sql")) continue;

    const { rows } = await db.query(
      "SELECT 1 FROM _migrations WHERE name = $1",
      [file]
    );

    if (rows.length > 0) {
      console.log(`Skipping ${file} (already run)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    console.log(`Running migration: ${file}`);
    await db.query(sql);
    await db.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
  }

  console.log("Migrations complete");
  await db.pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
```

- [ ] **Step 4: Run migrations**

Make sure Docker PostgreSQL is running:

```bash
cd /Users/michaelgalloway/dev/prop-stealth
docker compose up -d
npm run migrate -w api
```

Expected: `Running migration: 001_create_users_sessions.sql` then `Migrations complete`.

- [ ] **Step 5: Verify tables exist**

```bash
docker compose exec postgres psql -U propstealth -d propstealth -c "\dt"
```

Expected: `users`, `sessions`, and `_migrations` tables listed.

- [ ] **Step 6: Commit**

```bash
git add api/src/db/
git commit -m "feat: add database client, migrations, and initial schema"
```

---

## Task 5: Auth Middleware (requireAuth)

**Files:**
- Create: `api/src/middleware/auth.ts`

- [ ] **Step 1: Create `api/src/middleware/auth.ts`**

Create `api/src/middleware/auth.ts`:

```ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { JwtPayload } from "../types.js";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies[config.cookieName];

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add api/src/middleware/
git commit -m "feat: add requireAuth middleware for JWT verification"
```

---

## Task 6: Google OAuth Routes

**Files:**
- Create: `api/src/routes/auth.ts`
- Modify: `api/src/index.ts`

- [ ] **Step 1: Create `api/src/routes/auth.ts`**

Create `api/src/routes/auth.ts`:

```ts
import { Router, Request, Response } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../config.js";
import { db } from "../db/client.js";
import { User, JwtPayload } from "../types.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// --- Passport setup ---

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        done(null, {
          googleId: profile.id,
          email: profile.emails?.[0]?.value || "",
          name: profile.displayName || null,
          avatarUrl: profile.photos?.[0]?.value || null,
        });
      } catch (err) {
        done(err as Error);
      }
    }
  )
);

// Serialize/deserialize (not using sessions, but Passport requires these)
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user as Express.User));

// --- Helper functions ---

function createState(role: string): string {
  const csrf = crypto.randomBytes(16).toString("hex");
  return Buffer.from(JSON.stringify({ role, csrf })).toString("base64url");
}

function parseState(state: string): { role: string; csrf: string } | null {
  try {
    return JSON.parse(Buffer.from(state, "base64url").toString());
  } catch {
    return null;
  }
}

async function findOrCreateUser(
  googleId: string,
  email: string,
  name: string | null,
  avatarUrl: string | null,
  role: "owner" | "agent"
): Promise<User> {
  // Check if user exists
  const { rows: existing } = await db.query(
    "SELECT * FROM users WHERE google_id = $1",
    [googleId]
  );

  if (existing.length > 0) {
    return existing[0] as User;
  }

  // Create new user
  const { rows: created } = await db.query(
    `INSERT INTO users (email, name, avatar_url, role, google_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [email, name, avatarUrl, role, googleId]
  );

  return created[0] as User;
}

async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + config.sessionMaxAge);
  const { rows } = await db.query(
    `INSERT INTO sessions (user_id, expires_at)
     VALUES ($1, $2)
     RETURNING id`,
    [userId, expiresAt]
  );
  return rows[0].id;
}

function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });
}

function setSessionCookie(res: Response, token: string) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    maxAge: config.sessionMaxAge,
    path: "/",
  });
}

// --- Routes ---

// GET /api/auth/google — initiate OAuth
router.get("/google", (req: Request, res: Response, next) => {
  const role = req.query.role as string;
  if (role !== "owner" && role !== "agent") {
    res.status(400).json({ error: "role must be 'owner' or 'agent'" });
    return;
  }

  const state = createState(role);

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state,
    session: false,
  })(req, res, next);
});

// GET /api/auth/google/callback — handle OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login?error=auth_failed",
    session: false,
  }),
  async (req: Request, res: Response) => {
    try {
      const stateParam = req.query.state as string;
      const state = parseState(stateParam);

      if (!state || (state.role !== "owner" && state.role !== "agent")) {
        res.redirect("/login?error=invalid_state");
        return;
      }

      const profile = req.user as {
        googleId: string;
        email: string;
        name: string | null;
        avatarUrl: string | null;
      };

      const user = await findOrCreateUser(
        profile.googleId,
        profile.email,
        profile.name,
        profile.avatarUrl,
        state.role as "owner" | "agent"
      );

      const sessionId = await createSession(user.id);

      const token = signJwt({
        userId: user.id,
        role: user.role,
        sessionId,
      });

      setSessionCookie(res, token);

      // Redirect to appropriate dashboard
      const dashboardPath = user.role === "owner" ? "/owner" : "/agent";
      res.redirect(dashboardPath);
    } catch (err) {
      console.error("OAuth callback error:", err);
      res.redirect("/login?error=server_error");
    }
  }
);

// POST /api/auth/logout
router.post("/logout", requireAuth, async (req: Request, res: Response) => {
  try {
    // Delete session from DB
    await db.query("DELETE FROM sessions WHERE id = $1", [
      req.user!.sessionId,
    ]);

    // Clear cookie
    res.clearCookie(config.cookieName, { path: "/" });
    res.json({ success: true });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Failed to logout" });
  }
});

// GET /api/auth/me — return current user
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query(
      "SELECT id, email, name, avatar_url, role FROM users WHERE id = $1",
      [req.user!.userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user: rows[0] });
  } catch (err) {
    console.error("Auth me error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
```

- [ ] **Step 2: Register auth routes in `api/src/index.ts`**

Replace `api/src/index.ts`:

```ts
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(config.port, () => {
  console.log(`API server running on http://localhost:${config.port}`);
});
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
npx tsc --noEmit -p api/tsconfig.json
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add api/src/routes/ api/src/index.ts
git commit -m "feat: add Google OAuth routes with Passport.js and JWT sessions"
```

---

## Task 7: Next.js Proxy Rewrites

**Files:**
- Modify: `web/next.config.ts`

- [ ] **Step 1: Update `web/next.config.ts` to proxy `/api/*`**

Replace `web/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 2: Verify the proxy works**

Start both servers:

```bash
cd /Users/michaelgalloway/dev/prop-stealth
npm run dev
```

In another terminal, test through the proxy:

```bash
curl http://localhost:3000/api/health
```

Expected: `{"status":"ok"}` (proxied from Express on 4000).

- [ ] **Step 3: Commit**

```bash
git add web/next.config.ts
git commit -m "feat: add Next.js rewrites to proxy /api/* to Express server"
```

---

## Task 8: Next.js Auth Middleware

**Files:**
- Create: `web/middleware.ts`

- [ ] **Step 1: Create `web/middleware.ts`**

Create `web/middleware.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";

// Lightweight JWT decode (no verification — that happens server-side on API calls).
// Middleware runs on the edge and just needs to check if a session exists and read the role.
function decodeJwtPayload(
  token: string
): { userId: string; role: string; sessionId: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString()
    );
    // Check expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

const protectedPaths = ["/owner", "/agent"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect dashboard routes
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("propstealth_session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = decodeJwtPayload(token);

  if (!payload) {
    // Invalid or expired token — clear it and redirect
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("propstealth_session");
    return response;
  }

  // Role-based routing: owner trying /agent/* or vice versa
  const isOwnerRoute =
    pathname === "/owner" || pathname.startsWith("/owner/");
  const isAgentRoute =
    pathname === "/agent" || pathname.startsWith("/agent/");

  if (isOwnerRoute && payload.role !== "owner") {
    return NextResponse.redirect(new URL("/agent", request.url));
  }

  if (isAgentRoute && payload.role !== "agent") {
    return NextResponse.redirect(new URL("/owner", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/owner/:path*", "/agent/:path*"],
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
npx tsc --noEmit -p web/tsconfig.json
```

- [ ] **Step 3: Commit**

```bash
git add web/middleware.ts
git commit -m "feat: add Next.js middleware for auth route protection"
```

---

## Task 9: Update Login Page

**Files:**
- Modify: `web/src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Update login page with real Google OAuth link**

Replace `web/src/app/(auth)/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";

type Role = "owner" | "agent";

const messaging: Record<Role, { headline: string; sub: string }> = {
  owner: {
    headline: "Manage your rental properties with AI",
    sub: "Automate inbox triage, screen tenants, and stay on top of your portfolio.",
  },
  agent: {
    headline: "Grow your clients' wealth with AI",
    sub: "Source tenants, manage client portfolios, and offer ongoing property services.",
  },
};

export default function LoginPage() {
  const [role, setRole] = useState<Role>("owner");

  const { headline, sub } = messaging[role];
  const googleAuthUrl = `/api/auth/google?role=${role}`;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-[340px] p-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 bg-brand rounded-lg" />
          <span className="font-bold text-xl text-gray-900">PropStealth</span>
        </div>

        {/* Role toggle */}
        <div className="flex flex-row bg-gray-100 rounded-lg p-0.5 mb-6">
          <button
            onClick={() => setRole("owner")}
            className={`flex-1 text-center py-2 text-[13px] rounded-md transition-colors ${
              role === "owner"
                ? "bg-white font-medium text-gray-900 shadow-sm"
                : "text-gray-500 cursor-pointer"
            }`}
          >
            Property Owner
          </button>
          <button
            onClick={() => setRole("agent")}
            className={`flex-1 text-center py-2 text-[13px] rounded-md transition-colors ${
              role === "agent"
                ? "bg-white font-medium text-gray-900 shadow-sm"
                : "text-gray-500 cursor-pointer"
            }`}
          >
            Real Estate Agent
          </button>
        </div>

        {/* Messaging */}
        <p className="text-sm font-medium text-gray-900 text-center mb-1">
          {headline}
        </p>
        <p className="text-xs text-gray-500 text-center mb-6">{sub}</p>

        {/* Google OAuth button — real link */}
        <a
          href={googleAuthUrl}
          className="w-full border border-gray-300 rounded-lg py-2.5 flex items-center justify-center gap-2.5 mb-4 hover:bg-gray-50 transition-colors"
        >
          <span className="w-[18px] h-[18px] bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">G</span>
          </span>
          <span className="text-[13px] font-medium text-gray-700">
            Continue with Google
          </span>
        </a>

        {/* Divider */}
        <p className="text-center text-[11px] text-gray-400 mb-4">or</p>

        {/* Email input — non-functional for MVP */}
        <input
          type="email"
          placeholder="Email address"
          disabled
          className="w-full border border-gray-300 rounded-md py-2 px-3 text-xs text-gray-900 placeholder:text-gray-400 mb-3 opacity-50 cursor-not-allowed"
        />

        {/* Password input — non-functional for MVP */}
        <input
          type="password"
          placeholder="Password"
          disabled
          className="w-full border border-gray-300 rounded-md py-2 px-3 text-xs text-gray-900 placeholder:text-gray-400 mb-4 opacity-50 cursor-not-allowed"
        />

        {/* Sign Up button — disabled for MVP */}
        <button
          disabled
          className="block w-full bg-gray-300 text-white py-2.5 rounded-lg text-center text-[13px] font-medium mb-4 cursor-not-allowed"
        >
          Sign Up with Email
        </button>

        {/* Sign in link */}
        <p className="text-center text-xs text-gray-500">
          Already have an account?{" "}
          <a href={googleAuthUrl} className="text-brand hover:underline">
            Sign in with Google
          </a>
        </p>

        {/* Error display */}
        <ErrorMessage />
      </div>
    </div>
  );
}

function ErrorMessage() {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");

  if (!error) return null;

  const messages: Record<string, string> = {
    auth_failed: "Google sign-in failed. Please try again.",
    invalid_state: "Something went wrong. Please try again.",
    server_error: "Server error. Please try again later.",
  };

  return (
    <p className="text-center text-xs text-red-500 mt-4">
      {messages[error] || "An error occurred. Please try again."}
    </p>
  );
}
```

- [ ] **Step 2: Verify the web app builds**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
npm run build -w web
```

- [ ] **Step 3: Commit**

```bash
git add web/src/app/\(auth\)/login/page.tsx
git commit -m "feat: update login page with real Google OAuth link and disabled email fields"
```

---

## Task 10: Root Dev Scripts + Verification

**Files:**
- Modify: `package.json` (root)

- [ ] **Step 1: Install root dependencies**

```bash
cd /Users/michaelgalloway/dev/prop-stealth
npm install
```

- [ ] **Step 2: Verify full dev startup**

```bash
npm run dev
```

Expected: Both servers start — Next.js on 3000, Express on 4000.

In another terminal:

```bash
# Test API health through proxy
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}

# Test direct API
curl http://localhost:4000/api/health
# Expected: {"status":"ok"}
```

- [ ] **Step 3: Verify auth flow initiates**

Open browser to `http://localhost:3000/login`. Click "Continue with Google".

Expected behavior depends on whether Google OAuth credentials are configured:
- **Without credentials:** Redirected to Google with an error (expected — credentials not yet set up). This confirms the proxy and route wiring works.
- **With credentials:** Full OAuth flow completes, user is created, redirected to dashboard.

- [ ] **Step 4: Verify middleware protects routes**

```bash
# Without a session cookie, dashboard should redirect to login
curl -s -o /dev/null -w "%{redirect_url}" http://localhost:3000/owner
# Expected: http://localhost:3000/login
```

- [ ] **Step 5: Commit any final adjustments**

```bash
git add -A
git commit -m "chore: finalize dev scripts and verify full auth pipeline"
```
