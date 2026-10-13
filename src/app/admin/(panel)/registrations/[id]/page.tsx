import { ArrowLeft, ExternalLink, ImageOff, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { AdminCard, Checkbox, Select, TextArea, TextInput } from "@/components/admin/fields";
import { PageTitle, StatusBadge } from "@/components/admin/StatusBadge";
import { Avatar } from "@/components/Avatar";
import { formatBnDateTime, toBn } from "@/lib/bn";
import { APPROVAL_STATUS_LABELS, APPROVAL_STATUSES, BLOOD_GROUPS } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";
import { getAuditFor, getRegistrationForAdmin } from "@/lib/queries/admin";
import { getSettings } from "@/lib/queries/settings";
import { isUuid } from "@/lib/validation";
import {
  deleteRegistrationAction,
  removePhotoAction,
  replacePhotoAction,
  updateRegistrationAction,
} from "../../../_actions/registrations";

export const metadata = { title: "নিবন্ধনের বিস্তারিত" };

const ACTION_LABELS: Record<string, string> = {
  "status:approved": "অনুমোদন করেছেন",
  "status:rejected": "বাতিল করেছেন",
  "status:pending": "অপেক্ষমাণ করেছেন",
  edit: "তথ্য সম্পাদনা করেছেন",
  remove_photo: "ছবি মুছেছেন",
  replace_photo: "ছবি পরিবর্তন করেছেন",
};

export default async function RegistrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [r, settings, history] = await Promise.all([getRegistrationForAdmin(id), getSettings(), getAuditFor("registration", id)]);
  if (!r) notFound();
  const years = Array.from({ length: settings.max_passing_year - settings.min_passing_year + 1 }, (_, i) => settings.max_passing_year - i);
  if (!years.includes(r.passing_year)) years.unshift(r.passing_year); // keep the stored year selectable even if the range changed

  return (
    <>
      <Link href="/admin/registrations" className="mb-4 inline-flex items-center gap-1.5 font-semibold text-green">
        <ArrowLeft aria-hidden size={18} /> সব নিবন্ধন
      </Link>
      <PageTitle title={r.full_name} description={`নিবন্ধনের সময়: ${formatBnDateTime(r.created_at)}`}>
        <div className="flex flex-wrap items-center gap-2">
          {r.is_demo && <span className="badge badge-amber">নমুনা</span>}
          <StatusBadge status={r.approval_status} />
          {r.approval_status === "approved" && (
            <Link href={`/alumni/${r.id}`} target="_blank" className="btn btn-ghost btn-sm">
              পাবলিক প্রোফাইল <ExternalLink aria-hidden size={14} />
            </Link>
          )}
        </div>
      </PageTitle>

      <div className="grid gap-6 xl:grid-cols-[20rem_1fr]">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <Avatar name={r.full_name} src={r.photo_key ? `/media/alumni/${r.id}/full?v=${r.version}` : null} size="large" />
            <div className="space-y-3 p-4 text-sm">
              <p>
                ছবি প্রকাশের সম্মতি: <strong>{r.photo_consent ? "আছে" : "নেই"}</strong>
                <br />
                রক্তের গ্রুপ প্রকাশের সম্মতি: <strong>{r.blood_group_public_consent ? "আছে" : "নেই"}</strong>
                <br />
                গোপনীয়তা নীতিতে সম্মতি: {formatBnDateTime(r.privacy_accepted_at)}
              </p>
              {r.reviewed_at && (
                <p className="text-muted">সর্বশেষ পর্যালোচনা: {r.reviewer_name ?? "—"}, {formatBnDateTime(r.reviewed_at)}</p>
              )}
              <ActionForm action={replacePhotoAction} className="border-t border-line pt-3">
                <input type="hidden" name="id" value={r.id} />
                <label htmlFor="replace-photo" className="field-label text-sm">ছবি পরিবর্তন</label>
                <input id="replace-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required className="file-input" />
                <SubmitButton className="btn btn-outline btn-sm mt-2"><Upload aria-hidden size={14} /> আপলোড</SubmitButton>
              </ActionForm>
              <ActionForm action={removePhotoAction} confirmMessage="ছবিটি স্থায়ীভাবে মুছে ফেলবেন?">
                <input type="hidden" name="id" value={r.id} />
                {r.photo_key ? (
                  <SubmitButton className="btn btn-ghost btn-sm text-red-ink"><ImageOff aria-hidden size={14} /> ছবি মুছে ফেলুন</SubmitButton>
                ) : (
                  <p className="text-muted">এই নিবন্ধনে কোনো ছবি নেই।</p>
                )}
              </ActionForm>
            </div>
          </section>

          {history.length > 0 && (
            <section className="card p-4">
              <h2 className="font-semibold">কার্যক্রমের ইতিহাস</h2>
              <ul className="mt-2 space-y-1.5 text-sm text-muted">
                {history.map((h) => (
                  <li key={h.id}>{h.admin_name ?? "—"} {ACTION_LABELS[h.action] ?? h.action} · {formatBnDateTime(h.created_at)}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <AdminCard title="তথ্য সম্পাদনা" description="নিবন্ধনকারীর অনুরোধে তথ্য সংশোধন করুন। মোবাইল নম্বর কখনো প্রকাশ্যে দেখানো হয় না।">
            <ActionForm action={updateRegistrationAction} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="id" value={r.id} />
              <TextInput label="পূর্ণ নাম" name="full_name" defaultValue={r.full_name} required maxLength={100} className="sm:col-span-2" />
              <TextInput label="মোবাইল নম্বর" name="phone" type="tel" defaultValue={r.normalized_phone} required />
              <Select label="রক্তের গ্রুপ" name="blood_group" defaultValue={r.blood_group}>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </Select>
              <Select label="পাসের বছর" name="passing_year" defaultValue={String(r.passing_year)}>
                {years.map((y) => <option key={y} value={y}>{toBn(y)}</option>)}
              </Select>
              <Select label="অনুমোদনের অবস্থা" name="approval_status" defaultValue={r.approval_status}>
                {APPROVAL_STATUSES.map((s) => <option key={s} value={s}>{APPROVAL_STATUS_LABELS[s]}</option>)}
              </Select>
              <div className="space-y-3 sm:col-span-2">
                <Checkbox label="ছবি প্রকাশের সম্মতি" name="photo_consent" defaultChecked={r.photo_consent} />
                <Checkbox label="রক্তের গ্রুপ প্রকাশের সম্মতি" name="blood_group_public_consent" defaultChecked={r.blood_group_public_consent} />
              </div>
              <TextArea label="অভ্যন্তরীণ নোট (শুধু আয়োজকরা দেখবেন)" name="admin_note" defaultValue={r.admin_note ?? ""} maxLength={2000} className="sm:col-span-2" />
              <div className="sm:col-span-2">
                <SubmitButton>সংরক্ষণ করুন</SubmitButton>
              </div>
            </ActionForm>
          </AdminCard>

          {admin.role === "admin" && (
            <AdminCard title="নিবন্ধন মুছে ফেলুন" description="নিবন্ধনকারীর অনুরোধে বা ভুল/ভুয়া নিবন্ধনের ক্ষেত্রে। ছবিসহ সব তথ্য স্থায়ীভাবে মুছে যাবে।">
              <ActionForm action={deleteRegistrationAction} confirmMessage="এই নিবন্ধনটি স্থায়ীভাবে মুছে ফেলবেন? এটি আর ফেরানো যাবে না।">
                <input type="hidden" name="id" value={r.id} />
                <Checkbox label="আমি নিশ্চিত, এই নিবন্ধনটি স্থায়ীভাবে মুছে ফেলতে চাই।" name="confirm" />
                <SubmitButton className="btn btn-danger mt-4"><Trash2 aria-hidden size={16} /> স্থায়ীভাবে মুছে ফেলুন</SubmitButton>
              </ActionForm>
            </AdminCard>
          )}
        </div>
      </div>
    </>
  );
}
