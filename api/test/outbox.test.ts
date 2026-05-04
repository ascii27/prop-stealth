import { describe, it, expect, vi } from "vitest";
import { claimPendingForUpdate } from "../src/email/outbox.js";

describe("claimPendingForUpdate", () => {
  it("uses UPDATE ... RETURNING with FOR UPDATE SKIP LOCKED and bumps attempts", async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      rows: [{ id: "row-1", to_email: "x@y.test" }],
    });
    const rows = await claimPendingForUpdate({ query: mockQuery } as never, 5);
    expect(rows).toHaveLength(1);
    const sql = mockQuery.mock.calls[0][0] as string;
    expect(sql).toMatch(/UPDATE\s+email_outbox/i);
    expect(sql).toMatch(/SET\s+attempts/i);
    expect(sql).toMatch(/RETURNING/i);
    expect(sql).toMatch(/FOR\s+UPDATE\s+SKIP\s+LOCKED/i);
    expect(mockQuery.mock.calls[0][1]).toEqual([5]);
  });
});
