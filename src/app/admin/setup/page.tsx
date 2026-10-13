import { KeyRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { BrandMark } from "@/components/BrandMark";
import { school } from "@/config/site";
import { toBn } from "@/lib/bn";
import { sql } from "@/lib/db";
import { PASSWORD_MIN_LENGTH } from "@/lib/password";
import { setupToken } from "@/lib/setup";
import { firstAdminAction } from "../_actions/setup";

export const metadata: Metadata = { title: "প্রথম অ্যাডমিন তৈরি", robots: { index: false, follow: false } };

export default async function SetupPage() {
  const [{ count }] = await sql<{ count: number }[]>`select count(*)::int as count from admins`;
  const token = setupToken();

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
          <h1 className="flex items-center gap-2 text-2xl font-bold"><KeyRound aria-hidden size={22} className="text-green" /> প্রথম অ্যাডমিন তৈরি</h1>
          {count > 0 ? (
            <>
              <p className="mt-3 text-muted">সেটআপ আগেই সম্পন্ন হয়েছে। নতুন অ্যাডমিন যুক্ত করতে প্রবেশ করে &quot;অ্যাডমিন ব্যবহারকারী&quot; পাতা ব্যবহার করুন।</p>
              <Link href="/admin/login" className="btn btn-primary mt-6 w-full">লগইন পাতায় যান</Link>
            </>
          ) : !token ? (
            <div className="mt-3 space-y-3 text-[0.95rem] leading-7 text-muted">
              <p>নিরাপত্তার জন্য প্রথম অ্যাডমিন তৈরি করতে একটি গোপন সেটআপ কোড প্রয়োজন।</p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>Vercel → Project → Settings → Environment Variables-এ <code className="rounded bg-green-light px-1">SETUP_TOKEN</code> নামে কমপক্ষে ১৬ অক্ষরের একটি গোপন মান যোগ করুন।</li>
                <li>Deployments থেকে আবার ডিপ্লয় (Redeploy) করুন।</li>
                <li>এই পাতাটি আবার খুলুন।</li>
              </ol>
            </div>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">এই পাতা শুধু একবার ব্যবহার করা যায়। প্রথম অ্যাডমিন তৈরি হলে এটি বন্ধ হয়ে যাবে।</p>
              <ActionForm action={firstAdminAction} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="token" className="field-label">সেটআপ কোড (SETUP_TOKEN)</label>
                  <input id="token" name="token" type="password" required autoComplete="off" className="input" />
                </div>
                <div>
                  <label htmlFor="name" className="field-label">আপনার নাম</label>
                  <input id="name" name="name" required maxLength={100} autoComplete="name" className="input" />
                </div>
                <div>
                  <label htmlFor="email" className="field-label">ইমেইল</label>
                  <input id="email" name="email" type="email" required autoComplete="username" className="input" />
                </div>
                <div>
                  <label htmlFor="password" className="field-label">পাসওয়ার্ড</label>
                  <input id="password" name="password" type="password" required minLength={PASSWORD_MIN_LENGTH} autoComplete="new-password" className="input" />
                  <p className="field-hint">কমপক্ষে {toBn(PASSWORD_MIN_LENGTH)} অক্ষর।</p>
                </div>
                <div>
                  <label htmlFor="confirm" className="field-label">পাসওয়ার্ড আবার লিখুন</label>
                  <input id="confirm" name="confirm" type="password" required autoComplete="new-password" className="input" />
                </div>
                <SubmitButton className="btn btn-primary w-full" pendingLabel="তৈরি হচ্ছে…">অ্যাডমিন তৈরি করুন</SubmitButton>
              </ActionForm>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
