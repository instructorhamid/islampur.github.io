import { Check, Download, Eye, Search, X } from "lucide-react";
import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { PageTitle, StatusBadge } from "@/components/admin/StatusBadge";
import { Avatar } from "@/components/Avatar";
import { buildHref, Pagination } from "@/components/Pagination";
import { formatBnDate, formatBnNumber, toBn } from "@/lib/bn";
import { ADMIN_PAGE_SIZE, APPROVAL_STATUS_LABELS, APPROVAL_STATUSES } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";
import { getBatchStatsForAdmin, listRegistrationsForAdmin, parseAdminFilters } from "@/lib/queries/admin";
import { reviewRegistrationsAction } from "../../_actions/registrations";

export const metadata = { title: "নিবন্ধন ব্যবস্থাপনা" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function RegistrationsAdminPage({ searchParams }: { searchParams: SP }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const filters = parseAdminFilters(sp);
  const [{ items, total }, batches] = await Promise.all([
    listRegistrationsForAdmin(filters, ADMIN_PAGE_SIZE),
    getBatchStatsForAdmin(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const filterParams = { q: filters.q, year: filters.year, status: filters.status };

  return (
    <>
      <PageTitle title="নিবন্ধন ব্যবস্থাপনা" description={`মোট ${formatBnNumber(total)}টি নিবন্ধন${filters.q || filters.year || filters.status ? " (ফিল্টার করা)" : ""}`}>
        {admin.role === "admin" && (
          <a href={buildHref("/admin/export", filterParams)} className="btn btn-outline btn-sm">
            <Download aria-hidden size={16} /> CSV ডাউনলোড
          </a>
        )}
      </PageTitle>

      {sp.deleted && <p role="status" className="mb-4 rounded-lg bg-green-light px-4 py-2 text-green-deep">নিবন্ধনটি স্থায়ীভাবে মুছে ফেলা হয়েছে।</p>}

      <form method="get" className="card mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_10rem_10rem_auto] sm:items-end">
        <div>
          <label htmlFor="aq" className="field-label text-sm">নাম বা মোবাইল নম্বর</label>
          <input id="aq" name="q" type="search" defaultValue={filters.q} className="input" placeholder="খুঁজুন…" />
        </div>
        <div>
          <label htmlFor="ay" className="field-label text-sm">পাসের বছর</label>
          <select id="ay" name="year" defaultValue={filters.year ?? ""} className="input">
            <option value="">সব</option>
            {batches.map((b) => <option key={b.passing_year} value={b.passing_year}>{toBn(b.passing_year)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="as" className="field-label text-sm">অবস্থা</label>
          <select id="as" name="status" defaultValue={filters.status ?? ""} className="input">
            <option value="">সব</option>
            {APPROVAL_STATUSES.map((s) => <option key={s} value={s}>{APPROVAL_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary !min-h-12"><Search aria-hidden size={16} /> খুঁজুন</button>
          <Link href="/admin/registrations" className="btn btn-outline !min-h-12">রিসেট</Link>
        </div>
      </form>

      {/* The form stays mounted even when the list becomes empty, so the result message remains visible. */}
      <ActionForm action={reviewRegistrationsAction} className="card overflow-hidden" messageClassName="px-4 pb-3">
        {items.length === 0 ? (
          <p className="p-10 text-center text-muted">কোনো নিবন্ধন পাওয়া যায়নি।</p>
        ) : (
          <>
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-green-light/50 px-4 py-3">
            <span className="text-sm text-muted">নির্বাচিতগুলো:</span>
            <SubmitButton name="decision" value="approved" className="btn btn-primary btn-sm"><Check aria-hidden size={16} /> অনুমোদন</SubmitButton>
            <SubmitButton name="decision" value="rejected" className="btn btn-outline btn-sm"><X aria-hidden size={16} /> বাতিল</SubmitButton>
          </div>
          <ul className="divide-y divide-line">
            {items.map((r) => (
              <li key={r.id} className="grid grid-cols-[auto_3.5rem_1fr] items-center gap-3 px-4 py-3 md:grid-cols-[auto_3.5rem_1.6fr_1fr_0.7fr_1fr_auto]">
                <input type="checkbox" name="ids" value={r.id} className="checkbox !mt-0" aria-label={`${r.full_name} নির্বাচন করুন`} />
                <div className="w-14 overflow-hidden rounded-lg">
                  <Avatar name={r.full_name} src={r.photo_key ? `/media/alumni/${r.id}/thumb?v=${r.version}` : null} size="small" />
                </div>
                <div className="min-w-0">
                  <Link href={`/admin/registrations/${r.id}`} className="font-semibold hover:text-green">{r.full_name}</Link>
                  {r.is_demo && <span className="badge badge-amber ml-2">নমুনা</span>}
                  <p className="text-sm text-muted md:hidden">ব্যাচ {toBn(r.passing_year)} · {r.blood_group} · {toBn(r.normalized_phone)}</p>
                </div>
                <p className="hidden text-sm md:block">{toBn(r.normalized_phone)}</p>
                <p className="hidden text-sm md:block">{toBn(r.passing_year)} · {r.blood_group}</p>
                <div className="col-span-3 flex flex-wrap items-center gap-2 md:col-span-1">
                  <StatusBadge status={r.approval_status} />
                  <span className="text-xs text-muted">{formatBnDate(r.created_at)}</span>
                </div>
                <div className="col-span-3 flex gap-1.5 md:col-span-1">
                  {r.approval_status !== "approved" && (
                    <SubmitButton name="single" value={`${r.id}:approved`} className="btn btn-primary btn-sm" pendingLabel="…">
                      <Check aria-hidden size={14} /> অনুমোদন
                    </SubmitButton>
                  )}
                  {r.approval_status !== "rejected" && (
                    <SubmitButton name="single" value={`${r.id}:rejected`} className="btn btn-outline btn-sm" pendingLabel="…">
                      <X aria-hidden size={14} /> বাতিল
                    </SubmitButton>
                  )}
                  <Link href={`/admin/registrations/${r.id}`} className="btn btn-ghost btn-sm" aria-label={`${r.full_name}-এর বিস্তারিত`}>
                    <Eye aria-hidden size={14} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          </>
        )}
      </ActionForm>
      <Pagination path="/admin/registrations" params={filterParams} page={filters.page} totalPages={totalPages} />
    </>
  );
}
