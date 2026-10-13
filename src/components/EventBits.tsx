import { CalendarDays, ChevronDown, Clock, MapPin, Megaphone, Pin, Ticket } from "lucide-react";
import { formatBnDate, formatBnDateTime, formatBnTime, formatBnTimeOfDate, formatTaka } from "@/lib/bn";
import type { Announcement, EventInfo, Faq, ScheduleItem } from "@/lib/queries/event";
import { DemoBadge, EmptyState } from "./ui";

export function eventDateLabel(event: EventInfo | null) {
  return event?.event_date ? formatBnDate(event.event_date, { weekday: true }) : "তারিখ শীঘ্রই ঘোষণা করা হবে";
}

export function EventFacts({ event, layout = "grid" }: { event: EventInfo | null; layout?: "grid" | "stack" }) {
  const facts = [
    {
      icon: CalendarDays,
      label: "তারিখ",
      value: eventDateLabel(event),
      sub: event?.event_date ? `শুরু ${formatBnTimeOfDate(event.event_date)}` : null,
    },
    {
      icon: MapPin,
      label: "ভেন্যু",
      value: event?.venue_name ?? "ভেন্যু শীঘ্রই ঘোষণা করা হবে",
      sub: event?.venue_address ?? null,
    },
    {
      icon: Clock,
      label: "নিবন্ধনের শেষ সময়",
      value: event?.registration_deadline ? formatBnDateTime(event.registration_deadline) : "শীঘ্রই ঘোষণা করা হবে",
      sub: null,
    },
    {
      icon: Ticket,
      label: "নিবন্ধন ফি",
      value: event?.registration_fee_amount != null ? (event.registration_fee_amount === 0 ? "বিনামূল্যে" : formatTaka(event.registration_fee_amount)) : "শীঘ্রই ঘোষণা করা হবে",
      sub: null,
    },
  ];
  return (
    <dl className={layout === "grid" ? "grid gap-3 sm:grid-cols-2" : "grid gap-3"}>
      {facts.map(({ icon: Icon, label, value, sub }) => (
        <div key={label} className="card flex items-start gap-3 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-green-light text-green">
            <Icon aria-hidden size={22} />
          </span>
          <div className="min-w-0">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="font-display text-[1.05rem] font-semibold leading-snug">{value}</dd>
            {sub && <dd className="text-sm text-muted">{sub}</dd>}
          </div>
        </div>
      ))}
    </dl>
  );
}

export function ScheduleTimeline({ items }: { items: ScheduleItem[] }) {
  if (items.length === 0) {
    return <EmptyState title="অনুষ্ঠানসূচি শীঘ্রই প্রকাশ করা হবে" description="আয়োজক কমিটি সময়সূচি চূড়ান্ত করলে এখানে দেখা যাবে।" icon={<Clock aria-hidden size={28} />} />;
  }
  return (
    <ol className="relative space-y-4 before:absolute before:bottom-4 before:left-[1.06rem] before:top-4 before:w-0.5 before:bg-green-soft sm:before:left-[9.56rem]">
      {items.map((item) => (
        <li key={item.id} className="relative grid grid-cols-[2.25rem_1fr] gap-3 sm:grid-cols-[7.5rem_2.25rem_1fr] sm:gap-4">
          <p className="hidden pt-3 text-right font-display font-semibold text-green-deep sm:block">
            {formatBnTime(item.start_time)}
          </p>
          <span className="relative z-10 mt-3 grid h-9 w-9 place-items-center rounded-full border-4 border-white bg-green shadow-sm" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
          <div className="card card-hover p-4">
            <p className="font-display text-sm font-semibold text-green sm:hidden">
              {formatBnTime(item.start_time)}
              {item.end_time && ` – ${formatBnTime(item.end_time)}`}
            </p>
            <h3 className="text-lg font-semibold">{item.activity_title}</h3>
            {item.activity_description && <p className="mt-1 text-muted">{item.activity_description}</p>}
            {item.end_time && (
              <p className="mt-2 hidden text-sm text-muted sm:block">
                {formatBnTime(item.start_time)} – {formatBnTime(item.end_time)}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function FaqList({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) return <p className="text-muted">এখনো কোনো প্রশ্নোত্তর যুক্ত করা হয়নি।</p>;
  return (
    <div className="space-y-3">
      {faqs.map((faq) => (
        <details key={faq.id} className="card group overflow-hidden">
          <summary className="flex min-h-14 items-center justify-between gap-4 px-5 py-4 font-display text-[1.05rem] font-semibold hover:bg-green-light/50">
            {faq.question}
            <ChevronDown aria-hidden size={20} className="faq-chevron shrink-0 text-green transition-transform" />
          </summary>
          <div className="border-t border-line px-5 py-4 leading-8 text-muted">{faq.answer}</div>
        </details>
      ))}
    </div>
  );
}

export function AnnouncementList({ items }: { items: Announcement[] }) {
  if (items.length === 0) {
    return <EmptyState title="এখনো কোনো ঘোষণা নেই" description="নতুন ঘোষণা প্রকাশিত হলে এখানে দেখা যাবে।" icon={<Megaphone aria-hidden size={28} />} />;
  }
  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <li key={a.id} className={`card p-5 ${a.is_pinned ? "border-green-soft bg-green-light/40" : ""}`}>
          <div className="flex flex-wrap items-center gap-2">
            {a.is_pinned && (
              <span className="badge badge-green"><Pin aria-hidden size={12} /> গুরুত্বপূর্ণ</span>
            )}
            {a.is_demo && <DemoBadge />}
            <time dateTime={a.published_at.toISOString()} className="text-sm text-muted">{formatBnDate(a.published_at)}</time>
          </div>
          <h3 className="mt-2 text-lg font-semibold">{a.title}</h3>
          <p className="mt-1 whitespace-pre-line leading-8 text-muted">{a.body}</p>
        </li>
      ))}
    </ul>
  );
}
