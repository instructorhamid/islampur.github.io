"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-page py-16">
      <div className="card mx-auto flex max-w-xl flex-col items-center px-6 py-12 text-center" role="alert">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-red-bg text-red-ink">
          <TriangleAlert aria-hidden size={28} />
        </span>
        <h1 className="mt-4 text-2xl font-bold">তথ্য লোড করা যায়নি</h1>
        <p className="mt-2 text-muted">সাময়িক একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="btn btn-primary">
            <RefreshCw aria-hidden size={18} /> আবার চেষ্টা করুন
          </button>
          <Link href="/" className="btn btn-outline">হোমে ফিরে যান</Link>
        </div>
      </div>
    </div>
  );
}
