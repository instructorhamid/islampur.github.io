// Seeds clearly-labelled DEMO data for development and demonstrations.
// Every row inserted here has is_demo = true and is shown on the site with a "নমুনা" badge.
// Remove it before launch with: npm run db:clear-demo
import { connect } from "./_db";

const FIRST = [
  "আব্দুল করিম", "মোহাম্মদ রফিক", "নুসরাত জাহান", "তাহমিনা আক্তার", "রুহুল আমিন", "সাবিনা ইয়াসমিন",
  "জাহিদ হাসান", "ফারজানা বেগম", "আরিফুল ইসলাম", "শাহানা পারভীন", "মাহমুদুল হক", "রোকসানা খানম",
  "সুমন দাস", "অনিতা রানী দেব", "কামরুল হাসান", "সালমা খাতুন", "তানভীর আহমেদ", "মৌসুমী চৌধুরী",
  "ইমরান হোসেন", "লাকী বেগম", "বিপ্লব পাল", "নাজমা আক্তার", "সাইফুল আলম", "রাবেয়া বসরী",
  "দেলোয়ার হোসেন", "শিরিন সুলতানা", "আশরাফুল আলম", "মিতালী সিনহা", "হাবিবুর রহমান", "জান্নাতুল ফেরদৌস",
];
const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const YEARS = [1988, 1992, 1995, 1998, 2001, 2004, 2007, 2010, 2013, 2016, 2019, 2022, 2024];

async function main() {
  if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
    console.error("Refusing to seed demo data with NODE_ENV=production (pass --force to override).");
    process.exit(1);
  }
  const sql = connect();
  const [{ count }] = await sql<{ count: number }[]>`select count(*)::int as count from registrations where is_demo`;
  if (count > 0) {
    console.log(`Demo data already present (${count} demo registrations). Run npm run db:clear-demo first to reseed.`);
    await sql.end();
    return;
  }

  // Deterministic pseudo-random generator so the demo looks the same on every machine.
  let seed = 42;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);

  const rows = [];
  let n = 0;
  for (const year of YEARS) {
    // Give the 2010 batch enough members to demonstrate pagination (page size 24).
    const size = year === 2010 ? 30 : 2 + Math.floor(rand() * 6);
    for (let i = 0; i < size; i++) {
      n++;
      const status = n % 11 === 0 ? "pending" : n % 17 === 0 ? "rejected" : "approved";
      const createdAt = new Date(Date.now() - Math.floor(rand() * 60) * 86_400_000);
      rows.push({
        full_name: FIRST[n % FIRST.length],
        normalized_phone: `0130000${String(n).padStart(4, "0")}`,
        blood_group: BLOOD[Math.floor(rand() * BLOOD.length)],
        passing_year: year,
        photo_key: null,
        photo_consent: true,
        blood_group_public_consent: rand() > 0.35,
        privacy_accepted_at: createdAt,
        approval_status: status,
        reviewed_at: status === "pending" ? null : createdAt,
        is_demo: true,
        created_at: createdAt,
      });
    }
  }
  await sql`insert into registrations ${sql(rows)}`;

  const tiers = await sql<{ id: string; name: string }[]>`select id, name from sponsor_tiers order by display_order`;
  if (tiers.length) {
    await sql`insert into sponsors ${sql([
      { name: "নমুনা পৃষ্ঠপোষক প্রতিষ্ঠান ১", tier_id: tiers[0].id, description: "এটি একটি নমুনা এন্ট্রি। প্রকৃত পৃষ্ঠপোষক যুক্ত হলে এটি মুছে ফেলুন।", display_order: 1, is_published: true, is_demo: true },
      { name: "নমুনা পৃষ্ঠপোষক প্রতিষ্ঠান ২", tier_id: tiers[1 % tiers.length].id, description: "এটি একটি নমুনা এন্ট্রি। প্রকৃত পৃষ্ঠপোষক যুক্ত হলে এটি মুছে ফেলুন।", display_order: 1, is_published: true, is_demo: true },
      { name: "নমুনা সহযোগী প্রতিষ্ঠান", tier_id: tiers[tiers.length - 1].id, description: null, display_order: 1, is_published: true, is_demo: true },
    ])}`;
  }

  await sql`insert into announcements ${sql([
    { title: "নিবন্ধন চলছে (নমুনা ঘোষণা)", body: "পুনর্মিলনীর অনলাইন নিবন্ধন চলছে। আপনার ব্যাচের বন্ধুদেরও নিবন্ধনে উৎসাহিত করুন। এটি একটি নমুনা ঘোষণা।", is_pinned: true, is_demo: true },
    { title: "স্বেচ্ছাসেবক আহ্বান (নমুনা ঘোষণা)", body: "আয়োজনে স্বেচ্ছাসেবক হিসেবে যুক্ত হতে আগ্রহীরা আয়োজকদের সঙ্গে যোগাযোগ করুন। এটি একটি নমুনা ঘোষণা।", is_pinned: false, is_demo: true },
  ])}`;

  console.log(`Seeded ${rows.length} demo registrations, 3 demo sponsors and 2 demo announcements.`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
