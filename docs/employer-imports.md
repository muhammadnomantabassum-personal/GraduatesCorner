# Employer thesis, internship and trainee imports

Admin entry points:

- `/n_admin/dashboard/thesis-imports`: master's theses and internships.
- `/n_admin/dashboard/employer-program-imports`: graduate and trainee programs.

Both use one source registry and shared scan history. A scan processes the next search term/page and routes matching titles to the right queue. Manual scans prioritize the current section's search terms (thesis/internship or trainee/graduate). Enable employers, then use **Scan enabled sources** or **Scan next page**. The daily 09:00 UTC cron cycles all search terms for enabled sources, oldest scan first, with three workers and a bounded runtime. Browser batches use two workers. Each source has a database lease to prevent overlapping scans. Detail failures retry twice before advancing, so one broken posting cannot stall later pages indefinitely.

## Setup

Apply `supabase_employer_imports_setup.sql` before deploying. It adds private source, run and review tables, atomic publication functions, and additive columns on public listings. Existing listings are retained. Existing admin/service-role and `CRON_SECRET` configuration is reused. New sources and auto-publication start disabled; enable the desired sources in the dashboard.

## Coverage and limits

The catalogue includes the supplied employers across Sweden, Norway, Finland, Netherlands and Germany, plus consulting firms and FINN. A catalogue entry is not a claim that the site can currently be crawled. The dashboard distinguishes configured endpoints from career pages needing discovery and reports blocked or changed endpoints.

Implemented adapters: Workday public job search/details, SmartRecruiters public postings, Eightfold public careers search, SuccessFactors search pages, Siemens Avature search/detail pages, and HTML/JobPosting JSON-LD. Generic career pages can discover an explicitly linked Workday board. Ericsson currently uses Eightfold; Siemens' current site is Avature, and Klarna links to Deel. Neither is assumed to use the ATS suggested in the original list. No Teamtailor, Deel, Lever or Greenhouse adapter is claimed.

Live validation on 2026-09-06 returned matching candidates from ABB, Volvo, Scania, Sandvik, Saab, NXP, Philips, TNO, Kongsberg, Fraunhofer, SAP and Infineon. Other configured feeds can return no matches for the current term. Bosch and Heineken were blocked by their crawler rules. Several supplied career URLs redirect, are obsolete, require JavaScript, or deny automated requests. FINN is intentionally disabled; use original employer vacancies or an authorized feed. Sources requiring access or another adapter remain visibly unresolved rather than receiving fabricated listings.

## Duplicate protection

Existing public listings and all review statuses are checked before detail requests. Canonical URLs remove tracking parameters and normalize Workday locale/apply variants and SmartRecruiters title slugs. Source + external ID is a second identity. Database unique constraints handle races. Publication locks a candidate and uses a transaction/advisory lock to check both public sections before inserting. Ignored or previously published candidates are remembered and do not reappear as new on repeat scans. Listing index pages must still be fetched to discover new IDs; known detail pages are skipped.

## Review and data handling

Only public vacancy metadata/descriptions are imported, not applicant profiles or applications. Admin APIs require authentication, reject cross-origin mutations and return no-store responses. Import tables and publication functions are inaccessible to anonymous and ordinary authenticated users. Fetches enforce HTTPS, approved hosts, public IP addresses, redirect bounds, robots rules, response size and request/time budgets.

Missing deadlines and compensation remain null. Public tables require those fields, so incomplete candidates remain in review until confirmed from the employer's listing. Auto-publication is an explicit per-source opt-in and only attempts complete candidates. Do not invent a deadline for rolling applications. Title classification excludes doctoral and bachelor-only roles; supported country metadata filters multinational feeds. Graduates should apply on the linked employer website.

## Validation

`npm run test:employer-import` checks identities, classification, dates, crawler rules, Workday parsing, saved pagination and skipping known detail requests. `scripts/check-employer-import.sql` tests private access, source locking, destination routing and repeat publication inside a rolled-back transaction. Existing PhD and trainee tests remain separate. `node scripts/check-employer-import.mjs --live=abb,saab,nxp` checks real feeds without writing production data.
