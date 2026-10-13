import { Plus, Trash2 } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { AdminCard, Checkbox, Select, TextArea, TextInput } from "@/components/admin/fields";
import { PageTitle } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { toBn } from "@/lib/bn";
import { getAllSponsors, getSponsorTiers, type Sponsor, type SponsorTier } from "@/lib/queries/sponsors";
import { deleteSponsorAction, deleteTierAction, saveSponsorAction, saveTierAction } from "../../_actions/sponsors";

export const metadata = { title: "স্পনসর ব্যবস্থাপনা" };

function SponsorFields({ sponsor, tiers }: { sponsor?: Sponsor; tiers: SponsorTier[] }) {
  return (
    <>
      <TextInput label="নাম" name="name" defaultValue={sponsor?.name} required maxLength={200} />
      <Select label="পৃষ্ঠপোষকতার শ্রেণি" name="tier_id" defaultValue={sponsor?.tier_id ?? ""}>
        <option value="">— শ্রেণি নেই —</option>
        {tiers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </Select>
      <TextInput label="ওয়েবসাইট (ঐচ্ছিক)" name="website_url" type="url" defaultValue={sponsor?.website_url ?? ""} placeholder="https://" />
      <TextInput label="ক্রম" name="display_order" type="number" min={0} max={999} defaultValue={sponsor?.display_order ?? 0} />
      <TextArea label="সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)" name="description" defaultValue={sponsor?.description ?? ""} maxLength={1000} className="md:col-span-2" />
      <div className="md:col-span-2">
        <label className="field-label text-[0.95rem]">
          {sponsor?.logo_url ? "লোগো পরিবর্তন (ঐচ্ছিক)" : "লোগো (ঐচ্ছিক)"}
          <input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="file-input mt-1 font-normal" />
        </label>
        <p className="field-hint">JPG, PNG বা WebP। স্বচ্ছ পটভূমির PNG সবচেয়ে ভালো দেখায়। নিরাপত্তার কারণে SVG গ্রহণ করা হয় না।</p>
      </div>
      <div className="flex flex-wrap gap-6 md:col-span-2">
        <Checkbox label="ওয়েবসাইটে প্রকাশ করুন" name="is_published" defaultChecked={sponsor ? sponsor.is_published : true} />
        {sponsor?.logo_url && <Checkbox label="বর্তমান লোগো মুছে ফেলুন" name="remove_logo" />}
      </div>
    </>
  );
}

export default async function SponsorsAdminPage() {
  await requireAdmin();
  const [sponsors, tiers] = await Promise.all([getAllSponsors(), getSponsorTiers()]);

  return (
    <>
      <PageTitle title="স্পনসর ব্যবস্থাপনা" description="শুধু নিশ্চিত হওয়া পৃষ্ঠপোষকদের প্রকাশ করুন।" />
      <div className="space-y-6">
        <AdminCard title="নতুন পৃষ্ঠপোষক যুক্ত করুন">
          <ActionForm action={saveSponsorAction} resetOnSuccess className="grid gap-4 md:grid-cols-2">
            <SponsorFields tiers={tiers} />
            <div className="md:col-span-2"><SubmitButton><Plus aria-hidden size={16} /> যুক্ত করুন</SubmitButton></div>
          </ActionForm>
        </AdminCard>

        <AdminCard title={`পৃষ্ঠপোষক তালিকা (${toBn(sponsors.length)})`}>
          {sponsors.length === 0 ? (
            <p className="text-muted">এখনো কোনো পৃষ্ঠপোষক যুক্ত করা হয়নি। ওয়েবসাইটে পৃষ্ঠপোষকতার আমন্ত্রণ দেখানো হচ্ছে।</p>
          ) : (
            <ul className="space-y-4">
              {sponsors.map((s) => (
                <li key={s.id} className="rounded-xl border border-line p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    {s.logo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logo_url} alt="" className="h-12 w-24 rounded bg-green-light object-contain p-1" />
                    )}
                    <span className="font-semibold">{s.name}</span>
                    {s.is_published ? <span className="badge badge-green">প্রকাশিত</span> : <span className="badge badge-gray">অপ্রকাশিত</span>}
                    {s.is_demo && <span className="badge badge-amber">নমুনা</span>}
                  </div>
                  <details>
                    <summary className="inline-flex text-sm font-semibold text-green">সম্পাদনা করুন</summary>
                    <ActionForm action={saveSponsorAction} className="mt-3 grid gap-4 md:grid-cols-2">
                      <input type="hidden" name="id" value={s.id} />
                      <SponsorFields sponsor={s} tiers={tiers} />
                      <div className="md:col-span-2"><SubmitButton className="btn btn-outline btn-sm">হালনাগাদ</SubmitButton></div>
                    </ActionForm>
                  </details>
                  <ActionForm action={deleteSponsorAction} confirmMessage={`"${s.name}" মুছে ফেলবেন?`} className="mt-2">
                    <input type="hidden" name="id" value={s.id} />
                    <SubmitButton className="btn btn-ghost btn-sm text-red-ink"><Trash2 aria-hidden size={14} /> মুছুন</SubmitButton>
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard title="পৃষ্ঠপোষকতার শ্রেণি" description="ক্রম নম্বর অনুযায়ী স্পনসর পাতায় শ্রেণিগুলো সাজানো হয়।">
          <ul className="space-y-3">
            {tiers.map((t) => (
              <li key={t.id} className="flex flex-wrap items-end gap-2 rounded-xl border border-line p-3">
                <ActionForm action={saveTierAction} className="flex flex-1 flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={t.id} />
                  <TextInput label="নাম" name="name" defaultValue={t.name} required maxLength={100} className="min-w-48 flex-1" />
                  <TextInput label="ক্রম" name="display_order" type="number" min={0} max={999} defaultValue={t.display_order} className="w-24" />
                  <SubmitButton className="btn btn-outline btn-sm !min-h-12">হালনাগাদ</SubmitButton>
                </ActionForm>
                <ActionForm action={deleteTierAction} confirmMessage={`"${t.name}" শ্রেণি মুছে ফেলবেন?`}>
                  <input type="hidden" name="id" value={t.id} />
                  <SubmitButton className="btn btn-ghost btn-sm !min-h-12 text-red-ink"><Trash2 aria-hidden size={14} /> মুছুন</SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
          <ActionForm action={saveTierAction} resetOnSuccess className="mt-4 flex flex-wrap items-end gap-2 rounded-xl bg-green-light/60 p-3">
            <TextInput label="নতুন শ্রেণির নাম" name="name" required maxLength={100} className="min-w-48 flex-1" />
            <TextInput label="ক্রম" name="display_order" type="number" min={0} max={999} defaultValue={tiers.length + 1} className="w-24" />
            <SubmitButton className="btn btn-primary btn-sm !min-h-12"><Plus aria-hidden size={14} /> যুক্ত করুন</SubmitButton>
          </ActionForm>
        </AdminCard>
      </div>
    </>
  );
}
