import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { createLocalStorage } from "../src/storage/local.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ps-storage-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("createLocalStorage", () => {
  it("put writes a file under root and get reads it back", async () => {
    const storage = createLocalStorage(tmpDir);
    await storage.put("a/b.txt", Buffer.from("hello"));
    const out = await storage.get("a/b.txt");
    expect(out.toString()).toBe("hello");
  });

  it("put refuses keys that try to escape the root", async () => {
    const storage = createLocalStorage(tmpDir);
    await expect(storage.put("../escape.txt", Buffer.from("x"))).rejects.toThrow();
    await expect(storage.put("/abs/path.txt", Buffer.from("x"))).rejects.toThrow();
  });

  it("delete removes the file", async () => {
    const storage = createLocalStorage(tmpDir);
    await storage.put("c.txt", Buffer.from("data"));
    await storage.delete("c.txt");
    await expect(storage.get("c.txt")).rejects.toThrow();
  });
});
