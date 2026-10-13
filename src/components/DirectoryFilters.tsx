import { Search, X } from "lucide-react";
import Link from "next/link";
import { toBn } from "@/lib/bn";
import { BLOOD_GROUPS } from "@/lib/constants";
import { ALUMNI_SORT_LABELS, ALUMNI_SORTS } from "@/lib/queries/alumni-types";
import { AutoSubmitSelect } from "./AutoSubmitSelect";

type Props = {
  action: string;
  q: string;
  sort: string;
  year?: number | null;
  blood?: string | null;
  years?: number[];
  showBlood?: boolean;
  searchLabel?: string;
  defaultSort?: string;
};

/** Plain GET form: works without JavaScript, shareable URLs, server-rendered results. */
export function DirectoryFilters({ action, q, sort, year, blood, years, showBlood, searchLabel = "নাম দিয়ে খুঁজুন", defaultSort = "recent" }: Props) {
  const active = Boolean(q || year || blood || sort !== defaultSort);
  return (
    <form action={action} method="get" role="search" aria-label="প্রাক্তন শিক্ষার্থী খোঁজা" className="card grid grid-cols-2 gap-3 p-4 sm:p-5 md:grid-cols-12 md:items-end">
      <div className={`col-span-2 ${years ? "md:col-span-4" : "md:col-span-6"}`}>
        <label htmlFor="filter-q" className="field-label text-sm">{searchLabel}</label>
        <div className="relative">
          <Search aria-hidden size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input id="filter-q" name="q" type="search" defaultValue={q} maxLength={100} placeholder="যেমন: করিম" className="input !pl-10" />
        </div>
      </div>
      {years && (
        <div className="md:col-span-2">
          <label htmlFor="filter-year" className="field-label text-sm">পাসের বছর</label>
          <AutoSubmitSelect id="filter-year" name="year" defaultValue={year ? String(year) : ""} className="input">
            <option value="">সব বছর</option>
            {years.map((y) => (
              <option key={y} value={y}>{toBn(y)}</option>
            ))}
          </AutoSubmitSelect>
        </div>
      )}
      {showBlood && (
        <div className="md:col-span-2">
          <label htmlFor="filter-blood" className="field-label text-sm">রক্তের গ্রুপ</label>
          <AutoSubmitSelect id="filter-blood" name="blood" defaultValue={blood ?? ""} className="input">
            <option value="">সব গ্রুপ</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </AutoSubmitSelect>
        </div>
      )}
      <div className={`${years && showBlood ? "col-span-2" : years || showBlood ? "" : "col-span-2"} ${showBlood || years ? "md:col-span-2" : "md:col-span-4"}`}>
        <label htmlFor="filter-sort" className="field-label text-sm">সাজান</label>
        <AutoSubmitSelect id="filter-sort" name="sort" defaultValue={sort} className="input">
          {ALUMNI_SORTS.map((s) => (
            <option key={s} value={s}>{ALUMNI_SORT_LABELS[s]}</option>
          ))}
        </AutoSubmitSelect>
      </div>
      <div className="col-span-2 flex gap-2 md:col-span-2">
        <button type="submit" className="btn btn-primary !min-h-12 flex-1">
          <Search aria-hidden size={18} /> খুঁজুন
        </button>
        {active && (
          <Link href={action} className="btn btn-outline !min-h-12 !px-3" aria-label="ফিল্টার মুছুন" title="ফিল্টার মুছুন">
            <X aria-hidden size={18} />
          </Link>
        )}
      </div>
    </form>
  );
}
