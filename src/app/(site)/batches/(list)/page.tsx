import { ArrowRight, Layers, Search, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { Pagination } from "@/components/Pagination";
import { DemoBadge, EmptyState, PageHero } from "@/components/ui";
import { formatBnNumber, toBn } from "@/lib/bn";
import { BATCHES_PAGE_SIZE } from "@/lib/constants";
import { parseBatchParams } from "@/lib/params";
import { listBatches } from "@/lib/queries/alumni";
import { BATCH_SORT_LABELS, BATCH_SORTS } from "@/lib/queries/alumni-types";

export const metadata: Metadata = {
  title: "ব্যাচ ডিরেক্টরি",
  description: "পাসের বছর অনুযায়ী ইসলামপুর উচ্চ বিদ্যালয়ের প্রাক্তন শিক্ষার্থীদের ব্যাচ তালিকা।",
  alternates: { canonical: "/batches" },
};

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function BatchesPage({ searchParams }: { searchParams: SP }) {
  const params = parseBatchParams(await searchParams);
  const all = await listBatches({ yearQuery: params.q || null, sort: params.sort });
  const totalPages = Math.max(1, Math.ceil(all.length / BATCHES_PAGE_SIZE));
  const page = Math.min(params.page, totalPages);
  const batches = all.slice((page - 1) * BATCHES_PAGE_SIZE, page * BATCHES_PAGE_SIZE);
  const totalAlumni = all.reduce((sum, b) => sum + b.count, 0);
  const filtered = Boolean(params.q);

  return (
    <>
      <PageHero
        eyebrow="ব্যাচ ডিরেক্টরি"
        title="পাসের বছর অনুযায়ী ব্যাচ"
        description="যেসব ব্যাচ থেকে প্রাক্তন শিক্ষার্থীরা নিবন্ধন করেছেন, সেগুলো এখানে দেখা যাবে। নিজের ব্যাচে কে কে যুক্ত হয়েছেন দেখে নিন।"
      />
      <div className="container-page py-8 sm:py-10">
        <form action="/batches" method="get" role="search" aria-label="ব্যাচ খোঁজা" className="card grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end sm:p-5">
          <div>
            <label htmlFor="batch-q" className="field-label text-sm">বছর দিয়ে খুঁজুন</label>
            <div className="relative">
              <Search aria-hidden size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input id="batch-q" name="q" type="search" inputMode="numeric" defaultValue={params.q} maxLength={4} placeholder="যেমন: ২০১০ বা ১৯৯" className="input !pl-10" />
            </div>
          </div>
          <div>
            <label htmlFor="batch-sort" className="field-label text-sm">সাজান</label>
            <AutoSubmitSelect id="batch-sort" name="sort" defaultValue={params.sort} className="input sm:w-56">
              {BATCH_SORTS.map((s) => (
                <option key={s} value={s}>{BATCH_SORT_LABELS[s]}</option>
              ))}
            </AutoSubmitSelect>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary !min-h-12 flex-1"><Search aria-hidden size={18} /> খুঁজুন</button>
            {(filtered || params.sort !== "year_desc") && (
              <Link href="/batches" className="btn btn-outline !min-h-12 !px-3" aria-label="ফিল্টার মুছুন"><X aria-hidden size={18} /></Link>
            )}
          </div>
        </form>

        {all.length > 0 && (
          <p className="mt-6 text-muted" aria-live="polite">
            <strong className="text-ink">{formatBnNumber(all.length)}</strong>টি ব্যাচ · মোট{" "}
            <strong className="text-ink">{formatBnNumber(totalAlumni)}</strong> জন প্রাক্তন শিক্ষার্থী
          </p>
        )}

        <div className="mt-4">
          {batches.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {batches.map((b) => (
                <li key={b.passing_year}>
                  <article className="card card-hover group relative flex h-full flex-col overflow-hidden">
                    <div className="relative bg-gradient-to-br from-green to-green-deep px-4 pb-8 pt-5 text-white">
                      <p className="text-sm text-white/80">ব্যাচ</p>
                      <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">{toBn(b.passing_year)}</h2>
                      <svg viewBox="0 0 200 24" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-6 w-full" aria-hidden="true">
                        <path d="M0 24V12c30-8 60-10 100-4s70 6 100-2v18z" fill="#ffffff" />
                      </svg>
                      {b.demo_count > 0 && <DemoBadge className="absolute right-3 top-3" />}
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <p className="flex items-center gap-2 text-muted">
                        <Layers aria-hidden size={16} className="text-green" />
                        <span><strong className="text-ink">{formatBnNumber(b.count)}</strong> জন প্রাক্তন শিক্ষার্থী</span>
                      </p>
                      <Link href={`/batches/${b.passing_year}`} className="mt-auto inline-flex items-center gap-1.5 font-semibold text-green after:absolute after:inset-0 group-hover:text-green-deep">
                        ব্যাচটি দেখুন <ArrowRight aria-hidden size={16} className="transition-transform group-hover:translate-x-1" />
                        <span className="sr-only">({toBn(b.passing_year)})</span>
                      </Link>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          ) : filtered ? (
            <EmptyState
              title="এই বছরের কোনো ব্যাচ পাওয়া যায়নি"
              description="হয়তো এই ব্যাচ থেকে এখনো কেউ নিবন্ধন করেননি। আপনিই প্রথম হতে পারেন!"
              action={{ href: "/register", label: "নিবন্ধন করুন" }}
            />
          ) : (
            <EmptyState
              icon={<Layers aria-hidden size={28} />}
              title="এখনো কোনো ব্যাচ তৈরি হয়নি"
              description="প্রাক্তন শিক্ষার্থীদের নিবন্ধন অনুমোদিত হলে পাসের বছর অনুযায়ী ব্যাচগুলো এখানে স্বয়ংক্রিয়ভাবে দেখা যাবে।"
              action={{ href: "/register", label: "প্রথম নিবন্ধনকারী হোন" }}
            />
          )}
        </div>
        <Pagination path="/batches" params={{ q: params.q, sort: params.sort === "year_desc" ? null : params.sort }} page={page} totalPages={totalPages} />
      </div>
    </>
  );
}
