"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { failure, success, type ActionState } from "@/lib/action-state";
import { audit, requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { isUuid, requiredText } from "@/lib/validation";

const refresh = () => revalidatePath("/", "layout");
const flag = z.string().optional().transform((v) => v === "on");

const announcementSchema = z.object({
  title: requiredText(200, "শিরোনাম লিখুন।"),
  body: requiredText(5000, "ঘোষণার বিষয়বস্তু লিখুন।"),
  is_published: flag,
  is_pinned: flag,
});

export async function saveAnnouncementAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = announcementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message);
  const d = parsed.data;
  if (id) {
    if (!isUuid(id)) return failure("অবৈধ অনুরোধ।");
    await sql`update announcements set title = ${d.title}, body = ${d.body}, is_published = ${d.is_published},
      is_pinned = ${d.is_pinned}, updated_at = now() where id = ${id}`;
  } else {
    await sql`insert into announcements (title, body, is_published, is_pinned) values (${d.title}, ${d.body}, ${d.is_published}, ${d.is_pinned})`;
  }
  await audit(admin.id, id ? "update_announcement" : "create_announcement", "announcement", id || null);
  refresh();
  return success(id ? "ঘোষণা হালনাগাদ করা হয়েছে।" : "নতুন ঘোষণা যুক্ত করা হয়েছে।");
}

export async function deleteAnnouncementAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return failure("অবৈধ অনুরোধ।");
  await sql`delete from announcements where id = ${id}`;
  await audit(admin.id, "delete_announcement", "announcement", id);
  refresh();
  return success("ঘোষণা মুছে ফেলা হয়েছে।");
}

const faqSchema = z.object({
  question: requiredText(300, "প্রশ্ন লিখুন।"),
  answer: requiredText(3000, "উত্তর লিখুন।"),
  display_order: z.coerce.number().int().min(0).max(999).catch(0),
  is_published: flag,
});

export async function saveFaqAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = faqSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message);
  const d = parsed.data;
  if (id) {
    if (!isUuid(id)) return failure("অবৈধ অনুরোধ।");
    await sql`update faqs set question = ${d.question}, answer = ${d.answer}, display_order = ${d.display_order},
      is_published = ${d.is_published}, updated_at = now() where id = ${id}`;
  } else {
    await sql`insert into faqs (question, answer, display_order, is_published) values (${d.question}, ${d.answer}, ${d.display_order}, ${d.is_published})`;
  }
  await audit(admin.id, id ? "update_faq" : "create_faq", "faq", id || null);
  refresh();
  return success(id ? "প্রশ্নোত্তর হালনাগাদ করা হয়েছে।" : "নতুন প্রশ্নোত্তর যুক্ত করা হয়েছে।");
}

export async function deleteFaqAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return failure("অবৈধ অনুরোধ।");
  await sql`delete from faqs where id = ${id}`;
  await audit(admin.id, "delete_faq", "faq", id);
  refresh();
  return success("প্রশ্নোত্তর মুছে ফেলা হয়েছে।");
}
