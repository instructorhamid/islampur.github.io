import { Handshake, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SponsorCard } from "@/components/SponsorGrid";
import { EmptyState, PageHero } from "@/components/ui";
import { toBn } from "@/lib/bn";
import { getSettings } from "@/lib/queries/settings";
import { getPublishedSponsors, type Sponsor } from "@/lib/queries/sponsors";

export const metadata: Metadata = {
  title: "স্পনসর ও পৃষ্ঠপোষক",
  description: "ইসলামপুর উচ্চ বিদ্যালয় প্রাক্তন শিক্ষার্থী পুনর্মিলনীর পৃষ্ঠপোষক ও সহযোগী প্রতিষ্ঠান।",
  alternates: { canonical: "/sponsors" },
};

export default async function SponsorsPage() {
  const [sponsors, settings] = await Promise.all([getPublishedSponsors(), getSettings()]);

  // Group by tier, preserving the tier order returned by the query.
  const groups: { name: string; items: Sponsor[] }[] = [];
  for (const s of sponsors) {
    const name = s.tier_name ?? "অন্যান্য সহযোগী";
    let group = groups.find((g) => g.name === name);
    if (!group) groups.push((group = { name, items: [] }));
    group.items.push(s);
  }

  return (
    <>
      <PageHero
        eyebrow="পৃষ্ঠপোষক"
        title="স্পনসর ও পৃষ্ঠপোষক"
        description="যাঁদের আন্তরিক সহযোগিতায় প্রিয় বিদ্যালয়ের এই মিলনমেলা সম্ভব হচ্ছে, তাঁদের প্রতি আমাদের কৃতজ্ঞতা।"
      />
      <div className="container-page py-10 sm:py-14">
        {groups.length > 0 ? (
          <div className="space-y-12">
            {groups.map((group, gi) => (
              <section key={group.name} aria-labelledby={`tier-${gi}`}>
                <div className="flex items-center gap-3">
                  <h2 id={`tier-${gi}`} className="text-2xl font-bold">{group.name}</h2>
                  <span className="h-px flex-1 bg-line" aria-hidden="true" />
                </div>
                <ul className={`mt-6 grid gap-4 ${gi === 0 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                  {group.items.map((s) => (
                    <li key={s.id}>
                      <SponsorCard sponsor={s} featured={gi === 0} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Handshake aria-hidden size={28} />}
            title="পৃষ্ঠপোষকদের তালিকা শীঘ্রই প্রকাশ করা হবে"
            description="এখনো কোনো পৃষ্ঠপোষক যুক্ত করা হয়নি। আপনি বা আপনার প্রতিষ্ঠান এই আয়োজনের পাশে থাকতে চাইলে নিচের তথ্য দেখুন।"
          />
        )}

        <section id="become-sponsor" aria-labelledby="become-title" className="mt-14 scroll-mt-24 overflow-hidden rounded-[2rem] bg-green-deep text-white">
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <h2 id="become-title" className="text-2xl font-bold text-white sm:text-3xl">পৃষ্ঠপোষক হিসেবে পাশে থাকুন</h2>
              <p className="mt-3 text-lg leading-8 text-white/85">
                প্রাক্তন শিক্ষার্থী, শুভানুধ্যায়ী বা যেকোনো প্রতিষ্ঠান পুনর্মিলনীর পৃষ্ঠপোষক হতে পারেন। পৃষ্ঠপোষকতার ধরন ও সুবিধা সম্পর্কে জানতে আয়োজক কমিটির সঙ্গে যোগাযোগ করুন।
              </p>
              <p className="mt-3 text-sm text-white/70">পৃষ্ঠপোষকতার শ্রেণি (প্রধান, স্বর্ণ, রৌপ্য, সহযোগী) আয়োজক কমিটি নির্ধারণ করবে।</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15">
              {settings.contact_phone || settings.contact_email ? (
                <ul className="space-y-3">
                  {settings.contact_phone && (
                    <li>
                      <a href={`tel:${settings.contact_phone.replace(/[^\d+]/g, "")}`} className="btn btn-light w-full">
                        <Phone aria-hidden size={18} /> {toBn(settings.contact_phone)}
                      </a>
                    </li>
                  )}
                  {settings.contact_email && (
                    <li>
                      <a href={`mailto:${settings.contact_email}?subject=${encodeURIComponent("পুনর্মিলনী পৃষ্ঠপোষকতা")}`} className="btn w-full border-white/60 text-white hover:bg-white/10">
                        <Mail aria-hidden size={18} /> ইমেইল করুন
                      </a>
                    </li>
                  )}
                </ul>
              ) : (
                <>
                  <p className="text-white/85">আয়োজক কমিটির যোগাযোগের তথ্য শীঘ্রই প্রকাশ করা হবে।</p>
                  <Link href="/event" className="btn btn-light mt-4 w-full">অনুষ্ঠানের তথ্য দেখুন</Link>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
