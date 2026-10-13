import { config } from "dotenv";
import postgres from "postgres";
import { resolveDatabaseConfig } from "../src/lib/db-config";

// Load .env.local first (development), then .env. Existing environment variables win.
config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

export function connect() {
  const config = resolveDatabaseConfig();
  if (!config) {
    console.error("DATABASE_URL (or POSTGRES_URL) is not set. Copy .env.example to .env.local and fill it in.");
    process.exit(1);
  }
  return postgres(config.url, {
    max: 1,
    ssl: config.ssl ? "require" : false,
    prepare: false,
    onnotice: () => {},
  });
}
