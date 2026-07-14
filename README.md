# Graduates Corner

Graduates Corner is a Next.js platform for graduate opportunities, research positions, trainee programs, and career guidance.

## Environment setup

1. Duplicate `.env.example` as `.env.local`.
2. Configure the browser-safe Supabase URL and anon key.
3. Configure server-only secrets only in the deployment platform and local server environment.
4. Run `yarn security:secrets` before committing or deploying.

`NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_GA_MEASUREMENT_ID` are intentionally visible in the browser. The Supabase anon key is safe only while Row Level Security remains enabled on every exposed Supabase table and storage write policies remain restrictive. `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `CRON_SECRET`, `GA4_PROPERTY_ID`, `GA4_CLIENT_EMAIL`, and `GA4_PRIVATE_KEY` are server-only and must never use a `NEXT_PUBLIC_` prefix.

Generate `ADMIN_SESSION_SECRET` and `CRON_SECRET` with a cryptographically secure password generator. Use at least 32 random bytes for the admin session secret.

Admin login uses a salted PBKDF2-SHA512 hash in `ADMIN_PASSWORD_HASH`; never store the plaintext password. The retired `admin_users` database table is dropped by the current security SQL so credentials cannot become exposed through a database policy regression.

## Security warning

Environment files containing Supabase configuration existed in earlier Git history. Removing them from the current tree does not remove their old values from reachable commits. Rotate every credential or key that was ever committed or shared outside the deployment secret store before production use, including old Supabase anon, publishable, secret/service-role, access, and deployment tokens. Invalidate existing admin sessions after rotating `ADMIN_SESSION_SECRET`.

The SQL schema in `supabase_setup.sql` enables Row Level Security on every application table. Apply the current schema and `supabase_security_upgrade.sql` to each Supabase environment, then verify RLS and policies in the Supabase dashboard before exposing an anon key.

## Validation

```bash
yarn security:secrets
yarn lint
npx tsc --noEmit
yarn build
```

## Search visibility

- Sitemap: `https://graduatescorner.com/sitemap.xml`
- Robots: `https://graduatescorner.com/robots.txt`
- Opportunity and article feed: `https://graduatescorner.com/feed.xml`
- Operational launch checklist: [`docs/SEO_LAUNCH_PLAN.md`](docs/SEO_LAUNCH_PLAN.md)

Set `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` in the deployment
environment after creating the corresponding webmaster accounts. Search
rankings cannot be guaranteed; avoid purchased or automated backlinks.

## Traffic analytics

Vercel Web Analytics remains enabled for anonymous platform-level traffic. Optional Google Analytics 4 is consent-gated and adds acquisition, engagement, geography, content, and conversion reporting to the protected admin dashboard.

1. Create a GA4 property and web data stream for `https://graduatescorner.com`.
2. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` to the stream's public `G-...` measurement ID.
3. Enable the Google Analytics Data API in a Google Cloud project and create a service account.
4. Add the service-account email to the GA4 property with Viewer access.
5. Add `GA4_PROPERTY_ID`, `GA4_CLIENT_EMAIL`, and `GA4_PRIVATE_KEY` as server-only Vercel environment variables.
6. Redeploy, accept optional analytics on the public site, and confirm the admin Overview traffic section connects.

The admin reporting endpoint authenticates every request and caches aggregate reports briefly. Raw visitor records and Google credentials are never returned to the browser.
