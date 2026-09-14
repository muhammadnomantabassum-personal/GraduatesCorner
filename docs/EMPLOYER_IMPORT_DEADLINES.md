# Automatic thesis and internship deadlines

Apply `supabase_employer_metadata_upgrade.sql` once to an existing installation before deploying this change. New installations can run the updated `supabase_employer_imports_setup.sql`. The migration preserves existing positions, duplicate protection, and access restrictions. Its rerun and publication behavior are covered by `scripts/check-employer-import.sql`.

The admin importer now offers **Fetch deadlines only** and **Fetch deadlines & publish all**. Both process all pending positions in batches and revisit each original vacancy. Publication uses fresh source details, with no manual checkbox or compensation entry. The source must provide a current deadline. Closed positions, missing deadlines, unavailable sources, and removed sources are skipped with reasons; missing deadlines are never estimated. A missing source deadline clears a previously stored date when the page was successfully fetched.

Deadline extraction supports structured `validThrough`, Workday closing fields, HTML metadata, and labelled dates in English, Swedish, Norwegian, Danish, German, Dutch, and Finnish. Publication/start dates and rolling applications are not used as invented closing dates.

Unspecified compensation is stored publicly as `not_specified` and displayed as unknown, never as paid or unpaid. Source auto-publish settings remain unchanged; enabled automatic publication now requires a current deadline but no longer requires published pay details.

Klarna uses the public Deel board and structured vacancy pages, without calling its disallowed API paths. FINN is absent from active sources; the upgrade disables its stored scheduling preferences without deleting imported records.

Validation: `npm run test:employer-import`, TypeScript, ESLint, production build, local PostgreSQL migration tests, and live read-only scans of Klarna, Volvo, and Aalto.
