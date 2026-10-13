"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { failure, success, type ActionState } from "@/lib/action-state";
import { audit, requireAdmin } from "@/lib/auth";
import { toBn } from "@/lib/bn";
import { sql } from "@/lib/db";
import { deleteObjects, photoObjectKeys } from "@/lib/images";
import { optionalText, optionalUrl } from "@/lib/validation";

const refresh = () => revalidatePath("/", "layout");
const flag = z.string().optional().transform((v) => v === "on");

const settingsSchema = z.object({
  registration_open: flag,
  require_approval: flag,
  show_blood_group_publicly: flag,
  contact_phone: optionalText(40),
  contact_email: z
    .string()
    .trim()
    .transform((v) => v || null)
    .refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "সঠিক ইমেইল ঠিকানা দিন।"),
  contact_address: optionalText(300),
  facebook_url: optionalUrl,
});

export async function updateSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin("admin");
  const parsed = settingsSchema.safeParse({
    registration_open: formData.get("registration_open") ?? undefined,
    require_approval: formData.get("require_approval") ?? undefined,
    show_blood_group_publicly: formData.get("show_blood_group_publicly") ?? undefined,
    contact_phone: formData.get("contact_phone") ?? "",
    contact_email: formData.get("contact_email") ?? "",
    contact_address: formData.get("contact_address") ?? "",
    facebook_url: formData.get("facebook_url") ?? "",
  });
  if (!parsed.success) return failure(parsed.error.issues[0]?.message);
  const d = parsed.data;
  await sql`update site_settings set registration_open = ${d.registration_open}, require_approval = ${d.require_approval},
    show_blood_group_publicly = ${d.show_blood_group_publicly}, contact_phone = ${d.contact_phone},
    contact_email = ${d.contact_email}, contact_address = ${d.contact_address}, facebook_url = ${d.facebook_url},
    updated_at = now() where id = 1`;
  await audit(admin.id, "update_settings", "settings", "1", { ...d });
  refresh();
  return success("সেটিংস সংরক্ষণ করা হয়েছে।");
}

export async function updateYearRangeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin("admin");
  const min = Number(formData.get("min_passing_year"));
  const max = Number(formData.get("max_passing_year"));
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1900 || max > 2100) return failure("সঠিক বছর দিন (১৯০০–২১০০)।");
  if (min > max) return failure("প্রথম বছর শেষ বছরের চেয়ে বড় হতে পারে না।");
  const [outside] = await sql<{ count: number }[]>`select count(*)::int as count from registrations where passing_year < ${min} or passing_year > ${max}`;
  await sql`update site_settings set min_passing_year = ${min}, max_passing_year = ${max}, updated_at = now() where id = 1`;
  await audit(admin.id, "update_year_range", "settings", "1", { min, max });
  refresh();
  return success(
    outside.count > 0
      ? `সীমা হালনাগাদ হয়েছে। সতর্কতা: ${toBn(outside.count)}টি বিদ্যমান নিবন্ধন নতুন সীমার বাইরে; সেগুলোর ব্যাচ পাতা আর খোলা যাবে না।`
      : "পাসের বছরের সীমা হালনাগাদ করা হয়েছে।",
  );
}

export async function clearDemoDataAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin("admin");
  if (formData.get("confirm") !== "on") return failure("নিশ্চিতকরণ ঘরে টিক দিন।");
  const regs = await sql<{ photo_key: string | null }[]>`delete from registrations where is_demo returning photo_key`;
  const sponsors = await sql<{ logo_key: string | null }[]>`delete from sponsors where is_demo returning logo_key`;
  const ann = await sql`delete from announcements where is_demo`;
  await deleteObjects([
    ...regs.flatMap((r) => (r.photo_key ? photoObjectKeys(r.photo_key) : [])),
    ...sponsors.flatMap((s) => (s.logo_key ? [s.logo_key] : [])),
  ]);
  await audit(admin.id, "clear_demo", "settings", "1", { registrations: regs.length, sponsors: sponsors.length, announcements: ann.count });
  refresh();
  return success(`নমুনা তথ্য মুছে ফেলা হয়েছে: ${toBn(regs.length)}টি নিবন্ধন, ${toBn(sponsors.length)}টি পৃষ্ঠপোষক, ${toBn(ann.count)}টি ঘোষণা।`);
}

export async function purgeRejectedAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin("admin");
  const days = Number(formData.get("days"));
  if (!Number.isInteger(days) || days < 0 || days > 3650) return failure("সঠিক দিনের সংখ্যা দিন।");
  if (formData.get("confirm") !== "on") return failure("নিশ্চিতকরণ ঘরে টিক দিন।");
  const rows = await sql<{ photo_key: string | null }[]>`
    delete from registrations where approval_status = 'rejected'
      and coalesce(reviewed_at, updated_at) < now() - make_interval(days => ${days})
    returning photo_key`;
  await deleteObjects(rows.flatMap((r) => (r.photo_key ? photoObjectKeys(r.photo_key) : [])));
  await audit(admin.id, "purge_rejected", "settings", "1", { days, count: rows.length });
  return success(`${toBn(rows.length)}টি বাতিল নিবন্ধন স্থায়ীভাবে মুছে ফেলা হয়েছে।`);
}
