-- Allow source-derived deadlines and unknown compensation without manual confirmation.
-- Keeps existing positions and all duplicate protections. Safe to run again.
BEGIN;
ALTER TABLE public.theses DROP CONSTRAINT IF EXISTS theses_compensation_check;
ALTER TABLE public.theses ADD CONSTRAINT theses_compensation_check CHECK (compensation IN ('paid','unpaid','stipend','not_specified'));
ALTER TABLE public.trainee_programs DROP CONSTRAINT IF EXISTS trainee_programs_compensation_check;
ALTER TABLE public.trainee_programs ADD CONSTRAINT trainee_programs_compensation_check CHECK (compensation IN ('paid','unpaid','stipend','not_specified'));
CREATE OR REPLACE FUNCTION public.publish_employer_candidate(candidate_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE item public.employer_import_items; target_id UUID; identity_key TEXT;
BEGIN
  SELECT * INTO item FROM public.employer_import_items WHERE id=candidate_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Candidate not found'; END IF;
  IF item.status IN ('published','duplicate') THEN RETURN coalesce(item.thesis_id,item.program_id); END IF;
  IF item.status='ignored' THEN RAISE EXCEPTION 'Restore an ignored candidate before publishing'; END IF;
  IF item.deadline IS NULL OR item.deadline<CURRENT_DATE THEN
    RAISE EXCEPTION 'Source must provide a current application deadline';
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
    VALUES(item.title,item.organization,item.description,item.field,item.location,item.duration,coalesce(item.compensation,'not_specified'),item.deadline,item.canonical_url,identity_key,item.organization,item.published_at,now(),'admin','approved',identity_key) RETURNING id INTO target_id;
    UPDATE public.employer_import_items SET status='published',program_id=target_id,reviewed_at=now() WHERE id=item.id;
  ELSE
    INSERT INTO public.theses(title,type,opportunity_kind,organization,organization_type,description,subject,location,compensation,deadline,external_url,external_id,source_name,source_published_at,last_synced_at,posted_by,status,employer_import_key)
    VALUES(item.title,'master',item.kind,item.organization,CASE WHEN item.source_id='aalto' THEN 'university' ELSE 'company' END,item.description,item.field,item.location,coalesce(item.compensation,'not_specified'),item.deadline,item.canonical_url,identity_key,item.organization,item.published_at,now(),'admin','approved',identity_key) RETURNING id INTO target_id;
    UPDATE public.employer_import_items SET status='published',thesis_id=target_id,reviewed_at=now() WHERE id=item.id;
  END IF;
  RETURN target_id;
END $$;
REVOKE ALL ON FUNCTION public.publish_employer_candidate(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_employer_candidate(UUID) TO service_role;
UPDATE public.employer_import_sources SET enabled=false, auto_publish=false WHERE id='finn';
COMMIT;
