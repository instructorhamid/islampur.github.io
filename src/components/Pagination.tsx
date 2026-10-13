import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toBn } from "@/lib/bn";

type Params = Record<string, string | number | null | undefined>;

export function buildHref(path: string, params: Params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== "" && !(k === "page" && Number(v) === 1)) sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

function pageWindow(current: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

export function Pagination({ path, params, page, totalPages }: { path: string; params: Params; page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const href = (p: number) => buildHref(path, { ...params, page: p });
  const base = "inline-flex h-11 min-w-11 items-center justify-center rounded-full border px-3 font-display font-semibold transition-colors";
  return (
    <nav aria-label="পৃষ্ঠা নির্বাচন" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={`${base} border-line bg-white hover:bg-green-light`}>
          <ChevronLeft aria-hidden size={18} /> <span>আগের</span>
        </Link>
      ) : (
        <span className={`${base} border-line text-muted opacity-50`} aria-hidden="true">
          <ChevronLeft size={18} /> আগের
        </span>
      )}
      {pageWindow(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-muted" aria-hidden="true">…</span>
        ) : p === page ? (
          <span key={p} aria-current="page" className={`${base} border-green bg-green text-white`}>
            <span className="sr-only">পৃষ্ঠা </span>{toBn(p)}
          </span>
        ) : (
          <Link key={p} href={href(p)} className={`${base} border-line bg-white hover:bg-green-light`}>
            <span className="sr-only">পৃষ্ঠা </span>{toBn(p)}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={href(page + 1)} rel="next" className={`${base} border-line bg-white hover:bg-green-light`}>
          <span>পরের</span> <ChevronRight aria-hidden size={18} />
        </Link>
      ) : (
        <span className={`${base} border-line text-muted opacity-50`} aria-hidden="true">
          পরের <ChevronRight size={18} />
        </span>
      )}
    </nav>
  );
}
