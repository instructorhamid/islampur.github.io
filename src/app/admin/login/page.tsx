import { Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { BrandMark } from "@/components/BrandMark";
import { school } from "@/config/site";
import { getCurrentAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { loginAction } from "../_actions/auth";

export const metadata: Metadata = { title: "আয়োজকদের প্রবেশ", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");
  const [{ count: adminCount }] = await sql<{ count: number }[]>`select count(*)::int as count from admins`;
  return (
    <main className="grid min-h-dvh place-items-center bg-green-light px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <BrandMark size={48} />
          <div>
            <p className="font-display text-lg font-bold text-green-deep">{school.nameBn}</p>
            <p className="text-sm text-muted">পুনর্মিলনী অ্যাডমিন প্যানেল</p>
          </div>
        </div>
        <div className="card p-6 sm:p-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Lock aria-hidden size={22} className="text-green" /> আয়োজকদের প্রবেশ</h1>
          <p className="mt-1 text-sm text-muted">শুধু অনুমোদিত আয়োজকদের জন্য।</p>
          {adminCount === 0 && (
            <p className="mt-4 rounded-lg bg-amber-bg px-3 py-2 text-sm text-amber-ink">
              এখনো কোনো অ্যাডমিন অ্যাকাউন্ট নেই।{" "}
              <Link href="/admin/setup" className="font-semibold underline">প্রথম অ্যাডমিন তৈরি করুন</Link>
            </p>
          )}
          <ActionForm action={loginAction} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="field-label">ইমেইল</label>
              <input id="email" name="email" type="email" autoComplete="username" required className="input" />
            </div>
            <div>
              <label htmlFor="password" className="field-label">পাসওয়ার্ড</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
            </div>
            <SubmitButton className="btn btn-primary w-full" pendingLabel="যাচাই করা হচ্ছে…">প্রবেশ করুন</SubmitButton>
          </ActionForm>
        </div>
        <p className="mt-6 text-center text-sm"><Link href="/" className="text-green hover:underline">← মূল ওয়েবসাইটে ফিরে যান</Link></p>
      </div>
    </main>
  );
}
