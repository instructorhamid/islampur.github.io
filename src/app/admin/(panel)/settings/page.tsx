import { Trash2 } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { AdminCard, Checkbox, TextInput } from "@/components/admin/fields";
import { PageTitle } from "@/components/admin/StatusBadge";
import { formatBnNumber } from "@/lib/bn";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getSettings } from "@/lib/queries/settings";
import { clearDemoDataAction, purgeRejectedAction, updateSettingsAction } from "../../_actions/settings";

export const metadata = { title: "সেটিংস ও গোপনীয়তা" };

export default async function SettingsPage() {
  await requireAdmin("admin");
  const settings = await getSettings();
  const [demo] = await sql<{ registrations: number; sponsors: number; announcements: number }[]>`
    select (select count(*) from registrations where is_demo)::int as registrations,
           (select count(*) from sponsors where is_demo)::int as sponsors,
           (select count(*) from announcements where is_demo)::int as announcements`;
  const demoTotal = demo.registrations + demo.sponsors + demo.announcements;

  return (
    <>
      <PageTitle title="সেটিংস ও গোপনীয়তা" description="শুধু প্রধান অ্যাডমিন এই পাতা দেখতে ও পরিবর্তন করতে পারেন।" />
      <div className="space-y-6">
        <AdminCard title="নিবন্ধন, গোপনীয়তা ও যোগাযোগ">
          <ActionForm action={updateSettingsAction} className="grid gap-5 md:grid-cols-2">
            <div className="space-y-4 md:col-span-2">
              <Checkbox label="নিবন্ধন চালু রাখুন" name="registration_open" defaultChecked={settings.registration_open} hint="বন্ধ করলে নিবন্ধন ফর্মের জায়গায় 'নিবন্ধন বন্ধ' বার্তা দেখাবে।" />
              <Checkbox label="প্রকাশের আগে অনুমোদন প্রয়োজন" name="require_approval" defaultChecked={settings.require_approval} hint="সুপারিশকৃত। বন্ধ করলে নতুন নিবন্ধন সঙ্গে সঙ্গে তালিকায় প্রকাশিত হবে।" />
              <Checkbox
                label="রক্তের গ্রুপ প্রকাশের সুযোগ চালু রাখুন"
                name="show_blood_group_publicly"
                defaultChecked={settings.show_blood_group_publicly}
                hint="চালু থাকলেও কেবল সম্মতিদাতাদের রক্তের গ্রুপ দেখাবে। বন্ধ করলে কারও রক্তের গ্রুপই প্রকাশ্যে দেখাবে না।"
              />
            </div>
            <TextInput label="যোগাযোগের ফোন নম্বর" name="contact_phone" type="tel" defaultValue={settings.contact_phone ?? ""} maxLength={40} hint="ফাঁকা রাখলে 'শীঘ্রই প্রকাশ করা হবে' দেখাবে।" />
            <TextInput label="যোগাযোগের ইমেইল" name="contact_email" type="email" defaultValue={settings.contact_email ?? ""} />
            <TextInput label="যোগাযোগের ঠিকানা" name="contact_address" defaultValue={settings.contact_address ?? ""} maxLength={300} />
            <TextInput label="ফেসবুক পেজ/গ্রুপ লিংক" name="facebook_url" type="url" defaultValue={settings.facebook_url ?? ""} placeholder="https://facebook.com/…" />
            <div className="md:col-span-2"><SubmitButton>সংরক্ষণ করুন</SubmitButton></div>
          </ActionForm>
        </AdminCard>

        <div id="demo" className="scroll-mt-24">
          <AdminCard title="নমুনা (ডেমো) তথ্য" description="উন্নয়ন ও প্রদর্শনের জন্য যুক্ত নমুনা তথ্য। ওয়েবসাইট চালুর আগে অবশ্যই মুছে ফেলুন।">
            <ActionForm action={clearDemoDataAction} confirmMessage="সব নমুনা তথ্য স্থায়ীভাবে মুছে ফেলবেন?">
              {demoTotal === 0 ? (
                <p className="text-green-deep">কোনো নমুনা তথ্য নেই। ✓</p>
              ) : (
                <>
                  <p>
                    বর্তমানে {formatBnNumber(demo.registrations)}টি নমুনা নিবন্ধন, {formatBnNumber(demo.sponsors)}টি নমুনা পৃষ্ঠপোষক ও{" "}
                    {formatBnNumber(demo.announcements)}টি নমুনা ঘোষণা রয়েছে। প্রকৃত তথ্য অক্ষত থাকবে।
                  </p>
                  <div className="mt-3"><Checkbox label="আমি নিশ্চিত, সব নমুনা তথ্য মুছে ফেলতে চাই।" name="confirm" /></div>
                  <SubmitButton className="btn btn-danger mt-4"><Trash2 aria-hidden size={16} /> নমুনা তথ্য মুছে ফেলুন</SubmitButton>
                </>
              )}
            </ActionForm>
          </AdminCard>
        </div>

        <AdminCard title="তথ্য সংরক্ষণের মেয়াদ" description="বাতিল হওয়া নিবন্ধনের ব্যক্তিগত তথ্য অপ্রয়োজনে রেখে দেওয়া উচিত নয়। নির্দিষ্ট দিনের বেশি পুরোনো বাতিল নিবন্ধন ছবিসহ মুছে ফেলুন।">
          <ActionForm action={purgeRejectedAction} confirmMessage="নির্বাচিত বাতিল নিবন্ধনগুলো স্থায়ীভাবে মুছে ফেলবেন?" className="flex flex-wrap items-end gap-4">
            <TextInput label="যত দিনের বেশি পুরোনো" name="days" type="number" min={0} max={3650} defaultValue={30} className="w-40" />
            <Checkbox label="আমি নিশ্চিত" name="confirm" />
            <SubmitButton className="btn btn-danger"><Trash2 aria-hidden size={16} /> বাতিল নিবন্ধন মুছুন</SubmitButton>
          </ActionForm>
          <p className="mt-4 text-sm text-muted">
            ব্যক্তিগত অনুরোধে কোনো নিবন্ধন সংশোধন, ছবি সরানো বা মুছে ফেলতে নিবন্ধন পাতা থেকে নির্দিষ্ট নিবন্ধন খুলুন।
          </p>
        </AdminCard>
      </div>
    </>
  );
}
