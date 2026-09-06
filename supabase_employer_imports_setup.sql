-- Employer thesis, internship and graduate-program imports. No existing posts are removed.
BEGIN;
ALTER TABLE public.theses ADD COLUMN IF NOT EXISTS opportunity_kind TEXT NOT NULL DEFAULT 'master_thesis';
ALTER TABLE public.theses ADD COLUMN IF NOT EXISTS employer_import_key TEXT;
ALTER TABLE public.trainee_programs ADD COLUMN IF NOT EXISTS employer_import_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS theses_employer_import_key_unique ON public.theses(employer_import_key) WHERE employer_import_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS programs_employer_import_key_unique ON public.trainee_programs(employer_import_key) WHERE employer_import_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.employer_import_sources (
  id TEXT PRIMARY KEY, enabled BOOLEAN NOT NULL DEFAULT FALSE, auto_publish BOOLEAN NOT NULL DEFAULT FALSE,
  cursor JSONB NOT NULL DEFAULT '{"query":0,"offset":0}', last_checked_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ, last_error TEXT, lock_token UUID, lock_until TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS public.employer_import_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), source_id TEXT NOT NULL REFERENCES public.employer_import_sources(id),
  status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running','succeeded','partial','failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(), completed_at TIMESTAMPTZ,
  found INTEGER NOT NULL DEFAULT 0, added INTEGER NOT NULL DEFAULT 0, duplicates INTEGER NOT NULL DEFAULT 0,
  excluded INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 0, error_message TEXT
);
CREATE TABLE IF NOT EXISTS public.employer_import_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), source_id TEXT NOT NULL REFERENCES public.employer_import_sources(id),
  external_id TEXT NOT NULL, canonical_url TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('master_thesis','internship','trainee')),
  organization TEXT NOT NULL, location TEXT NOT NULL, description TEXT NOT NULL, field TEXT NOT NULL,
  deadline DATE, compensation TEXT CHECK(compensation IN ('paid','unpaid','stipend')),
  duration TEXT NOT NULL DEFAULT 'Not specified', published_at DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','published','ignored','duplicate')),
  thesis_id UUID REFERENCES public.theses(id) ON DELETE SET NULL,
  program_id UUID REFERENCES public.trainee_programs(id) ON DELETE SET NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(), reviewed_at TIMESTAMPTZ,
  UNIQUE(source_id, external_id)
);
CREATE INDEX IF NOT EXISTS employer_import_queue ON public.employer_import_items(kind,status,first_seen_at);
CREATE INDEX IF NOT EXISTS employer_import_runs_source ON public.employer_import_runs(source_id,started_at);
ALTER TABLE public.employer_import_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_import_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_import_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.employer_import_sources, public.employer_import_items, public.employer_import_runs FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.employer_import_sources, public.employer_import_items, public.employer_import_runs TO service_role;

CREATE OR REPLACE FUNCTION public.claim_employer_import(source_key TEXT) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE token UUID := gen_random_uuid();
BEGIN
  UPDATE public.employer_import_sources SET lock_token=token, lock_until=now()+interval '180 seconds'
  WHERE id=source_key AND (lock_until IS NULL OR lock_until<now());
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN token;
END $$;

CREATE OR REPLACE FUNCTION public.employer_canonical_url(value TEXT) RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE SET search_path = '' AS $$
DECLARE base TEXT; host TEXT; path TEXT; query TEXT; parts TEXT[];
BEGIN
  IF value IS NULL THEN RETURN NULL; END IF;
  base := split_part(value,'#',1);
  parts := regexp_match(base, '^https://([^/?]+)([^?]*)(?:\?(.*))?$');
  IF parts IS NULL THEN RETURN base; END IF;
  host := lower(regexp_replace(parts[1], ':443$', ''));
  path := parts[2];
  IF host LIKE '%.myworkdayjobs.com' THEN
    path := regexp_replace(regexp_replace(path, '^/[a-z]{2}-[a-z]{2}/', '/', 'i'), '/apply/?$', '', 'i');
  END IF;
  IF host='www.smartrecruiters.com' THEN host := 'jobs.smartrecruiters.com'; END IF;
  IF host='jobs.smartrecruiters.com' THEN path := regexp_replace(path, '/([0-9]+)-[^/]+$', '/\1'); END IF;
  path := rtrim(path,'/');
  IF path='' THEN path := '/'; END IF;
  SELECT string_agg(p,'&' ORDER BY split_part(p,'=',1) COLLATE "C", ordinal) INTO query
  FROM unnest(string_to_array(parts[3],'&')) WITH ORDINALITY AS entries(p,ordinal)
  WHERE p<>'' AND split_part(p,'=',1) !~* '^(utm_.+|source|src|ref|referrer|trackingid|lang|locale|gh_src)$';
  RETURN 'https://' || host || path || CASE WHEN query IS NULL THEN '' ELSE '?' || query END;
END
$$;

CREATE OR REPLACE FUNCTION public.publish_employer_candidate(candidate_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE item public.employer_import_items; target_id UUID; identity_key TEXT;
BEGIN
  SELECT * INTO item FROM public.employer_import_items WHERE id=candidate_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Candidate not found'; END IF;
  IF item.status IN ('published','duplicate') THEN RETURN coalesce(item.thesis_id,item.program_id); END IF;
  IF item.status='ignored' THEN RAISE EXCEPTION 'Restore an ignored candidate before publishing'; END IF;
  IF item.deadline IS NULL OR item.compensation IS NULL OR item.deadline<CURRENT_DATE THEN
    RAISE EXCEPTION 'Review requires a current confirmed deadline and compensation';
  END IF;
  identity_key := item.source_id || ':' || item.external_id;
  PERFORM pg_advisory_xact_lock(hashtextextended(item.canonical_url,0));
  -- Check both public sections; a role classified differently on a repeat scan must not duplicate.
  SELECT id INTO target_id FROM public.theses WHERE
    employer_import_key=identity_key OR public.employer_canonical_url(external_url)=item.canonical_url OR
    (lower(organization)=lower(item.organization) AND external_id IN (identity_key,item.external_id))
    ORDER BY created_at LIMIT 1;
  IF target_id IS NOT NULL THEN
    UPDATE public.employer_import_items SET status='duplicate',thesis_id=target_id,reviewed_at=now() WHERE id=item.id;
    RETURN target_id;
  END IF;
  SELECT id INTO target_id FROM public.trainee_programs WHERE
    employer_import_key=identity_key OR public.employer_canonical_url(external_url)=item.canonical_url OR
    (lower(company)=lower(item.organization) AND external_id IN (identity_key,item.external_id))
    ORDER BY created_at LIMIT 1;
  IF target_id IS NOT NULL THEN
    UPDATE public.employer_import_items SET status='duplicate',program_id=target_id,reviewed_at=now() WHERE id=item.id;
    RETURN target_id;
  END IF;
  IF item.kind='trainee' THEN
    INSERT INTO public.trainee_programs(title,company,description,field,location,duration,compensation,deadline,external_url,external_id,source_name,source_published_at,last_synced_at,posted_by,status,employer_import_key)
    VALUES(item.title,item.organization,item.description,item.field,item.location,item.duration,item.compensation,item.deadline,item.canonical_url,identity_key,item.organization,item.published_at,now(),'admin','approved',identity_key) RETURNING id INTO target_id;
    UPDATE public.employer_import_items SET status='published',program_id=target_id,reviewed_at=now() WHERE id=item.id;
  ELSE
    INSERT INTO public.theses(title,type,opportunity_kind,organization,organization_type,description,subject,location,compensation,deadline,external_url,external_id,source_name,source_published_at,last_synced_at,posted_by,status,employer_import_key)
    VALUES(item.title,'master',item.kind,item.organization,'company',item.description,item.field,item.location,item.compensation,item.deadline,item.canonical_url,identity_key,item.organization,item.published_at,now(),'admin','approved',identity_key) RETURNING id INTO target_id;
    UPDATE public.employer_import_items SET status='published',thesis_id=target_id,reviewed_at=now() WHERE id=item.id;
  END IF;
  RETURN target_id;
END $$;
REVOKE ALL ON FUNCTION public.claim_employer_import(TEXT), public.publish_employer_candidate(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_employer_import(TEXT), public.publish_employer_candidate(UUID) TO service_role;
COMMIT;
