# Islampur High School Reunion Website

Bengali-language reunion website for **Islampur High School (ইসলামপুর উচ্চ বিদ্যালয়)**, Chhatak, Sunamganj, Sylhet, Bangladesh. School code 2713, EIIN 129817.

Former students can register with a photo, find classmates in a searchable directory, browse batches by passing year, and read the event schedule, announcements and sponsor information. Organizers manage everything from a protected admin panel.

> **Status of event information:** the event date (22 January 2027), venue, schedule, deadline and fee in the database are **provisional placeholders**. The site marks them "প্রস্তাবিত তথ্য" until an organizer unticks the provisional flag in `/admin/event`. See [Replacing demo and provisional content](#replacing-demo-and-provisional-content).

---

## Features

| Area | What it does |
| --- | --- |
| Homepage `/` | Hero with live countdown (never negative), about section, highlights, schedule timeline, real statistics from the database, most active batches, recent alumni, sponsor preview, announcements, FAQ, CTAs |
| Registration `/register` | Name, mobile, blood group, passing year, photo. Client and server validation, Bengali messages, photo preview/replace, in-browser downscaling, duplicate-phone protection, consent checkboxes, works without JavaScript |
| Alumni `/alumni` | Search by name, filter by year and blood group, sort, pagination, skeletons, empty and error states |
| Profiles `/alumni/[id]` | Public profile for approved records only (`noindex` for privacy) |
| Batches `/batches`, `/batches/[year]` | Generated from the database; one dynamic page per year with search and pagination |
| Sponsors `/sponsors` | Grouped by configurable tiers, logos, links, sponsor-invitation section |
| Event `/event` | Description, date, venue, map link, deadline, fee, schedule, instructions, announcements, FAQ, contact. Event JSON-LD is emitted only once details are confirmed |
| Privacy `/privacy` | Bengali privacy notice (draft for organizer review) |
| Admin `/admin` | Dashboard, registration review (single and bulk approve/reject), editing, photo removal/replacement, deletion, CSV export, event and schedule editing, announcements, FAQs, sponsors and tiers, batch statistics, passing-year range, privacy switches, contact details, demo-data removal, data-retention purge, admin accounts, audit log |

## Architecture

- **Next.js 15 (App Router) + TypeScript**, server-rendered. Tailwind CSS v4 with design tokens as CSS variables (`src/app/globals.css`).
- **PostgreSQL** via [`postgres`](https://github.com/porsager/postgres) with plain SQL migrations (`db/migrations`). Works with Supabase, Neon or self-hosted Postgres 13+.
- **Images** are validated and re-encoded with `sharp` (EXIF/GPS stripped) into WebP: a full image and a square thumbnail.
- **Storage driver** is pluggable: `local` (filesystem; development and VPS) or `supabase` (private Supabase Storage bucket).
- **Auth**: organizer accounts in the `admins` table with scrypt password hashes; random session tokens stored hashed in `admin_sessions`; HTTP-only cookies. Two roles: `admin` (everything) and `moderator` (review and content editing; no deletion, export, settings or account management).
- **Validation** with Zod, shared between the browser and the server (`src/lib/validation.ts`).
- **Fonts**: Hind Siliguri (headings) and Noto Sans Bengali (body) via `next/font/google`, self-hosted at build time.

> **Why not GitHub Pages?** The repository is named `*.github.io`, but GitHub Pages only serves static files. Registration, uploads, admin login and approval need a server and a database, so the site must run on a Node.js host (Vercel or a VPS). See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). If GitHub Pages is enabled for this repository, disable it (Settings → Pages) so it does not publish the source code as a website.

### Privacy model

- A registration becomes public only after approval (`approval_status = 'approved'`), unless an admin turns approval off.
- Public pages show **name and passing year** only. The **photo** is shown only with photo consent; the **blood group** only with the person's consent *and* the global switch in settings.
- **Phone numbers are never sent to public pages.** All public data goes through `src/lib/queries/alumni.ts`, which selects only public columns.
- Photos are served through `/media/...`, which checks approval and consent on every request (organizers can see all photos). The Supabase bucket stays private.
- Row Level Security is enabled on every table with no policies, so Supabase's public API keys cannot read anything directly.
- Rate limiting is stored in Postgres (works on serverless): registration 20 per 10 minutes per IP (generous because Bangladeshi carriers use carrier-grade NAT); failed logins 20 per IP and 8 per account per 15 minutes. IP addresses are stored only as keyed hashes.
- Uploads: JPEG/PNG/WebP only, checked by declared type, size and actual decoded content.
- CSV export (with phone numbers) is restricted to the `admin` role, neutralizes spreadsheet formulas and is recorded in the audit log.

## Quick start (local development)

Prerequisites: Node.js 20.9+ and PostgreSQL 13+.

```bash
npm install
cp .env.example .env.local          # then edit DATABASE_URL and APP_SECRET

createdb reunion                    # or create it with psql / your Postgres GUI
npm run db:migrate                  # creates tables + provisional event content
npm run db:seed                     # optional: clearly-labelled demo alumni/sponsors
npm run admin:create -- --email you@example.com --name "আপনার নাম"   # prompts for a password

npm run dev                         # http://localhost:3000, admin at /admin
```

### Environment variables

All are server-only except `NEXT_PUBLIC_SITE_URL`. See `.env.example` for comments.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes | Public base URL (canonical URLs, sitemap, Open Graph) |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `DATABASE_SSL` | hosted DBs | `require` for Supabase/Neon |
| `DATABASE_POOL_MAX` | no | Connections per instance (default 5; use 1–3 on serverless) |
| `APP_SECRET` | yes (prod) | ≥24 random characters; keys the IP hashing |
| `STORAGE_DRIVER` | no | `local` (default) or `supabase` |
| `LOCAL_UPLOAD_DIR` | local | Upload folder (default `./uploads`) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | supabase | Storage credentials (never exposed to the browser) |
| `MAX_UPLOAD_MB` | no | Maximum upload size (default 4; keep ≤4 on Vercel) |

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop, build, serve |
| `npm run db:migrate` | Apply new SQL migrations (each once, in a transaction) |
| `npm run db:seed` | Insert demo data (`is_demo = true`); refuses to run with `NODE_ENV=production` |
| `npm run db:clear-demo` | Remove demo rows (also available in `/admin/settings`) |
| `npm run admin:create -- --email … --name … [--role admin\|moderator]` | Create an organizer account or reset its password (`ADMIN_PASSWORD` env var or prompt) |
| `npm run typecheck`, `npm run lint` | TypeScript and ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) against a fresh `reunion_test` database and a production build |

## Project structure

```
db/migrations/            SQL schema and provisional content
scripts/                  migrate, seed, clear-demo, create-admin
src/config/site.ts        School identity, navigation, evergreen copy (edit here)
src/app/(site)/           Public pages
src/app/admin/            Login, admin panel pages and server actions (_actions/)
src/app/api/register/     Registration endpoint
src/app/media/            Photo/logo delivery with privacy checks
src/components/           Shared UI (header, footer, cards, countdown, timeline …)
src/lib/                  Database, auth, validation, images, storage, queries
tests/unit, tests/e2e     Vitest and Playwright suites
docs/                     Deployment, organizer guide (Bengali), testing report
```

### Database tables

`site_settings` (single row: year range, approval, privacy switches, contacts) · `registrations` · `events` (one active) · `event_schedule_items` · `announcements` · `faqs` · `sponsor_tiers` · `sponsors` · `admins` · `admin_sessions` · `rate_limits` · `audit_log` · `schema_migrations`. See `db/migrations/001_initial_schema.sql` for constraints and indexes (unique normalized phone, status/year index, trigram name index).

## Replacing demo and provisional content

1. **Event details**: `/admin/event` → set the real date, venue, address, map link, deadline, fee and instructions; edit the schedule; then **untick "তথ্যগুলো এখনো প্রস্তাবিত"**. The provisional notices disappear and event structured data is published.
2. **Contacts**: `/admin/settings` → phone, email, address, Facebook link (blank fields show "শীঘ্রই প্রকাশ করা হবে").
3. **Passing-year range**: `/admin/batches` → set the first SSC batch year (default 1960 is a placeholder) and the latest batch.
4. **Demo data**: `/admin/settings` → "নমুনা তথ্য মুছে ফেলুন" (or `npm run db:clear-demo`). Real records are untouched.
5. **Sponsors, announcements, FAQs**: `/admin/sponsors`, `/admin/content`.
6. **Logo and school photo**: put files in `public/images/` and set `school.logoPath` / `school.heroImage` in `src/config/site.ts`. No official logo is invented; the "ই" mark is a typographic placeholder.
7. **Copy**: about text and highlights live in `src/config/site.ts`; the privacy notice in `src/app/(site)/privacy/page.tsx` is a draft for the committee to review.

## Further documentation

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Vercel + Supabase, or a VPS
- [docs/ORGANIZER_GUIDE.md](docs/ORGANIZER_GUIDE.md): Bengali guide for organizers
- [docs/TESTING.md](docs/TESTING.md): how to run the tests and what was verified
