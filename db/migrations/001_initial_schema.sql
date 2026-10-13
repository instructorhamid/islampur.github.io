-- Islampur High School Reunion — initial schema
-- Plain PostgreSQL (13+). Compatible with Supabase, Neon and self-hosted Postgres.
--
-- Access model: the Next.js server connects with a privileged role (table owner).
-- Row Level Security is ENABLED on every table without any policy, so the
-- Supabase `anon` / `authenticated` roles (PostgREST) cannot read or write
-- anything directly. All public reads go through the server, which applies the
-- publication rules (approved + consent) before returning data.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Site-wide settings (single row)
-- ---------------------------------------------------------------------------
create table site_settings (
  id                         smallint primary key default 1 check (id = 1),
  min_passing_year           integer  not null default 1960,
  max_passing_year           integer  not null default 2026,
  require_approval           boolean  not null default true,
  registration_open          boolean  not null default true,
  show_blood_group_publicly  boolean  not null default true,
  contact_phone              text,
  contact_email              text,
  contact_address            text,
  facebook_url               text,
  updated_at                 timestamptz not null default now(),
  constraint site_settings_year_range check (min_passing_year <= max_passing_year)
);

insert into site_settings (id) values (1);

-- ---------------------------------------------------------------------------
-- Administrators & sessions
-- ---------------------------------------------------------------------------
create table admins (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null,
  password_hash  text not null,              -- scrypt, never plain text
  auth_provider  text not null default 'local',
  role           text not null default 'moderator' check (role in ('admin', 'moderator')),
  is_active      boolean not null default true,
  last_login_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index admins_email_key on admins (lower(email));

create table admin_sessions (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null references admins (id) on delete cascade,
  token_hash  text not null unique,           -- sha256 of the cookie token
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index admin_sessions_admin_idx on admin_sessions (admin_id);
create index admin_sessions_expiry_idx on admin_sessions (expires_at);

-- ---------------------------------------------------------------------------
-- Alumni registrations
-- ---------------------------------------------------------------------------
create table registrations (
  id                          uuid primary key default gen_random_uuid(),
  full_name                   text not null check (char_length(full_name) between 2 and 100),
  normalized_phone            text not null check (normalized_phone ~ '^01[3-9][0-9]{8}$'),
  blood_group                 text not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  passing_year                integer not null check (passing_year between 1900 and 2100),
  photo_key                   text,            -- storage object prefix; null when removed
  photo_consent               boolean not null default false,
  blood_group_public_consent  boolean not null default false,
  privacy_accepted_at         timestamptz not null,
  approval_status             text not null default 'pending'
                                check (approval_status in ('pending','approved','rejected')),
  admin_note                  text,
  reviewed_by                 uuid references admins (id) on delete set null,
  reviewed_at                 timestamptz,
  is_demo                     boolean not null default false,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
-- One registration per mobile number (normalized to 01XXXXXXXXX).
create unique index registrations_phone_key on registrations (normalized_phone);
create index registrations_status_year_idx on registrations (approval_status, passing_year);
create index registrations_created_idx on registrations (created_at desc);
create index registrations_name_trgm_idx on registrations using gin (full_name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Event, schedule, announcements, FAQs
-- ---------------------------------------------------------------------------
create table events (
  id                         uuid primary key default gen_random_uuid(),
  event_title                text not null,
  event_tagline              text,
  event_description          text,
  event_date                 timestamptz,      -- null = "to be announced"
  venue_name                 text,
  venue_address              text,
  map_url                    text,             -- optional link, no invented coordinates
  registration_deadline      timestamptz,
  registration_fee_amount    integer check (registration_fee_amount is null or registration_fee_amount >= 0),
  registration_fee_note      text,
  registration_instructions  text,
  is_provisional             boolean not null default true,
  is_active                  boolean not null default true,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);
create unique index events_single_active on events (is_active) where is_active;

create table event_schedule_items (
  id                    uuid primary key default gen_random_uuid(),
  event_id              uuid not null references events (id) on delete cascade,
  activity_title        text not null,
  activity_description  text,
  start_time            time not null,
  end_time              time,
  display_order         integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index event_schedule_event_idx on event_schedule_items (event_id, start_time, display_order);

create table announcements (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text not null,
  is_published  boolean not null default true,
  is_pinned     boolean not null default false,
  is_demo       boolean not null default false,
  published_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index announcements_pub_idx on announcements (is_published, is_pinned desc, published_at desc);

create table faqs (
  id             uuid primary key default gen_random_uuid(),
  question       text not null,
  answer         text not null,
  display_order  integer not null default 0,
  is_published   boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Sponsors
-- ---------------------------------------------------------------------------
create table sponsor_tiers (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now()
);

create table sponsors (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  logo_key       text,
  tier_id        uuid references sponsor_tiers (id) on delete set null,
  description    text,
  website_url    text,
  display_order  integer not null default 0,
  is_published   boolean not null default false,
  is_demo        boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index sponsors_pub_idx on sponsors (is_published, display_order);

-- ---------------------------------------------------------------------------
-- Abuse protection & accountability
-- ---------------------------------------------------------------------------
create table rate_limits (
  key           text not null,
  window_start  timestamptz not null,
  count         integer not null default 0,
  primary key (key, window_start)
);

create table audit_log (
  id           bigint generated always as identity primary key,
  admin_id     uuid references admins (id) on delete set null,
  action       text not null,
  target_type  text,
  target_id    text,
  details      jsonb,
  created_at   timestamptz not null default now()
);
create index audit_log_target_idx on audit_log (target_type, target_id);

-- ---------------------------------------------------------------------------
-- Lock down direct API access (Supabase PostgREST etc.)
-- ---------------------------------------------------------------------------
alter table site_settings         enable row level security;
alter table admins                enable row level security;
alter table admin_sessions        enable row level security;
alter table registrations         enable row level security;
alter table events                enable row level security;
alter table event_schedule_items  enable row level security;
alter table announcements         enable row level security;
alter table faqs                  enable row level security;
alter table sponsor_tiers         enable row level security;
alter table sponsors              enable row level security;
alter table rate_limits           enable row level security;
alter table audit_log             enable row level security;
