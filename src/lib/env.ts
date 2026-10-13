import "server-only";
import { resolveDatabaseConfig } from "./db-config";

/** Server-side Supabase key: legacy service_role key or the newer secret key. */
function supabaseKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
}

function read(name: string, fallback?: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  /** Connection settings from DATABASE_URL or the Vercel/Supabase integration's POSTGRES_URL. */
  get database() {
    const config = resolveDatabaseConfig();
    if (!config) throw new Error("Missing database connection: set DATABASE_URL (or POSTGRES_URL)");
    return config;
  },
  get databasePoolMax() {
    return Number(process.env.DATABASE_POOL_MAX || 5);
  },
  get appSecret() {
    const secret = read("APP_SECRET", process.env.NODE_ENV === "production" ? undefined : "dev-only-secret");
    if (process.env.NODE_ENV === "production" && secret.length < 24) {
      throw new Error("APP_SECRET must be at least 24 characters in production");
    }
    return secret;
  },
  /** Explicit STORAGE_DRIVER wins; otherwise Supabase is used whenever its credentials are present. */
  get storageDriver(): "local" | "supabase" {
    const explicit = process.env.STORAGE_DRIVER;
    if (explicit === "supabase" || explicit === "local") return explicit;
    return process.env.SUPABASE_URL && supabaseKey() ? "supabase" : "local";
  },
  get localUploadDir() {
    return read("LOCAL_UPLOAD_DIR", "./uploads");
  },
  get supabaseUrl() {
    return read("SUPABASE_URL").replace(/\/$/, "");
  },
  get supabaseServiceRoleKey() {
    const key = supabaseKey();
    if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)");
    return key;
  },
  get supabaseBucket() {
    return read("SUPABASE_STORAGE_BUCKET", "reunion-media");
  },
  get maxUploadBytes() {
    return Math.round(Number(process.env.MAX_UPLOAD_MB || 4) * 1024 * 1024);
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
};
