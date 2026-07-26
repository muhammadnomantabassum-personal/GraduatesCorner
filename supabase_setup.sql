-- Hardened database setup for GraduatesCorner

-- 1. Profiles (extends Supabase Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('student', 'university', 'company', 'admin')) NOT NULL,
  organization TEXT,
  bio TEXT,
  avatar TEXT,
  welcome_email_sent BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  verification_note TEXT,
  verification_badge TEXT DEFAULT 'verified' CHECK (verification_badge IN ('verified', 'trusted', 'featured')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_by TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_note TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_badge TEXT DEFAULT 'verified';

-- 2. Theses
CREATE TABLE IF NOT EXISTS public.theses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('master', 'phd')) NOT NULL,
  description TEXT NOT NULL,
  subject TEXT NOT NULL,
  organization TEXT NOT NULL,
  organization_type TEXT CHECK (organization_type IN ('university', 'company')) NOT NULL,
  location TEXT NOT NULL,
  compensation TEXT CHECK (compensation IN ('paid', 'unpaid', 'stipend')) NOT NULL,
  deadline DATE NOT NULL,
  posted_by TEXT CHECK (posted_by IN ('university', 'company', 'admin')) NOT NULL,
  posted_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  external_url TEXT,
  status TEXT CHECK (status IN ('approved', 'pending', 'rejected')) DEFAULT 'pending',
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.theses ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- 3. Trainee Programs
CREATE TABLE IF NOT EXISTS public.trainee_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  field TEXT NOT NULL,
  location TEXT NOT NULL,
  duration TEXT NOT NULL,
  compensation TEXT CHECK (compensation IN ('paid', 'unpaid', 'stipend')) NOT NULL,
  deadline DATE NOT NULL,
  posted_by TEXT CHECK (posted_by IN ('company', 'admin')) NOT NULL,
  posted_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  external_url TEXT,
  status TEXT CHECK (status IN ('approved', 'pending', 'rejected')) DEFAULT 'pending',
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.trainee_programs ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- 4. Blog Posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  cover_image TEXT,
  read_time TEXT,
  status TEXT CHECK (status IN ('approved', 'pending', 'rejected')) DEFAULT 'pending',
  posted_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author TEXT NOT NULL,
  role TEXT CHECK (role IN ('student', 'university', 'company', 'admin')) NOT NULL,
  organization TEXT,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  status TEXT CHECK (status IN ('approved', 'pending', 'rejected')) DEFAULT 'pending',
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Blog Comments
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_email TEXT,
  content TEXT NOT NULL,
  status TEXT CHECK (status IN ('approved', 'pending', 'rejected')) DEFAULT 'pending',
  is_anonymous BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blog_comments ADD COLUMN IF NOT EXISTS author_email TEXT;
ALTER TABLE public.blog_comments ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT TRUE;

-- 7. Wishlist
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  thesis_id UUID REFERENCES public.theses(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.trainee_programs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT only_one_item CHECK (
    (thesis_id IS NOT NULL AND program_id IS NULL) OR
    (thesis_id IS NULL AND program_id IS NOT NULL)
  ),
  UNIQUE (user_id, thesis_id),
  UNIQUE (user_id, program_id)
);

-- 8. Applications
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  thesis_id UUID REFERENCES public.theses(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.trainee_programs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT only_one_item_applied CHECK (
    (thesis_id IS NOT NULL AND program_id IS NULL) OR
    (thesis_id IS NULL AND program_id IS NOT NULL)
  ),
  UNIQUE (user_id, thesis_id),
  UNIQUE (user_id, program_id)
);

-- 9. University PhD import registry, run history, and review queue
ALTER TABLE public.theses ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.theses ADD COLUMN IF NOT EXISTS source_name TEXT;
ALTER TABLE public.theses ADD COLUMN IF NOT EXISTS source_published_at DATE;
ALTER TABLE public.theses ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS theses_external_url_unique
  ON public.theses (external_url)
  WHERE external_url IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.phd_import_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  country TEXT NOT NULL,
  source_url TEXT NOT NULL,
  public_url TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('html', 'feed', 'sitemap')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  auto_publish BOOLEAN NOT NULL DEFAULT FALSE,
  last_checked_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  consecutive_failures INTEGER NOT NULL DEFAULT 0 CHECK (consecutive_failures >= 0),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.phd_import_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL REFERENCES public.phd_import_sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'partial', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  found_count INTEGER NOT NULL DEFAULT 0 CHECK (found_count >= 0),
  new_count INTEGER NOT NULL DEFAULT 0 CHECK (new_count >= 0),
  duplicate_count INTEGER NOT NULL DEFAULT 0 CHECK (duplicate_count >= 0),
  published_count INTEGER NOT NULL DEFAULT 0 CHECK (published_count >= 0),
  error_count INTEGER NOT NULL DEFAULT 0 CHECK (error_count >= 0),
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS public.phd_import_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL REFERENCES public.phd_import_sources(id) ON DELETE CASCADE,
  run_id UUID REFERENCES public.phd_import_runs(id) ON DELETE SET NULL,
  external_id TEXT NOT NULL,
  external_url TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  location TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  deadline DATE NOT NULL,
  published_at DATE,
  compensation TEXT NOT NULL CHECK (compensation IN ('paid', 'unpaid', 'stipend')),
  source_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'ignored')),
  thesis_id UUID REFERENCES public.theses(id) ON DELETE SET NULL,
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, external_id),
  UNIQUE (fingerprint)
);

CREATE INDEX IF NOT EXISTS phd_import_items_review_queue_idx
  ON public.phd_import_items (status, first_seen_at DESC);
CREATE INDEX IF NOT EXISTS phd_import_runs_source_started_idx
  ON public.phd_import_runs (source_id, started_at DESC);
CREATE INDEX IF NOT EXISTS phd_import_items_run_id_idx
  ON public.phd_import_items (run_id);
CREATE INDEX IF NOT EXISTS phd_import_items_thesis_id_idx
  ON public.phd_import_items (thesis_id);
CREATE INDEX IF NOT EXISTS applications_program_id_idx
  ON public.applications (program_id);
CREATE INDEX IF NOT EXISTS applications_thesis_id_idx
  ON public.applications (thesis_id);
CREATE INDEX IF NOT EXISTS blog_posts_posted_by_user_id_idx
  ON public.blog_posts (posted_by_user_id);
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

-- Admin credentials live only in server-side deployment secrets. Remove the
-- retired table so a database policy regression can never expose a login hash.
DROP TABLE IF EXISTS public.admin_users;

-- Helper for RLS policies. SECURITY DEFINER avoids recursive policy checks when
-- policies need to know whether the current authenticated user is an admin.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND type = 'admin'
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainee_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phd_import_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phd_import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phd_import_items ENABLE ROW LEVEL SECURITY;

-- Reset policies so this script is repeatable.
-- Remove policy drift from older deployments, including permissive policy
-- names that predate this setup file.
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

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

DROP POLICY IF EXISTS "Approved theses are viewable by everyone" ON public.theses;
DROP POLICY IF EXISTS "Users can view their own theses" ON public.theses;
DROP POLICY IF EXISTS "Visible theses" ON public.theses;
DROP POLICY IF EXISTS "Admins can view all theses" ON public.theses;
DROP POLICY IF EXISTS "Organizations can insert theses" ON public.theses;
DROP POLICY IF EXISTS "Users can insert pending own theses" ON public.theses;
DROP POLICY IF EXISTS "Admins can insert theses" ON public.theses;
DROP POLICY IF EXISTS "Users can update their own theses" ON public.theses;
DROP POLICY IF EXISTS "Admins can update theses" ON public.theses;
DROP POLICY IF EXISTS "Admins can delete theses" ON public.theses;

DROP POLICY IF EXISTS "Approved trainee programs viewable by everyone" ON public.trainee_programs;
DROP POLICY IF EXISTS "Users can view their own trainee programs" ON public.trainee_programs;
DROP POLICY IF EXISTS "Visible trainee programs" ON public.trainee_programs;
DROP POLICY IF EXISTS "Admins can view all trainee programs" ON public.trainee_programs;
DROP POLICY IF EXISTS "Users can insert pending own trainee programs" ON public.trainee_programs;
DROP POLICY IF EXISTS "Admins can insert trainee programs" ON public.trainee_programs;
DROP POLICY IF EXISTS "Users can update their own trainee programs" ON public.trainee_programs;
DROP POLICY IF EXISTS "Admins can update trainee programs" ON public.trainee_programs;
DROP POLICY IF EXISTS "Admins can delete trainee programs" ON public.trainee_programs;

DROP POLICY IF EXISTS "Approved blog posts viewable by everyone" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can view their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Visible blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can view all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can insert pending own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can insert blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can update their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can delete blog posts" ON public.blog_posts;

DROP POLICY IF EXISTS "Approved blog comments viewable by everyone" ON public.blog_comments;
DROP POLICY IF EXISTS "Users can view their own blog comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Admins can view all blog comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Anyone can insert pending blog comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Admins can update blog comments" ON public.blog_comments;
DROP POLICY IF EXISTS "Admins can delete blog comments" ON public.blog_comments;

DROP POLICY IF EXISTS "Approved testimonials viewable by everyone" ON public.testimonials;
DROP POLICY IF EXISTS "Users can view their own testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Visible testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can view all testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Users can insert pending own testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Users can update their own testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can update testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can delete testimonials" ON public.testimonials;

DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can insert into their own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can delete from their own wishlist" ON public.wishlist;

DROP POLICY IF EXISTS "Users can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can insert into their own applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applications;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id AND type IN ('student', 'university', 'company'));
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND type IN ('student', 'university', 'company')
  );
CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT INSERT (id, name, email, type, organization) ON public.profiles TO authenticated;
GRANT UPDATE (name, organization, bio, avatar, type) ON public.profiles TO authenticated;

-- Profile emails and internal verification notes must never be exposed through
-- public or signed-in PostgREST queries. Auth email remains available through
-- Supabase Auth, and privileged admin APIs use the service role.
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, name, type, organization, bio, avatar,
  is_verified, verified_at, verification_badge, created_at
) ON public.profiles TO anon, authenticated;

REVOKE ALL ON public.theses FROM anon, authenticated;
GRANT SELECT ON public.theses TO anon, authenticated;
GRANT INSERT, UPDATE ON public.theses TO authenticated;

REVOKE ALL ON public.trainee_programs FROM anon, authenticated;
GRANT SELECT ON public.trainee_programs TO anon, authenticated;
GRANT INSERT, UPDATE ON public.trainee_programs TO authenticated;

REVOKE ALL ON public.blog_posts FROM anon, authenticated;
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE ON public.blog_posts TO authenticated;

REVOKE ALL ON public.blog_comments FROM anon, authenticated;
GRANT SELECT ON public.blog_comments TO anon, authenticated;

REVOKE ALL ON public.testimonials FROM anon, authenticated;
GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT INSERT, UPDATE ON public.testimonials TO authenticated;

REVOKE ALL ON public.wishlist FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.wishlist TO authenticated;

REVOKE ALL ON public.applications FROM anon, authenticated;
GRANT SELECT, INSERT ON public.applications TO authenticated;

REVOKE ALL ON public.phd_import_sources FROM anon, authenticated;
REVOKE ALL ON public.phd_import_runs FROM anon, authenticated;
REVOKE ALL ON public.phd_import_items FROM anon, authenticated;
GRANT ALL ON public.phd_import_sources TO service_role;
GRANT ALL ON public.phd_import_runs TO service_role;
GRANT ALL ON public.phd_import_items TO service_role;

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

-- Theses policies
CREATE POLICY "Visible theses" ON public.theses
  FOR SELECT TO anon, authenticated
  USING (
    status = 'approved'
    OR (SELECT auth.uid()) = posted_by_user_id
    OR (SELECT public.is_admin())
  );
CREATE POLICY "Users can insert pending own theses" ON public.theses
  FOR INSERT WITH CHECK (
    auth.uid() = posted_by_user_id
    AND status = 'pending'
    AND posted_by IN ('university', 'company')
  );
CREATE POLICY "Admins can insert theses" ON public.theses
  FOR INSERT TO authenticated WITH CHECK (public.is_admin() AND posted_by = 'admin' AND status = 'approved');
CREATE POLICY "Users can update their own theses" ON public.theses
  FOR UPDATE USING (auth.uid() = posted_by_user_id)
  WITH CHECK (auth.uid() = posted_by_user_id AND status = 'pending');
CREATE POLICY "Admins can update theses" ON public.theses
  FOR UPDATE TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete theses" ON public.theses
  FOR DELETE TO authenticated USING (public.is_admin());

-- Trainee program policies
CREATE POLICY "Visible trainee programs" ON public.trainee_programs
  FOR SELECT TO anon, authenticated
  USING (
    status = 'approved'
    OR (SELECT auth.uid()) = posted_by_user_id
    OR (SELECT public.is_admin())
  );
CREATE POLICY "Users can insert pending own trainee programs" ON public.trainee_programs
  FOR INSERT WITH CHECK (
    auth.uid() = posted_by_user_id
    AND status = 'pending'
    AND posted_by = 'company'
  );
CREATE POLICY "Admins can insert trainee programs" ON public.trainee_programs
  FOR INSERT TO authenticated WITH CHECK (public.is_admin() AND posted_by = 'admin' AND status = 'approved');
CREATE POLICY "Users can update their own trainee programs" ON public.trainee_programs
  FOR UPDATE USING (auth.uid() = posted_by_user_id)
  WITH CHECK (auth.uid() = posted_by_user_id AND status = 'pending');
CREATE POLICY "Admins can update trainee programs" ON public.trainee_programs
  FOR UPDATE TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete trainee programs" ON public.trainee_programs
  FOR DELETE TO authenticated USING (public.is_admin());

-- Blog post policies
CREATE POLICY "Visible blog posts" ON public.blog_posts
  FOR SELECT TO anon, authenticated
  USING (
    status = 'approved'
    OR (SELECT auth.uid()) = posted_by_user_id
    OR (SELECT public.is_admin())
  );
CREATE POLICY "Users can insert pending own blog posts" ON public.blog_posts
  FOR INSERT WITH CHECK (auth.uid() = posted_by_user_id AND status = 'pending');
CREATE POLICY "Admins can insert blog posts" ON public.blog_posts
  FOR INSERT TO authenticated WITH CHECK (public.is_admin() AND status = 'approved');
CREATE POLICY "Users can update their own blog posts" ON public.blog_posts
  FOR UPDATE USING (auth.uid() = posted_by_user_id)
  WITH CHECK (auth.uid() = posted_by_user_id AND status = 'pending');
CREATE POLICY "Admins can update blog posts" ON public.blog_posts
  FOR UPDATE TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete blog posts" ON public.blog_posts
  FOR DELETE TO authenticated USING (public.is_admin());

-- Blog comment policies
CREATE POLICY "Approved blog comments viewable by everyone" ON public.blog_comments
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view their own blog comments" ON public.blog_comments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all blog comments" ON public.blog_comments
  FOR SELECT TO authenticated USING (public.is_admin());
-- Comments are disabled in the product. Keep the table for old records but do
-- not allow new anonymous submissions.
REVOKE INSERT ON public.blog_comments FROM anon, authenticated;
CREATE POLICY "Admins can update blog comments" ON public.blog_comments
  FOR UPDATE TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete blog comments" ON public.blog_comments
  FOR DELETE TO authenticated USING (public.is_admin());

-- Testimonial policies
CREATE POLICY "Visible testimonials" ON public.testimonials
  FOR SELECT TO anon, authenticated
  USING (
    status = 'approved'
    OR (SELECT auth.uid()) = user_id
    OR (SELECT public.is_admin())
  );
CREATE POLICY "Users can insert pending own testimonials" ON public.testimonials
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Users can update their own testimonials" ON public.testimonials
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins can update testimonials" ON public.testimonials
  FOR UPDATE TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete testimonials" ON public.testimonials
  FOR DELETE TO authenticated USING (public.is_admin());

-- Wishlist policies
CREATE POLICY "Users can view their own wishlist" ON public.wishlist
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into their own wishlist" ON public.wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete from their own wishlist" ON public.wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- Applications policies
CREATE POLICY "Users can view their own applications" ON public.applications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into their own applications" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all applications" ON public.applications
  FOR SELECT TO authenticated USING (public.is_admin());

-- Trigger to create profile on signup. Admin users should be promoted only by a
-- trusted server-side process or direct database maintenance, never by clients.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_type TEXT := COALESCE(new.raw_user_meta_data->>'type', 'student');
BEGIN
  IF requested_type NOT IN ('student', 'university', 'company') THEN
    requested_type := 'student';
  END IF;

  INSERT INTO public.profiles (id, name, email, type)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    requested_type
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Public search contract used by /api/search. SECURITY DEFINER is safe here
-- because every branch explicitly restricts results to approved content.
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

-- Managed Swedish university sources. Sources are review-first by default;
-- administrators may enable auto-publishing per source after validation.
INSERT INTO public.phd_import_sources (
  id, name, organization, country, source_url, public_url, platform
) VALUES
  ('uppsala-university', 'Uppsala University vacancies', 'Uppsala University', 'Sweden', 'https://www.uu.se/en/about-uu/join-us/jobs-and-vacancies', 'https://www.uu.se/en/about-uu/join-us/jobs-and-vacancies', 'html'),
  ('lund-university', 'Lund University vacancies', 'Lund University', 'Sweden', 'https://www.lunduniversity.lu.se/vacancies', 'https://www.lunduniversity.lu.se/vacancies', 'html'),
  ('university-of-gothenburg', 'University of Gothenburg vacancies', 'University of Gothenburg', 'Sweden', 'https://www.gu.se/en/work-at-the-university-of-gothenburg/vacancies', 'https://www.gu.se/en/work-at-the-university-of-gothenburg/vacancies', 'html'),
  ('stockholm-university', 'Stockholm University vacancies', 'Stockholm University', 'Sweden', 'https://su.varbi.com/en/', 'https://www.su.se/english/about-the-university/work-at-su/available-jobs', 'html'),
  ('kth', 'KTH vacancies', 'KTH Royal Institute of Technology', 'Sweden', 'https://kth.varbi.com/en/', 'https://kth.varbi.com/en/', 'html'),
  ('chalmers', 'Chalmers vacancies', 'Chalmers University of Technology', 'Sweden', 'https://web103.reachmee.com/ext/I003/304/main?site=5&validator=a72aeedd63ec10de71e46f8d91d0d57c&lang=UK', 'https://www.chalmers.se/en/about-chalmers/work-with-us/vacancies/', 'html'),
  ('linkoping-university', 'Linkoping University vacancies', 'Linkoping University', 'Sweden', 'https://liu.se/rss/liu-jobs-en.rss', 'https://liu.se/en/work-at-liu/vacancies', 'feed'),
  ('karolinska-institutet', 'Karolinska Institutet vacancies', 'Karolinska Institutet', 'Sweden', 'https://ki.se/en/vacancies', 'https://ki.se/en/vacancies', 'html'),
  ('umea-university', 'Umea University vacancies', 'Umea University', 'Sweden', 'https://umu.varbi.com/en/', 'https://umu.varbi.com/en/', 'html'),
  ('lulea-university-of-technology', 'Lulea University of Technology vacancies', 'Lulea University of Technology', 'Sweden', 'https://web103.reachmee.com/ext/I003/583/main?site=6&validator=e4575239eb8c0828707e2b716f86c5f8&lang=UK', 'https://www.ltu.se/en/about-the-university/work-with-us/job-vacancies', 'html'),
  ('orebro-university', 'Orebro University vacancies', 'Orebro University', 'Sweden', 'https://www.oru.se/english/career/available-positions/', 'https://www.oru.se/english/career/available-positions/', 'html'),
  ('malmo-university', 'Malmo University vacancies', 'Malmo University', 'Sweden', 'https://mau.se/en/about-us/job-offers/current-vacancies/', 'https://mau.se/en/about-us/job-offers/current-vacancies/', 'html'),
  ('linnaeus-university', 'Linnaeus University vacancies', 'Linnaeus University', 'Sweden', 'https://web103.reachmee.com/ext/I009/613/main?site=7&validator=696d86b542bf9f7d3a3da97c96c9eb28&lang=UK', 'https://www.lnu.se/en/meet-linnaeus-university/work-with-us/vacancies-page/', 'html'),
  ('karlstad-university', 'Karlstad University vacancies', 'Karlstad University', 'Sweden', 'https://kau.varbi.com/en/', 'https://www.kau.se/en/work-us/work/vacancies', 'html'),
  ('malardalen-university', 'Malardalen University vacancies', 'Malardalen University', 'Sweden', 'https://www.mdu.se/en/malardalen-university/about-mdu/work-with-us/job-opportunities', 'https://www.mdu.se/en/malardalen-university/about-mdu/work-with-us/job-opportunities', 'html'),
  ('slu', 'SLU vacancies', 'Swedish University of Agricultural Sciences', 'Sweden', 'https://www.slu.se/sitemap.xml', 'https://www.slu.se/en/about-slu/work-at-slu/jobs-and-vacancies/', 'sitemap'),
  ('jonkoping-university', 'Jonkoping University vacancies', 'Jonkoping University', 'Sweden', 'https://ju.se/en/about-us/work-at-jonkoping-university/job-vacancies.html', 'https://ju.se/en/about-us/work-at-jonkoping-university/job-vacancies.html', 'html')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  organization = EXCLUDED.organization,
  country = EXCLUDED.country,
  source_url = EXCLUDED.source_url,
  public_url = EXCLUDED.public_url,
  platform = EXCLUDED.platform,
  updated_at = NOW();
