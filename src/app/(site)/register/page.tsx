import { CalendarClock, CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHero, ProvisionalNotice } from "@/components/ui";
import { formatBnDateTime, toBn } from "@/lib/bn";
import { env } from "@/lib/env";
import { getActiveEvent, registrationClosedReason } from "@/lib/queries/event";
import { getSettings } from "@/lib/queries/settings";
import { RegistrationForm } from "./RegistrationForm";

export const metadata: Metadata = {
  title: "নিবন্ধন",
  description: "ইসলামপুর উচ্চ বিদ্যালয় প্রাক্তন শিক্ষার্থী পুনর্মিলনীতে অনলাইনে নিবন্ধন করুন।",
  alternates: { canonical: "/register" },
};

const FALLBACK_ERRORS: Record<string, string> = {
  origin: "অনুরোধটি গ্রহণ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
  too_large: "ছবির আকার অনেক বড়। ছোট আকারের একটি ছবি দিয়ে আবার চেষ্টা করুন।",
  rate_limited: "অল্প সময়ে অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।",
  closed: "এই মুহূর্তে নিবন্ধন বন্ধ রয়েছে।",
  deadline: "নিবন্ধনের নির্ধারিত সময় শেষ হয়ে গেছে।",
  invalid_form: "ফর্মটি সঠিকভাবে জমা হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
  validation: "কিছু তথ্য সঠিক নয় বা ছবিটি গ্রহণযোগ্য নয়। অনুগ্রহ করে সব ঘর সঠিকভাবে পূরণ করে আবার জমা দিন।",
  duplicate: "এই মোবাইল নম্বর দিয়ে ইতিমধ্যে নিবন্ধন করা হয়েছে। তথ্য সংশোধনের প্রয়োজন হলে আয়োজকদের সঙ্গে যোগাযোগ করুন।",
  server: "দুঃখিত, একটি সমস্যা হয়েছে। আপনার নিবন্ধন সংরক্ষণ করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।",
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, settings, event] = await Promise.all([searchParams, getSettings(), getActiveEvent()]);
  const closed = registrationClosedReason(event, settings.registration_open);
  const maxMb = Math.round(env.maxUploadBytes / 1024 / 1024);

  return (
    <>
      <PageHero
        eyebrow="পুনর্মিলনী নিবন্ধন"
        title="আপনার নিবন্ধন সম্পন্ন করুন"
        description="মাত্র পাঁচটি তথ্য দিয়ে নিবন্ধন করুন। আয়োজকদের অনুমোদনের পর আপনার নাম প্রাক্তন শিক্ষার্থী তালিকা ও নিজের ব্যাচের পাতায় যুক্ত হবে।"
      />
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_22rem] lg:gap-10 lg:py-14">
        <div>
          {closed ? (
            <EmptyState
              icon={<Lock aria-hidden size={28} />}
              title={closed === "deadline" ? "নিবন্ধনের সময় শেষ হয়ে গেছে" : "নিবন্ধন সাময়িকভাবে বন্ধ রয়েছে"}
              description="হালনাগাদ তথ্যের জন্য অনুষ্ঠান পাতার ঘোষণা দেখুন অথবা আয়োজকদের সঙ্গে যোগাযোগ করুন।"
              action={{ href: "/event", label: "অনুষ্ঠানের তথ্য দেখুন" }}
            />
          ) : (
            <RegistrationForm
              minYear={settings.min_passing_year}
              maxYear={settings.max_passing_year}
              maxUploadMb={maxMb}
              requireApproval={settings.require_approval}
              showBloodPublicOption={settings.show_blood_group_publicly}
              fallbackError={error ? (FALLBACK_ERRORS[error] ?? FALLBACK_ERRORS.server) : null}
            />
          )}
        </div>

        <aside className="space-y-4" aria-label="নিবন্ধন সংক্রান্ত তথ্য">
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CheckCircle2 aria-hidden size={20} className="text-green" /> যা যা লাগবে
            </h2>
            <ul className="mt-3 space-y-2 text-[0.95rem] text-muted">
              <li>• পূর্ণ নাম (বাংলা বা ইংরেজিতে)</li>
              <li>• সচল মোবাইল নম্বর</li>
              <li>• রক্তের গ্রুপ</li>
              <li>• এসএসসি পাসের বছর ({toBn(settings.min_passing_year)}–{toBn(settings.max_passing_year)})</li>
              <li>• একটি পরিষ্কার প্রোফাইল ছবি (JPG, PNG বা WebP)</li>
            </ul>
          </div>
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck aria-hidden size={20} className="text-green" /> আপনার তথ্যের সুরক্ষা
            </h2>
            <p className="mt-3 text-[0.95rem] leading-7 text-muted">
              মোবাইল নম্বর কখনোই প্রকাশ করা হয় না। ছবি ও রক্তের গ্রুপ কেবল আপনার সম্মতিতে প্রকাশ পাবে।{" "}
              <Link href="/privacy" className="font-semibold text-green underline underline-offset-4">গোপনীয়তা নীতি পড়ুন</Link>
            </p>
          </div>
          {event?.registration_deadline && (
            <div className="card p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <CalendarClock aria-hidden size={20} className="text-green" /> নিবন্ধনের শেষ সময়
              </h2>
              <p className="mt-2 font-display font-semibold">{formatBnDateTime(event.registration_deadline)}</p>
            </div>
          )}
          {event?.is_provisional && <ProvisionalNotice compact />}
        </aside>
      </div>
    </>
  );
}
