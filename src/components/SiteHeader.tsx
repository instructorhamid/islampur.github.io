import Link from "next/link";
import { school } from "@/config/site";
import { BrandMark } from "./BrandMark";
import { HeaderNav } from "./HeaderNav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-green focus:px-4 focus:py-2 focus:text-white"
      >
        মূল বিষয়বস্তুতে যান
      </a>
      <div className="container-page flex h-[4.5rem] items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label={`${school.nameBn} পুনর্মিলনী — হোম`}>
          <BrandMark size={44} />
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-[1.05rem] font-bold text-green-deep sm:text-lg">
              {school.nameBn}
            </span>
            <span className="block truncate text-xs text-muted sm:text-[0.8rem]">প্রাক্তন শিক্ষার্থী পুনর্মিলনী · {school.locationBn.split(",")[0]}</span>
          </span>
        </Link>
        <HeaderNav />
      </div>
    </header>
  );
}
