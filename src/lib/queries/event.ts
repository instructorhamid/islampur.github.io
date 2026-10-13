import "server-only";
import { cache } from "react";
import { sql } from "../db";

export type EventInfo = {
  id: string;
  event_title: string;
  event_tagline: string | null;
  event_description: string | null;
  event_date: Date | null;
  venue_name: string | null;
  venue_address: string | null;
  map_url: string | null;
  registration_deadline: Date | null;
  registration_fee_amount: number | null;
  registration_fee_note: string | null;
  registration_instructions: string | null;
  is_provisional: boolean;
  updated_at: Date;
};

export type ScheduleItem = {
  id: string;
  activity_title: string;
  activity_description: string | null;
  start_time: string;
  end_time: string | null;
  display_order: number;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  is_published: boolean;
  is_demo: boolean;
  published_at: Date;
};

export type Faq = { id: string; question: string; answer: string; display_order: number; is_published: boolean };

export const getActiveEvent = cache(async (): Promise<EventInfo | null> => {
  const [row] = await sql<EventInfo[]>`
    select id, event_title, event_tagline, event_description, event_date, venue_name, venue_address, map_url,
           registration_deadline, registration_fee_amount, registration_fee_note, registration_instructions,
           is_provisional, updated_at
    from events where is_active limit 1`;
  return row ?? null;
});

export const getSchedule = cache(async (eventId: string): Promise<ScheduleItem[]> => {
  return sql<ScheduleItem[]>`
    select id, activity_title, activity_description,
           to_char(start_time, 'HH24:MI') as start_time, to_char(end_time, 'HH24:MI') as end_time, display_order
    from event_schedule_items where event_id = ${eventId}
    order by start_time, display_order`;
});

export const getPublishedAnnouncements = cache(async (limit = 20): Promise<Announcement[]> => {
  return sql<Announcement[]>`
    select id, title, body, is_pinned, is_published, is_demo, published_at from announcements
    where is_published order by is_pinned desc, published_at desc limit ${limit}`;
});

export const getPublishedFaqs = cache(async (): Promise<Faq[]> => {
  return sql<Faq[]>`select id, question, answer, display_order, is_published from faqs
                    where is_published order by display_order, created_at`;
});

/** Registration is accepted when enabled in settings and the deadline (if any) has not passed. */
export function registrationClosedReason(
  event: EventInfo | null,
  registrationOpen: boolean,
): "disabled" | "deadline" | null {
  if (!registrationOpen) return "disabled";
  if (event?.registration_deadline && event.registration_deadline.getTime() < Date.now()) return "deadline";
  return null;
}
