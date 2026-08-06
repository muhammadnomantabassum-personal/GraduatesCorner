-- Automated trainee program import registry, run history, and private review queue.

ALTER TABLE public.trainee_programs ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.trainee_programs ADD COLUMN IF NOT EXISTS source_name TEXT;
ALTER TABLE public.trainee_programs ADD COLUMN IF NOT EXISTS source_published_at DATE;
ALTER TABLE public.trainee_programs ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS trainee_programs_external_url_unique
  ON public.trainee_programs (external_url)
  WHERE external_url IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.trainee_import_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  country TEXT NOT NULL,
  source_url TEXT NOT NULL,
  public_url TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('html', 'json', 'wordpress')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  auto_publish BOOLEAN NOT NULL DEFAULT FALSE,
  last_checked_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  consecutive_failures INTEGER NOT NULL DEFAULT 0 CHECK (consecutive_failures >= 0),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trainee_import_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL REFERENCES public.trainee_import_sources(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS public.trainee_import_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL REFERENCES public.trainee_import_sources(id) ON DELETE CASCADE,
  run_id UUID REFERENCES public.trainee_import_runs(id) ON DELETE SET NULL,
  external_id TEXT NOT NULL,
  external_url TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  field TEXT NOT NULL,
  description TEXT NOT NULL,
  duration TEXT NOT NULL,
  compensation TEXT NOT NULL CHECK (compensation IN ('paid', 'unpaid', 'stipend')),
  deadline DATE NOT NULL,
  published_at DATE,
  source_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'ignored')),
  program_id UUID REFERENCES public.trainee_programs(id) ON DELETE SET NULL,
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, external_id),
  UNIQUE (fingerprint)
);

CREATE INDEX IF NOT EXISTS trainee_import_items_review_queue_idx
  ON public.trainee_import_items (status, first_seen_at DESC);
CREATE INDEX IF NOT EXISTS trainee_import_runs_source_started_idx
  ON public.trainee_import_runs (source_id, started_at DESC);
CREATE INDEX IF NOT EXISTS trainee_import_items_run_id_idx
  ON public.trainee_import_items (run_id);
CREATE INDEX IF NOT EXISTS trainee_import_items_program_id_idx
  ON public.trainee_import_items (program_id);

ALTER TABLE public.trainee_import_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainee_import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainee_import_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.trainee_import_sources FROM anon, authenticated;
REVOKE ALL ON public.trainee_import_runs FROM anon, authenticated;
REVOKE ALL ON public.trainee_import_items FROM anon, authenticated;
GRANT ALL ON public.trainee_import_sources TO service_role;
GRANT ALL ON public.trainee_import_runs TO service_role;
GRANT ALL ON public.trainee_import_items TO service_role;

DROP POLICY IF EXISTS "Trainee import sources are server-only" ON public.trainee_import_sources;
DROP POLICY IF EXISTS "Trainee import runs are server-only" ON public.trainee_import_runs;
DROP POLICY IF EXISTS "Trainee import items are server-only" ON public.trainee_import_items;

CREATE POLICY "Trainee import sources are server-only"
  ON public.trainee_import_sources FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
CREATE POLICY "Trainee import runs are server-only"
  ON public.trainee_import_runs FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
CREATE POLICY "Trainee import items are server-only"
  ON public.trainee_import_items FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

INSERT INTO public.trainee_import_sources (
  id, name, organization, country, source_url, public_url, platform, enabled
) VALUES
  ('traineeguiden-sweden', 'TraineeGuiden Sweden', 'TraineeGuiden', 'Sweden', 'https://www.traineeguiden.se/wp-json/wp/v2/trainee-program?per_page=100&page=1', 'https://www.traineeguiden.se/', 'wordpress', TRUE),
  ('graduateships', 'Graduateships graduate programmes', 'Graduateships', 'Europe', 'https://graduateships.com/job-location/eu/', 'https://graduateships.com/', 'html', TRUE),
  ('targetjobs', 'TargetJobs graduate schemes', 'TargetJobs', 'United Kingdom', 'https://targetjobs.co.uk/s/jobs/graduate-scheme', 'https://targetjobs.co.uk/', 'html', TRUE),
  ('higherin', 'Higherin graduate schemes', 'Higherin', 'United Kingdom', 'https://higherin.com/search-jobs/graduate-scheme', 'https://higherin.com/search-jobs/graduate-scheme', 'json', TRUE),
  ('milkround', 'Milkround graduate schemes', 'Milkround', 'United Kingdom', 'https://www.milkround.com/jobs/graduate-scheme', 'https://www.milkround.com/', 'html', FALSE),
  ('graduate-programmes-directory', 'Graduate Programmes directory', 'Graduate Programmes', 'International', 'https://www.graduate-programmes.com/en/graduate-programmes-list', 'https://www.graduate-programmes.com/en/graduate-programmes-list', 'html', FALSE),
  ('gradcracker', 'Gradcracker', 'Gradcracker', 'United Kingdom', 'https://www.gradcracker.com/', 'https://www.gradcracker.com/', 'html', FALSE),
  ('eures', 'EURES job mobility portal', 'European Labour Authority', 'European Union', 'https://europa.eu/eures/portal/', 'https://europa.eu/eures/portal/', 'html', FALSE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  organization = EXCLUDED.organization,
  country = EXCLUDED.country,
  source_url = EXCLUDED.source_url,
  public_url = EXCLUDED.public_url,
  platform = EXCLUDED.platform,
  updated_at = NOW();

UPDATE public.trainee_import_sources
SET enabled = FALSE, auto_publish = FALSE, updated_at = NOW()
WHERE id IN ('milkround', 'graduate-programmes-directory', 'gradcracker', 'eures');
