-- Create tables for GraduatesCorner

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- For existing tables, run this:
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE;

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 6. Admin Users (for custom admin authentication)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Note: In production, passwords should be hashed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Wishlist (Students only)
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  thesis_id UUID REFERENCES public.theses(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.trainee_programs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure only one of thesis_id or program_id is set
  CONSTRAINT only_one_item CHECK (
    (thesis_id IS NOT NULL AND program_id IS NULL) OR
    (thesis_id IS NULL AND program_id IS NOT NULL)
  ),
  -- Unique constraint to prevent duplicate entries for the same user and item
  UNIQUE (user_id, thesis_id),
  UNIQUE (user_id, program_id)
);

-- Insert a default admin user
INSERT INTO public.admin_users (username, password)
VALUES ('admin', 'admin123')
ON CONFLICT (username) DO NOTHING;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainee_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Theses Policies
CREATE POLICY "Approved theses are viewable by everyone" ON public.theses
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view their own theses" ON public.theses
  FOR SELECT USING (auth.uid() = posted_by_user_id);
CREATE POLICY "Organizations can insert theses" ON public.theses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own theses" ON public.theses
  FOR UPDATE USING (auth.uid() = posted_by_user_id);

-- Trainee Programs Policies
CREATE POLICY "Approved trainee programs viewable by everyone" ON public.trainee_programs
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view their own trainee programs" ON public.trainee_programs
  FOR SELECT USING (auth.uid() = posted_by_user_id);

-- Blog Posts Policies
CREATE POLICY "Approved blog posts viewable by everyone" ON public.blog_posts
  FOR SELECT USING (status = 'approved');

-- Testimonials Policies
CREATE POLICY "Approved testimonials viewable by everyone" ON public.testimonials
  FOR SELECT USING (status = 'approved');

-- Admin Users Policies
CREATE POLICY "Admin credentials viewable for login" ON public.admin_users
  FOR SELECT USING (true);

-- 8. Applications (Students only)
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  thesis_id UUID REFERENCES public.theses(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.trainee_programs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure only one of thesis_id or program_id is set
  CONSTRAINT only_one_item_applied CHECK (
    (thesis_id IS NOT NULL AND program_id IS NULL) OR
    (thesis_id IS NULL AND program_id IS NOT NULL)
  ),
  -- Unique constraint to prevent duplicate entries for the same user and item
  UNIQUE (user_id, thesis_id),
  UNIQUE (user_id, program_id)
);

-- Wishlist Policies
CREATE POLICY "Users can view their own wishlist" ON public.wishlist
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into their own wishlist" ON public.wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete from their own wishlist" ON public.wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- Applications Policies
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own applications" ON public.applications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into their own applications" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger to create profile on signup
-- NOTE: For Google OAuth, the 'type' is NOT set in raw_user_meta_data by Google.
-- It's only set for email/password signups where we explicitly pass it.
-- The auth callback route (/auth/callback) handles role assignment via upsert
-- for Google OAuth signups, overwriting the trigger's default 'student' value.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, type)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'type', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

