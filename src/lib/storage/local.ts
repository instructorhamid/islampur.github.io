import "server-only";
import { mkdir, readFile, rm, rmdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../env";
import { assertSafeKey, type StorageDriver } from "./types";

function resolve(key: string) {
  assertSafeKey(key);
  const root = path.resolve(env.localUploadDir);
  const full = path.resolve(root, key);
  if (!full.startsWith(root + path.sep)) throw new Error("Invalid storage key");
  return full;
}

export const localStorageDriver: StorageDriver = {
  async put(key, body) {
    const full = resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body);
  },
  async get(key) {
    try {
      const body = await readFile(resolve(key));
      return { body, contentType: key.endsWith(".webp") ? "image/webp" : "application/octet-stream" };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  },
  async delete(keys) {
    await Promise.all(keys.map((k) => rm(resolve(k), { force: true })));
    // Remove now-empty per-photo folders (e.g. uploads/alumni/<uuid>/); non-empty ones are left alone.
    const root = path.resolve(env.localUploadDir);
    const parents = new Set(keys.map((k) => path.dirname(resolve(k))).filter((d) => d !== root && d.startsWith(root + path.sep)));
    await Promise.all([...parents].map((d) => rmdir(d).catch(() => {})));
  },
};
