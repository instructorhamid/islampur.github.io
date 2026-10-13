// Removes every row flagged is_demo = true. Real registrations, sponsors and announcements are untouched.
// Demo rows are seeded without uploaded files, so there is nothing to remove from storage.
import { connect } from "./_db";

async function main() {
  const sql = connect();
  const r = await sql`delete from registrations where is_demo and photo_key is null`;
  const s = await sql`delete from sponsors where is_demo and logo_key is null`;
  const a = await sql`delete from announcements where is_demo`;
  const [{ left }] = await sql<{ left: number }[]>`
    select ((select count(*) from registrations where is_demo) + (select count(*) from sponsors where is_demo))::int as left`;
  console.log(`Removed ${r.count} demo registrations, ${s.count} demo sponsors, ${a.count} demo announcements.`);
  if (left > 0) console.log(`${left} demo row(s) with uploaded files remain — remove them from /admin/settings so their files are deleted too.`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
