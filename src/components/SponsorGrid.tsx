import { ExternalLink } from "lucide-react";
import type { Sponsor } from "@/lib/queries/sponsors";
import { DemoBadge } from "./ui";

export function SponsorCard({ sponsor, featured = false }: { sponsor: Sponsor; featured?: boolean }) {
  return (
    <article className={`card card-hover flex h-full flex-col p-5 ${featured ? "sm:p-7" : ""}`}>
      <div className={`grid place-items-center rounded-xl bg-green-light/60 ${featured ? "h-36" : "h-28"}`}>
        {sponsor.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sponsor.logo_url} alt={`${sponsor.name}-এর লোগো`} loading="lazy" className="max-h-[80%] max-w-[80%] object-contain" />
        ) : (
          <span className="px-4 text-center font-display text-xl font-bold text-green-deep/80">{sponsor.name}</span>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {sponsor.tier_name && <span className="badge badge-green">{sponsor.tier_name}</span>}
        {sponsor.is_demo && <DemoBadge />}
      </div>
      <h3 className={`mt-2 font-semibold ${featured ? "text-xl" : "text-lg"}`}>{sponsor.name}</h3>
      {sponsor.description && <p className="mt-1 text-[0.95rem] leading-7 text-muted">{sponsor.description}</p>}
      {sponsor.website_url && (
        <a
          href={sponsor.website_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-auto inline-flex items-center gap-1.5 pt-3 font-semibold text-green hover:text-green-deep"
        >
          ওয়েবসাইট দেখুন <ExternalLink aria-hidden size={16} />
          <span className="sr-only">(নতুন ট্যাবে খুলবে)</span>
        </a>
      )}
    </article>
  );
}
