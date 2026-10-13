# Deployment

The site is a Next.js server application with a PostgreSQL database and file storage. Choose one of the options below.

> GitHub Pages cannot host this site (no server, no database). If Pages is enabled for this repository, turn it off under **Settings → Pages**.

---

## Option A: Vercel + Supabase (recommended)

Both have free tiers that suit a community reunion site.

### 1. Supabase project

1. Create a project at <https://supabase.com> (choose a nearby region, e.g. Singapore or Mumbai).
2. **Database connection strings**: open **Connect** in the project dashboard.
   - *Session pooler* URI (port **5432**): use it to run migrations from your computer.
   - *Transaction pooler* URI (port **6543**): use it as `DATABASE_URL` on Vercel. The app already disables prepared statements, which transaction pooling requires.
3. **Run migrations and create the first organizer** from your computer:

   ```bash
   export DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
   export DATABASE_SSL=require
   npm run db:migrate
   npm run admin:create -- --email organizer@example.com --name "আয়োজকের নাম"
   ```

   Do **not** run `npm run db:seed` against the production database.

   The migration enables Row Level Security on every table without adding policies. Supabase's `anon` and `authenticated` keys therefore cannot read or change any data. Only the server, which connects as the database owner, can.

4. **Storage bucket**: go to **Storage → New bucket**:
   - Name: `reunion-media`
   - **Public bucket: OFF** (the app serves files itself after checking approval and consent)
   - Restrict file size to 5 MB and allowed MIME types to `image/webp` (the server re-encodes every upload to WebP)
5. Copy the **service_role** key from **Project Settings → API keys**. It is a secret: put it only in Vercel's server environment variables, never in client code.

### 2. Vercel project

1. Import the GitHub repository at <https://vercel.com/new>. The framework preset is Next.js; the default build command is fine.
2. Set **Environment Variables** (Production and Preview):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-domain.example` |
   | `DATABASE_URL` | Transaction pooler URI (port 6543) |
   | `DATABASE_SSL` | `require` |
   | `DATABASE_POOL_MAX` | `2` |
   | `APP_SECRET` | output of `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `STORAGE_DRIVER` | `supabase` |
   | `SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
   | `SUPABASE_STORAGE_BUCKET` | `reunion-media` |
   | `MAX_UPLOAD_MB` | `4` (Vercel limits request bodies to 4.5 MB) |

3. Deploy, then add your domain under **Settings → Domains** and update `NEXT_PUBLIC_SITE_URL` to match.

Notes:
- `STORAGE_DRIVER=local` does **not** work on Vercel (read-only, ephemeral filesystem).
- Photos are shrunk in the browser before upload, so phone photos stay under the 4 MB limit. Sponsor logos uploaded from the admin panel must also be under about 4.5 MB on Vercel.

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
npm run admin:create -- --email organizer@example.com --name "আয়োজকের নাম"
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
