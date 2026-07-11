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

-- Legacy admin login table used by /api/admin/auth/login. Keep it server-only:
-- the app reads it through the Supabase service role and no client RLS policies
-- are created for it.
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper for RLS policies. SECURITY DEFINER avoids recursive policy checks when
-- policies need to know whether the current authenticated user is an admin.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND type = 'admin'
  );
$$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainee_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Reset policies so this script is repeatable.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

DROP POLICY IF EXISTS "Approved theses are viewable by everyone" ON public.theses;
DROP POLICY IF EXISTS "Users can view their own theses" ON public.theses;
DROP POLICY IF EXISTS "Admins can view all theses" ON public.theses;
DROP POLICY IF EXISTS "Organizations can insert theses" ON public.theses;
DROP POLICY IF EXISTS "Users can insert pending own theses" ON public.theses;
DROP POLICY IF EXISTS "Admins can insert theses" ON public.theses;
DROP POLICY IF EXISTS "Users can update their own theses" ON public.theses;
DROP POLICY IF EXISTS "Admins can update theses" ON public.theses;
DROP POLICY IF EXISTS "Admins can delete theses" ON public.theses;

DROP POLICY IF EXISTS "Approved trainee programs viewable by everyone" ON public.trainee_programs;
DROP POLICY IF EXISTS "Users can view their own trainee programs" ON public.trainee_programs;
DROP POLICY IF EXISTS "Admins can view all trainee programs" ON public.trainee_programs;
DROP POLICY IF EXISTS "Users can insert pending own trainee programs" ON public.trainee_programs;
DROP POLICY IF EXISTS "Admins can insert trainee programs" ON public.trainee_programs;
DROP POLICY IF EXISTS "Users can update their own trainee programs" ON public.trainee_programs;
DROP POLICY IF EXISTS "Admins can update trainee programs" ON public.trainee_programs;
DROP POLICY IF EXISTS "Admins can delete trainee programs" ON public.trainee_programs;

DROP POLICY IF EXISTS "Approved blog posts viewable by everyone" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can view their own blog posts" ON public.blog_posts;
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
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (name, organization, bio, avatar) ON public.profiles TO authenticated;

-- Profile emails and internal verification notes must never be exposed through
-- public or signed-in PostgREST queries. Auth email remains available through
-- Supabase Auth, and privileged admin APIs use the service role.
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, name, type, organization, bio, avatar,
  is_verified, verified_at, verification_badge, created_at
) ON public.profiles TO anon, authenticated;

-- Theses policies
CREATE POLICY "Approved theses are viewable by everyone" ON public.theses
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view their own theses" ON public.theses
  FOR SELECT USING (auth.uid() = posted_by_user_id);
CREATE POLICY "Admins can view all theses" ON public.theses
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can insert pending own theses" ON public.theses
  FOR INSERT WITH CHECK (
    auth.uid() = posted_by_user_id
    AND status = 'pending'
    AND posted_by IN ('university', 'company')
  );
CREATE POLICY "Admins can insert theses" ON public.theses
  FOR INSERT WITH CHECK (public.is_admin() AND posted_by = 'admin' AND status = 'approved');
CREATE POLICY "Users can update their own theses" ON public.theses
  FOR UPDATE USING (auth.uid() = posted_by_user_id)
  WITH CHECK (auth.uid() = posted_by_user_id AND status = 'pending');
CREATE POLICY "Admins can update theses" ON public.theses
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete theses" ON public.theses
  FOR DELETE USING (public.is_admin());

-- Trainee program policies
CREATE POLICY "Approved trainee programs viewable by everyone" ON public.trainee_programs
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view their own trainee programs" ON public.trainee_programs
  FOR SELECT USING (auth.uid() = posted_by_user_id);
CREATE POLICY "Admins can view all trainee programs" ON public.trainee_programs
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can insert pending own trainee programs" ON public.trainee_programs
  FOR INSERT WITH CHECK (
    auth.uid() = posted_by_user_id
    AND status = 'pending'
    AND posted_by = 'company'
  );
CREATE POLICY "Admins can insert trainee programs" ON public.trainee_programs
  FOR INSERT WITH CHECK (public.is_admin() AND posted_by = 'admin' AND status = 'approved');
CREATE POLICY "Users can update their own trainee programs" ON public.trainee_programs
  FOR UPDATE USING (auth.uid() = posted_by_user_id)
  WITH CHECK (auth.uid() = posted_by_user_id AND status = 'pending');
CREATE POLICY "Admins can update trainee programs" ON public.trainee_programs
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete trainee programs" ON public.trainee_programs
  FOR DELETE USING (public.is_admin());

-- Blog post policies
CREATE POLICY "Approved blog posts viewable by everyone" ON public.blog_posts
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view their own blog posts" ON public.blog_posts
  FOR SELECT USING (auth.uid() = posted_by_user_id);
CREATE POLICY "Admins can view all blog posts" ON public.blog_posts
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can insert pending own blog posts" ON public.blog_posts
  FOR INSERT WITH CHECK (auth.uid() = posted_by_user_id AND status = 'pending');
CREATE POLICY "Admins can insert blog posts" ON public.blog_posts
  FOR INSERT WITH CHECK (public.is_admin() AND status = 'approved');
CREATE POLICY "Users can update their own blog posts" ON public.blog_posts
  FOR UPDATE USING (auth.uid() = posted_by_user_id)
  WITH CHECK (auth.uid() = posted_by_user_id AND status = 'pending');
CREATE POLICY "Admins can update blog posts" ON public.blog_posts
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete blog posts" ON public.blog_posts
  FOR DELETE USING (public.is_admin());

-- Blog comment policies
CREATE POLICY "Approved blog comments viewable by everyone" ON public.blog_comments
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view their own blog comments" ON public.blog_comments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all blog comments" ON public.blog_comments
  FOR SELECT USING (public.is_admin());
-- Comments are disabled in the product. Keep the table for old records but do
-- not allow new anonymous submissions.
REVOKE INSERT ON public.blog_comments FROM anon, authenticated;
CREATE POLICY "Admins can update blog comments" ON public.blog_comments
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete blog comments" ON public.blog_comments
  FOR DELETE USING (public.is_admin());

-- Testimonial policies
CREATE POLICY "Approved testimonials viewable by everyone" ON public.testimonials
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view their own testimonials" ON public.testimonials
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all testimonials" ON public.testimonials
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can insert pending own testimonials" ON public.testimonials
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Users can update their own testimonials" ON public.testimonials
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins can update testimonials" ON public.testimonials
  FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete testimonials" ON public.testimonials
  FOR DELETE USING (public.is_admin());

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
  FOR SELECT USING (public.is_admin());

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
