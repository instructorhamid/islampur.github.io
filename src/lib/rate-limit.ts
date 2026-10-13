import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { sql } from "./db";
import { env } from "./env";

/** Client IP from proxy headers (Vercel / most reverse proxies set x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** Keyed hash so raw IP addresses are never stored. */
export function hashIdentifier(value: string): string {
  return createHmac("sha256", env.appSecret).update(value).digest("hex").slice(0, 32);
}

function windowFor(action: string, identifier: string, windowSeconds: number) {
  return {
    key: `${action}:${hashIdentifier(identifier)}`,
    windowStart: new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000),
  };
}

/** True when `identifier` has already used up `limit` attempts in the current window (does not count this call). */
export async function isRateLimited(action: string, identifier: string, limit: number, windowSeconds: number) {
  const { key, windowStart } = windowFor(action, identifier, windowSeconds);
  const [row] = await sql<{ count: number }[]>`select count from rate_limits where key = ${key} and window_start = ${windowStart}`;
  return (row?.count ?? 0) >= limit;
}

/** Record one attempt (e.g. a failed login) without checking the limit. */
export async function recordAttempt(action: string, identifier: string, windowSeconds: number) {
  const { key, windowStart } = windowFor(action, identifier, windowSeconds);
  await sql`insert into rate_limits (key, window_start, count) values (${key}, ${windowStart}, 1)
    on conflict (key, window_start) do update set count = rate_limits.count + 1`;
}

/**
 * Fixed-window rate limiter stored in Postgres (works across serverless instances).
 * Counts this call and returns true when the action is allowed.
 */
export async function rateLimit(action: string, identifier: string, limit: number, windowSeconds: number) {
  const { key, windowStart } = windowFor(action, identifier, windowSeconds);
  const [row] = await sql<{ count: number }[]>`
    insert into rate_limits (key, window_start, count) values (${key}, ${windowStart}, 1)
    on conflict (key, window_start) do update set count = rate_limits.count + 1
    returning count`;
  // Opportunistic cleanup of old windows (~1% of calls).
  if (Math.random() < 0.01) {
    await sql`delete from rate_limits where window_start < now() - interval '2 days'`;
  }
  return row.count <= limit;
}
