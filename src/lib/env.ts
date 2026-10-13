import "server-only";

function read(name: string, fallback?: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get databaseUrl() {
    return read("DATABASE_URL");
  },
  get databaseSsl() {
    return process.env.DATABASE_SSL === "require";
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
  get storageDriver(): "local" | "supabase" {
    return process.env.STORAGE_DRIVER === "supabase" ? "supabase" : "local";
  },
  get localUploadDir() {
    return read("LOCAL_UPLOAD_DIR", "./uploads");
  },
  get supabaseUrl() {
    return read("SUPABASE_URL").replace(/\/$/, "");
  },
  get supabaseServiceRoleKey() {
    return read("SUPABASE_SERVICE_ROLE_KEY");
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
