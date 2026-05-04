import crypto from "crypto";

export function generateInviteToken(): string {
  // 48 random bytes → base64url ≈ 64 chars (no padding)
  return crypto.randomBytes(48).toString("base64url").slice(0, 64);
}

export const INVITE_TTL_DAYS = 14;

export function inviteExpiry(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + INVITE_TTL_DAYS);
  return d;
}

export interface InviteRow {
  invite_token: string | null;
  invite_token_expires_at: Date | null;
  invite_consumed_at: Date | null;
}

export function isInviteValid(row: InviteRow, now: Date = new Date()): boolean {
  if (!row.invite_token) return false;
  if (row.invite_consumed_at) return false;
  if (!row.invite_token_expires_at) return false;
  return row.invite_token_expires_at.getTime() > now.getTime();
}
