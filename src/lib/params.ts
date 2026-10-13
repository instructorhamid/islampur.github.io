import { fromBnDigits } from "./bn";
import { BLOOD_GROUPS, type BloodGroup } from "./constants";
import { ALUMNI_SORTS, BATCH_SORTS, type AlumniSort, type BatchSort } from "./queries/alumni-types";

type SP = Record<string, string | string[] | undefined>;

export function one(sp: SP, key: string): string {
  const v = sp[key];
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export function parsePage(sp: SP): number {
  const n = Number(fromBnDigits(one(sp, "page")));
  return Number.isInteger(n) && n >= 1 && n <= 10_000 ? n : 1;
}

export function parseYear(value: string): number | null {
  const v = fromBnDigits(value).trim();
  return /^\d{4}$/.test(v) ? Number(v) : null;
}

export function parseAlumniParams(sp: SP) {
  const blood = one(sp, "blood");
  const sort = one(sp, "sort");
  return {
    q: one(sp, "q").trim().slice(0, 100),
    year: parseYear(one(sp, "year")),
    blood: (BLOOD_GROUPS as readonly string[]).includes(blood) ? (blood as BloodGroup) : null,
    sort: (ALUMNI_SORTS as readonly string[]).includes(sort) ? (sort as AlumniSort) : ("recent" as AlumniSort),
    page: parsePage(sp),
  };
}

export function parseBatchParams(sp: SP) {
  const sort = one(sp, "sort");
  const q = fromBnDigits(one(sp, "q")).replace(/\D/g, "").slice(0, 4);
  return {
    q,
    sort: (BATCH_SORTS as readonly string[]).includes(sort) ? (sort as BatchSort) : ("year_desc" as BatchSort),
    page: parsePage(sp),
  };
}
