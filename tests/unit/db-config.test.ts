import { describe, expect, it } from "vitest";
import { resolveDatabaseConfig } from "@/lib/db-config";

describe("resolveDatabaseConfig", () => {
  it("prefers DATABASE_URL and keeps local connections unencrypted", () => {
    expect(resolveDatabaseConfig({ DATABASE_URL: "postgres://u:p@localhost:5432/db", POSTGRES_URL: "postgres://x@y/z" })).toEqual({
      url: "postgres://u:p@localhost:5432/db",
      ssl: false,
    });
  });

  it("accepts the Vercel/Supabase POSTGRES_URL and strips integration-only parameters", () => {
    const r = resolveDatabaseConfig({
      POSTGRES_URL: "postgres://postgres.abc:pw@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x",
    });
    expect(r).toEqual({ url: "postgres://postgres.abc:pw@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres", ssl: true });
  });

  it("honours explicit DATABASE_SSL and sslmode", () => {
    expect(resolveDatabaseConfig({ DATABASE_URL: "postgres://u@db.example.com/x?sslmode=require" })?.ssl).toBe(true);
    expect(resolveDatabaseConfig({ DATABASE_URL: "postgres://u@localhost/x", DATABASE_SSL: "require" })?.ssl).toBe(true);
    expect(resolveDatabaseConfig({ DATABASE_URL: "postgres://u@x.supabase.com/x", DATABASE_SSL: "disable" })?.ssl).toBe(false);
  });

  it("returns null when nothing is configured", () => {
    expect(resolveDatabaseConfig({})).toBeNull();
  });
});
