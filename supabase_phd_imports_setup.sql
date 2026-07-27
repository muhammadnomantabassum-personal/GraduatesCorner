-- University PhD import registry, run history, and review queue.

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
  platform TEXT NOT NULL CHECK (platform IN ('html', 'feed', 'sitemap', 'json')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  auto_publish BOOLEAN NOT NULL DEFAULT FALSE,
  last_checked_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  consecutive_failures INTEGER NOT NULL DEFAULT 0 CHECK (consecutive_failures >= 0),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.phd_import_sources
  DROP CONSTRAINT IF EXISTS phd_import_sources_platform_check;
ALTER TABLE public.phd_import_sources
  ADD CONSTRAINT phd_import_sources_platform_check
  CHECK (platform IN ('html', 'feed', 'sitemap', 'json'));

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

ALTER TABLE public.phd_import_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phd_import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phd_import_items ENABLE ROW LEVEL SECURITY;

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
  ON public.phd_import_sources FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
CREATE POLICY "University import runs are server-only"
  ON public.phd_import_runs FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
CREATE POLICY "University import items are server-only"
  ON public.phd_import_items FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

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
  ('jonkoping-university', 'Jonkoping University vacancies', 'Jonkoping University', 'Sweden', 'https://ju.se/en/about-us/work-at-jonkoping-university/job-vacancies.html', 'https://ju.se/en/about-us/work-at-jonkoping-university/job-vacancies.html', 'html'),
  ('norwegian-universities-jobbnorge', 'Norwegian university vacancies via Jobbnorge', 'Norwegian universities', 'Norway', 'https://publicapi.jobbnorge.no/v3/jobs?OrderBy=Published&Period=All&language=1', 'https://www.jobbnorge.no/search/en?OrderBy=Published&Period=All', 'json'),
  ('netherlands-academictransfer', 'Dutch university PhD vacancies via AcademicTransfer', 'Dutch universities', 'Netherlands', 'https://www.academictransfer.com/en/job-type/phd/', 'https://www.academictransfer.com/en/job-type/phd/', 'json'),
  ('university-of-helsinki', 'University of Helsinki vacancies', 'University of Helsinki', 'Finland', 'https://jobs.helsinki.fi/search/', 'https://jobs.helsinki.fi/', 'html'),
  ('aalto-university', 'Aalto University vacancies', 'Aalto University', 'Finland', 'https://www.aalto.fi/en/open-positions', 'https://www.aalto.fi/en/open-positions', 'html'),
  ('tampere-university', 'Tampere University vacancies', 'Tampere University', 'Finland', 'https://www.tuni.fi/en/tau/work-with-us/open-positions?navref=search--list', 'https://www.tuni.fi/en/tau/work-with-us/open-positions', 'html'),
  ('university-of-turku', 'University of Turku vacancies', 'University of Turku', 'Finland', 'https://ats.talentadore.com/positions/3VMfJS4/json?v=2&display_language=en&tags=&notTags=&businessUnits=&notBusinessUnits=&display_description=job_ad&categories=tags_and_extras', 'https://www.utu.fi/en/university/come-work-with-us/open-vacancies', 'json'),
  ('university-of-jyvaskyla', 'University of Jyvaskyla vacancies', 'University of Jyvaskyla', 'Finland', 'https://www.jyu.fi/en/about-us/work-with-us/current-vacancies-at-the-university-of-jyvaskyla', 'https://www.jyu.fi/en/about-us/work-with-us/current-vacancies-at-the-university-of-jyvaskyla', 'html'),
  ('university-of-oulu', 'University of Oulu vacancies', 'University of Oulu', 'Finland', 'https://oulunyliopisto.varbi.com/en/', 'https://oulunyliopisto.varbi.com/en/', 'html'),
  ('university-of-eastern-finland', 'University of Eastern Finland vacancies', 'University of Eastern Finland', 'Finland', 'https://www.uef.fi/en/open-positions', 'https://www.uef.fi/en/open-positions', 'html'),
  ('lut-university', 'LUT University vacancies', 'LUT University', 'Finland', 'https://lut.rekrytointi.com/paikat/index.php?fid=4&lang=en&list=1&o=A_LOJ', 'https://lut.rekrytointi.com/paikat/index.php?fid=4&lang=en&list=1&o=A_LOJ', 'html'),
  ('abo-akademi-university', 'Abo Akademi University vacancies', 'Abo Akademi University', 'Finland', 'https://abo.rekrytointi.com/paikat/index.php?key=&lang=en&list=1&o=A_LOJ', 'https://abo.rekrytointi.com/paikat/index.php?key=&lang=en&list=1&o=A_LOJ', 'html')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  organization = EXCLUDED.organization,
  country = EXCLUDED.country,
  source_url = EXCLUDED.source_url,
  public_url = EXCLUDED.public_url,
  platform = EXCLUDED.platform,
  updated_at = NOW();
