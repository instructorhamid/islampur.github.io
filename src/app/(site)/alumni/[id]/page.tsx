import { ArrowLeft, Droplet, GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlumniGrid } from "@/components/AlumniCard";
import { Avatar } from "@/components/Avatar";
import { DemoBadge } from "@/components/ui";
import { school } from "@/config/site";
import { toBn } from "@/lib/bn";
import { getPublicAlumnus, listAlumni } from "@/lib/queries/alumni";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const alumnus = await getPublicAlumnus((await params).id);
  if (!alumnus) return { title: "প্রোফাইল পাওয়া যায়নি", robots: { index: false, follow: false } };
  return {
    title: `${alumnus.full_name} — ${toBn(alumnus.passing_year)} ব্যাচ`,
    description: `${school.nameBn}-এর ${toBn(alumnus.passing_year)} ব্যাচের প্রাক্তন শিক্ষার্থী।`,
    // Individual profiles are reachable from the directory but kept out of search engines for privacy.
    robots: { index: false, follow: true },
    alternates: { canonical: `/alumni/${alumnus.id}` },
  };
}

export default async function AlumnusPage({ params }: { params: Params }) {
  const alumnus = await getPublicAlumnus((await params).id);
  if (!alumnus) notFound();
  const classmates = await listAlumni({ year: alumnus.passing_year, sort: "name", pageSize: 7 });
  const others = classmates.items.filter((a) => a.id !== alumnus.id).slice(0, 6);

  return (
    <div className="container-page py-8 sm:py-12">
      <Link href="/alumni" className="inline-flex items-center gap-1.5 font-semibold text-green hover:text-green-deep">
        <ArrowLeft aria-hidden size={18} /> প্রাক্তন শিক্ষার্থী তালিকা
      </Link>

      <article className="card mt-5 grid overflow-hidden md:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="relative">
          <Avatar name={alumnus.full_name} src={alumnus.photo_url} size="large" className="h-full" />
          {alumnus.is_demo && <DemoBadge className="absolute left-3 top-3" />}
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-10">
          <p className="eyebrow"><GraduationCap aria-hidden size={16} /> প্রাক্তন শিক্ষার্থী</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{alumnus.full_name}</h1>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-green-light p-4">
              <dt className="text-sm text-muted">পাসের বছর (ব্যাচ)</dt>
              <dd className="font-display text-2xl font-bold text-green-deep">{toBn(alumnus.passing_year)}</dd>
            </div>
            {alumnus.blood_group && (
              <div className="rounded-xl bg-red-bg p-4">
                <dt className="flex items-center gap-1 text-sm text-red-ink"><Droplet aria-hidden size={14} /> রক্তের গ্রুপ</dt>
                <dd className="font-display text-2xl font-bold text-red-ink">{alumnus.blood_group}</dd>
              </div>
            )}
          </dl>
          <p className="mt-6 text-muted">{school.nameBn}, {school.locationBn}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/batches/${alumnus.passing_year}`} className="btn btn-primary">
              {toBn(alumnus.passing_year)} ব্যাচের সবাইকে দেখুন
            </Link>
          </div>
        </div>
      </article>

      {others.length > 0 && (
        <section aria-labelledby="classmates-title" className="mt-12">
          <h2 id="classmates-title" className="text-2xl font-bold">একই ব্যাচের সহপাঠীরা</h2>
          <div className="mt-5">
            <AlumniGrid items={others} />
          </div>
        </section>
      )}
    </div>
  );
}
