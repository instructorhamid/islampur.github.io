import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { AdminCard, TextInput } from "@/components/admin/fields";
import { PageTitle } from "@/components/admin/StatusBadge";
import { formatBnNumber, toBn } from "@/lib/bn";
import { requireAdmin } from "@/lib/auth";
import { getBatchStatsForAdmin } from "@/lib/queries/admin";
import { getSettings } from "@/lib/queries/settings";
import { updateYearRangeAction } from "../../_actions/settings";

export const metadata = { title: "ব্যাচ ব্যবস্থাপনা" };

export default async function BatchesAdminPage() {
  const admin = await requireAdmin();
  const [batches, settings] = await Promise.all([getBatchStatsForAdmin(), getSettings()]);

  return (
    <>
      <PageTitle title="ব্যাচ ব্যবস্থাপনা" description="ব্যাচগুলো নিবন্ধন থেকে স্বয়ংক্রিয়ভাবে তৈরি হয়। শুধু অনুমোদিত নিবন্ধন পাবলিক ব্যাচ পাতায় গণনা হয়।" />
      <div className="space-y-6">
        <AdminCard
          title="পাসের বছরের সীমা"
          description={`বর্তমানে ${toBn(settings.min_passing_year)} থেকে ${toBn(settings.max_passing_year)} সাল পর্যন্ত নিবন্ধন গ্রহণ করা হয়। বিদ্যালয়ের প্রথম এসএসসি ব্যাচের সাল নিশ্চিত হয়ে সীমা ঠিক করুন।`}
        >
          {admin.role === "admin" ? (
            <ActionForm action={updateYearRangeAction} className="flex flex-wrap items-end gap-3">
              <TextInput label="প্রথম বছর" name="min_passing_year" type="number" min={1900} max={2100} defaultValue={settings.min_passing_year} required className="w-40" />
              <TextInput label="শেষ বছর" name="max_passing_year" type="number" min={1900} max={2100} defaultValue={settings.max_passing_year} required className="w-40" />
              <SubmitButton className="btn btn-primary !min-h-12">সংরক্ষণ করুন</SubmitButton>
            </ActionForm>
          ) : (
            <p className="text-muted">সীমা পরিবর্তন করতে প্রধান অ্যাডমিনের সঙ্গে যোগাযোগ করুন।</p>
          )}
        </AdminCard>

        <AdminCard title={`নিবন্ধিত ব্যাচ (${toBn(batches.length)})`}>
          {batches.length === 0 ? (
            <p className="text-muted">এখনো কোনো নিবন্ধন নেই।</p>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left">
                <thead className="border-b border-line text-sm text-muted">
                  <tr>
                    <th className="py-2 font-medium">ব্যাচ</th>
                    <th className="py-2 font-medium">মোট</th>
                    <th className="py-2 font-medium">অনুমোদিত</th>
                    <th className="py-2 font-medium">অপেক্ষমাণ</th>
                    <th className="py-2 font-medium">বাতিল</th>
                    <th className="py-2 font-medium"><span className="sr-only">লিংক</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {batches.map((b) => (
                    <tr key={b.passing_year}>
                      <td className="py-2.5 font-display font-bold">{toBn(b.passing_year)}</td>
                      <td className="py-2.5">{formatBnNumber(b.total)}</td>
                      <td className="py-2.5">{formatBnNumber(b.approved)}</td>
                      <td className="py-2.5">{b.pending ? <Link href={`/admin/registrations?year=${b.passing_year}&status=pending`} className="badge badge-amber">{formatBnNumber(b.pending)}</Link> : "০"}</td>
                      <td className="py-2.5">{formatBnNumber(b.rejected)}</td>
                      <td className="py-2.5 text-right text-sm">
                        <Link href={`/admin/registrations?year=${b.passing_year}`} className="font-semibold text-green">নিবন্ধন</Link>
                        {" · "}
                        <Link href={`/batches/${b.passing_year}`} target="_blank" className="font-semibold text-green">পাবলিক পাতা</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      </div>
    </>
  );
}
