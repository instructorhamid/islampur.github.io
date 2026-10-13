// Resolves database connection settings from the environment. Shared by the app and the CLI scripts.
//
// Accepts DATABASE_URL, or POSTGRES_URL as created by the Vercel ⇄ Supabase integration.
// Integration URLs carry extra query parameters (e.g. `supa=base-pooler.x`, `sslmode=require`)
// that postgres.js would otherwise forward to the server as startup parameters.
//
// Supabase's shared pooler accepts session mode on port 5432 and transaction mode on 6543.
// Session mode holds one of only ~15 server connections per client for as long as the client
// stays connected, which serverless functions (and concurrent builds) exhaust quickly
// ("EMAXCONNSESSION max clients reached in session mode"). The app needs no session state
// (prepared statements are off, locks are transaction-scoped), so always use transaction mode.

type Env = Record<string, string | undefined>;

const HOSTED_SUFFIXES = [".supabase.com", ".supabase.co", ".neon.tech", ".pooler.supabase.com"];

export function resolveDatabaseConfig(env: Env = process.env): { url: string; ssl: boolean } | null {
  const raw = env.DATABASE_URL || env.POSTGRES_URL;
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { url: raw, ssl: env.DATABASE_SSL === "require" };
  }
  const sslmode = url.searchParams.get("sslmode");
  for (const key of ["supa", "pgbouncer", "sslmode", "connection_limit", "pool_timeout"]) url.searchParams.delete(key);
  if (url.hostname.endsWith(".pooler.supabase.com") && (url.port === "" || url.port === "5432")) url.port = "6543";
  const hosted = HOSTED_SUFFIXES.some((s) => url.hostname.endsWith(s));
  const ssl =
    env.DATABASE_SSL === "require" ||
    (env.DATABASE_SSL !== "disable" && (hosted || (sslmode !== null && sslmode !== "disable" && sslmode !== "allow")));
  return { url: url.toString(), ssl };
}
