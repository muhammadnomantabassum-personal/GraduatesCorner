# Search visibility and maintenance

Listing pages render their public content on the server and use on-demand ISR with a five-minute revalidation interval. Public database responses are cached in batches of 100 records. Canonical routing metadata has a bounded five-minute cache. Expired opportunities lose JobPosting markup and receive noindex when the page refreshes; they are omitted from the active sitemap. Do not advertise this refresh window as instantaneous removal.

The `/opportunities` directory provides server-rendered pagination, with links to every approved, active opportunity. Ten country/subject collections provide distinct introductions and application guidance; empty collections are noindex and omitted from the sitemap. Interactive category grids initially render 24 cards. Their client-side filtering still downloads the existing listing dataset: a future large-catalogue improvement is fully server-side filtering and pagination.

Descriptive URLs include an immutable UUID suffix. Old UUID links and outdated titles permanently redirect through the proxy, avoiding duplicate redirect headers observed with this Next.js version's cold ISR redirects. Public routing lookups never use service-role credentials or private profile data.

JobPosting is emitted only for active job-like opportunities with an application URL and a resolvable country. Academic master's projects use EducationalOccupationalProgram. Unknown location data needs editorial correction, not an invented country. Internship employmentType is explicit; full-time employment, salary, and remote eligibility are not guessed. Structured data alone does not guarantee Google for Jobs inclusion.

## Webmaster setup

- Canonical property: `https://graduatescorner.com/`
- Submit `https://graduatescorner.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- The homepage includes the Google ownership verification tag; retain it after verification. Environment variables `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` can override/configure tokens.
- Review indexing and job enhancement reports after crawling. Search Console search clicks are not total visitor counts.
- Validate Core Web Vitals with field data after deployment; this change does not certify LCP, INP, or CLS targets. Existing CDN delivery, AVIF/WebP optimization and reserved card dimensions are retained.
- `supabase_seo_performance_setup.sql` adds partial type/deadline indexes. Existing full-text GIN indexes already cover search. No permission or data-retention rules are changed.

## Validation

`npm run test:seo` checks canonical identifiers, country ambiguity, schema classification, expiration and server HTML sanitization. `npm run test:seo-render` builds and starts Next against an isolated local fixture server, then checks initial HTML, redirects, 404s, expired noindex, sitemap exclusion and internal links. It overrides public Supabase variables for the test process only and does not write production data.

## Backlink outreach drafts (not sent)

Use relevant, individually selected university career-resource contacts. Follow community posting rules and avoid bulk promotional posts or purchased links.

**University careers resource request**

Subject: Graduate opportunity resource for your students

Hello [name], Graduates Corner lists PhD positions, master's thesis projects, internships and graduate trainee programs, with deadlines and links to original postings. If it would help students using your careers resources, please consider including https://graduatescorner.com/opportunities. I would welcome feedback on coverage relevant to [institution/discipline].

**Employer or university with a published listing**

Hello [name], your public opportunity [title] is listed at [canonical listing URL], with a link to your original application page. Please let us know if any details need correction. You are welcome to link to this listing from your student opportunities page.

**Academic resource editor**

Hello [name], I found your resource list for [specific audience]. Graduates Corner's [relevant country/field collection URL] may be useful alongside the resources you already include. It shows current opportunities and links applicants to the original source. Would you consider reviewing it for inclusion?

The existing About, Contact and blog pages remain available. Publish advice with real author/reviewer attribution; do not fabricate experts, endorsements or employment conditions.
