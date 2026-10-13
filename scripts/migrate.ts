// Applies SQL files in db/migrations in filename order, each exactly once, inside a transaction.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { connect } from "./_db";

async function main() {
  const sql = connect();
  await sql`create table if not exists schema_migrations (
    name text primary key, applied_at timestamptz not null default now())`;
  await sql`alter table schema_migrations enable row level security`;

  const dir = path.join(process.cwd(), "db", "migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const applied = new Set((await sql<{ name: string }[]>`select name from schema_migrations`).map((r) => r.name));

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const body = await readFile(path.join(dir, file), "utf8");
    process.stdout.write(`Applying ${file} ... `);
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into schema_migrations (name) values (${file})`;
    });
    console.log("done");
    count++;
  }
  console.log(count ? `Applied ${count} migration(s).` : "Database is up to date.");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
