// Create (or reset the password of) an administrator.
// Usage: npm run admin:create -- --email you@example.com --name "Your Name" [--role admin|moderator]
// The password is read from the ADMIN_PASSWORD environment variable or prompted for interactively.
import { createInterface } from "node:readline/promises";
import { hashPassword, PASSWORD_MIN_LENGTH } from "../src/lib/password";
import { connect } from "./_db";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim() || "Administrator";
  const role = arg("role") === "moderator" ? "moderator" : "admin";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Usage: npm run admin:create -- --email you@example.com --name "Name" [--role admin|moderator]');
    process.exit(1);
  }

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    password = await rl.question(`Password (min ${PASSWORD_MIN_LENGTH} characters): `);
    rl.close();
  }
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    console.error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
    process.exit(1);
  }

  const sql = connect();
  const hash = await hashPassword(password);
  const [row] = await sql<{ id: string; inserted: boolean }[]>`
    insert into admins (name, email, password_hash, role) values (${name}, ${email}, ${hash}, ${role})
    on conflict (lower(email)) do update set password_hash = excluded.password_hash, role = excluded.role,
      name = excluded.name, is_active = true, updated_at = now()
    returning id, (xmax = 0) as inserted`;
  await sql`delete from admin_sessions where admin_id = ${row.id}`;
  console.log(`${row.inserted ? "Created" : "Updated"} ${role} account for ${email}.`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
