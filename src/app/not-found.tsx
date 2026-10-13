import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-green-light px-4 py-16">
      <div className="card max-w-lg p-8 text-center sm:p-12">
        <div className="flex justify-center"><BrandMark size={56} /></div>
        <p className="mt-6 font-display text-6xl font-bold text-green">৪০৪</p>
        <h1 className="mt-2 text-2xl font-bold">পাতাটি খুঁজে পাওয়া যায়নি</h1>
        <p className="mt-2 text-muted">আপনি যে পাতাটি খুঁজছেন সেটি সরানো হয়েছে অথবা ঠিকানাটি সঠিক নয়।</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="btn btn-primary">হোমে ফিরে যান</Link>
          <Link href="/alumni" className="btn btn-outline">প্রাক্তন শিক্ষার্থী</Link>
        </div>
      </div>
    </main>
  );
}
