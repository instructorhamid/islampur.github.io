import { config } from "dotenv";
import postgres from "postgres";

// Load .env.local first (development), then .env. Existing environment variables win.
config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

export function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
    process.exit(1);
  }
  return postgres(url, {
    max: 1,
    ssl: process.env.DATABASE_SSL === "require" ? "require" : false,
    prepare: false,
    onnotice: () => {},
  });
}
