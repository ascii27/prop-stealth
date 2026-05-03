# PropStealth Backend & Auth Design Spec

**Date:** 2026-04-19
**Status:** Approved

---

## Overview

Express + TypeScript backend server in a monorepo alongside the existing Next.js frontend. Handles Google OAuth 2.0 authentication, session management via JWTs in HTTP-only cookies, and serves as the API/BFF layer for the frontend. PostgreSQL via Docker for data storage.

## Monorepo Structure

Top-level directories. Move existing Next.js app into `web/`, create `api/` for Express. Root `package.json` uses npm workspaces.

```
prop-stealth/
├── package.json              # workspaces: ["web", "api"]
├── docker-compose.yml        # PostgreSQL 16
├── web/                      # Next.js app (moved from root)
│   ├── package.json
│   ├── next.config.ts        # rewrites /api/* → localhost:4000
│   ├── middleware.ts          # JWT verification, route protection
│   ├── src/
│   └── ...
├── api/                      # Express backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts          # Express app entry, listen on port 4000
│   │   ├── config.ts         # env vars, constants
│   │   ├── db/
│   │   │   ├── client.ts     # pg Pool singleton
│   │   │   ├── migrate.ts    # migration runner
│   │   │   └── migrations/   # SQL migration files
│   │   ├── routes/
│   │   │   └── auth.ts       # /api/auth/* routes
│   │   ├── middleware/
│   │   │   └── auth.ts       # requireAuth middleware
│   │   └── types.ts          # User, Session types
│   └── .env                  # secrets (not committed)
```

## Database

PostgreSQL 16 via Docker Compose. Two tables for MVP.

### Docker Compose

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

### Schema

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255),
  avatar_url    TEXT,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'agent')),
  google_id     VARCHAR(255) UNIQUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

- No password column — MVP is Google OAuth only
- Role is set at signup, immutable after creation
- Sessions table tracks active sessions for revocation

## Authentication Flow

### Google OAuth (Authorization Code Flow)

**Sign Up / Sign In:**

1. User selects role toggle (owner/agent) on login page, clicks "Continue with Google"
2. Frontend navigates to `GET /api/auth/google?role=owner` (or `agent`)
3. Express stores the `role` value in the OAuth `state` parameter (base64-encoded JSON with role + CSRF token)
4. Express redirects to Google OAuth consent screen via Passport
5. Google redirects back to `GET /api/auth/google/callback` with authorization code
6. Express exchanges code for tokens, gets user profile (email, name, avatar URL)
7. Express checks if user exists by `google_id`:
   - **New user:** Creates user row with role from state, creates session row, signs JWT, sets cookie, redirects to `/owner` or `/agent`
   - **Existing user:** Creates session row, signs JWT, sets cookie, redirects to dashboard for their stored role (ignores role param)
8. Frontend loads — dashboard layout reads role from JWT

**Return visit:**

1. User navigates to any `/owner/*` or `/agent/*` page
2. Next.js middleware reads `propstealth_session` cookie, verifies JWT signature
3. Valid + not expired → allow through
4. Expired or missing → redirect to `/login`
5. Wrong role for route (e.g., owner accessing `/agent/*`) → redirect to correct dashboard

**Sign out:**

1. Frontend calls `POST /api/auth/logout`
2. Express deletes session row from DB, clears cookie
3. Redirects to `/`

### JWT Cookie

- Cookie name: `propstealth_session`
- HTTP-only: yes
- Secure: yes (in production)
- SameSite: Lax
- Payload: `{ userId: string, role: "owner" | "agent", sessionId: string }`
- Expiry: 7 days
- Signed with a server-side secret (`JWT_SECRET` env var)

### Email/Password Auth

Not implemented in MVP. The login page shows email/password fields but they are non-functional. Google OAuth is the only working auth flow. Email/password will be added in a future iteration when password reset and email verification flows are ready.

## API Routes

### Auth Routes (`/api/auth/`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/google` | Initiates Google OAuth. Query param: `role=owner\|agent` |
| GET | `/api/auth/google/callback` | Google OAuth callback. Creates/finds user, sets cookie, redirects |
| POST | `/api/auth/logout` | Clears session and cookie |
| GET | `/api/auth/me` | Returns current user from JWT (userId, email, name, role, avatarUrl) |

### Future Routes (not in this spec)

Property CRUD, tenant evaluations, inbox agent, etc. will be added as separate specs.

## Tech Stack

### Express API (`api/`)

- `express` + `@types/express` — HTTP server
- `passport` + `passport-google-oauth20` — Google OAuth strategy
- `jsonwebtoken` + `@types/jsonwebtoken` — sign/verify JWTs
- `cookie-parser` + `@types/cookie-parser` — parse cookies
- `pg` + `@types/pg` — PostgreSQL client (raw SQL, no ORM)
- `dotenv` — env var loading
- `tsx` — dev server with hot reload
- `helmet` — security headers
- `morgan` + `@types/morgan` — request logging

### Docker

- PostgreSQL 16 via `docker-compose.yml`

### Next.js Changes (`web/`)

- `next.config.ts` — add `rewrites` to proxy `/api/*` to `http://localhost:4000`
- `web/middleware.ts` — read JWT cookie, verify signature, protect `/owner/*` and `/agent/*` routes, redirect unauthenticated users to `/login`
- `web/src/app/(auth)/login/page.tsx` — "Continue with Google" becomes `<a href="/api/auth/google?role=owner">` (dynamic based on toggle)

### Root

- `package.json` — npm workspaces `["web", "api"]`
- `concurrently` — runs both `web` and `api` dev servers via `npm run dev`

## Environment Variables (`api/.env`)

```
DATABASE_URL=postgresql://propstealth:propstealth_dev@localhost:5432/propstealth
JWT_SECRET=<random-secret-for-dev>
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
PORT=4000
NODE_ENV=development
```

Note: `GOOGLE_CALLBACK_URL` uses port 3000 (the Next.js proxy URL), not 4000, because the OAuth redirect goes through the frontend proxy.

## Key Design Decisions

1. **JWTs in HTTP-only cookies** — Embeds role and userId for frontend middleware to read (via a non-HTTP-only companion cookie or a `/api/auth/me` call), while keeping the token secure from JavaScript access.
2. **Role stored on user, not in JWT only** — JWT carries the role for convenience, but the database is the source of truth.
3. **No ORM** — Raw SQL via `pg` for simplicity and control. Two tables don't justify Prisma/Drizzle overhead.
4. **Passport.js** — Standard, well-documented Google OAuth integration. Avoids hand-rolling the OAuth flow.
5. **Next.js rewrites for proxy** — Frontend calls `/api/*` with relative URLs. No CORS configuration needed. In production, both can sit behind a reverse proxy.
6. **Google OAuth only for MVP** — Email/password fields exist in UI but are non-functional. Reduces scope significantly.
7. **`state` param for role** — The role selected on the login page is passed through the OAuth flow via Google's `state` parameter, so it survives the redirect round-trip.
