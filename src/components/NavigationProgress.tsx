"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "./BrandMark";

/** Navigations faster than this show only the top line, so quick page changes don't flash the overlay. */
const OVERLAY_DELAY_MS = 350;

/**
 * Page-change feedback for the whole site and the admin panel: a thin progress line at the top of
 * the window and, if the page takes a moment, the school mark spinning in the centre.
 *
 * The App Router has no navigation events, so it starts on clicks on internal links, GET form
 * submissions (directory filters) and back/forward, and finishes when the URL changes (Next.js
 * changes it once the new page is ready). Route `loading.tsx` files are deliberately not used:
 * they make missing pages answer 200 instead of 404 and kept admin Server Actions from finishing.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [progress, setProgress] = useState<number | null>(null);
  const [overlay, setOverlay] = useState(false);
  const active = useRef(false);
  const finishRef = useRef(() => {});

  useEffect(() => {
    let trickle: ReturnType<typeof setInterval> | undefined;
    let hide: ReturnType<typeof setTimeout> | undefined;
    let showOverlay: ReturnType<typeof setTimeout> | undefined;
    let safety: ReturnType<typeof setTimeout> | undefined;
    const clear = () => {
      clearInterval(trickle);
      clearTimeout(hide);
      clearTimeout(showOverlay);
      clearTimeout(safety);
    };
    const finish = () => {
      if (!active.current) return;
      active.current = false;
      clear();
      setOverlay(false);
      setProgress(1);
      hide = setTimeout(() => setProgress(null), 400);
    };
    const start = () => {
      clear();
      active.current = true;
      setProgress(0.08);
      // Ease towards 90% and wait there for the page.
      trickle = setInterval(() => setProgress((p) => (p === null || p >= 1 ? p : p + (0.9 - p) * 0.06)), 200);
      showOverlay = setTimeout(() => setOverlay(true), OVERLAY_DELAY_MS);
      // A click that never changes the URL (e.g. a redirect back to the same page) must not leave it behind.
      safety = setTimeout(finish, 20000);
    };
    finishRef.current = finish;

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href || a.hasAttribute("download") || (a.target && a.target !== "_self")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname.startsWith("/admin/export")) return; // file downloads
      if (url.pathname === location.pathname && url.search === location.search) return; // same page or #anchor
      start();
    };
    const onSubmit = (e: SubmitEvent) => {
      // Server-action forms (POST) show their own pending state on the submit button.
      if ((e.target as HTMLFormElement).method.toLowerCase() === "get") start();
    };
    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    window.addEventListener("popstate", start);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit);
      window.removeEventListener("popstate", start);
      clear();
    };
  }, []);

  useEffect(() => {
    finishRef.current();
  }, [pathname, search]);

  return (
    <>
      {progress !== null && (
        <div className="nav-progress" data-done={progress >= 1 || undefined} aria-hidden="true">
          <div className="nav-progress-bar" style={{ transform: `scaleX(${progress})` }} />
        </div>
      )}
      {overlay && (
        <div className="page-loader" role="status" aria-live="polite">
          <div className="flex flex-col items-center gap-5">
            <div className="relative grid h-24 w-24 place-items-center">
              <span className="page-loader-ring absolute inset-0 rounded-full" aria-hidden="true" />
              <span className="page-loader-mark">
                <BrandMark size={56} />
              </span>
            </div>
            <p className="font-display text-base font-medium text-green-deep">
              লোড হচ্ছে
              <span className="page-loader-dots" aria-hidden="true">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
