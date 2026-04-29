import { google } from "googleapis";
import { config } from "../../config.js";
import { db } from "../../db/client.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GmailTokens {
  access_token: string;
  refresh_token: string;
  token_expires_at: Date;
}

export interface RawEmail {
  gmailMessageId: string;
  sender: string;
  subject: string;
  body: string;
  date: Date;
  threadId: string;
}

// ---------------------------------------------------------------------------
// OAuth client
// ---------------------------------------------------------------------------

function createOAuth2Client(tokens?: GmailTokens) {
  const client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.gmailCallbackUrl,
  );

  if (tokens) {
    client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.token_expires_at.getTime(),
    });
  }

  return client;
}

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

export async function getTokensForUser(userId: string): Promise<GmailTokens | null> {
  const result = await db.query(
    "SELECT access_token, refresh_token, token_expires_at FROM gmail_connections WHERE user_id = $1",
    [userId],
  );
  if (result.rows.length === 0) return null;
  return result.rows[0];
}

export async function refreshTokenIfNeeded(userId: string, tokens: GmailTokens): Promise<GmailTokens> {
  // If token expires within 5 minutes, refresh it
  const fiveMinutes = 5 * 60 * 1000;
  if (tokens.token_expires_at.getTime() - Date.now() > fiveMinutes) {
    return tokens;
  }

  const client = createOAuth2Client(tokens);
  const { credentials } = await client.refreshAccessToken();

  const updated: GmailTokens = {
    access_token: credentials.access_token!,
    refresh_token: credentials.refresh_token || tokens.refresh_token,
    token_expires_at: new Date(credentials.expiry_date!),
  };

  await db.query(
    `UPDATE gmail_connections
     SET access_token = $1, refresh_token = $2, token_expires_at = $3
     WHERE user_id = $4`,
    [updated.access_token, updated.refresh_token, updated.token_expires_at, userId],
  );

  return updated;
}

// ---------------------------------------------------------------------------
// Fetch emails
// ---------------------------------------------------------------------------

export async function fetchEmailsByLabel(
  tokens: GmailTokens,
  label: string,
  maxResults: number = 50,
): Promise<RawEmail[]> {
  const client = createOAuth2Client(tokens);
  const gmail = google.gmail({ version: "v1", auth: client });

  // Find or verify the label exists
  const labelsRes = await gmail.users.labels.list({ userId: "me" });
  const matchedLabel = labelsRes.data.labels?.find(
    (l) => l.name?.toLowerCase() === label.toLowerCase(),
  );

  if (!matchedLabel) {
    return []; // Label doesn't exist — no emails to fetch
  }

  // List messages with this label
  const listRes = await gmail.users.messages.list({
    userId: "me",
    labelIds: [matchedLabel.id!],
    maxResults,
  });

  if (!listRes.data.messages || listRes.data.messages.length === 0) {
    return [];
  }

  // Fetch each message's details
  const emails: RawEmail[] = [];
  for (const msg of listRes.data.messages) {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
      format: "full",
    });

    const headers = detail.data.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

    const sender = getHeader("From");
    const subject = getHeader("Subject");
    const dateStr = getHeader("Date");

    // Extract body text
    let body = "";
    const payload = detail.data.payload;
    if (payload?.body?.data) {
      body = Buffer.from(payload.body.data, "base64url").toString("utf-8");
    } else if (payload?.parts) {
      const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, "base64url").toString("utf-8");
      }
    }

    emails.push({
      gmailMessageId: msg.id!,
      sender,
      subject,
      body,
      date: dateStr ? new Date(dateStr) : new Date(),
      threadId: msg.threadId || msg.id!,
    });
  }

  return emails;
}

// ---------------------------------------------------------------------------
// Create draft reply
// ---------------------------------------------------------------------------

export async function createDraftReply(
  tokens: GmailTokens,
  threadId: string,
  originalMessageId: string,
  to: string,
  subject: string,
  bodyText: string,
): Promise<string> {
  const client = createOAuth2Client(tokens);
  const gmail = google.gmail({ version: "v1", auth: client });

  // Build RFC 2822 message
  const replySubject = subject.startsWith("Re:") ? subject : `Re: ${subject}`;
  const rawMessage = [
    `To: ${to}`,
    `Subject: ${replySubject}`,
    `In-Reply-To: ${originalMessageId}`,
    `References: ${originalMessageId}`,
    "",
    bodyText,
  ].join("\r\n");

  const encoded = Buffer.from(rawMessage).toString("base64url");

  const draft = await gmail.users.drafts.create({
    userId: "me",
    requestBody: {
      message: {
        raw: encoded,
        threadId,
      },
    },
  });

  return draft.data.id!;
}

// ---------------------------------------------------------------------------
// OAuth URL generation (used by routes)
// ---------------------------------------------------------------------------

export function getGmailAuthUrl(userId: string): string {
  const client = createOAuth2Client();
  const state = Buffer.from(JSON.stringify({ userId })).toString("base64url");

  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/gmail.labels",
    ],
    state,
  });
}

export async function exchangeGmailCode(code: string): Promise<{
  tokens: GmailTokens;
  email: string;
}> {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error("No refresh token returned. Re-authorize with prompt=consent.");
  }

  client.setCredentials(tokens);
  const gmail = google.gmail({ version: "v1", auth: client });
  const profile = await gmail.users.getProfile({ userId: "me" });

  return {
    tokens: {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(tokens.expiry_date!),
    },
    email: profile.data.emailAddress!,
  };
}
