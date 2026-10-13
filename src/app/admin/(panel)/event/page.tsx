import { Plus, Trash2 } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { AdminCard, Checkbox, TextArea, TextInput } from "@/components/admin/fields";
import { PageTitle } from "@/components/admin/StatusBadge";
import { formatBnTime, toDhakaInputValue } from "@/lib/bn";
import { requireAdmin } from "@/lib/auth";
import { getActiveEvent, getSchedule } from "@/lib/queries/event";
import { deleteScheduleItemAction, saveScheduleItemAction, updateEventAction } from "../../_actions/event";

export const metadata = { title: "অনুষ্ঠান ও সময়সূচি" };

export default async function EventAdminPage() {
  await requireAdmin();
  const event = await getActiveEvent();
  if (!event) {
    return <p className="card p-6">কোনো সক্রিয় অনুষ্ঠান পাওয়া যায়নি। ডাটাবেজ মাইগ্রেশন চালানো হয়েছে কি না পরীক্ষা করুন।</p>;
  }
  const schedule = await getSchedule(event.id);

  return (
    <>
      <PageTitle title="অনুষ্ঠান ও সময়সূচি" description="এখানে করা পরিবর্তন সঙ্গে সঙ্গে ওয়েবসাইটে দেখা যাবে। সব সময় বাংলাদেশ সময় (GMT+৬) অনুযায়ী।" />
      <div className="space-y-6">
        <AdminCard title="অনুষ্ঠানের মূল তথ্য">
          <ActionForm action={updateEventAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="id" value={event.id} />
            <TextInput label="অনুষ্ঠানের শিরোনাম" name="event_title" defaultValue={event.event_title} required maxLength={200} className="md:col-span-2" />
            <TextInput label="ট্যাগলাইন" name="event_tagline" defaultValue={event.event_tagline ?? ""} maxLength={200} className="md:col-span-2" />
            <TextArea label="অনুষ্ঠানের বিবরণ" name="event_description" defaultValue={event.event_description ?? ""} maxLength={3000} className="md:col-span-2" />
            <TextInput label="অনুষ্ঠানের তারিখ ও শুরুর সময়" name="event_date" type="datetime-local" defaultValue={toDhakaInputValue(event.event_date)} hint="ফাঁকা রাখলে 'তারিখ শীঘ্রই ঘোষণা করা হবে' দেখাবে।" />
            <TextInput label="নিবন্ধনের শেষ সময়" name="registration_deadline" type="datetime-local" defaultValue={toDhakaInputValue(event.registration_deadline)} hint="এই সময়ের পর নিবন্ধন ফর্ম বন্ধ হয়ে যাবে। ফাঁকা রাখলে কোনো সময়সীমা নেই।" />
            <TextInput label="ভেন্যুর নাম" name="venue_name" defaultValue={event.venue_name ?? ""} maxLength={200} />
            <TextInput label="ভেন্যুর ঠিকানা" name="venue_address" defaultValue={event.venue_address ?? ""} maxLength={500} />
            <TextInput label="ম্যাপ লিংক (ঐচ্ছিক)" name="map_url" type="url" defaultValue={event.map_url ?? ""} placeholder="https://maps.google.com/…" hint="ভেন্যু চূড়ান্ত হলে Google Maps-এর শেয়ার লিংক দিন।" className="md:col-span-2" />
            <TextInput label="নিবন্ধন ফি (টাকা)" name="registration_fee_amount" type="number" min={0} step={1} defaultValue={event.registration_fee_amount ?? ""} hint="ফাঁকা = এখনো ঘোষণা হয়নি, ০ = বিনামূল্যে।" />
            <TextInput label="ফি সংক্রান্ত নোট" name="registration_fee_note" defaultValue={event.registration_fee_note ?? ""} maxLength={1000} hint="পরিশোধের পদ্ধতি ইত্যাদি।" />
            <TextArea label="নিবন্ধনের নির্দেশনা" name="registration_instructions" defaultValue={event.registration_instructions ?? ""} maxLength={3000} className="md:col-span-2" />
            <div className="rounded-xl border border-amber-line bg-amber-bg p-4 md:col-span-2">
              <Checkbox
                label="তথ্যগুলো এখনো প্রস্তাবিত (চূড়ান্ত নয়)"
                name="is_provisional"
                defaultChecked={event.is_provisional}
                hint="টিক থাকলে ওয়েবসাইটের সংশ্লিষ্ট সব জায়গায় 'প্রস্তাবিত তথ্য' সতর্কবার্তা দেখাবে। তারিখ, ভেন্যু ও সময়সূচি চূড়ান্ত হলে টিক তুলে দিন।"
              />
            </div>
            <div className="md:col-span-2">
              <SubmitButton>সংরক্ষণ করুন</SubmitButton>
            </div>
          </ActionForm>
        </AdminCard>

        <AdminCard title="অনুষ্ঠানসূচি" description="কার্যক্রমগুলো শুরুর সময় অনুযায়ী সাজানো থাকে; একই সময়ের ক্ষেত্রে ক্রম নম্বর ব্যবহার হয়।">
          <ul className="space-y-4">
            {schedule.map((item) => (
              <li key={item.id} className="rounded-xl border border-line p-4">
                <p className="mb-3 text-sm font-semibold text-green">{formatBnTime(item.start_time)}{item.end_time && ` – ${formatBnTime(item.end_time)}`}</p>
                <ActionForm action={saveScheduleItemAction} className="grid gap-3 md:grid-cols-[1fr_1fr_8rem_8rem_6rem]">
                  <input type="hidden" name="id" value={item.id} />
                  <TextInput label="কার্যক্রম" name="activity_title" defaultValue={item.activity_title} required maxLength={200} />
                  <TextInput label="বিবরণ" name="activity_description" defaultValue={item.activity_description ?? ""} maxLength={1000} />
                  <TextInput label="শুরু" name="start_time" type="time" defaultValue={item.start_time} required />
                  <TextInput label="শেষ" name="end_time" type="time" defaultValue={item.end_time ?? ""} />
                  <TextInput label="ক্রম" name="display_order" type="number" min={0} max={999} defaultValue={item.display_order} />
                  <div className="md:col-span-5"><SubmitButton className="btn btn-outline btn-sm">হালনাগাদ</SubmitButton></div>
                </ActionForm>
                <ActionForm action={deleteScheduleItemAction} confirmMessage={`"${item.activity_title}" মুছে ফেলবেন?`} className="mt-2">
                  <input type="hidden" name="id" value={item.id} />
                  <SubmitButton className="btn btn-ghost btn-sm text-red-ink"><Trash2 aria-hidden size={14} /> মুছুন</SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-xl bg-green-light/60 p-4">
            <h3 className="flex items-center gap-2 font-semibold"><Plus aria-hidden size={18} /> নতুন কার্যক্রম যুক্ত করুন</h3>
            <ActionForm action={saveScheduleItemAction} resetOnSuccess className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_8rem_8rem_6rem]">
              <input type="hidden" name="event_id" value={event.id} />
              <TextInput label="কার্যক্রম" name="activity_title" required maxLength={200} />
              <TextInput label="বিবরণ" name="activity_description" maxLength={1000} />
              <TextInput label="শুরু" name="start_time" type="time" required />
              <TextInput label="শেষ" name="end_time" type="time" />
              <TextInput label="ক্রম" name="display_order" type="number" min={0} max={999} defaultValue={schedule.length + 1} />
              <div className="md:col-span-5"><SubmitButton>যুক্ত করুন</SubmitButton></div>
            </ActionForm>
          </div>
        </AdminCard>
      </div>
    </>
  );
}
