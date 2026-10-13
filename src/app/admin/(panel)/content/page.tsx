import { Plus, Trash2 } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { AdminCard, Checkbox, TextArea, TextInput } from "@/components/admin/fields";
import { PageTitle } from "@/components/admin/StatusBadge";
import { formatBnDate } from "@/lib/bn";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Announcement, Faq } from "@/lib/queries/event";
import { deleteAnnouncementAction, deleteFaqAction, saveAnnouncementAction, saveFaqAction } from "../../_actions/content";

export const metadata = { title: "ঘোষণা ও প্রশ্নোত্তর" };

export default async function ContentAdminPage() {
  await requireAdmin();
  const [announcements, faqs] = await Promise.all([
    sql<Announcement[]>`select id, title, body, is_pinned, is_published, is_demo, published_at from announcements order by is_pinned desc, published_at desc`,
    sql<Faq[]>`select id, question, answer, display_order, is_published from faqs order by display_order, created_at`,
  ]);

  return (
    <>
      <PageTitle title="ঘোষণা ও প্রশ্নোত্তর" description="হোম ও অনুষ্ঠান পাতায় প্রকাশিত ঘোষণা এবং সচরাচর জিজ্ঞাসিত প্রশ্ন।" />
      <div className="space-y-6">
        <AdminCard title="ঘোষণা">
          <div className="rounded-xl bg-green-light/60 p-4">
            <h3 className="flex items-center gap-2 font-semibold"><Plus aria-hidden size={18} /> নতুন ঘোষণা</h3>
            <ActionForm action={saveAnnouncementAction} resetOnSuccess className="mt-3 grid gap-3">
              <TextInput label="শিরোনাম" name="title" required maxLength={200} />
              <TextArea label="বিষয়বস্তু" name="body" required maxLength={5000} />
              <div className="flex flex-wrap gap-6">
                <Checkbox label="প্রকাশ করুন" name="is_published" defaultChecked />
                <Checkbox label="গুরুত্বপূর্ণ (উপরে পিন করুন)" name="is_pinned" />
              </div>
              <div><SubmitButton>যুক্ত করুন</SubmitButton></div>
            </ActionForm>
          </div>
          <ul className="mt-6 space-y-4">
            {announcements.length === 0 && <li className="text-muted">এখনো কোনো ঘোষণা নেই।</li>}
            {announcements.map((a) => (
              <li key={a.id} className="rounded-xl border border-line p-4">
                <p className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                  {formatBnDate(a.published_at)}
                  {!a.is_published && <span className="badge badge-gray">অপ্রকাশিত</span>}
                  {a.is_demo && <span className="badge badge-amber">নমুনা</span>}
                </p>
                <ActionForm action={saveAnnouncementAction} className="grid gap-3">
                  <input type="hidden" name="id" value={a.id} />
                  <TextInput label="শিরোনাম" name="title" defaultValue={a.title} required maxLength={200} />
                  <TextArea label="বিষয়বস্তু" name="body" defaultValue={a.body} required maxLength={5000} />
                  <div className="flex flex-wrap gap-6">
                    <Checkbox label="প্রকাশিত" name="is_published" defaultChecked={a.is_published} />
                    <Checkbox label="গুরুত্বপূর্ণ (পিন করা)" name="is_pinned" defaultChecked={a.is_pinned} />
                  </div>
                  <div><SubmitButton className="btn btn-outline btn-sm">হালনাগাদ</SubmitButton></div>
                </ActionForm>
                <ActionForm action={deleteAnnouncementAction} confirmMessage="এই ঘোষণাটি মুছে ফেলবেন?" className="mt-2">
                  <input type="hidden" name="id" value={a.id} />
                  <SubmitButton className="btn btn-ghost btn-sm text-red-ink"><Trash2 aria-hidden size={14} /> মুছুন</SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
        </AdminCard>

        <AdminCard title="সচরাচর জিজ্ঞাসিত প্রশ্ন">
          <ul className="space-y-4">
            {faqs.map((f) => (
              <li key={f.id} className="rounded-xl border border-line p-4">
                <ActionForm action={saveFaqAction} className="grid gap-3 md:grid-cols-[1fr_6rem]">
                  <input type="hidden" name="id" value={f.id} />
                  <TextInput label="প্রশ্ন" name="question" defaultValue={f.question} required maxLength={300} />
                  <TextInput label="ক্রম" name="display_order" type="number" min={0} max={999} defaultValue={f.display_order} />
                  <TextArea label="উত্তর" name="answer" defaultValue={f.answer} required maxLength={3000} className="md:col-span-2" />
                  <div className="flex flex-wrap items-center gap-6 md:col-span-2">
                    <Checkbox label="প্রকাশিত" name="is_published" defaultChecked={f.is_published} />
                    <SubmitButton className="btn btn-outline btn-sm">হালনাগাদ</SubmitButton>
                  </div>
                </ActionForm>
                <ActionForm action={deleteFaqAction} confirmMessage="এই প্রশ্নোত্তরটি মুছে ফেলবেন?" className="mt-2">
                  <input type="hidden" name="id" value={f.id} />
                  <SubmitButton className="btn btn-ghost btn-sm text-red-ink"><Trash2 aria-hidden size={14} /> মুছুন</SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-xl bg-green-light/60 p-4">
            <h3 className="flex items-center gap-2 font-semibold"><Plus aria-hidden size={18} /> নতুন প্রশ্নোত্তর</h3>
            <ActionForm action={saveFaqAction} resetOnSuccess className="mt-3 grid gap-3 md:grid-cols-[1fr_6rem]">
              <TextInput label="প্রশ্ন" name="question" required maxLength={300} />
              <TextInput label="ক্রম" name="display_order" type="number" min={0} max={999} defaultValue={faqs.length + 1} />
              <TextArea label="উত্তর" name="answer" required maxLength={3000} className="md:col-span-2" />
              <div className="flex flex-wrap items-center gap-6 md:col-span-2">
                <Checkbox label="প্রকাশ করুন" name="is_published" defaultChecked />
                <SubmitButton>যুক্ত করুন</SubmitButton>
              </div>
            </ActionForm>
          </div>
        </AdminCard>
      </div>
    </>
  );
}
