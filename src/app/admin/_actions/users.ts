"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { failure, success, type ActionState } from "@/lib/action-state";
import { audit, requireAdmin } from "@/lib/auth";
import { isUniqueViolation, sql } from "@/lib/db";
import { toBn } from "@/lib/bn";
import { ADMIN_ROLES } from "@/lib/constants";
import { hashPassword, PASSWORD_MIN_LENGTH } from "@/lib/password";
import { isUuid, requiredText } from "@/lib/validation";

const userSchema = z.object({
  name: requiredText(100, "নাম লিখুন।"),
  email: z.string().trim().toLowerCase().email("সঠিক ইমেইল দিন।"),
  role: z.enum(ADMIN_ROLES),
  password: z.string().min(PASSWORD_MIN_LENGTH, `পাসওয়ার্ড কমপক্ষে ${toBn(PASSWORD_MIN_LENGTH)} অক্ষরের হতে হবে।`).max(200),
});

export async function createAdminAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin("admin");
  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message);
  const d = parsed.data;
  try {
    const [row] = await sql<{ id: string }[]>`insert into admins (name, email, password_hash, role)
      values (${d.name}, ${d.email}, ${await hashPassword(d.password)}, ${d.role}) returning id`;
    await audit(admin.id, "create_admin", "admin", row.id, { role: d.role });
  } catch (err) {
    if (isUniqueViolation(err)) return failure("এই ইমেইল দিয়ে আগেই একটি অ্যাকাউন্ট আছে।");
    throw err;
  }
  revalidatePath("/admin/users");
  return success("নতুন অ্যাডমিন অ্যাকাউন্ট তৈরি হয়েছে। পাসওয়ার্ডটি নিরাপদ মাধ্যমে জানিয়ে দিন এবং প্রথম লগইনের পর পরিবর্তন করতে বলুন।");
}

export async function updateAdminAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin("admin");
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "");
  const active = formData.get("is_active") === "on";
  if (!isUuid(id) || !(ADMIN_ROLES as readonly string[]).includes(role)) return failure("অবৈধ অনুরোধ।");
  if (id === admin.id && (role !== "admin" || !active)) return failure("নিজের অ্যাকাউন্ট নিষ্ক্রিয় বা ভূমিকা কমানো যাবে না।");
  await sql`update admins set role = ${role}, is_active = ${active}, updated_at = now() where id = ${id}`;
  if (!active) await sql`delete from admin_sessions where admin_id = ${id}`;
  await audit(admin.id, "update_admin", "admin", id, { role, active });
  revalidatePath("/admin/users");
  return success("হালনাগাদ করা হয়েছে।");
}
