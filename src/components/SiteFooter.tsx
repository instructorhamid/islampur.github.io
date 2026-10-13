import { Facebook, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { mainNav, school } from "@/config/site";
import { toBn } from "@/lib/bn";
import type { SiteSettings } from "@/lib/queries/settings";
import { BrandMark } from "./BrandMark";
import { Hills } from "./Hills";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const hasContact = settings.contact_phone || settings.contact_email || settings.contact_address;
  return (
    <footer className="relative mt-auto bg-green-darker text-white/85">
      <Hills className="absolute inset-x-0 -top-px h-10 w-full -translate-y-full text-green-darker sm:h-14" variant="footer" />
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <BrandMark size={48} inverted />
            <div>
              <p className="font-display text-xl font-bold text-white">{school.nameBn}</p>
              <p className="text-sm text-white/70">{school.locationBn}</p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-[0.95rem] leading-7 text-white/75">
            প্রাক্তন শিক্ষার্থী পুনর্মিলনী — স্মৃতি, বন্ধুত্ব আর প্রিয় বিদ্যালয়ের প্রতি ভালোবাসার মিলনমেলা।
          </p>
          <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/70">
            <div className="flex gap-1.5"><dt>বিদ্যালয় কোড:</dt><dd className="font-semibold text-white">{toBn(school.schoolCode)}</dd></div>
            <div className="flex gap-1.5"><dt>EIIN:</dt><dd className="font-semibold text-white">{toBn(school.eiin)}</dd></div>
          </dl>
        </div>

        <nav aria-label="ফুটার নেভিগেশন">
          <h2 className="font-display text-base font-semibold text-white">দ্রুত লিংক</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[0.95rem] lg:grid-cols-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white hover:underline underline-offset-4">{item.label}</Link>
              </li>
            ))}
            <li><Link href="/privacy" className="hover:text-white hover:underline underline-offset-4">গোপনীয়তা নীতি</Link></li>
          </ul>
        </nav>

        <div id="contact">
          <h2 className="font-display text-base font-semibold text-white">যোগাযোগ</h2>
          {hasContact ? (
            <ul className="mt-4 space-y-3 text-[0.95rem]">
              {settings.contact_phone && (
                <li className="flex items-start gap-2.5">
                  <Phone aria-hidden size={18} className="mt-1 shrink-0 text-white/60" />
                  <a href={`tel:${settings.contact_phone.replace(/[^\d+]/g, "")}`} className="hover:text-white">{toBn(settings.contact_phone)}</a>
                </li>
              )}
              {settings.contact_email && (
                <li className="flex items-start gap-2.5">
                  <Mail aria-hidden size={18} className="mt-1 shrink-0 text-white/60" />
                  <a href={`mailto:${settings.contact_email}`} className="break-all hover:text-white">{settings.contact_email}</a>
                </li>
              )}
              {settings.contact_address && (
                <li className="flex items-start gap-2.5">
                  <MapPin aria-hidden size={18} className="mt-1 shrink-0 text-white/60" />
                  <span>{settings.contact_address}</span>
                </li>
              )}
            </ul>
          ) : (
            <p className="mt-4 text-[0.95rem] text-white/70">আয়োজক কমিটির যোগাযোগের তথ্য শীঘ্রই প্রকাশ করা হবে।</p>
          )}
          {settings.facebook_url && (
            <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-[0.95rem] hover:text-white">
              <Facebook aria-hidden size={18} /> ফেসবুক পেজ
            </a>
          )}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {toBn(new Date().getFullYear())} {school.nameBn} প্রাক্তন শিক্ষার্থী পুনর্মিলনী আয়োজক কমিটি</p>
          <Link href="/admin" className="hover:text-white">আয়োজকদের প্রবেশ</Link>
        </div>
      </div>
    </footer>
  );
}
