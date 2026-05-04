import fs from "fs/promises";
import path from "path";

export interface Storage {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  resolveAbsolute(key: string): string;
}

function safeResolve(rootAbs: string, key: string): string {
  if (path.isAbsolute(key)) {
    throw new Error("storage key must be relative");
  }
  const target = path.resolve(rootAbs, key);
  if (target !== rootAbs && !target.startsWith(rootAbs + path.sep)) {
    throw new Error("storage key escapes the root");
  }
  return target;
}

export function createLocalStorage(rootDir: string): Storage {
  const rootAbs = path.resolve(rootDir);
  return {
    async put(key, data) {
      const target = safeResolve(rootAbs, key);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, data);
    },
    async get(key) {
      const target = safeResolve(rootAbs, key);
      return fs.readFile(target);
    },
    async delete(key) {
      const target = safeResolve(rootAbs, key);
      await fs.rm(target, { force: true });
    },
    resolveAbsolute(key) {
      return safeResolve(rootAbs, key);
    },
  };
}
