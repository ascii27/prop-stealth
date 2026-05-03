import { describe, it, expect } from "vitest";
import { generateInviteToken, isInviteValid } from "../src/invites/tokens.js";

describe("generateInviteToken", () => {
  it("returns a 64-char URL-safe string", () => {
    const t = generateInviteToken();
    expect(t).toHaveLength(64);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns different values on subsequent calls", () => {
    const a = generateInviteToken();
    const b = generateInviteToken();
    expect(a).not.toBe(b);
  });
});

describe("isInviteValid", () => {
  it("returns false when token is missing", () => {
    expect(
      isInviteValid({
        invite_token: null,
        invite_token_expires_at: new Date(Date.now() + 1000),
        invite_consumed_at: null,
      }),
    ).toBe(false);
  });

  it("returns false when expired", () => {
    expect(
      isInviteValid({
        invite_token: "abc",
        invite_token_expires_at: new Date(Date.now() - 1000),
        invite_consumed_at: null,
      }),
    ).toBe(false);
  });

  it("returns false when already consumed", () => {
    expect(
      isInviteValid({
        invite_token: "abc",
        invite_token_expires_at: new Date(Date.now() + 1000),
        invite_consumed_at: new Date(),
      }),
    ).toBe(false);
  });

  it("returns true for valid unexpired unconsumed token", () => {
    expect(
      isInviteValid({
        invite_token: "abc",
        invite_token_expires_at: new Date(Date.now() + 1000),
        invite_consumed_at: null,
      }),
    ).toBe(true);
  });
});
