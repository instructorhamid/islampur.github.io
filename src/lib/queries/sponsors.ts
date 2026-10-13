import "server-only";
import { cache } from "react";
import { sql } from "../db";

export type SponsorTier = { id: string; name: string; display_order: number };

export type Sponsor = {
  id: string;
  name: string;
  logo_url: string | null;
  tier_id: string | null;
  tier_name: string | null;
  description: string | null;
  website_url: string | null;
  display_order: number;
  is_published: boolean;
  is_demo: boolean;
};

type Row = Omit<Sponsor, "logo_url"> & { has_logo: boolean; version: number };

function toSponsor({ has_logo, version, ...row }: Row): Sponsor {
  return { ...row, logo_url: has_logo ? `/media/sponsors/${row.id}?v=${version}` : null };
}

const columns = () => sql`s.id, s.name, s.tier_id, t.name as tier_name, s.description, s.website_url,
  s.display_order, s.is_published, s.is_demo, (s.logo_key is not null) as has_logo,
  floor(extract(epoch from s.updated_at))::int as version`;

export const getSponsorTiers = cache(async (): Promise<SponsorTier[]> => {
  return sql<SponsorTier[]>`select id, name, display_order from sponsor_tiers order by display_order, name`;
});

export const getPublishedSponsors = cache(async (): Promise<Sponsor[]> => {
  const rows = await sql<Row[]>`
    select ${columns()} from sponsors s left join sponsor_tiers t on t.id = s.tier_id
    where s.is_published
    order by t.display_order nulls last, s.display_order, s.name`;
  return rows.map(toSponsor);
});

export async function getAllSponsors(): Promise<Sponsor[]> {
  const rows = await sql<Row[]>`
    select ${columns()} from sponsors s left join sponsor_tiers t on t.id = s.tier_id
    order by t.display_order nulls last, s.display_order, s.name`;
  return rows.map(toSponsor);
}
