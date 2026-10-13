import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("local storage driver", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "reunion-storage-"));
    vi.stubEnv("LOCAL_UPLOAD_DIR", dir);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("stores, reads and deletes objects and prunes empty folders", async () => {
    const { localStorageDriver } = await import("@/lib/storage/local");
    await localStorageDriver.put("alumni/abc/full.webp", Buffer.from("x"), "image/webp");
    expect((await localStorageDriver.get("alumni/abc/full.webp"))?.body.toString()).toBe("x");
    await localStorageDriver.delete(["alumni/abc/full.webp"]);
    expect(await localStorageDriver.get("alumni/abc/full.webp")).toBeNull();
    expect(existsSync(path.join(dir, "alumni/abc"))).toBe(false);
  });

  it("refuses path traversal", async () => {
    const { localStorageDriver } = await import("@/lib/storage/local");
    await expect(localStorageDriver.put("../evil.txt", Buffer.from("x"), "text/plain")).rejects.toThrow();
    await expect(localStorageDriver.get("alumni/../../etc/passwd")).rejects.toThrow();
  });
});

describe("supabase storage driver (HTTP contract, mocked)", () => {
  beforeEach(() => {
    vi.stubEnv("SUPABASE_URL", "https://proj.supabase.co/");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    vi.stubEnv("SUPABASE_STORAGE_BUCKET", "reunion-media");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uploads with the service key to the private bucket", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { supabaseStorageDriver } = await import("@/lib/storage/supabase");
    await supabaseStorageDriver.put("alumni/abc/full.webp", Buffer.from("img"), "image/webp");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://proj.supabase.co/storage/v1/object/reunion-media/alumni/abc/full.webp");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer service-key");
    expect(init.headers["Content-Type"]).toBe("image/webp");
  });

  it("treats missing objects as null and deletes in bulk", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{"statusCode":"404"}', { status: 400 }))
      .mockResolvedValueOnce(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { supabaseStorageDriver } = await import("@/lib/storage/supabase");
    expect(await supabaseStorageDriver.get("alumni/missing/full.webp")).toBeNull();
    await supabaseStorageDriver.delete(["a/1.webp", "a/2.webp"]);
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("https://proj.supabase.co/storage/v1/object/reunion-media");
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(init.body)).toEqual({ prefixes: ["a/1.webp", "a/2.webp"] });
  });

  it("surfaces upload failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("denied", { status: 403 })));
    const { supabaseStorageDriver } = await import("@/lib/storage/supabase");
    await expect(supabaseStorageDriver.put("alumni/x/full.webp", Buffer.from("x"), "image/webp")).rejects.toThrow(/403/);
  });
});
