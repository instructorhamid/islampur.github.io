import "server-only";
import postgres from "postgres";
import { env } from "./env";

type Sql = ReturnType<typeof postgres>;

// Reuse one pool across hot reloads in development and across requests in production.
const globalForDb = globalThis as unknown as { __reunionSql?: Sql };

function createClient(): Sql {
  const { url, ssl } = env.database;
  return postgres(url, {
    max: env.databasePoolMax,
    ssl: ssl ? "require" : false,
    // Required for transaction-mode poolers (Supabase pooler on port 6543, PgBouncer).
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
    transform: { undefined: null },
  });
}

export const sql: Sql = globalForDb.__reunionSql ?? createClient();
if (!env.isProduction) globalForDb.__reunionSql = sql;

/** True when a Postgres error is a unique-constraint violation on the given index. */
export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  const e = error as { code?: string; constraint_name?: string };
  return e?.code === "23505" && (!constraint || e.constraint_name === constraint);
}
