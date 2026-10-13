# Deployment

The site is a Next.js server application with a PostgreSQL database and file storage. Choose one of the options below.

> GitHub Pages cannot host this site (no server, no database). If Pages is enabled for this repository, turn it off under **Settings → Pages**.

---

## Option A: Vercel + Supabase (recommended)

### If you connected Supabase through Vercel (Storage / Marketplace integration)

The integration already adds `POSTGRES_URL`, `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`) to the Vercel project. The app uses them directly:

- **Database**: `POSTGRES_URL` is used when `DATABASE_URL` is not set (SSL and pooler settings are handled automatically).
- **Migrations** run automatically on every Vercel build (`vercel-build` script → `npm run db:migrate && next build`). They are idempotent and safe if two builds run at once.
- **Connection pooling**: a Supabase pooler URL on port 5432 (session mode) is switched to port 6543 (transaction mode) automatically. Session mode allows only ~15 clients and fails under serverless traffic with `EMAXCONNSESSION max clients reached in session mode`.
- **Storage** switches to Supabase automatically when the Supabase credentials are present. The private bucket `reunion-media` is created on the first upload if it doesn't exist.
- **Site URL** defaults to the Vercel production domain if `NEXT_PUBLIC_SITE_URL` is not set.

You only need to add two variables yourself (**Vercel → Project → Settings → Environment Variables**, Production + Preview):

| Name | Value |
| --- | --- |
| `APP_SECRET` | a long random string, e.g. output of `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` or any password generator (≥24 characters) |
| `SETUP_TOKEN` | another random string (≥16 characters), used once to create the first organizer account |

Recommended: `DATABASE_POOL_MAX=2`, `MAX_UPLOAD_MB=4`, and `NEXT_PUBLIC_SITE_URL` once you have a custom domain.

Then:

1. **Redeploy** (Deployments → ⋯ → Redeploy) so the new variables and migrations take effect. In the build log you should see `Applied 001_initial_schema.sql` and `Applied 002_default_content.sql` (on later builds: `Database is up to date.`).
2. Open `https://<your-site>/admin/setup`, enter the `SETUP_TOKEN` and create the first admin account. The page locks itself permanently once an admin exists. You may then delete `SETUP_TOKEN` from Vercel.
3. Follow the [launch checklist](#launch-checklist).

Do **not** run `npm run db:seed` against the production database (it adds demo people).

Row Level Security is enabled on every table without policies, so Supabase's public `anon` key cannot read or change any data; only the server can.

### Manual setup (without the integration)

1. Create a Supabase project. From **Connect**, copy the *Transaction pooler* URI (port 6543).
2. In Vercel set `DATABASE_URL` (that URI), `DATABASE_SSL=require`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API keys; keep it secret), `APP_SECRET`, `SETUP_TOKEN`.
3. Deploy and continue from step 2 above.

Notes:
- `STORAGE_DRIVER=local` does **not** work on Vercel (read-only filesystem); don't set it there.
- Vercel limits request bodies to 4.5 MB. Phone photos are shrunk in the browser first; sponsor logos must be under ~4.5 MB.
- Vercel deploys the repository's production branch. If you later create `main`, set it as the production branch under **Settings → Git**.

---

## Option B: VPS / own server (Ubuntu example)

Suitable when you already have a server. Uses local disk for uploads.

```bash
# System packages
sudo apt install -y postgresql nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs

# Database
sudo -u postgres psql -c "CREATE USER reunion WITH PASSWORD 'strong-password';"
sudo -u postgres psql -c "CREATE DATABASE reunion OWNER reunion;"

# App
git clone <repo-url> /srv/reunion && cd /srv/reunion
npm ci
cp .env.example .env.local   # set DATABASE_URL, APP_SECRET, NEXT_PUBLIC_SITE_URL, LOCAL_UPLOAD_DIR=/srv/reunion-uploads
npm run db:migrate
npm run admin:create -- --email organizer@example.com --name "আয়োজকের নাম"   # or use /admin/setup with SETUP_TOKEN
npm run build
```

Run it as a service, for example `/etc/systemd/system/reunion.service`:

```ini
[Unit]
Description=Islampur reunion website
After=network.target postgresql.service

[Service]
WorkingDirectory=/srv/reunion
ExecStart=/usr/bin/npm run start -- -p 3000
Restart=always
User=www-data
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then proxy it with nginx and HTTPS (certbot). Set `client_max_body_size 6m;` and forward `X-Forwarded-For` so rate limiting sees real client IPs:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Make sure the `www-data` user can write to `LOCAL_UPLOAD_DIR`, and back it up together with the database.

---

## After every deployment

- `npm run db:migrate` whenever new files appear in `db/migrations/`. Migrations are applied once each, in order, inside transactions.
- Open `/admin`: the dashboard warns while demo data exists or the event is still marked provisional.

## Backups and data retention

- Supabase: enable daily backups (paid plans) or schedule `pg_dump` yourself. VPS: run a nightly `pg_dump` and copy the upload folder.
- Agree on a retention period with the committee. Use **/admin/settings → তথ্য সংরক্ষণের মেয়াদ** to purge rejected registrations, and delete individual records on request from the registration detail page.

## Launch checklist

- [ ] Event date, venue, schedule, deadline and fee confirmed; provisional flag turned off
- [ ] Contact details filled in
- [ ] Passing-year range set to the school's real first SSC batch
- [ ] Demo data removed (dashboard shows no demo warning)
- [ ] Privacy notice reviewed by the committee
- [ ] Official logo and photos added (optional)
- [ ] At least two `admin` accounts exist; moderators added as needed
- [ ] A test registration completed on the live site, approved, checked in the directory, then deleted
