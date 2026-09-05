# Graduates Corner

Graduates Corner is a Next.js platform for graduate opportunities, research positions, trainee programs, and career guidance.

## Environment setup

1. Duplicate `.env.example` as `.env.local`.
2. Configure the browser-safe Supabase URL and anon key.
3. Configure server-only secrets only in the deployment platform and local server environment.
4. Run `yarn security:secrets` before committing or deploying.

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is intentionally visible in the browser. It is safe only while Row Level Security remains enabled on every exposed Supabase table and storage write policies remain restrictive. `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `CRON_SECRET` are server-only and must never use a `NEXT_PUBLIC_` prefix.

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

Optional website analytics are disabled. The application does not load Vercel Analytics or Google Analytics. Re-enabling analytics requires a review of its lawful basis, provider terms, applicable consent requirements, and privacy notice.

## University PhD imports

The admin dashboard includes a review-first import pipeline for Swedish,
Norwegian, Dutch, and Finnish university vacancies. It supports approved HTML
portals, Varbi, ReachMee, Linkoping University's RSS feed, SLU's public
sitemap, the public Jobbnorge vacancy API, AcademicTransfer's public browser
data API, and University of Turku's official TalentAdore JSON feed. Arbitrary
user-supplied feed URLs are not accepted.

- Apply `supabase_phd_imports_setup.sql` to add the source registry, run
  history, deduplication ledger, and review queue. A fresh environment may use
  the complete `supabase_setup.sql` instead.
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` server-only. The import
  tables have RLS enabled and grant no browser access.
- Vercel runs `/api/cron/import-phd` daily at 07:00 UTC. New records enter the
  admin review queue by default; auto-publishing is an explicit per-source
  setting.
- Deduplication preserves each university's public vacancy URL and checks the
  canonical URL, normalized university plus official vacancy ID, then a strict
  title/university/deadline fallback for legacy posts. Repeated scans update
  `last_seen_at` and link the import ledger to an existing post instead of
  creating a duplicate.
- Network feeds resolve each record to an allowlisted university before it can
  enter the queue. Every imported post stores its country and up to five
  relevant research fields for public country, university, and field filters.
- Review source health and parser errors in `Admin > University Imports`.
  University portal markup can change, so a failed source should be inspected
  before auto-publishing is enabled.

Only import public vacancy data that the source permits you to access. Keep the
official source link on every imported listing and honor applicable terms,
robots directives, and removal requests.

## Trainee program imports

The trainee importer follows the same review-first workflow at
`Admin > Program Imports`. TraineeGuiden, Graduateships, TargetJobs, Higherin,
and Milkround have source-specific adapters; Vercel scans production-ready sources daily
at 08:00 UTC. Candidates with usable future deadlines enter a private queue and
can be published individually or through the duplicate-safe `Publish all`
action.

- Apply `supabase_trainee_imports_setup.sql` in an existing environment, or use
  the complete `supabase_setup.sql` for a fresh environment.
- Repeated scans match canonical URLs, source vacancy IDs, and a strict
  title/company/deadline fallback before creating a public trainee program.
- Imported descriptions are concise attributed factual summaries. The original
  listing remains the canonical source for full responsibilities, eligibility,
  benefits, and application instructions.
- Graduate Programmes is registered but disabled because it does not expose a
  reliable current-vacancy feed with deadlines. Gradcracker and EURES remain
  permission-gated because their published terms do not permit this scraping
  and republication workflow.
- Milkround remains registered but paused because listing requests time out
  from the production Vercel network. Enable it only after connecting a
  reliable authorized feed or server endpoint.

## GDPR readiness

Privacy improvements and outstanding production requirements are documented in [docs/GDPR_READINESS.md](docs/GDPR_READINESS.md). Apply `supabase_privacy_upgrade.sql` to existing databases and configure the legal operator details before launch. These code changes alone do not establish GDPR compliance.
