# Testing

## How to run

```bash
npm run typecheck      # TypeScript
npm run lint           # ESLint (next/core-web-vitals + typescript)
npm test               # Unit tests (Vitest), no database needed
npm run test:e2e       # End-to-end tests (Playwright)
npm run test:all       # all of the above
```

`npm run test:e2e`:

1. drops and recreates the schema in the **`reunion_test`** database (override with `E2E_DATABASE_URL`), runs the migrations and seeds demo data (no admin accounts; the first spec creates them through `/admin/setup` and the users page);
2. builds the app into `.next-test/` and starts it on port 3100 with uploads in `tests/.tmp/uploads`;
3. runs the specs in `tests/e2e/` in order. They share state; for example, the admin spec approves the registration created by the registration spec.

Create the test database once: `createdb reunion_test` (owned by the user in the URL). If Playwright's own browser isn't installed, run `npx playwright install chromium`, or point `PW_CHROMIUM_PATH` at an existing Chromium. A GitHub Actions workflow (`.github/workflows/ci.yml`) runs everything against a Postgres 16 service container.

## What was verified (13 October 2026, local Postgres 16, production build, Chromium)

**Unit tests: 44 passed.** They cover phone normalization (Bengali digits, `+880`/`880`/`0088` prefixes, separators, invalid operators), Bengali number/date/time formatting in Dhaka time, the registration schema (Bengali and English names, markup rejection, year range, consent), CSV formula-injection escaping, scrypt hashing, local-storage path-traversal protection, the Supabase Storage HTTP calls including automatic bucket creation (mocked), and parsing of Vercel/Supabase connection strings.

**End-to-end tests: 31 passed.** First-time setup is covered (setup notice on the login page, wrong code rejected, first admin created, moderator added, setup locked afterwards). They map to the requested checks as follows:

| # | Requirement | Covered by |
| --- | --- | --- |
| 1 | Valid student can register | Registration via the UI with photo preview; Bengali confirmation shown only after the server saved it |
| 2 | Invalid/missing fields rejected | Client-side errors for every field with focus on the first; server returns 422 with per-field Bengali messages for an empty POST |
| 3 | Invalid images rejected | Text file in the browser; text disguised as `.jpg` and a GIF rejected by the server (content is decoded, not trusted from the name) |
| 4 | Duplicate phones | Same number typed as `০১৮১১০০০২২২` after registering `+880 1811-000222` is reported as a duplicate. Separately checked by hand: 5 simultaneous requests with one number give one 201 and four 409s, with no orphaned files |
| 5 | Appears in directory after approval | Hidden while pending; after admin approval visible in `/alumni`, `/batches`, `/batches/2005` and its profile |
| 6 | Correct year in batch directory | `/batches` lists 2005 after approval and 2010 from demo data |
| 7 | Batch page shows only its year | Every card badge on `/batches/2010` and `/batches/2005` checked |
| 8 | Search and filters | Name search, year filter (auto-submit), empty state |
| 9 | Pagination | `/batches/2010` page 1 has 24 cards, page 2 has the rest, current-page marker |
| 10 | Unauthorized users blocked | Anonymous users redirected from all admin pages and CSV export; forged session cookie rejected; moderator blocked from settings (redirect) and export (403); crafted `approval_status=approved` in a public submission still results in `pending` |
| 11 | Admin updates event and sponsors | Venue, fee and provisional flag; invalid map URL rejected without losing typed input; schedule item added and shown with Bengali time; sponsor with logo added and served |
| 12 | Empty, loading and error states | Empty search results, empty valid batch (`/batches/1961`), 404s for invalid year, malformed and unknown IDs, "registration closed" state |
| 13 | Mobile usability | No horizontal scrolling at 360 px on 8 public pages and 7 admin pages; mobile menu opens, navigates and closes with Escape |
| 14 | No sensitive data in public responses | HTML of 8 public pages and the sitemap contains no phone number pattern, `normalized_phone` or `admin_note`; profile pages carry `noindex`; removed photos return 404 immediately |
| 15 | Demo vs official content | "প্রস্তাবিত তথ্য" notices while provisional and gone after confirmation; "নমুনা" badges on demo records; demo removal deletes only demo rows |

Also covered: the homepage countdown (no negative values, no console errors), robots.txt and sitemap contents, CSV export (UTF-8 BOM, Bengali header, phone numbers for admins), closing registration in settings (UI message and API 403), and logout.

Manual checks during development:
- Uploaded photos are re-encoded to WebP, and EXIF metadata, including an injected test field, is gone.
- A pending registration's photo URL returns 404.
- The no-JavaScript form fallback redirects with an error code.
- Cross-origin POSTs to `/api/register` are rejected (403).
- The rate limiter returns 429 after the limit.
- Screenshots were reviewed at 1366 px and 390 px.

## Not verified here

Every item below needs credentials or devices that this development environment does not have:

- **Live Supabase Storage and a Supabase database.** The storage driver's HTTP calls are unit-tested against mocks only. Run one real registration after configuring Supabase.
- **Vercel deployment** and the GitHub Actions workflow.
- **Real phones** (iOS Safari, Android Chrome, older Android WebViews). Mobile was tested with Chromium at phone widths only. In particular, check that iPhone photos (HEIC) are converted to JPEG by the browser on upload.
- **Screen-reader walkthroughs** (TalkBack, VoiceOver). Semantic markup, labels, focus handling and live regions are in place but were not tested with assistive technology.
- **Lighthouse or field performance measurements.**
- The **error boundary** (`src/app/(site)/error.tsx`) and the **loading skeletons** were not triggered by automated tests.
