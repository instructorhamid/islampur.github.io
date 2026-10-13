import { ArrowRight, Award, Camera, CalendarDays, GraduationCap, Heart, Layers, MapPin, Music, Sprout, Users, UtensilsCrossed } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AlumniGrid } from "@/components/AlumniCard";
import { Countdown } from "@/components/Countdown";
import { AnnouncementList, EventFacts, eventDateLabel, FaqList, ScheduleTimeline } from "@/components/EventBits";
import { HeroLandscape, Hills } from "@/components/Hills";
import { Reveal } from "@/components/Reveal";
import { SponsorCard } from "@/components/SponsorGrid";
import { EmptyState, ProvisionalNotice, SectionHeading } from "@/components/ui";
import { aboutCopy, heroCopy, highlights, school, site } from "@/config/site";
import { formatBnNumber, toBn } from "@/lib/bn";
import { getPublicStats, listAlumni, listBatches } from "@/lib/queries/alumni";
import { getActiveEvent, getPublishedAnnouncements, getPublishedFaqs, getSchedule } from "@/lib/queries/event";
import { getPublishedSponsors } from "@/lib/queries/sponsors";

export const metadata: Metadata = {
  title: { absolute: site.name },
  alternates: { canonical: "/" },
};

const HIGHLIGHT_ICONS = { users: Users, award: Award, music: Music, camera: Camera, utensils: UtensilsCrossed, heart: Heart } as const;

export default async function HomePage() {
  const event = await getActiveEvent();
  const [schedule, stats, batches, recent, sponsors, faqs, announcements] = await Promise.all([
    event ? getSchedule(event.id) : Promise.resolve([]),
    getPublicStats(),
    listBatches({ sort: "count" }),
    listAlumni({ sort: "recent", pageSize: 6 }),
    getPublishedSponsors(),
    getPublishedFaqs(),
    getPublishedAnnouncements(3),
  ]);
  const provisional = event?.is_provisional ?? true;
  const futureDate = event?.event_date ? event.event_date.toISOString() : null;

  return (
    <>
      {/* ------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-light via-white to-white">
        <div className="bg-dots absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
        <div className="container-page relative grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-green-soft bg-white/80 px-3 py-1 text-sm font-medium text-green-deep shadow-sm">
              <GraduationCap aria-hidden size={16} />
              {school.nameBn} · {school.locationBn.split(",").slice(0, 2).join(",")}
            </p>
            <h1 className="mt-5 text-[2.35rem] font-bold leading-[1.25] text-green-darker sm:text-5xl lg:text-[3.6rem]">
              {heroCopy.headline}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted">{heroCopy.text}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="btn btn-primary !min-h-[3.25rem] px-7 text-[1.05rem]">
                {heroCopy.primaryCta} <ArrowRight aria-hidden size={18} />
              </Link>
              <Link href="/alumni" className="btn btn-outline !min-h-[3.25rem] px-7 text-[1.05rem]">
                {heroCopy.secondaryCta}
              </Link>
            </div>
            <ul className="mt-7 flex flex-col gap-2 text-[0.98rem] sm:flex-row sm:flex-wrap sm:gap-x-6">
              <li className="flex items-center gap-2">
                <CalendarDays aria-hidden size={18} className="text-green" />
                <span className="font-semibold">{eventDateLabel(event)}</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin aria-hidden size={18} className="text-green" />
                <span className="font-semibold">{event?.venue_name ?? "ভেন্যু শীঘ্রই ঘোষণা করা হবে"}</span>
              </li>
            </ul>
            {futureDate && (
              <div className="mt-6 max-w-md">
                <p className="mb-2 text-sm font-medium text-muted">পুনর্মিলনী শুরু হতে বাকি</p>
                <Countdown target={futureDate} />
              </div>
            )}
            {provisional && <ProvisionalNotice compact className="mt-6 max-w-xl" />}
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-green-soft/50 blur-2xl" aria-hidden="true" />
            {school.heroImage ? (
              <Image
                src={school.heroImage.src}
                alt={school.heroImage.alt}
                width={1200}
                height={920}
                priority
                className="aspect-[600/460] w-full rounded-[2.25rem] object-cover shadow-[var(--shadow-lg)]"
              />
            ) : (
              <HeroLandscape className="w-full drop-shadow-[0_24px_40px_rgba(11,93,54,0.18)]" />
            )}
            <div className="absolute -bottom-5 left-4 right-4 flex items-center gap-3 rounded-2xl border border-line bg-white/95 p-3 shadow-[var(--shadow)] sm:left-8 sm:right-auto sm:p-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-green text-white">
                <Users aria-hidden size={22} />
              </span>
              <div>
                <p className="font-display text-lg font-bold leading-tight">
                  {stats.alumni > 0 ? `${formatBnNumber(stats.alumni)} জন প্রাক্তন শিক্ষার্থী` : "প্রথম নিবন্ধনকারী হোন"}
                </p>
                <p className="text-sm text-muted">
                  {stats.alumni > 0 ? `${formatBnNumber(stats.batches)}টি ব্যাচ থেকে যুক্ত হয়েছেন${stats.demo > 0 ? " (নমুনা তথ্যসহ)" : ""}` : "আপনার ব্যাচকে এগিয়ে রাখুন"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ About */}
      <section id="about" aria-labelledby="about-title" className="container-page scroll-mt-24 py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <Reveal>
            <SectionHeading id="about-title" eyebrow="আমাদের গল্প" title={aboutCopy.title} />
            <div className="prose-bn mt-5 text-[1.05rem] leading-8 text-muted">
              {aboutCopy.paragraphs.map((p) => (
                <p key={p.slice(0, 20)}>{p}</p>
              ))}
            </div>
            {event?.event_description && (
              <p className="mt-5 rounded-xl border-l-4 border-green bg-green-light/60 px-4 py-3 leading-8">{event.event_description}</p>
            )}
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {aboutCopy.pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 80}>
                <div className="card card-hover flex h-full gap-4 p-5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-green-light font-display text-xl font-bold text-green">
                    {toBn(i + 1)}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{p.title}</h3>
                    <p className="mt-1 text-muted">{p.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Highlights */}
      <section aria-labelledby="highlights-title" className="bg-green-light/60 py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            id="highlights-title"
            align="center"
            eyebrow="যা থাকছে"
            title="পুনর্মিলনীর বিশেষ আয়োজন"
            description={provisional ? "পরিকল্পিত আয়োজনসমূহ — চূড়ান্ত সূচি আয়োজক কমিটি ঘোষণা করবে।" : "সারাদিনের আয়োজনে যা যা থাকছে।"}
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((h, i) => {
              const Icon = HIGHLIGHT_ICONS[h.icon];
              return (
                <li key={h.title}>
                  <Reveal delay={(i % 3) * 80} className="h-full">
                    <div className="card card-hover h-full p-6">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-green text-white shadow-sm">
                        <Icon aria-hidden size={24} />
                      </span>
                      <h3 className="mt-4 text-xl font-semibold">{h.title}</h3>
                      <p className="mt-2 text-muted">{h.text}</p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* --------------------------------------------------- Event overview */}
      <section aria-labelledby="schedule-title" className="container-page py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.35fr] lg:gap-14">
          <div>
            <SectionHeading
              id="schedule-title"
              eyebrow="অনুষ্ঠানসূচি"
              title="পুনর্মিলনীর দিনটি এক নজরে"
              description="সকাল থেকে বিকেল পর্যন্ত স্মৃতি, আড্ডা আর আনন্দে ভরা একটি দিন।"
            />
            <div className="mt-6">
              <EventFacts event={event} layout="stack" />
            </div>
            {provisional && <ProvisionalNotice compact className="mt-4" />}
            <Link href="/event" className="btn btn-outline mt-6">
              বিস্তারিত অনুষ্ঠান তথ্য <ArrowRight aria-hidden size={18} />
            </Link>
          </div>
          <ScheduleTimeline items={schedule} />
        </div>
      </section>

      {/* ------------------------------------------------- Registration CTA */}
      <section aria-labelledby="cta-title" className="relative overflow-hidden bg-green-deep text-white">
        <Hills variant="divider" className="absolute inset-x-0 bottom-0 h-16 w-full text-green-darker/60" />
        <div className="container-page relative flex flex-col items-start gap-6 py-14 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 id="cta-title" className="text-2xl font-bold text-white sm:text-3xl">আপনার ব্যাচের বন্ধুরা অপেক্ষায়!</h2>
            <p className="mt-3 text-lg leading-8 text-white/85">
              মাত্র পাঁচটি তথ্য দিয়ে দুই মিনিটে নিবন্ধন করুন। অনুমোদনের পর আপনার নাম ব্যাচ ডিরেক্টরিতে যুক্ত হবে।
            </p>
          </div>
          <Link href="/register" className="btn btn-light !min-h-[3.25rem] px-7 text-[1.05rem]">
            এখনই নিবন্ধন করুন <ArrowRight aria-hidden size={18} />
          </Link>
        </div>
      </section>

      {/* ----------------------------------------------------------- Stats */}
      <section aria-labelledby="stats-title" className="container-page py-16 sm:py-20">
        <SectionHeading id="stats-title" align="center" eyebrow="নিবন্ধনের হালচাল" title="প্রাক্তন শিক্ষার্থীদের সাড়া" />
        {stats.alumni === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="এখনো কোনো প্রকাশিত নিবন্ধন নেই"
              description="নিবন্ধন অনুমোদিত হলে এখানে প্রকৃত পরিসংখ্যান দেখা যাবে।"
              action={{ href: "/register", label: "প্রথম নিবন্ধনকারী হোন" }}
            />
          </div>
        ) : (
          <>
            <dl className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {[
                { label: "প্রকাশিত প্রাক্তন শিক্ষার্থী", value: formatBnNumber(stats.alumni), icon: Users },
                { label: "ব্যাচ", value: formatBnNumber(stats.batches), icon: Layers },
                { label: "সবচেয়ে পুরোনো ব্যাচ", value: stats.earliest ? toBn(stats.earliest) : "—", icon: Sprout },
                { label: "সর্বশেষ ব্যাচ", value: stats.latest ? toBn(stats.latest) : "—", icon: GraduationCap },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="card flex flex-col items-center p-5 text-center sm:p-6">
                  <Icon aria-hidden size={26} className="order-0 text-green" />
                  <dt className="order-2 mt-1 text-sm text-muted sm:text-base">{label}</dt>
                  <dd className="order-1 mt-2 font-display text-3xl font-bold text-green-deep sm:text-4xl">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-center text-sm text-muted">
              পরিসংখ্যানটি ডাটাবেজের অনুমোদিত নিবন্ধন থেকে স্বয়ংক্রিয়ভাবে হিসাব করা হয়।
              {stats.demo > 0 && <strong className="font-semibold text-amber-ink"> বর্তমানে {formatBnNumber(stats.demo)}টি নমুনা (ডেমো) নিবন্ধন অন্তর্ভুক্ত।</strong>}
            </p>
          </>
        )}
      </section>

      {/* -------------------------------------------------- Featured batches */}
      {batches.length > 0 && (
        <section aria-labelledby="batches-title" className="bg-green-light/60 py-16 sm:py-20">
          <div className="container-page">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading id="batches-title" eyebrow="ব্যাচ ডিরেক্টরি" title="সবচেয়ে সক্রিয় ব্যাচগুলো" />
              <Link href="/batches" className="btn btn-outline self-start sm:self-auto">
                সব ব্যাচ দেখুন <ArrowRight aria-hidden size={18} />
              </Link>
            </div>
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {batches.slice(0, 8).map((b) => (
                <li key={b.passing_year}>
                  <Link href={`/batches/${b.passing_year}`} className="card card-hover block p-5 text-center">
                    <span className="block text-sm text-muted">ব্যাচ</span>
                    <span className="block font-display text-3xl font-bold text-green-deep">{toBn(b.passing_year)}</span>
                    <span className="mt-1 block text-sm font-medium">{formatBnNumber(b.count)} জন</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* --------------------------------------------------- Recent alumni */}
      <section aria-labelledby="recent-title" className="container-page py-16 sm:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading id="recent-title" eyebrow="নতুন যুক্ত হয়েছেন" title="সাম্প্রতিক প্রাক্তন শিক্ষার্থী" />
          {recent.items.length > 0 && (
            <Link href="/alumni" className="btn btn-outline self-start sm:self-auto">
              সবাইকে দেখুন <ArrowRight aria-hidden size={18} />
            </Link>
          )}
        </div>
        <div className="mt-8">
          {recent.items.length > 0 ? (
            <AlumniGrid items={recent.items} />
          ) : (
            <EmptyState
              title="এখনো কেউ তালিকায় যুক্ত হননি"
              description="নিবন্ধন অনুমোদিত হলে প্রাক্তন শিক্ষার্থীদের এখানে দেখা যাবে।"
              action={{ href: "/register", label: "নিবন্ধন করুন" }}
            />
          )}
        </div>
      </section>

      {/* --------------------------------------------------------- Sponsors */}
      <section aria-labelledby="sponsors-title" className="border-y border-line bg-white py-16 sm:py-20">
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading id="sponsors-title" eyebrow="পৃষ্ঠপোষক" title="যাঁদের সহযোগিতায় এই আয়োজন" />
            <Link href="/sponsors" className="btn btn-outline self-start sm:self-auto">
              সব স্পনসর <ArrowRight aria-hidden size={18} />
            </Link>
          </div>
          {sponsors.length > 0 ? (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sponsors.slice(0, 3).map((s) => (
                <li key={s.id}>
                  <SponsorCard sponsor={s} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-8">
              <EmptyState
                title="পৃষ্ঠপোষক হিসেবে পাশে থাকুন"
                description="প্রিয় বিদ্যালয়ের এই মিলনমেলায় পৃষ্ঠপোষকতার সুযোগ রয়েছে। আগ্রহী ব্যক্তি ও প্রতিষ্ঠানকে আয়োজকদের সঙ্গে যোগাযোগের আমন্ত্রণ জানাচ্ছি।"
                action={{ href: "/sponsors#become-sponsor", label: "পৃষ্ঠপোষকতার তথ্য" }}
                icon={<Heart aria-hidden size={28} />}
              />
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------ Announcements+FAQ */}
      <section className="container-page grid gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-14">
        <div aria-labelledby="news-title">
          <SectionHeading id="news-title" eyebrow="হালনাগাদ" title="ঘোষণা" />
          <div className="mt-6">
            <AnnouncementList items={announcements} />
          </div>
        </div>
        <div aria-labelledby="faq-title">
          <SectionHeading id="faq-title" eyebrow="জিজ্ঞাসা" title="সচরাচর জিজ্ঞাসিত প্রশ্ন" />
          <div className="mt-6">
            <FaqList faqs={faqs} />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- Final CTA */}
      <section className="container-page">
        <div className="relative overflow-hidden rounded-[2rem] bg-green px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <div className="bg-dots absolute inset-0 opacity-20 invert" aria-hidden="true" />
          <Hills variant="divider" className="absolute inset-x-0 bottom-0 h-14 w-full text-green-deep/70" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-white sm:text-4xl">আবার দেখা হবে প্রিয় আঙিনায়</h2>
            <p className="mt-4 text-lg leading-8 text-white/90">
              পুরোনো বন্ধু, প্রিয় শিক্ষক আর হারানো দিনগুলোর টানে চলে আসুন। আজই নিবন্ধন করে বন্ধুদেরও জানিয়ে দিন।
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/register" className="btn btn-light !min-h-[3.25rem] px-7 text-[1.05rem]">
                {heroCopy.primaryCta}
              </Link>
              <Link href="/batches" className="btn !min-h-[3.25rem] border-white/60 px-7 text-[1.05rem] text-white hover:bg-white/10">
                নিজের ব্যাচ খুঁজুন
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
