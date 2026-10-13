import { ArrowRight, CheckCircle2, Clock3, Layers, TriangleAlert, Users, XCircle } from "lucide-react";
import Link from "next/link";
import { PageTitle, StatusBadge } from "@/components/admin/StatusBadge";
import { formatBnDateTime, formatBnNumber, toBn } from "@/lib/bn";
import { requireAdmin } from "@/lib/auth";
import { getBatchStatsForAdmin, getDashboardStats, listRegistrationsForAdmin } from "@/lib/queries/admin";
import { getActiveEvent } from "@/lib/queries/event";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const admin = await requireAdmin();
  const { error } = await searchParams;
  const [stats, batches, recent, event] = await Promise.all([
    getDashboardStats(),
    getBatchStatsForAdmin(),
    listRegistrationsForAdmin({ q: "", year: null, status: null, page: 1 }, 8),
    getActiveEvent(),
  ]);

  const cards = [
    { label: "মোট নিবন্ধন", value: stats.total, icon: Users, href: "/admin/registrations", tone: "text-green-deep bg-green-light" },
    { label: "অপেক্ষমাণ", value: stats.pending, icon: Clock3, href: "/admin/registrations?status=pending", tone: "text-amber-ink bg-amber-bg" },
    { label: "অনুমোদিত", value: stats.approved, icon: CheckCircle2, href: "/admin/registrations?status=approved", tone: "text-green-deep bg-green-light" },
    { label: "বাতিল", value: stats.rejected, icon: XCircle, href: "/admin/registrations?status=rejected", tone: "text-red-ink bg-red-bg" },
  ];

  return (
    <>
      <PageTitle title={`স্বাগতম, ${admin.name}`} description={`গত ৭ দিনে নতুন নিবন্ধন: ${formatBnNumber(stats.last7)}টি`} />

      {error === "forbidden" && (
        <p role="alert" className="mb-6 flex items-center gap-2 rounded-xl bg-red-bg px-4 py-3 text-red-ink">
          <TriangleAlert aria-hidden size={18} /> এই পাতাটি শুধু প্রধান অ্যাডমিনের জন্য।
        </p>
      )}
      {stats.demo > 0 && (
        <p className="mb-6 rounded-xl border border-amber-line bg-amber-bg px-4 py-3 text-amber-ink">
          ডাটাবেজে {formatBnNumber(stats.demo)}টি <strong>নমুনা (ডেমো)</strong> নিবন্ধন রয়েছে। প্রকাশের আগে{" "}
          {admin.role === "admin" ? <Link href="/admin/settings#demo" className="font-semibold underline">সেটিংস</Link> : "সেটিংস"} থেকে সেগুলো মুছে ফেলুন।
        </p>
      )}
      {event?.is_provisional && (
        <p className="mb-6 rounded-xl border border-amber-line bg-amber-bg px-4 py-3 text-amber-ink">
          অনুষ্ঠানের তথ্য এখনো <strong>প্রস্তাবিত</strong> হিসেবে চিহ্নিত। চূড়ান্ত হলে{" "}
          <Link href="/admin/event" className="font-semibold underline">অনুষ্ঠান পাতা</Link> থেকে চিহ্নটি তুলে দিন।
        </p>
      )}

      <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, href, tone }) => (
          <li key={label}>
            <Link href={href} className="card card-hover flex items-center gap-4 p-4 sm:p-5">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${tone}`}><Icon aria-hidden size={24} /></span>
              <span>
                <span className="block font-display text-2xl font-bold sm:text-3xl">{formatBnNumber(value)}</span>
                <span className="block text-sm text-muted">{label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">সাম্প্রতিক নিবন্ধন</h2>
            <Link href="/admin/registrations" className="inline-flex items-center gap-1 text-sm font-semibold text-green">সব দেখুন <ArrowRight aria-hidden size={14} /></Link>
          </div>
          {recent.items.length === 0 ? (
            <p className="mt-4 text-muted">এখনো কোনো নিবন্ধন জমা পড়েনি।</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {recent.items.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/registrations/${r.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-green-light/40">
                    <span>
                      <span className="font-semibold">{r.full_name}</span>
                      {r.is_demo && <span className="badge badge-amber ml-2">নমুনা</span>}
                      <span className="block text-sm text-muted">ব্যাচ {toBn(r.passing_year)} · {formatBnDateTime(r.created_at)}</span>
                    </span>
                    <StatusBadge status={r.approval_status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-bold"><Layers aria-hidden size={20} className="text-green" /> ব্যাচভিত্তিক হিসাব</h2>
            <Link href="/admin/batches" className="inline-flex items-center gap-1 text-sm font-semibold text-green">বিস্তারিত <ArrowRight aria-hidden size={14} /></Link>
          </div>
          {batches.length === 0 ? (
            <p className="mt-4 text-muted">এখনো কোনো ব্যাচ নেই।</p>
          ) : (
            <table className="mt-4 w-full text-left text-sm">
              <thead className="text-muted">
                <tr><th className="py-2 font-medium">ব্যাচ</th><th className="py-2 font-medium">অনুমোদিত</th><th className="py-2 font-medium">অপেক্ষমাণ</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {batches.slice(0, 10).map((b) => (
                  <tr key={b.passing_year}>
                    <td className="py-2 font-semibold">
                      <Link href={`/admin/registrations?year=${b.passing_year}`} className="hover:text-green">{toBn(b.passing_year)}</Link>
                    </td>
                    <td className="py-2">{formatBnNumber(b.approved)}</td>
                    <td className="py-2">{b.pending ? <span className="badge badge-amber">{formatBnNumber(b.pending)}</span> : "০"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
