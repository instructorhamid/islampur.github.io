"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { failure, success, type ActionState } from "@/lib/action-state";
import { audit, requireAdmin } from "@/lib/auth";
import { isUniqueViolation, sql } from "@/lib/db";
import { APPROVAL_STATUSES, BLOOD_GROUPS } from "@/lib/constants";
import { deleteObjects, ImageValidationError, photoObjectKeys, storeProfilePhoto } from "@/lib/images";
import { toBn } from "@/lib/bn";
import { normalizeBdPhone } from "@/lib/phone";
import { getSettings } from "@/lib/queries/settings";
import { cleanText, isUuid } from "@/lib/validation";

function refreshPublic() {
  revalidatePath("/", "layout");
}

/** Approve / reject one (button value "id:status") or many (checkbox "ids" + "decision"). */
export async function reviewRegistrationsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  let ids: string[];
  let decision: string;
  const single = String(formData.get("single") ?? "");
  if (single) {
    const [id, status] = single.split(":");
    ids = [id];
    decision = status;
  } else {
    ids = formData.getAll("ids").map(String);
    decision = String(formData.get("decision") ?? "");
  }
  ids = ids.filter(isUuid);
  if (!(APPROVAL_STATUSES as readonly string[]).includes(decision)) return failure("অবৈধ সিদ্ধান্ত।");
  if (ids.length === 0) return failure("অন্তত একটি নিবন্ধন নির্বাচন করুন।");

  const updated = await sql`update registrations set approval_status = ${decision}, reviewed_by = ${admin.id},
    reviewed_at = now(), updated_at = now() where id = any(${sql.array(ids)}::uuid[]) returning id`;
  for (const row of updated) await audit(admin.id, `status:${decision}`, "registration", row.id);
  refreshPublic();
  const label = decision === "approved" ? "অনুমোদিত" : decision === "rejected" ? "বাতিল" : "অপেক্ষমাণ";
  return success(`${toBn(updated.length)}টি নিবন্ধন ${label} করা হয়েছে।`);
}

const editSchema = z.object({
  id: z.string().refine(isUuid),
  full_name: z.string().transform(cleanText).pipe(z.string().min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে।").max(100)),
  phone: z.string().transform((v, ctx) => {
    const n = normalizeBdPhone(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "সঠিক বাংলাদেশি মোবাইল নম্বর দিন।" });
      return z.NEVER;
    }
    return n;
  }),
  blood_group: z.enum(BLOOD_GROUPS, { errorMap: () => ({ message: "রক্তের গ্রুপ নির্বাচন করুন।" }) }),
  passing_year: z.coerce.number().int(),
  approval_status: z.enum(APPROVAL_STATUSES),
  photo_consent: z.string().optional().transform((v) => v === "on"),
  blood_group_public_consent: z.string().optional().transform((v) => v === "on"),
  admin_note: z.string().max(2000).transform((v) => v.trim() || null),
});

export async function updateRegistrationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = editSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "তথ্য সঠিক নয়।");
  const d = parsed.data;
  const settings = await getSettings();
  if (d.passing_year < settings.min_passing_year || d.passing_year > settings.max_passing_year) {
    return failure("পাসের বছর নির্ধারিত সীমার বাইরে। প্রয়োজনে ব্যাচ পাতায় বছরের সীমা পরিবর্তন করুন।");
  }
  const [before] = await sql<{ approval_status: string }[]>`select approval_status from registrations where id = ${d.id}`;
  if (!before) return failure("নিবন্ধনটি পাওয়া যায়নি।");
  try {
    await sql`update registrations set full_name = ${d.full_name}, normalized_phone = ${d.phone}, blood_group = ${d.blood_group},
      passing_year = ${d.passing_year}, approval_status = ${d.approval_status}, photo_consent = ${d.photo_consent},
      blood_group_public_consent = ${d.blood_group_public_consent}, admin_note = ${d.admin_note}, updated_at = now()
      ${before.approval_status !== d.approval_status ? sql`, reviewed_by = ${admin.id}, reviewed_at = now()` : sql``}
      where id = ${d.id}`;
  } catch (err) {
    if (isUniqueViolation(err)) return failure("এই মোবাইল নম্বর দিয়ে অন্য একটি নিবন্ধন রয়েছে।");
    throw err;
  }
  await audit(admin.id, "edit", "registration", d.id, { status: d.approval_status });
  refreshPublic();
  return success("তথ্য হালনাগাদ করা হয়েছে।");
}

export async function removePhotoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return failure("অবৈধ অনুরোধ।");
  const [row] = await sql<{ photo_key: string | null }[]>`select photo_key from registrations where id = ${id}`;
  if (!row?.photo_key) return failure("এই নিবন্ধনে কোনো ছবি নেই।");
  await sql`update registrations set photo_key = null, photo_consent = false, updated_at = now() where id = ${id}`;
  await deleteObjects(photoObjectKeys(row.photo_key));
  await audit(admin.id, "remove_photo", "registration", id);
  refreshPublic();
  return success("ছবিটি স্থায়ীভাবে মুছে ফেলা হয়েছে।");
}

export async function replacePhotoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return failure("অবৈধ অনুরোধ।");
  const [row] = await sql<{ photo_key: string | null }[]>`select photo_key from registrations where id = ${id}`;
  if (!row) return failure("নিবন্ধনটি পাওয়া যায়নি।");
  let key: string;
  try {
    key = await storeProfilePhoto(formData.get("photo"));
  } catch (err) {
    if (err instanceof ImageValidationError) return failure("ছবিটি গ্রহণযোগ্য নয় (JPG, PNG বা WebP; সর্বোচ্চ আকারের মধ্যে)।");
    throw err;
  }
  await sql`update registrations set photo_key = ${key}, updated_at = now() where id = ${id}`;
  if (row.photo_key) await deleteObjects(photoObjectKeys(row.photo_key));
  await audit(admin.id, "replace_photo", "registration", id);
  refreshPublic();
  return success("নতুন ছবি সংরক্ষণ করা হয়েছে।");
}

export async function deleteRegistrationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin("admin");
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return failure("অবৈধ অনুরোধ।");
  if (formData.get("confirm") !== "on") return failure("মুছে ফেলার আগে নিশ্চিতকরণ ঘরে টিক দিন।");
  const [row] = await sql<{ photo_key: string | null; passing_year: number }[]>`
    delete from registrations where id = ${id} returning photo_key, passing_year`;
  if (!row) return failure("নিবন্ধনটি পাওয়া যায়নি।");
  if (row.photo_key) await deleteObjects(photoObjectKeys(row.photo_key));
  await audit(admin.id, "delete", "registration", id, { passing_year: row.passing_year });
  refreshPublic();
  redirect("/admin/registrations?deleted=1");
}
