// Recreates the e2e database from scratch: schema, provisional content and demo data (no admin accounts).
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import postgres from "postgres";
import sharp from "sharp";
import { E2E_ENV } from "./env";

async function main() {
  const sql = postgres(E2E_ENV.DATABASE_URL, { max: 1, onnotice: () => {} });
  await sql.unsafe("drop schema if exists public cascade; create schema public;");
  await sql.end();

  const env: NodeJS.ProcessEnv = { ...process.env, ...E2E_ENV, NODE_ENV: "development" };
  const run = (args: string[], extra: Record<string, string> = {}) =>
    execFileSync("npx", ["tsx", ...args], { env: { ...env, ...extra }, stdio: "inherit" });
  run(["scripts/migrate.ts"]);
  run(["scripts/seed.ts"]);
  // No admin accounts: 00-setup.spec.ts creates them through /admin/setup and /admin/users.

  rmSync("tests/.tmp", { recursive: true, force: true });
  mkdirSync("tests/.tmp/uploads", { recursive: true });
  const svg = `<svg width="800" height="1000" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="1000" fill="#2c8a5a"/><circle cx="400" cy="380" r="190" fill="#f1d3a8"/><rect x="170" y="620" width="460" height="420" rx="200" fill="#0b5d36"/></svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toFile("tests/.tmp/photo.jpg");
  await sharp(Buffer.from(svg)).png().toFile("tests/.tmp/logo.png");
  writeFileSync("tests/.tmp/not-an-image.jpg", "this is plain text pretending to be a JPEG");
  console.log("E2E database and fixtures ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
