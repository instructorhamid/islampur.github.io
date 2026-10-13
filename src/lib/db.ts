import "server-only";
import postgres from "postgres";
import { limitConcurrency } from "./db-limit";
import { env } from "./env";

type Sql = ReturnType<typeof postgres>;

// Reuse one pool across hot reloads in development and across requests in production.
const globalForDb = globalThis as unknown as { __reunionSql?: Sql };

function createClient(): Sql {
  const { url, ssl } = env.database;
  const max = env.databasePoolMax;
  const client = postgres(url, {
    max,
    ssl: ssl ? "require" : false,
    // Required for transaction-mode poolers (Supabase pooler on port 6543, PgBouncer).
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
    transform: { undefined: null },
  });
  // Never more queries in flight than connections: pipelining hangs behind the Supabase pooler.
  return limitConcurrency(client, max);
}

export const sql: Sql = globalForDb.__reunionSql ?? createClient();
if (!env.isProduction) globalForDb.__reunionSql = sql;

/** True when a Postgres error is a unique-constraint violation on the given index. */
export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  const e = error as { code?: string; constraint_name?: string };
  return e?.code === "23505" && (!constraint || e.constraint_name === constraint);
}
