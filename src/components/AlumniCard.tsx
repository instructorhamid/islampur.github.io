import { Droplet } from "lucide-react";
import Link from "next/link";
import { toBn } from "@/lib/bn";
import type { PublicAlumnus } from "@/lib/queries/alumni";
import { Avatar } from "./Avatar";
import { DemoBadge } from "./ui";

export function AlumniCard({ alumnus }: { alumnus: PublicAlumnus }) {
  return (
    <article className="card card-hover group relative flex w-full flex-col overflow-hidden">
      <div className="relative overflow-hidden">
        <Avatar name={alumnus.full_name} src={alumnus.photo_url} className="transition-transform duration-500 group-hover:scale-[1.03]" />
        {alumnus.is_demo && <DemoBadge className="absolute left-2 top-2 shadow-sm" />}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h3 className="text-[1.02rem] font-semibold leading-snug sm:text-lg">
          <Link href={`/alumni/${alumnus.id}`} className="after:absolute after:inset-0 hover:text-green-deep">
            {alumnus.full_name}
          </Link>
        </h3>
        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          <Link
            href={`/batches/${alumnus.passing_year}`}
            className="badge badge-green relative z-10 hover:bg-green-soft"
            aria-label={`${toBn(alumnus.passing_year)} ব্যাচ দেখুন`}
          >
            ব্যাচ {toBn(alumnus.passing_year)}
          </Link>
          {alumnus.blood_group && (
            <span className="badge badge-red" title="রক্তের গ্রুপ">
              <Droplet aria-hidden size={12} />
              <span className="sr-only">রক্তের গ্রুপ </span>
              {alumnus.blood_group}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function AlumniGrid({ items }: { items: PublicAlumnus[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6" role="list">
      {items.map((a) => (
        <li key={a.id} className="flex">
          <AlumniCard alumnus={a} />
        </li>
      ))}
    </ul>
  );
}

export function AlumniGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="skeleton aspect-square !rounded-none" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
