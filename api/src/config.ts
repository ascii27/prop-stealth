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
    gmailCallbackUrl:
      process.env.GMAIL_CALLBACK_URL ||
      "http://localhost:3000/api/gmail/callback",
  },
  cookieName: "propstealth_session",
  sessionMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
} as const;
