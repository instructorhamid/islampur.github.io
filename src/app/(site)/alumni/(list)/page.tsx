import { UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AlumniGrid } from "@/components/AlumniCard";
import { DirectoryFilters } from "@/components/DirectoryFilters";
import { Pagination } from "@/components/Pagination";
import { EmptyState, PageHero } from "@/components/ui";
import { formatBnNumber, toBn } from "@/lib/bn";
import { ALUMNI_PAGE_SIZE } from "@/lib/constants";
import { parseAlumniParams } from "@/lib/params";
import { listAlumni, listBatches } from "@/lib/queries/alumni";
import { getSettings } from "@/lib/queries/settings";

export const metadata: Metadata = {
  title: "প্রাক্তন শিক্ষার্থী",
  description: "ইসলামপুর উচ্চ বিদ্যালয়ের নিবন্ধিত প্রাক্তন শিক্ষার্থীদের তালিকা — নাম, পাসের বছর ও রক্তের গ্রুপ দিয়ে খুঁজুন।",
  alternates: { canonical: "/alumni" },
};

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function AlumniPage({ searchParams }: { searchParams: SP }) {
  const params = parseAlumniParams(await searchParams);
  const settings = await getSettings();
  const [result, batches] = await Promise.all([
    listAlumni({ ...params, pageSize: ALUMNI_PAGE_SIZE }),
    listBatches({ sort: "year_desc" }),
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / ALUMNI_PAGE_SIZE));
  const filtered = Boolean(params.q || params.year || params.blood);
  const showBlood = settings.show_blood_group_publicly;

  return (
    <>
      <PageHero
        eyebrow="ডিরেক্টরি"
        title="প্রাক্তন শিক্ষার্থী"
        description="নিবন্ধিত ও অনুমোদিত প্রাক্তন শিক্ষার্থীদের তালিকা। নাম, পাসের বছর বা রক্তের গ্রুপ দিয়ে পুরোনো বন্ধুদের খুঁজে নিন।"
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/register" className="btn btn-primary"><UserPlus aria-hidden size={18} /> নিবন্ধন করুন</Link>
          <Link href="/batches" className="btn btn-outline">ব্যাচ অনুযায়ী দেখুন</Link>
        </div>
      </PageHero>

      <div className="container-page py-8 sm:py-10">
        <DirectoryFilters
          action="/alumni"
          q={params.q}
          sort={params.sort}
          year={params.year}
          blood={params.blood}
          years={batches.map((b) => b.passing_year)}
          showBlood={showBlood}
        />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2" aria-live="polite">
          <p className="text-muted">
            {result.total > 0 ? (
              <>
                মোট <strong className="text-ink">{formatBnNumber(result.total)}</strong> জন
                {filtered && " (ফিল্টার করা ফলাফল)"}
                {totalPages > 1 && ` · পৃষ্ঠা ${toBn(params.page)}/${toBn(totalPages)}`}
              </>
            ) : null}
          </p>
          {showBlood && (
            <p className="text-sm text-muted">রক্তের গ্রুপ কেবল সম্মতিদাতাদের ক্ষেত্রে দেখানো হয়।</p>
          )}
        </div>

        <div className="mt-4">
          {result.items.length > 0 ? (
            <AlumniGrid items={result.items} />
          ) : filtered ? (
            <EmptyState
              title="কোনো ফলাফল পাওয়া যায়নি"
              description="বানান পরীক্ষা করুন অথবা অন্য বছর বা গ্রুপ দিয়ে আবার খুঁজুন।"
              action={{ href: "/alumni", label: "সব ফিল্টার মুছুন" }}
            />
          ) : params.page > 1 ? (
            <EmptyState title="এই পৃষ্ঠায় কিছু নেই" action={{ href: "/alumni", label: "প্রথম পৃষ্ঠায় যান" }} />
          ) : (
            <EmptyState
              icon={<Users aria-hidden size={28} />}
              title="এখনো কেউ তালিকায় যুক্ত হননি"
              description="নিবন্ধন অনুমোদিত হলে প্রাক্তন শিক্ষার্থীদের এখানে দেখা যাবে। প্রথম নিবন্ধনকারী হোন!"
              action={{ href: "/register", label: "নিবন্ধন করুন" }}
            />
          )}
        </div>

        <Pagination
          path="/alumni"
          params={{ q: params.q, year: params.year, blood: params.blood, sort: params.sort === "recent" ? null : params.sort }}
          page={params.page}
          totalPages={totalPages}
        />
      </div>
    </>
  );
}
