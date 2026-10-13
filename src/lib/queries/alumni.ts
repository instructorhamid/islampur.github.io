import "server-only";
import { cache } from "react";
import { BLOOD_GROUPS, type BloodGroup } from "../constants";
import { sql } from "../db";
import { isUuid } from "../validation";
import type { AlumniSort, BatchSort } from "./alumni-types";
import { getSettings } from "./settings";

/**
 * Publication rule (single source of truth): a registration is public only when an
 * organizer has approved it. Phone numbers, notes and consent flags never leave this module.
 * Photo is public only with photo consent; blood group only with consent AND the global switch.
 */
const published = () => sql`approval_status = 'approved'`;

export type PublicAlumnus = {
  id: string;
  full_name: string;
  passing_year: number;
  blood_group: BloodGroup | null;
  photo_url: string | null;
  is_demo: boolean;
};

type Row = {
  id: string;
  full_name: string;
  passing_year: number;
  blood_group: BloodGroup;
  blood_group_public_consent: boolean;
  has_photo: boolean;
  version: number;
  is_demo: boolean;
};

const columns = () => sql`id, full_name, passing_year, blood_group, blood_group_public_consent, is_demo,
  (photo_key is not null and photo_consent) as has_photo,
  floor(extract(epoch from updated_at))::int as version`;

function toPublic(row: Row, showBlood: boolean, variant: "thumb" | "full" = "thumb"): PublicAlumnus {
  return {
    id: row.id,
    full_name: row.full_name,
    passing_year: row.passing_year,
    blood_group: showBlood && row.blood_group_public_consent ? row.blood_group : null,
    photo_url: row.has_photo ? `/media/alumni/${row.id}/${variant}?v=${row.version}` : null,
    is_demo: row.is_demo,
  };
}


export type AlumniQuery = {
  q?: string;
  year?: number | null;
  blood?: BloodGroup | null;
  sort?: AlumniSort;
  page?: number;
  pageSize: number;
};

function likePattern(q: string) {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export async function listAlumni(query: AlumniQuery): Promise<{ items: PublicAlumnus[]; total: number }> {
  const settings = await getSettings();
  const showBlood = settings.show_blood_group_publicly;
  const q = query.q?.trim().slice(0, 100);
  const page = Math.max(1, query.page ?? 1);
  const blood = showBlood && query.blood && BLOOD_GROUPS.includes(query.blood) ? query.blood : null;

  const where = () => sql`where ${published()}
    ${q ? sql`and full_name ilike ${likePattern(q)}` : sql``}
    ${query.year ? sql`and passing_year = ${query.year}` : sql``}
    ${blood ? sql`and blood_group = ${blood} and blood_group_public_consent` : sql``}`;

  const order = {
    recent: sql`order by coalesce(reviewed_at, created_at) desc, id`,
    name: sql`order by full_name asc, id`,
    year_desc: sql`order by passing_year desc, full_name asc, id`,
    year_asc: sql`order by passing_year asc, full_name asc, id`,
  }[query.sort ?? "recent"];

  const [rows, [{ count }]] = await Promise.all([
    sql<Row[]>`select ${columns()} from registrations ${where()} ${order}
               limit ${query.pageSize} offset ${(page - 1) * query.pageSize}`,
    sql<{ count: number }[]>`select count(*)::int as count from registrations ${where()}`,
  ]);
  return { items: rows.map((r) => toPublic(r, showBlood)), total: count };
}

export const getPublicAlumnus = cache(async (id: string): Promise<PublicAlumnus | null> => {
  if (!isUuid(id)) return null;
  const settings = await getSettings();
  const [row] = await sql<Row[]>`select ${columns()} from registrations where id = ${id} and ${published()}`;
  return row ? toPublic(row, settings.show_blood_group_publicly, "full") : null;
});

export type BatchSummary = { passing_year: number; count: number; demo_count: number };

export async function listBatches(opts: { yearQuery?: string | null; sort?: BatchSort } = {}): Promise<BatchSummary[]> {
  const order = {
    year_desc: sql`order by passing_year desc`,
    year_asc: sql`order by passing_year asc`,
    count: sql`order by count desc, passing_year desc`,
  }[opts.sort ?? "year_desc"];
  return sql<BatchSummary[]>`
    select passing_year, count(*)::int as count, count(*) filter (where is_demo)::int as demo_count
    from registrations where ${published()}
    ${opts.yearQuery && /^\d{1,4}$/.test(opts.yearQuery) ? sql`and passing_year::text like ${`%${opts.yearQuery}%`}` : sql``}
    group by passing_year ${order}`;
}

export type PublicStats = {
  alumni: number;
  batches: number;
  earliest: number | null;
  latest: number | null;
  demo: number;
};

export const getPublicStats = cache(async (): Promise<PublicStats> => {
  const [row] = await sql<PublicStats[]>`
    select count(*)::int as alumni, count(distinct passing_year)::int as batches,
           min(passing_year) as earliest, max(passing_year) as latest,
           count(*) filter (where is_demo)::int as demo
    from registrations where ${published()}`;
  return row;
});

/** Used by the media route: is this photo publicly viewable? */
export async function publicPhotoKey(id: string): Promise<string | null> {
  if (!isUuid(id)) return null;
  const [row] = await sql<{ photo_key: string }[]>`
    select photo_key from registrations
    where id = ${id} and ${published()} and photo_consent and photo_key is not null`;
  return row?.photo_key ?? null;
}
