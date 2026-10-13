import "server-only";
import { APPROVAL_STATUSES, type ApprovalStatus, type BloodGroup } from "../constants";
import { sql } from "../db";
import { fromBnDigits } from "../bn";

export type AdminRegistration = {
  id: string;
  full_name: string;
  normalized_phone: string;
  blood_group: BloodGroup;
  passing_year: number;
  photo_key: string | null;
  photo_consent: boolean;
  blood_group_public_consent: boolean;
  approval_status: ApprovalStatus;
  admin_note: string | null;
  is_demo: boolean;
  privacy_accepted_at: Date;
  reviewed_at: Date | null;
  reviewer_name: string | null;
  created_at: Date;
  updated_at: Date;
  version: number;
};

export type AdminFilters = { q: string; year: number | null; status: ApprovalStatus | null; page: number };

export function parseAdminFilters(sp: Record<string, string | string[] | undefined>): AdminFilters {
  const get = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };
  const year = fromBnDigits(get("year"));
  const status = get("status");
  const page = Number(get("page"));
  return {
    q: get("q").trim().slice(0, 100),
    year: /^\d{4}$/.test(year) ? Number(year) : null,
    status: (APPROVAL_STATUSES as readonly string[]).includes(status) ? (status as ApprovalStatus) : null,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

function whereClause(f: Omit<AdminFilters, "page">) {
  const q = f.q;
  const digits = fromBnDigits(q).replace(/\D/g, "");
  const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  return sql`where true
    ${q ? sql`and (r.full_name ilike ${like} ${digits.length >= 3 ? sql`or r.normalized_phone like ${`%${digits}%`}` : sql``})` : sql``}
    ${f.year ? sql`and r.passing_year = ${f.year}` : sql``}
    ${f.status ? sql`and r.approval_status = ${f.status}` : sql``}`;
}

const columns = () => sql`r.id, r.full_name, r.normalized_phone, r.blood_group, r.passing_year, r.photo_key, r.photo_consent,
  r.blood_group_public_consent, r.approval_status, r.admin_note, r.is_demo, r.privacy_accepted_at, r.reviewed_at,
  a.name as reviewer_name, r.created_at, r.updated_at, floor(extract(epoch from r.updated_at))::int as version`;

export async function listRegistrationsForAdmin(f: AdminFilters, pageSize: number) {
  const [items, [{ count }]] = await Promise.all([
    sql<AdminRegistration[]>`select ${columns()} from registrations r left join admins a on a.id = r.reviewed_by
      ${whereClause(f)} order by (r.approval_status = 'pending') desc, r.created_at desc
      limit ${pageSize} offset ${(f.page - 1) * pageSize}`,
    sql<{ count: number }[]>`select count(*)::int as count from registrations r ${whereClause(f)}`,
  ]);
  return { items, total: count };
}

export async function exportRegistrations(f: Omit<AdminFilters, "page">) {
  return sql<AdminRegistration[]>`select ${columns()} from registrations r left join admins a on a.id = r.reviewed_by
    ${whereClause(f)} order by r.passing_year, r.full_name`;
}

export async function getRegistrationForAdmin(id: string) {
  const [row] = await sql<AdminRegistration[]>`select ${columns()} from registrations r left join admins a on a.id = r.reviewed_by where r.id = ${id}`;
  return row ?? null;
}

export async function getDashboardStats() {
  const [counts] = await sql<{ total: number; pending: number; approved: number; rejected: number; demo: number; last7: number }[]>`
    select count(*)::int as total,
      count(*) filter (where approval_status = 'pending')::int as pending,
      count(*) filter (where approval_status = 'approved')::int as approved,
      count(*) filter (where approval_status = 'rejected')::int as rejected,
      count(*) filter (where is_demo)::int as demo,
      count(*) filter (where created_at > now() - interval '7 days')::int as last7
    from registrations`;
  return counts;
}

export type BatchAdminRow = { passing_year: number; total: number; approved: number; pending: number; rejected: number };

export async function getBatchStatsForAdmin() {
  return sql<BatchAdminRow[]>`
    select passing_year, count(*)::int as total,
      count(*) filter (where approval_status = 'approved')::int as approved,
      count(*) filter (where approval_status = 'pending')::int as pending,
      count(*) filter (where approval_status = 'rejected')::int as rejected
    from registrations group by passing_year order by passing_year desc`;
}

export async function getAuditFor(targetType: string, targetId: string) {
  return sql<{ id: number; action: string; admin_name: string | null; created_at: Date; details: Record<string, unknown> | null }[]>`
    select l.id, l.action, a.name as admin_name, l.created_at, l.details from audit_log l
    left join admins a on a.id = l.admin_id
    where l.target_type = ${targetType} and l.target_id = ${targetId} order by l.created_at desc limit 20`;
}
