import "server-only";
import { env } from "../env";
import { assertSafeKey, type StorageDriver } from "./types";

// Uses the Supabase Storage REST API with the service-role key (server-only).
// The bucket should be PRIVATE: the app serves files itself after checking approval/consent rules.

function headers(extra: Record<string, string> = {}) {
  const key = env.supabaseServiceRoleKey;
  return { Authorization: `Bearer ${key}`, apikey: key, ...extra };
}

function objectUrl(key: string) {
  assertSafeKey(key);
  return `${env.supabaseUrl}/storage/v1/object/${encodeURIComponent(env.supabaseBucket)}/${key}`;
}

/** Creates the private bucket the first time it is needed (no manual setup in the Supabase dashboard). */
async function ensureBucket() {
  const res = await fetch(`${env.supabaseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      id: env.supabaseBucket,
      name: env.supabaseBucket,
      public: false,
      file_size_limit: 5 * 1024 * 1024,
      allowed_mime_types: ["image/webp"],
    }),
  });
  // 409 / "already exists" just means another request created it first.
  if (!res.ok && res.status !== 409 && !/already exists/i.test(await res.text())) {
    throw new Error(`Supabase bucket creation failed (${res.status})`);
  }
}

async function upload(key: string, body: Buffer, contentType: string) {
  return fetch(objectUrl(key), {
    method: "POST",
    headers: headers({ "Content-Type": contentType, "x-upsert": "true", "cache-control": "31536000" }),
    body: new Uint8Array(body),
  });
}

export const supabaseStorageDriver: StorageDriver = {
  async put(key, body, contentType) {
    let res = await upload(key, body, contentType);
    if (!res.ok) {
      const text = await res.text();
      if (!/bucket not found/i.test(text)) throw new Error(`Supabase upload failed (${res.status}): ${text}`);
      await ensureBucket();
      res = await upload(key, body, contentType);
      if (!res.ok) throw new Error(`Supabase upload failed (${res.status}): ${await res.text()}`);
    }
  },
  async get(key) {
    const res = await fetch(objectUrl(key), { headers: headers(), cache: "no-store" });
    if (res.status === 400 || res.status === 404) return null;
    if (!res.ok) throw new Error(`Supabase download failed (${res.status})`);
    return {
      body: Buffer.from(await res.arrayBuffer()),
      contentType: res.headers.get("content-type") || "application/octet-stream",
    };
  },
  async delete(keys) {
    if (keys.length === 0) return;
    keys.forEach(assertSafeKey);
    const res = await fetch(`${env.supabaseUrl}/storage/v1/object/${encodeURIComponent(env.supabaseBucket)}`, {
      method: "DELETE",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ prefixes: keys }),
    });
    if (!res.ok && res.status !== 404) throw new Error(`Supabase delete failed (${res.status})`);
  },
};
