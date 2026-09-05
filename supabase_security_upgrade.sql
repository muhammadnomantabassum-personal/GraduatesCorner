-- Production security upgrade: 2026-07-23
-- Safe to run repeatedly. Administrative writes use the server-only service role.

BEGIN;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles', 'theses', 'trainee_programs', 'blog_posts',
    'blog_comments', 'testimonials', 'wishlist', 'applications',
    'phd_import_sources', 'phd_import_runs', 'phd_import_items'
  ]
  LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    END IF;
  END LOOP;
END
$$;

DROP TABLE IF EXISTS public.admin_users;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_by TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_note TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_badge TEXT DEFAULT 'verified';

-- Remove every existing policy on product tables before recreating the intended
-- least-privilege contract. This also clears policy drift from older releases.
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles', 'theses', 'trainee_programs', 'blog_posts',
        'blog_comments', 'testimonials', 'wishlist', 'applications'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY %I ON %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  END LOOP;
END
$$;

DROP FUNCTION IF EXISTS public.is_admin();

-- New users may request a public account type, but client-controlled metadata
-- can never create an administrator.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requested_type TEXT := COALESCE(new.raw_user_meta_data->>'type', 'student');
BEGIN
  IF requested_type NOT IN ('student', 'university', 'company') THEN
    requested_type := 'student';
  END IF;

  INSERT INTO public.profiles (id, name, email, type)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    requested_type
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF to_regprocedure('public.content_search_trigger()') IS NOT NULL THEN
    ALTER FUNCTION public.content_search_trigger() SET search_path = '';
    REVOKE ALL ON FUNCTION public.content_search_trigger() FROM PUBLIC, anon, authenticated;
  END IF;
END
$$;

-- RLS is the source of truth, while grants remove operations the browser never
-- needs. The service role remains unrestricted for authenticated admin APIs.
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, name, type, organization, bio, avatar,
  is_verified, verified_at, verification_badge, created_at
) ON public.profiles TO anon, authenticated;
GRANT INSERT (id, name, email, type, organization) ON public.profiles TO authenticated;
GRANT UPDATE (name, organization, bio, avatar, type) ON public.profiles TO authenticated;

REVOKE ALL ON TABLE public.theses FROM anon, authenticated;
GRANT SELECT ON public.theses TO anon, authenticated;
GRANT INSERT, UPDATE ON public.theses TO authenticated;

REVOKE ALL ON TABLE public.trainee_programs FROM anon, authenticated;
GRANT SELECT ON public.trainee_programs TO anon, authenticated;
GRANT INSERT, UPDATE ON public.trainee_programs TO authenticated;

REVOKE ALL ON TABLE public.blog_posts FROM anon, authenticated;
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE ON public.blog_posts TO authenticated;

REVOKE ALL ON TABLE public.testimonials FROM anon, authenticated;
GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT INSERT, UPDATE ON public.testimonials TO authenticated;

REVOKE ALL ON TABLE public.wishlist FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.wishlist TO authenticated;

REVOKE ALL ON TABLE public.applications FROM anon, authenticated;
GRANT SELECT, INSERT ON public.applications TO authenticated;

REVOKE ALL ON TABLE public.phd_import_sources FROM anon, authenticated;
REVOKE ALL ON TABLE public.phd_import_runs FROM anon, authenticated;
REVOKE ALL ON TABLE public.phd_import_items FROM anon, authenticated;
GRANT ALL ON TABLE public.phd_import_sources TO service_role;
GRANT ALL ON TABLE public.phd_import_runs TO service_role;
GRANT ALL ON TABLE public.phd_import_items TO service_role;

DROP POLICY IF EXISTS "University import sources are server-only" ON public.phd_import_sources;
DROP POLICY IF EXISTS "University import runs are server-only" ON public.phd_import_runs;
DROP POLICY IF EXISTS "University import items are server-only" ON public.phd_import_items;
CREATE POLICY "University import sources are server-only"
  ON public.phd_import_sources FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
CREATE POLICY "University import runs are server-only"
  ON public.phd_import_runs FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
CREATE POLICY "University import items are server-only"
  ON public.phd_import_items FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = id
    AND type IN ('student', 'university', 'company')
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK (
    (SELECT auth.uid()) = id
    AND type IN ('student', 'university', 'company')
  );

CREATE POLICY "Visible theses"
  ON public.theses FOR SELECT
  TO anon, authenticated
  USING (
    status = 'approved'
    OR (SELECT auth.uid()) = posted_by_user_id
  );

CREATE POLICY "Users can insert pending own theses"
  ON public.theses FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = posted_by_user_id
    AND status = 'pending'
    AND posted_by IN ('university', 'company')
  );

CREATE POLICY "Users can update their own theses"
  ON public.theses FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = posted_by_user_id)
  WITH CHECK (
    (SELECT auth.uid()) = posted_by_user_id
    AND status = 'pending'
    AND posted_by IN ('university', 'company')
  );

CREATE POLICY "Visible trainee programs"
  ON public.trainee_programs FOR SELECT
  TO anon, authenticated
  USING (
    status = 'approved'
    OR (SELECT auth.uid()) = posted_by_user_id
  );

CREATE POLICY "Users can insert pending own trainee programs"
  ON public.trainee_programs FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = posted_by_user_id
    AND status = 'pending'
    AND posted_by = 'company'
  );

CREATE POLICY "Users can update their own trainee programs"
  ON public.trainee_programs FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = posted_by_user_id)
  WITH CHECK (
    (SELECT auth.uid()) = posted_by_user_id
    AND status = 'pending'
    AND posted_by = 'company'
  );

CREATE POLICY "Visible blog posts"
  ON public.blog_posts FOR SELECT
  TO anon, authenticated
  USING (
    status = 'approved'
    OR (SELECT auth.uid()) = posted_by_user_id
  );

CREATE POLICY "Users can insert pending own blog posts"
  ON public.blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = posted_by_user_id
    AND status = 'pending'
  );

CREATE POLICY "Users can update their own blog posts"
  ON public.blog_posts FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = posted_by_user_id)
  WITH CHECK (
    (SELECT auth.uid()) = posted_by_user_id
    AND status = 'pending'
  );

CREATE POLICY "Visible testimonials"
  ON public.testimonials FOR SELECT
  TO anon, authenticated
  USING (
    status = 'approved'
    OR (SELECT auth.uid()) = user_id
  );

CREATE POLICY "Users can insert pending own testimonials"
  ON public.testimonials FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND status = 'pending'
  );

CREATE POLICY "Users can update their own testimonials"
  ON public.testimonials FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND status = 'pending'
  );

CREATE POLICY "Users can view their own wishlist"
  ON public.wishlist FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert into their own wishlist"
  ON public.wishlist FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete from their own wishlist"
  ON public.wishlist FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view their own applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert into their own applications"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- PostgreSQL does not index foreign keys automatically. Cover the relationship
-- columns used by ownership queries, joins, and cascading deletes.
CREATE INDEX IF NOT EXISTS applications_program_id_idx
  ON public.applications (program_id);
CREATE INDEX IF NOT EXISTS applications_thesis_id_idx
  ON public.applications (thesis_id);
CREATE INDEX IF NOT EXISTS blog_posts_posted_by_user_id_idx
  ON public.blog_posts (posted_by_user_id);
CREATE INDEX IF NOT EXISTS phd_import_items_run_id_idx
  ON public.phd_import_items (run_id);
CREATE INDEX IF NOT EXISTS phd_import_items_thesis_id_idx
  ON public.phd_import_items (thesis_id);
CREATE INDEX IF NOT EXISTS testimonials_user_id_idx
  ON public.testimonials (user_id);
CREATE INDEX IF NOT EXISTS theses_posted_by_user_id_idx
  ON public.theses (posted_by_user_id);
CREATE INDEX IF NOT EXISTS trainee_programs_posted_by_user_id_idx
  ON public.trainee_programs (posted_by_user_id);
CREATE INDEX IF NOT EXISTS wishlist_program_id_idx
  ON public.wishlist (program_id);
CREATE INDEX IF NOT EXISTS wishlist_thesis_id_idx
  ON public.wishlist (thesis_id);

-- Public search is an invoker function, so the approved-content RLS policies
-- still apply to every result.
DROP FUNCTION IF EXISTS public.global_search(TEXT);
CREATE FUNCTION public.global_search(search_term TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  meta TEXT,
  slug TEXT
)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT results.id, results.title, results.category, results.meta, results.slug
  FROM (
    SELECT
      t.id,
      t.title,
      CASE WHEN t.type = 'phd' THEN 'phd' ELSE 'thesis' END::TEXT AS category,
      concat_ws(' - ', t.organization, t.location)::TEXT AS meta,
      NULL::TEXT AS slug,
      t.created_at
    FROM public.theses t
    WHERE t.status = 'approved'
      AND length(trim(search_term)) BETWEEN 2 AND 120
      AND concat_ws(' ', t.title, t.subject, t.organization, t.location)
        ILIKE '%' || trim(search_term) || '%'

    UNION ALL

    SELECT
      p.id,
      p.title,
      'program'::TEXT AS category,
      concat_ws(' - ', p.company, p.location)::TEXT AS meta,
      NULL::TEXT AS slug,
      p.created_at
    FROM public.trainee_programs p
    WHERE p.status = 'approved'
      AND length(trim(search_term)) BETWEEN 2 AND 120
      AND concat_ws(' ', p.title, p.field, p.company, p.location)
        ILIKE '%' || trim(search_term) || '%'

    UNION ALL

    SELECT
      b.id,
      b.title,
      'blog'::TEXT AS category,
      concat_ws(' - ', b.category, b.author)::TEXT AS meta,
      b.slug,
      b.created_at
    FROM public.blog_posts b
    WHERE b.status = 'approved'
      AND length(trim(search_term)) BETWEEN 2 AND 120
      AND concat_ws(' ', b.title, b.excerpt, b.category, b.author)
        ILIKE '%' || trim(search_term) || '%'
  ) results
  ORDER BY results.created_at DESC
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.global_search(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.global_search(TEXT) TO anon, authenticated;

COMMIT;
