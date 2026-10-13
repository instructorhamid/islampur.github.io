// Applies SQL files in db/migrations in filename order, each exactly once, inside a transaction.
// Safe to run concurrently (e.g. two Vercel builds): every step holds a transaction-level advisory
// lock and re-checks what has been applied, which also works through transaction-mode poolers.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { connect } from "./_db";

const LOCK_ID = 2713_129817; // school code + EIIN

async function main() {
  const sql = connect();
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(${LOCK_ID})`;
    await tx`create table if not exists schema_migrations (
      name text primary key, applied_at timestamptz not null default now())`;
    await tx`alter table schema_migrations enable row level security`;
  });

  const dir = path.join(process.cwd(), "db", "migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  let count = 0;
  for (const file of files) {
    const body = await readFile(path.join(dir, file), "utf8");
    const applied = await sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(${LOCK_ID})`;
      const [done] = await tx`select 1 from schema_migrations where name = ${file}`;
      if (done) return false;
      await tx.unsafe(body);
      await tx`insert into schema_migrations (name) values (${file})`;
      return true;
    });
    if (applied) {
      console.log(`Applied ${file}`);
      count++;
    }
  }
  console.log(count ? `Applied ${count} migration(s).` : "Database is up to date.");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
