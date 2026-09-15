-- Run after supabase_employer_metadata_upgrade.sql. Idempotent; retains moderation and saved records.
BEGIN;
ALTER TABLE public.theses ALTER COLUMN deadline DROP NOT NULL;
ALTER TABLE public.trainee_programs ALTER COLUMN deadline DROP NOT NULL;
ALTER TABLE public.theses
  ADD COLUMN IF NOT EXISTS deadline_type TEXT NOT NULL DEFAULT 'not_specified' CHECK (deadline_type IN ('fixed','not_specified','rolling','until_filled')),
  ADD COLUMN IF NOT EXISTS source_status TEXT NOT NULL DEFAULT 'active' CHECK (source_status IN ('active','unavailable','closed')),
  ADD COLUMN IF NOT EXISTS source_checked_at TIMESTAMPTZ;
ALTER TABLE public.trainee_programs
  ADD COLUMN IF NOT EXISTS deadline_type TEXT NOT NULL DEFAULT 'not_specified' CHECK (deadline_type IN ('fixed','not_specified','rolling','until_filled')),
  ADD COLUMN IF NOT EXISTS source_status TEXT NOT NULL DEFAULT 'active' CHECK (source_status IN ('active','unavailable','closed')),
  ADD COLUMN IF NOT EXISTS source_checked_at TIMESTAMPTZ;
ALTER TABLE public.employer_import_items
  ADD COLUMN IF NOT EXISTS deadline_type TEXT NOT NULL DEFAULT 'not_specified' CHECK (deadline_type IN ('fixed','not_specified','rolling','until_filled')),
  ADD COLUMN IF NOT EXISTS availability_state TEXT NOT NULL DEFAULT 'unknown' CHECK (availability_state IN ('unknown','active','unavailable','closed')),
  ADD COLUMN IF NOT EXISTS availability_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_attempted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS check_failures INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS availability_error TEXT,
  ADD COLUMN IF NOT EXISTS next_check_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS check_token UUID,
  ADD COLUMN IF NOT EXISTS check_lock_until TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS employer_items_due ON public.employer_import_items(next_check_at, id) WHERE status IN ('pending','published');

-- Restrictive policies also protect direct API requests despite existing approval policies.
-- Owners retain access; the authenticated admin API uses service_role for archived records.
DROP POLICY IF EXISTS "Available theses" ON public.theses;
CREATE POLICY "Available theses" ON public.theses AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (source_status='active' OR posted_by_user_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS "Available trainee programs" ON public.trainee_programs;
CREATE POLICY "Available trainee programs" ON public.trainee_programs AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (source_status='active' OR posted_by_user_id=(SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.claim_employer_availability(candidate_id UUID DEFAULT NULL)
RETURNS SETOF public.employer_import_items LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE target UUID;
BEGIN
  SELECT id INTO target FROM public.employer_import_items
  WHERE status IN ('pending','published') AND (check_lock_until IS NULL OR check_lock_until<now())
    AND ((candidate_id IS NOT NULL AND id=candidate_id) OR (candidate_id IS NULL AND next_check_at<=now()))
  ORDER BY next_check_at,id LIMIT 1 FOR UPDATE SKIP LOCKED;
  RETURN QUERY UPDATE public.employer_import_items SET check_token=gen_random_uuid(),check_lock_until=now()+interval '10 minutes'
    WHERE id=target RETURNING *;
END $$;

CREATE OR REPLACE FUNCTION public.finish_employer_availability(candidate_id UUID, token UUID, outcome TEXT, metadata JSONB DEFAULT '{}', detail TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE item public.employer_import_items; state TEXT; failures INTEGER;
BEGIN
  IF outcome NOT IN ('active','closed','failed') THEN RAISE EXCEPTION 'Invalid availability outcome'; END IF;
  SELECT * INTO item FROM public.employer_import_items WHERE id=candidate_id FOR UPDATE;
  IF NOT FOUND OR item.check_token IS DISTINCT FROM token OR token IS NULL THEN RAISE EXCEPTION 'Availability check lease lost'; END IF;
  failures := CASE WHEN outcome='failed' THEN item.check_failures+1 ELSE 0 END;
  state := CASE WHEN outcome='failed' THEN CASE WHEN failures>=3 THEN 'unavailable' ELSE item.availability_state END ELSE outcome END;
  -- A known past deadline is definitive even when the source cannot be reached.
  IF outcome='failed' AND item.deadline<CURRENT_DATE THEN state:='closed'; END IF;
  UPDATE public.employer_import_items SET
    availability_state=state, check_failures=failures, last_attempted_at=now(),
    availability_checked_at=CASE WHEN outcome='failed' THEN availability_checked_at ELSE now() END,
    availability_error=CASE WHEN outcome='active' THEN NULL ELSE left(detail,1200) END,
    next_check_at=now()+CASE WHEN state='closed' THEN interval '7 days' WHEN outcome='failed' THEN interval '1 day' ELSE interval '48 hours' END,
    check_token=NULL,check_lock_until=NULL,
    deadline=CASE WHEN outcome='active' THEN (metadata->>'deadline')::date ELSE deadline END,
    deadline_type=CASE WHEN outcome='active' THEN metadata->>'deadline_type' ELSE deadline_type END,
    compensation=CASE WHEN outcome='active' THEN metadata->>'compensation' ELSE compensation END,
    description=CASE WHEN outcome='active' THEN metadata->>'description' ELSE description END,
    location=CASE WHEN outcome='active' THEN metadata->>'location' ELSE location END,
    organization=CASE WHEN outcome='active' THEN metadata->>'organization' ELSE organization END
    WHERE id=item.id RETURNING * INTO item;
  -- Never modify another publisher's duplicate or overwrite editorial approval decisions.
  IF item.status='published' THEN
    UPDATE public.theses SET source_status=CASE WHEN state='unknown' THEN source_status ELSE state END,
      source_checked_at=item.availability_checked_at,deadline=item.deadline,deadline_type=item.deadline_type,last_synced_at=now()
      WHERE id=item.thesis_id AND employer_import_key=item.source_id||':'||item.external_id;
    UPDATE public.trainee_programs SET source_status=CASE WHEN state='unknown' THEN source_status ELSE state END,
      source_checked_at=item.availability_checked_at,deadline=item.deadline,deadline_type=item.deadline_type,last_synced_at=now()
      WHERE id=item.program_id AND employer_import_key=item.source_id||':'||item.external_id;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.claim_employer_availability(UUID), public.finish_employer_availability(UUID,UUID,TEXT,JSONB,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_employer_availability(UUID), public.finish_employer_availability(UUID,UUID,TEXT,JSONB,TEXT) TO service_role;
-- Publication function appended below; the whole migration commits atomically.

CREATE OR REPLACE FUNCTION public.publish_employer_candidate(candidate_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE item public.employer_import_items; target_id UUID; identity_key TEXT;
BEGIN
  SELECT * INTO item FROM public.employer_import_items WHERE id=candidate_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Candidate not found'; END IF;
  IF item.status IN ('published','duplicate') THEN RETURN coalesce(item.thesis_id,item.program_id); END IF;
  IF item.status='ignored' THEN RAISE EXCEPTION 'Restore an ignored candidate before publishing'; END IF;
  IF item.deadline<CURRENT_DATE OR item.availability_state<>'active' OR item.availability_checked_at IS NULL OR item.availability_checked_at<now()-interval '48 hours' THEN
    RAISE EXCEPTION 'Vacancy must be confirmed active in the last 48 hours';
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
    INSERT INTO public.trainee_programs(title,company,description,field,location,duration,compensation,deadline,external_url,external_id,source_name,source_published_at,last_synced_at,posted_by,status,employer_import_key,deadline_type,source_status,source_checked_at)
    VALUES(item.title,item.organization,item.description,item.field,item.location,item.duration,coalesce(item.compensation,'not_specified'),item.deadline,item.canonical_url,identity_key,item.organization,item.published_at,now(),'admin','approved',identity_key,item.deadline_type,'active',item.availability_checked_at) RETURNING id INTO target_id;
    UPDATE public.employer_import_items SET status='published',program_id=target_id,reviewed_at=now() WHERE id=item.id;
  ELSE
    INSERT INTO public.theses(title,type,opportunity_kind,organization,organization_type,description,subject,location,compensation,deadline,external_url,external_id,source_name,source_published_at,last_synced_at,posted_by,status,employer_import_key,deadline_type,source_status,source_checked_at)
    VALUES(item.title,'master',item.kind,item.organization,CASE WHEN item.source_id='aalto' THEN 'university' ELSE 'company' END,item.description,item.field,item.location,coalesce(item.compensation,'not_specified'),item.deadline,item.canonical_url,identity_key,item.organization,item.published_at,now(),'admin','approved',identity_key,item.deadline_type,'active',item.availability_checked_at) RETURNING id INTO target_id;
    UPDATE public.employer_import_items SET status='published',thesis_id=target_id,reviewed_at=now() WHERE id=item.id;
  END IF;
  RETURN target_id;
END $$;
REVOKE ALL ON FUNCTION public.publish_employer_candidate(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_employer_candidate(UUID) TO service_role;
COMMIT;
