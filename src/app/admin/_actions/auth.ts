"use server";

import { redirect } from "next/navigation";
import { failure, success, type ActionState } from "@/lib/action-state";
import { audit, createSession, destroySession, requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { toBn } from "@/lib/bn";
import { hashPassword, PASSWORD_MIN_LENGTH, verifyPassword } from "@/lib/password";
import { clientIp, isRateLimited, recordAttempt } from "@/lib/rate-limit";

// A real hash so that unknown emails take as long to check as known ones (timing-safe).
const DUMMY_HASH = "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(formData.get("password") ?? "").slice(0, 200);
  if (!email || !password) return failure("ইমেইল ও পাসওয়ার্ড দুটোই লিখুন।");

  // Only failed attempts count: 20 per IP and 8 per account in 15 minutes.
  const ip = await clientIp();
  const WINDOW = 15 * 60;
  if ((await isRateLimited("login-fail-ip", ip, 20, WINDOW)) || (await isRateLimited("login-fail-email", email, 8, WINDOW))) {
    return failure("অনেকবার ভুল চেষ্টা করা হয়েছে। ১৫ মিনিট পর আবার চেষ্টা করুন।");
  }

  const [admin] = await sql<{ id: string; password_hash: string; is_active: boolean }[]>`
    select id, password_hash, is_active from admins where lower(email) = ${email}`;
  const valid = await verifyPassword(password, admin?.password_hash ?? DUMMY_HASH);
  if (!admin || !valid || !admin.is_active) {
    await recordAttempt("login-fail-ip", ip, WINDOW);
    await recordAttempt("login-fail-email", email, WINDOW);
    return failure("ইমেইল বা পাসওয়ার্ড সঠিক নয়।");
  }

  await createSession(admin.id);
  await audit(admin.id, "login", "admin", admin.id);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const current = String(formData.get("current_password") ?? "");
  const next = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");
  if (next.length < PASSWORD_MIN_LENGTH) return failure(`নতুন পাসওয়ার্ড কমপক্ষে ${toBn(PASSWORD_MIN_LENGTH)} অক্ষরের হতে হবে।`);
  if (next !== confirm) return failure("নতুন পাসওয়ার্ড দুটি মেলেনি।");
  const [row] = await sql<{ password_hash: string }[]>`select password_hash from admins where id = ${admin.id}`;
  if (!row || !(await verifyPassword(current, row.password_hash))) return failure("বর্তমান পাসওয়ার্ড সঠিক নয়।");
  await sql`update admins set password_hash = ${await hashPassword(next)}, updated_at = now() where id = ${admin.id}`;
  await audit(admin.id, "change_password", "admin", admin.id);
  return success("পাসওয়ার্ড পরিবর্তন করা হয়েছে।");
}
