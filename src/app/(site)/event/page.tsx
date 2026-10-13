import { ArrowRight, ClipboardList, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { AnnouncementList, EventFacts, FaqList, ScheduleTimeline } from "@/components/EventBits";
import { PageHero, ProvisionalNotice, SectionHeading } from "@/components/ui";
import { highlights, school, site } from "@/config/site";
import { toBn } from "@/lib/bn";
import { getActiveEvent, getPublishedAnnouncements, getPublishedFaqs, getSchedule } from "@/lib/queries/event";
import { getSettings } from "@/lib/queries/settings";

export async function generateMetadata(): Promise<Metadata> {
  const event = await getActiveEvent();
  const title = "অনুষ্ঠানের তথ্য ও সময়সূচি";
  const description = event?.event_description ?? site.description;
  return {
    title,
    description,
    alternates: { canonical: "/event" },
    openGraph: { title: `${title} | ${site.shortName}`, description, url: "/event", images: [{ url: "/og-image.png", width: 1200, height: 630 }] },
  };
}

export default async function EventPage() {
  const [event, settings, faqs, announcements] = await Promise.all([
    getActiveEvent(),
    getSettings(),
    getPublishedFaqs(),
    getPublishedAnnouncements(),
  ]);
  const schedule = event ? await getSchedule(event.id) : [];
  const provisional = event?.is_provisional ?? true;
  const hasContact = settings.contact_phone || settings.contact_email || settings.contact_address;

  // Structured data only once organizers have confirmed real details.
  const jsonLd =
    event && !provisional && event.event_date && event.venue_name
      ? {
          "@context": "https://schema.org",
          "@type": "Event",
          name: event.event_title,
          description: event.event_description ?? undefined,
          startDate: event.event_date.toISOString(),
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          location: { "@type": "Place", name: event.venue_name, address: event.venue_address ?? school.locationBn },
          organizer: { "@type": "Organization", name: `${school.nameBn} প্রাক্তন শিক্ষার্থী পুনর্মিলনী আয়োজক কমিটি`, url: site.url },
        }
      : null;

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <PageHero eyebrow="ইভেন্ট" title={event?.event_title ?? "পুনর্মিলনী অনুষ্ঠান"} description={event?.event_tagline ?? undefined}>
        {provisional && <ProvisionalNotice className="mt-6 max-w-3xl" />}
      </PageHero>

      <div className="container-page py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
          <section aria-labelledby="intro-title">
            <SectionHeading id="intro-title" eyebrow="পরিচিতি" title="অনুষ্ঠান সম্পর্কে" />
            <p className="mt-4 text-[1.05rem] leading-8 text-muted">
              {event?.event_description ?? "অনুষ্ঠানের বিস্তারিত বিবরণ শীঘ্রই প্রকাশ করা হবে।"}
            </p>
            <div className="mt-6">
              <EventFacts event={event} />
            </div>
            {event?.registration_fee_note && (
              <p className="mt-3 rounded-xl bg-green-light px-4 py-3 text-[0.95rem] leading-7"><strong>ফি সংক্রান্ত তথ্য:</strong> {event.registration_fee_note}</p>
            )}
          </section>

          <aside className="space-y-4">
            {event?.event_date && (
              <div className="card p-5">
                <h2 className="text-lg font-semibold">অনুষ্ঠান শুরু হতে বাকি</h2>
                <div className="mt-3">
                  <Countdown target={event.event_date.toISOString()} />
                </div>
              </div>
            )}
            <div className="card p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><MapPin aria-hidden size={20} className="text-green" /> ভেন্যু</h2>
              <p className="mt-2 font-display font-semibold">{event?.venue_name ?? "ভেন্যু শীঘ্রই ঘোষণা করা হবে"}</p>
              {event?.venue_address && <p className="text-muted">{event.venue_address}</p>}
              {event?.map_url ? (
                <a href={event.map_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm mt-4">
                  ম্যাপে দেখুন <ExternalLink aria-hidden size={16} /><span className="sr-only">(নতুন ট্যাবে খুলবে)</span>
                </a>
              ) : (
                <p className="mt-3 text-sm text-muted">ম্যাপ লিংক আয়োজকরা ভেন্যু চূড়ান্ত করার পর যুক্ত করবেন।</p>
              )}
            </div>
          </aside>
        </div>

        <section aria-labelledby="schedule-title" className="mt-16">
          <SectionHeading id="schedule-title" eyebrow="অনুষ্ঠানসূচি" title="দিনব্যাপী সময়সূচি" description={provisional ? "সম্ভাব্য সময়সূচি — চূড়ান্ত হলে হালনাগাদ করা হবে।" : undefined} />
          <div className="mt-8 max-w-4xl">
            <ScheduleTimeline items={schedule} />
          </div>
        </section>

        <section aria-labelledby="howto-title" className="mt-16 grid gap-8 lg:grid-cols-2">
          <div className="card p-6 sm:p-8">
            <h2 id="howto-title" className="flex items-center gap-2 text-2xl font-bold"><ClipboardList aria-hidden size={24} className="text-green" /> কীভাবে নিবন্ধন করবেন</h2>
            <p className="mt-4 whitespace-pre-line leading-8 text-muted">
              {event?.registration_instructions ?? "নিবন্ধন পাতার ফর্মটি পূরণ করে জমা দিন।"}
            </p>
            <Link href="/register" className="btn btn-primary mt-6">
              নিবন্ধন করুন <ArrowRight aria-hidden size={18} />
            </Link>
          </div>
          <div>
            <h2 className="text-2xl font-bold">বিশেষ আয়োজন</h2>
            {provisional && <p className="mt-1 text-sm text-muted">পরিকল্পিত আয়োজন — চূড়ান্ত নয়।</p>}
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {highlights.map((h) => (
                <li key={h.title} className="rounded-xl border border-line p-4">
                  <h3 className="font-semibold">{h.title}</h3>
                  <p className="mt-1 text-sm text-muted">{h.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-16 grid gap-12 lg:grid-cols-2">
          <div aria-labelledby="ann-title">
            <SectionHeading id="ann-title" eyebrow="হালনাগাদ" title="গুরুত্বপূর্ণ ঘোষণা" />
            <div className="mt-6"><AnnouncementList items={announcements} /></div>
          </div>
          <div aria-labelledby="faq-title">
            <SectionHeading id="faq-title" eyebrow="জিজ্ঞাসা" title="সচরাচর জিজ্ঞাসিত প্রশ্ন" />
            <div className="mt-6"><FaqList faqs={faqs} /></div>
          </div>
        </section>

        <section id="event-contact" aria-labelledby="contact-title" className="mt-16 rounded-2xl bg-green-light p-6 sm:p-8">
          <h2 id="contact-title" className="text-2xl font-bold">যোগাযোগ</h2>
          {hasContact ? (
            <ul className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {settings.contact_phone && (
                <li><a href={`tel:${settings.contact_phone.replace(/[^\d+]/g, "")}`} className="btn btn-outline"><Phone aria-hidden size={18} /> {toBn(settings.contact_phone)}</a></li>
              )}
              {settings.contact_email && (
                <li><a href={`mailto:${settings.contact_email}`} className="btn btn-outline"><Mail aria-hidden size={18} /> {settings.contact_email}</a></li>
              )}
              {settings.contact_address && (
                <li className="flex items-center gap-2 text-muted"><MapPin aria-hidden size={18} /> {settings.contact_address}</li>
              )}
            </ul>
          ) : (
            <p className="mt-3 text-muted">আয়োজক কমিটির যোগাযোগের তথ্য শীঘ্রই প্রকাশ করা হবে।</p>
          )}
        </section>
      </div>
    </>
  );
}
