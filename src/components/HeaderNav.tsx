"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { mainNav } from "@/config/site";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <nav aria-label="প্রধান নেভিগেশন" className="hidden xl:block">
        <ul className="flex items-center gap-0.5">
          {mainNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-3 py-2 font-display text-[0.95rem] font-medium transition-colors ${
                    active ? "bg-green-light text-green-deep" : "text-ink hover:bg-green-light/70 hover:text-green-deep"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex items-center gap-2">
        <Link href="/register" className="btn btn-primary btn-sm hidden sm:inline-flex">
          নিবন্ধন করুন
        </Link>
        <button
          ref={buttonRef}
          type="button"
          className="btn btn-ghost h-11 w-11 !p-0 xl:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X aria-hidden size={24} /> : <Menu aria-hidden size={24} />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 top-[4.5rem] z-40 xl:hidden">
          <button
            type="button"
            aria-label="মেনু বন্ধ করুন"
            tabIndex={-1}
            className="absolute inset-0 bg-ink/30"
            onClick={() => setOpen(false)}
          />
          <div
            id="mobile-menu"
            ref={panelRef}
            className="relative max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-b border-line bg-white px-4 pb-6 pt-2 shadow-lg"
          >
            <nav aria-label="মোবাইল নেভিগেশন">
              <ul className="divide-y divide-line">
                {mainNav.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-12 items-center rounded-lg px-3 font-display text-lg ${
                          active ? "font-semibold text-green" : "text-ink"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <Link href="/register" onClick={() => setOpen(false)} className="btn btn-primary mt-4 w-full">
              পুনর্মিলনীতে নিবন্ধন করুন
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
