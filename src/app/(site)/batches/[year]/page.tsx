import { ArrowLeft, UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlumniGrid } from "@/components/AlumniCard";
import { DirectoryFilters } from "@/components/DirectoryFilters";
import { Pagination } from "@/components/Pagination";
import { EmptyState, PageHero } from "@/components/ui";
import { school } from "@/config/site";
import { formatBnNumber, toBn } from "@/lib/bn";
import { ALUMNI_PAGE_SIZE } from "@/lib/constants";
import { parseAlumniParams } from "@/lib/params";
import { listAlumni } from "@/lib/queries/alumni";
import { getSettings } from "@/lib/queries/settings";

type Params = Promise<{ year: string }>;
type SP = Promise<Record<string, string | string[] | undefined>>;

async function validYear(raw: string): Promise<number | null> {
  if (!/^\d{4}$/.test(raw)) return null;
  const year = Number(raw);
  const settings = await getSettings();
  return year >= settings.min_passing_year && year <= settings.max_passing_year ? year : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const year = await validYear((await params).year);
  if (!year) return { title: "ব্যাচ পাওয়া যায়নি", robots: { index: false } };
  return {
    title: `${toBn(year)} ব্যাচের প্রাক্তন শিক্ষার্থী`,
    description: `${school.nameBn}-এর ${toBn(year)} সালের এসএসসি ব্যাচের নিবন্ধিত প্রাক্তন শিক্ষার্থীদের তালিকা।`,
    alternates: { canonical: `/batches/${year}` },
  };
}

export default async function BatchYearPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  const year = await validYear((await params).year);
  if (!year) notFound();
  const settings = await getSettings();
  const filters = parseAlumniParams(await searchParams);
  const query = { q: filters.q, blood: filters.blood, sort: filters.sort === "recent" ? ("name" as const) : filters.sort };

  const [result, batchTotal] = await Promise.all([
    listAlumni({ ...query, year, page: filters.page, pageSize: ALUMNI_PAGE_SIZE }),
    listAlumni({ year, pageSize: 1 }).then((r) => r.total),
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / ALUMNI_PAGE_SIZE));
  const filtered = Boolean(filters.q || filters.blood);

  return (
    <>
      <PageHero
        eyebrow={`ব্যাচ ${toBn(year)}`}
        title={`${toBn(year)} ব্যাচের প্রাক্তন শিক্ষার্থী`}
        description={
          batchTotal > 0
            ? `এই ব্যাচ থেকে এখন পর্যন্ত ${formatBnNumber(batchTotal)} জন প্রাক্তন শিক্ষার্থী যুক্ত হয়েছেন।`
            : "এই ব্যাচ থেকে এখনো কেউ তালিকায় যুক্ত হননি।"
        }
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/batches" className="btn btn-outline"><ArrowLeft aria-hidden size={18} /> সব ব্যাচ</Link>
          <Link href="/register" className="btn btn-primary"><UserPlus aria-hidden size={18} /> এই ব্যাচে যুক্ত হোন</Link>
        </div>
      </PageHero>

      <div className="container-page py-8 sm:py-10">
        {batchTotal > 0 && (
          <DirectoryFilters
            action={`/batches/${year}`}
            q={filters.q}
            sort={query.sort}
            blood={filters.blood}
            showBlood={settings.show_blood_group_publicly}
            searchLabel="এই ব্যাচে নাম খুঁজুন"
            defaultSort="name"
          />
        )}

        {filtered && result.total > 0 && (
          <p className="mt-6 text-muted" aria-live="polite">
            <strong className="text-ink">{formatBnNumber(result.total)}</strong> জন পাওয়া গেছে
          </p>
        )}

        <div className="mt-6">
          {result.items.length > 0 ? (
            <AlumniGrid items={result.items} />
          ) : filtered ? (
            <EmptyState title="কোনো ফলাফল পাওয়া যায়নি" description="অন্য নাম বা বানান দিয়ে আবার খুঁজুন।" action={{ href: `/batches/${year}`, label: "ফিল্টার মুছুন" }} />
          ) : (
            <EmptyState
              icon={<Users aria-hidden size={28} />}
              title={`${toBn(year)} ব্যাচ থেকে এখনো কেউ যুক্ত হননি`}
              description="আপনি যদি এই ব্যাচের হন, এখনই নিবন্ধন করুন এবং বন্ধুদেরও জানান।"
              action={{ href: "/register", label: "নিবন্ধন করুন" }}
            />
          )}
        </div>

        <Pagination
          path={`/batches/${year}`}
          params={{ q: filters.q, blood: filters.blood, sort: query.sort === "name" ? null : query.sort }}
          page={filters.page}
          totalPages={totalPages}
        />

        {batchTotal > 0 && (
          <aside className="mt-12 flex flex-col items-start gap-4 rounded-2xl border border-green-soft bg-green-light p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">আপনার ব্যাচের বন্ধু এখনো যুক্ত হননি?</h2>
              <p className="mt-1 text-muted">নিবন্ধনের লিংকটি ব্যাচের বন্ধুদের সঙ্গে শেয়ার করুন।</p>
            </div>
            <Link href="/register" className="btn btn-primary">নিবন্ধন পাতা</Link>
          </aside>
        )}
      </div>
    </>
  );
}
