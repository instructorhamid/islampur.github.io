import { ExternalLink, LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { BrandMark } from "@/components/BrandMark";
import { ADMIN_ROLE_LABELS } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "../_actions/auth";

export const metadata: Metadata = {
  title: { default: "অ্যাডমিন প্যানেল", template: "%s | অ্যাডমিন প্যানেল" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-dvh bg-[#f5f9f6]">
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-3 px-4">
          <Link href="/admin" className="flex items-center gap-2.5">
            <BrandMark size={36} />
            <span className="font-display font-bold text-green-deep">অ্যাডমিন প্যানেল</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-right text-sm leading-tight sm:block">
              <span className="block font-semibold">{admin.name}</span>
              <span className="block text-muted">{ADMIN_ROLE_LABELS[admin.role]}</span>
            </span>
            <Link href="/" target="_blank" className="btn btn-ghost btn-sm" aria-label="ওয়েবসাইট দেখুন (নতুন ট্যাবে)">
              <ExternalLink aria-hidden size={16} /> <span className="hidden md:inline">ওয়েবসাইট</span>
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-outline btn-sm"><LogOut aria-hidden size={16} /> বের হোন</button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[90rem] grid-cols-[minmax(0,1fr)] gap-6 px-4 py-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="min-w-0 lg:sticky lg:top-22 lg:self-start">
          <AdminNav isAdmin={admin.role === "admin"} />
        </aside>
        <main id="main" className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
