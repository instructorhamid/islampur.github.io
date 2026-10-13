"use client";

import { CalendarCog, Handshake, LayoutDashboard, Layers, Megaphone, Settings, ShieldCheck, UserCog, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "ড্যাশবোর্ড", icon: LayoutDashboard, adminOnly: false },
  { href: "/admin/registrations", label: "নিবন্ধন", icon: Users, adminOnly: false },
  { href: "/admin/batches", label: "ব্যাচ", icon: Layers, adminOnly: false },
  { href: "/admin/event", label: "অনুষ্ঠান ও সময়সূচি", icon: CalendarCog, adminOnly: false },
  { href: "/admin/content", label: "ঘোষণা ও প্রশ্নোত্তর", icon: Megaphone, adminOnly: false },
  { href: "/admin/sponsors", label: "স্পনসর", icon: Handshake, adminOnly: false },
  { href: "/admin/settings", label: "সেটিংস ও গোপনীয়তা", icon: Settings, adminOnly: true },
  { href: "/admin/users", label: "অ্যাডমিন ব্যবহারকারী", icon: ShieldCheck, adminOnly: true },
  { href: "/admin/account", label: "আমার অ্যাকাউন্ট", icon: UserCog, adminOnly: false },
];

export function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="অ্যাডমিন নেভিগেশন">
      <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {ITEMS.filter((i) => isAdmin || !i.adminOnly).map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 text-[0.95rem] font-medium transition-colors ${
                  active ? "bg-green text-white" : "text-ink hover:bg-green-light"
                }`}
              >
                <Icon aria-hidden size={18} /> {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
