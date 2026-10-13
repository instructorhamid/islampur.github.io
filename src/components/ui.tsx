import { Info, SearchX } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  id,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: "left" | "center";
  id?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Tag id={id} className={`mt-1 font-bold ${Tag === "h1" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-[2rem]"}`}>
        {title}
      </Tag>
      {description && <div className="mt-3 text-[1.02rem] leading-8 text-muted">{description}</div>}
    </div>
  );
}

export function PageHero({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-green-light">
      <div className="bg-dots absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="container-page relative py-10 sm:py-14">
        <SectionHeading as="h1" eyebrow={eyebrow} title={title} description={description} />
        {children}
      </div>
    </section>
  );
}

/** Shown wherever event details are still provisional (flag set by organizers in /admin/event). */
export function ProvisionalNotice({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div role="note" className={`flex items-start gap-2.5 rounded-xl border border-amber-line bg-amber-bg px-4 py-3 text-amber-ink ${className}`}>
      <Info aria-hidden size={20} className="mt-0.5 shrink-0" />
      <p className={compact ? "text-sm leading-6" : "text-[0.95rem] leading-7"}>
        <strong className="font-semibold">প্রস্তাবিত তথ্য:</strong> তারিখ, ভেন্যু, সময়সূচি ও ফি এখনো চূড়ান্ত নয়। আয়োজক কমিটি চূড়ান্ত করলে এখানে হালনাগাদ করা হবে।
      </p>
    </div>
  );
}

export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`badge badge-amber ${className}`} title="এটি উন্নয়ন ও প্রদর্শনের জন্য নমুনা তথ্য, প্রকৃত নয়">
      নমুনা
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: ReactNode;
  action?: { href: string; label: string };
  icon?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-green-light text-green">
        {icon ?? <SearchX aria-hidden size={28} />}
      </div>
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      {description && <div className="mt-2 max-w-md text-muted">{description}</div>}
      {action && (
        <Link href={action.href} className="btn btn-primary mt-6">
          {action.label}
        </Link>
      )}
    </div>
  );
}
