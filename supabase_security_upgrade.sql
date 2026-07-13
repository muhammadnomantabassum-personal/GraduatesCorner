-- Production security upgrade: 2026-07-11
-- Safe to run repeatedly.

BEGIN;

-- Enforce RLS even when this focused upgrade is applied without the full setup
-- script. The service role remains the only intentional bypass.
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles', 'theses', 'trainee_programs', 'blog_posts',
    'blog_comments', 'testimonials', 'wishlist', 'applications'
  ]
  LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    END IF;
  END LOOP;
END
$$;

DROP TABLE IF EXISTS public.admin_users;

DO $$
BEGIN
  IF to_regclass('public.blog_comments') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert pending blog comments" ON public.blog_comments';
    EXECUTE 'REVOKE INSERT ON public.blog_comments FROM anon, authenticated';
  END IF;
END
$$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_by TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_note TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_badge TEXT DEFAULT 'verified';

REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, name, type, organization, bio, avatar,
  is_verified, verified_at, verification_badge, created_at
) ON public.profiles TO anon, authenticated;

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
SECURITY DEFINER
SET search_path = public
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
      AND concat_ws(' ', t.title, t.subject, t.organization, t.location) ILIKE '%' || trim(search_term) || '%'

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
      AND concat_ws(' ', p.title, p.field, p.company, p.location) ILIKE '%' || trim(search_term) || '%'

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
      AND concat_ws(' ', b.title, b.excerpt, b.category, b.author) ILIKE '%' || trim(search_term) || '%'
  ) results
  ORDER BY results.created_at DESC
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.global_search(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.global_search(TEXT) TO anon, authenticated;

COMMIT;
