-- Apply after supabase_setup.sql / supabase_security_upgrade.sql.
-- Restrictive policy also blocks access if an old permissive policy survives.
-- Public content keeps its explicit author attribution; profile joins return null.
BEGIN;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are private by default" ON public.profiles;
CREATE POLICY "Profiles are private by default" ON public.profiles
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (auth.uid() = id);
-- Privileged admin APIs use the server-only service role, which bypasses RLS.
COMMIT;
