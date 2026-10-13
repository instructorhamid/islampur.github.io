import "server-only";
import { cache } from "react";
import { sql } from "../db";

export type SiteSettings = {
  min_passing_year: number;
  max_passing_year: number;
  require_approval: boolean;
  registration_open: boolean;
  show_blood_group_publicly: boolean;
  contact_phone: string | null;
  contact_email: string | null;
  contact_address: string | null;
  facebook_url: string | null;
};

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const [row] = await sql<SiteSettings[]>`
    select min_passing_year, max_passing_year, require_approval, registration_open,
           show_blood_group_publicly, contact_phone, contact_email, contact_address, facebook_url
    from site_settings where id = 1`;
  if (!row) throw new Error("site_settings row missing — run `npm run db:migrate`");
  return row;
});
