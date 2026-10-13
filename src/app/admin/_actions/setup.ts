"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { failure, type ActionState } from "@/lib/action-state";
import { audit, createSession } from "@/lib/auth";
import { toBn } from "@/lib/bn";
import { sql } from "@/lib/db";
import { hashPassword, PASSWORD_MIN_LENGTH } from "@/lib/password";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { setupToken } from "@/lib/setup";
import { requiredText } from "@/lib/validation";

function sameSecret(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

const schema = z.object({
  token: z.string(),
  name: requiredText(100, "আপনার নাম লিখুন।"),
  email: z.string().trim().toLowerCase().email("সঠিক ইমেইল দিন।"),
  password: z.string().min(PASSWORD_MIN_LENGTH, `পাসওয়ার্ড কমপক্ষে ${toBn(PASSWORD_MIN_LENGTH)} অক্ষরের হতে হবে।`).max(200),
  confirm: z.string(),
});

/** Creates the very first administrator. Refuses once any administrator exists. */
export async function firstAdminAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const expected = setupToken();
  if (!expected) return failure("সেটআপ চালু নেই। Vercel-এ SETUP_TOKEN যোগ করে আবার ডিপ্লয় করুন।");
  if (!(await rateLimit("setup", await clientIp(), 10, 15 * 60))) return failure("অনেকবার চেষ্টা করা হয়েছে। ১৫ মিনিট পর আবার চেষ্টা করুন।");

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message);
  const d = parsed.data;
  if (!sameSecret(d.token.trim(), expected)) return failure("সেটআপ কোডটি সঠিক নয়।");
  if (d.password !== d.confirm) return failure("পাসওয়ার্ড দুটি মেলেনি।");

  const hash = await hashPassword(d.password);
  const created = await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(271301)`; // serialize concurrent setup attempts
    const [row] = await tx<{ id: string }[]>`
      insert into admins (name, email, password_hash, role)
      select ${d.name}, ${d.email}, ${hash}, 'admin'
      where not exists (select 1 from admins)
      returning id`;
    return row ?? null;
  });
  if (!created) return failure("প্রথম অ্যাডমিন আগেই তৈরি করা হয়েছে। লগইন পাতা থেকে প্রবেশ করুন।");

  await audit(created.id, "first_admin_setup", "admin", created.id);
  await createSession(created.id);
  redirect("/admin");
}
