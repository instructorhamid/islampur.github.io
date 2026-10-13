import { CheckCircle2, Clock3 } from "lucide-react";
import Link from "next/link";
import { toBn } from "@/lib/bn";

export function RegistrationSuccess({
  status,
  passingYear,
  headingRef,
}: {
  status: "pending" | "approved";
  passingYear?: number | null;
  headingRef?: React.Ref<HTMLHeadingElement>;
}) {
  const approved = status === "approved";
  return (
    <div className="card overflow-hidden" role="status">
      <div className="bg-green px-6 py-8 text-center text-white sm:px-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/15 ring-4 ring-white/20">
          {approved ? <CheckCircle2 aria-hidden size={34} /> : <Clock3 aria-hidden size={34} />}
        </span>
        <h2 ref={headingRef} tabIndex={-1} className="mt-4 text-2xl font-bold text-white outline-none sm:text-3xl">
          {approved ? "নিবন্ধন সফল হয়েছে!" : "নিবন্ধন জমা হয়েছে!"}
        </h2>
      </div>
      <div className="px-6 py-8 text-center sm:px-10">
        <p className="mx-auto max-w-xl text-lg leading-8">
          {approved
            ? "আপনার নিবন্ধন সফলভাবে গ্রহণ করা হয়েছে। পুনর্মিলনীতে আপনাকে স্বাগতম!"
            : "আপনার নিবন্ধন সফলভাবে গ্রহণ করা হয়েছে এবং আয়োজকদের অনুমোদনের অপেক্ষায় রয়েছে। অনুমোদনের পর আপনার নাম প্রাক্তন শিক্ষার্থী তালিকায় দেখা যাবে। পুনর্মিলনীতে আপনাকে স্বাগতম!"}
        </p>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          অনুষ্ঠানের দিন নিবন্ধন ডেস্কে আপনার মোবাইল নম্বর বললেই চলবে। বন্ধুদেরও নিবন্ধনের কথা জানিয়ে দিন।
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {approved && passingYear ? (
            <Link href={`/batches/${passingYear}`} className="btn btn-primary">
              {toBn(passingYear)} ব্যাচের পাতা দেখুন
            </Link>
          ) : (
            <Link href="/event" className="btn btn-primary">অনুষ্ঠানের তথ্য দেখুন</Link>
          )}
          <Link href="/" className="btn btn-outline">হোমে ফিরে যান</Link>
        </div>
      </div>
    </div>
  );
}
