# GDPR readiness — September 5, 2026

Status: technical improvements implemented; **not a certification of compliance**. Production deployment status is recorded below.

## Implemented

- Optional Vercel Analytics removed, including its CSP permissions. External image preconnections removed.
- Privacy notice and registration disclosure, plus `/privacy` with authenticated JSON download and email rights requests. Email is opened, never automatically sent.
- Export uses a server-verified session ID, filters every table to that account, paginates, excludes auth tokens and internal verification notes, returns no-store responses, and fails rather than delivering a partial result after a database error.
- SQL setup and security upgrade limit profile reads to the owner. Privileged admin APIs use the server-only service role. `supabase_privacy_upgrade.sql` adds a restrictive policy that also guards against older permissive SELECT policies, without depending on helper functions absent from older deployments.
- Users can clear their saved opportunities and application markers with explicit confirmation; the server verifies authentication, same origin, category, and account ownership. Comparison lists can also be cleared.
- Replacing/removing a profile photo deletes the owned storage object. Failed profile saves attempt upload cleanup; storage failures are surfaced. An explicitly removed Google photo is no longer restored by the loaded-profile fallback. Previously orphaned images and cached copies still require separate review.
- Public author text remains visible on approved content. Public profile joins now return null: avatars and profile-derived verification badges are intentionally unavailable to other users. If required, add a separate minimal public publishing identity with explicit visibility controls; do not reopen profile access.

## Required before claiming readiness

1. Supply `PRIVACY_CONTROLLER_NAME` and `PRIVACY_CONTROLLER_ADDRESS` in the server environment. Privacy email admin@graduatescorner.com was confirmed. Determine whether a DPO or EU representative is required and publish details if applicable.
2. Apply database migrations in staging and verify anonymous, owner, other-user, and admin access. Check the deployed schema and storage policies, not just the SQL files. Do not use real user records as test fixtures.
3. Confirm the purposes and lawful bases in the notice. Maintain a processing inventory and legitimate-interest assessments for security and any third-party personal data in imported listings. Assess Article 14 notice duties for sourced personal data, minors, and whether a DPIA is needed. No marketing without an appropriate separate process.
4. Verify Supabase, Vercel, Google, email, image-provider and other actual subprocessors, contracts/DPAs, data locations, transfer mechanisms and assessments. EU hosting alone is insufficient. Complete the notice with actual transfer information.
5. Approve specific retention periods for accounts, inactive accounts, submitted content, correspondence, logs, backups, and caches. Implement scheduled cleanup and verify it. Current account/content storage has no automatic retention enforcement.
6. Assign an owner to the privacy mailbox, log requests securely and minimally, verify identity proportionately, and respond within one month. Track extensions and refusals. Test access, correction, deletion, restriction, objection, and portability end to end. A mailto link is not a tracked request system.
7. For erasure, identify all subject data BEFORE deleting the auth user: profile, wishlist, applications, listings, blogs, comments (including unlinked/email-based comments), testimonials, denormalized author names, avatar and blog-cover files, email, processor records, and caches. Foreign keys using ON DELETE SET NULL leave personal text behind. Remove storage objects before auth deletion where required. Document exceptions, notify recipients where required, and prevent restored backups from resurrecting erased data. Do not claim self-service instant erasure.
8. Review publicly accessible avatar/blog-cover buckets and existing objects; making a profile private does not revoke known public file URLs. Decide private authenticated delivery versus intentional public publication. Inventory arbitrary external image URLs in rich content. Configure cache purging and verify erasure across variants.
9. Verify production TLS, least-privilege admin access, MFA, session revocation, email verification, rate limits on authentication/export endpoints, log redaction, backup protection, restore tests, and patching. The export requires the server-only service-role credential and must not be cached by a CDN.
10. Document breach detection, incident ownership, risk assessment, and notification: supervisory authority within 72 hours of awareness where required, and affected individuals without undue delay where high risk. Record decisions and exercise the process.

## Verification before deployment

Local validation passed: production build, TypeScript typecheck, targeted ESLint, secret scan, and both privacy test scripts (`npm run test:privacy`). Tests cover authentication, subject isolation, pagination past 1,000 rows, cache protection, secret exclusion, query failure handling, deletion category allowlists, origin checks, and avatar ownership boundaries. The production build uses stubs locally because local provider credentials are absent. Browser verification confirmed the privacy page renders; the local signed-out export returns 401 with no-store headers.

- Export: signed-out returns 401; user A cannot export user B through query/body/header input; more than 1,000 owned records export without truncation; query failure returns an error; no token or secret in JSON; cache headers persist through hosting.
- Profiles: anonymous and unrelated authenticated clients cannot list/read private profiles; owner can read/update permitted fields; admin access works; approved public content still renders with null profile joins.
- Browser: registration notice visible before either sign-up method; privacy link usable on mobile; JSON download works; mailto describes actual behavior; no analytics script or analytics request on navigation.
- September 5: applied the restrictive profile SELECT policy to the existing GraduateHub production database through the Supabase SQL editor. No user records were deleted by the migration. Provider contracts, retention enforcement, full erasure workflows, and authenticated end-to-end export/file tests still require verification.

## Sources

- GDPR: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- EDPB rights guidance: https://www.edpb.europa.eu/sme/be-compliant/respect-individuals-rights_en
- EDPB small-business guide: https://www.edpb.europa.eu/sme_en

Review this document alongside the public notice whenever processing changes.
