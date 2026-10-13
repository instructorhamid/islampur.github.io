"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { failure, success, type ActionState } from "@/lib/action-state";
import { audit, requireAdmin } from "@/lib/auth";
import { fromDhakaInputValue } from "@/lib/bn";
import { sql } from "@/lib/db";
import { isUuid, optionalText, optionalUrl, requiredText } from "@/lib/validation";

const refresh = () => revalidatePath("/", "layout");

const eventSchema = z.object({
  id: z.string().refine(isUuid),
  event_title: requiredText(200, "অনুষ্ঠানের শিরোনাম লিখুন।"),
  event_tagline: optionalText(200),
  event_description: optionalText(3000),
  event_date: z.string(),
  venue_name: optionalText(200),
  venue_address: optionalText(500),
  map_url: optionalUrl,
  registration_deadline: z.string(),
  registration_fee_amount: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 1_000_000), "ফি অবশ্যই শূন্য বা ধনাত্মক পূর্ণসংখ্যা হতে হবে।"),
  registration_fee_note: optionalText(1000),
  registration_instructions: optionalText(3000),
  is_provisional: z.string().optional().transform((v) => v === "on"),
});

export async function updateEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "তথ্য সঠিক নয়।");
  const d = parsed.data;
  const eventDate = fromDhakaInputValue(d.event_date);
  const deadline = fromDhakaInputValue(d.registration_deadline);
  if (d.event_date && !eventDate) return failure("অনুষ্ঠানের তারিখ সঠিক নয়।");
  if (d.registration_deadline && !deadline) return failure("নিবন্ধনের শেষ সময় সঠিক নয়।");
  if (eventDate && deadline && deadline > eventDate) return failure("নিবন্ধনের শেষ সময় অনুষ্ঠানের আগে হতে হবে।");

  await sql`update events set event_title = ${d.event_title}, event_tagline = ${d.event_tagline},
    event_description = ${d.event_description}, event_date = ${eventDate}, venue_name = ${d.venue_name},
    venue_address = ${d.venue_address}, map_url = ${d.map_url}, registration_deadline = ${deadline},
    registration_fee_amount = ${d.registration_fee_amount}, registration_fee_note = ${d.registration_fee_note},
    registration_instructions = ${d.registration_instructions}, is_provisional = ${d.is_provisional}, updated_at = now()
    where id = ${d.id}`;
  await audit(admin.id, "update_event", "event", d.id);
  refresh();
  return success("অনুষ্ঠানের তথ্য হালনাগাদ করা হয়েছে।");
}

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
const scheduleSchema = z.object({
  activity_title: requiredText(200, "কার্যক্রমের নাম লিখুন।"),
  activity_description: optionalText(1000),
  start_time: z.string().regex(timeRe, "শুরুর সময় দিন।"),
  end_time: z.string().refine((v) => v === "" || timeRe.test(v), "শেষের সময় সঠিক নয়।").transform((v) => v || null),
  display_order: z.coerce.number().int().min(0).max(999).catch(0),
});

export async function saveScheduleItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const eventId = String(formData.get("event_id") ?? "");
  const parsed = scheduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "তথ্য সঠিক নয়।");
  const d = parsed.data;
  if (d.end_time && d.end_time <= d.start_time) return failure("শেষের সময় শুরুর সময়ের পরে হতে হবে।");
  if (id) {
    if (!isUuid(id)) return failure("অবৈধ অনুরোধ।");
    await sql`update event_schedule_items set activity_title = ${d.activity_title}, activity_description = ${d.activity_description},
      start_time = ${d.start_time}, end_time = ${d.end_time}, display_order = ${d.display_order}, updated_at = now() where id = ${id}`;
    await audit(admin.id, "update_schedule", "schedule", id);
  } else {
    if (!isUuid(eventId)) return failure("অবৈধ অনুরোধ।");
    const [row] = await sql<{ id: string }[]>`insert into event_schedule_items (event_id, activity_title, activity_description, start_time, end_time, display_order)
      values (${eventId}, ${d.activity_title}, ${d.activity_description}, ${d.start_time}, ${d.end_time}, ${d.display_order}) returning id`;
    await audit(admin.id, "create_schedule", "schedule", row.id);
  }
  refresh();
  return success(id ? "কার্যক্রম হালনাগাদ করা হয়েছে।" : "নতুন কার্যক্রম যুক্ত করা হয়েছে।");
}

export async function deleteScheduleItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return failure("অবৈধ অনুরোধ।");
  await sql`delete from event_schedule_items where id = ${id}`;
  await audit(admin.id, "delete_schedule", "schedule", id);
  refresh();
  return success("কার্যক্রম মুছে ফেলা হয়েছে।");
}
