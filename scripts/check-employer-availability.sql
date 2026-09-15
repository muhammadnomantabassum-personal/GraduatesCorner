-- Run after all employer migrations. Fixtures roll back, including public listings.
BEGIN;
DO $$
DECLARE candidate UUID; target UUID; claimed public.employer_import_items; attempt INTEGER; label TEXT;
BEGIN
  INSERT INTO public.employer_import_sources(id) VALUES('__availability_fixture');
  FOREACH label IN ARRAY ARRAY['master_thesis','trainee'] LOOP
    INSERT INTO public.employer_import_items(source_id,external_id,canonical_url,title,kind,organization,location,description,field)
    VALUES('__availability_fixture',label,'https://example.com/availability/'||label,'Active no-date fixture',label,'Test fixture','Sweden','Fixture description','Engineering') RETURNING id INTO candidate;
    SELECT * INTO claimed FROM public.claim_employer_availability(candidate);
    IF claimed.check_token IS NULL OR EXISTS(SELECT 1 FROM public.claim_employer_availability(candidate)) THEN RAISE EXCEPTION 'Concurrent lease allowed'; END IF;
    PERFORM public.finish_employer_availability(candidate,claimed.check_token,'active','{"deadline":null,"deadline_type":"rolling","compensation":null,"description":"Fixture description","location":"Sweden","organization":"Test fixture"}');
    -- Stale evidence is never sufficient for publishing.
    UPDATE public.employer_import_items SET availability_checked_at=now()-interval '49 hours' WHERE id=candidate;
    BEGIN
      PERFORM public.publish_employer_candidate(candidate);
      RAISE EXCEPTION 'TEST: stale evidence published';
    EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF; END;
    UPDATE public.employer_import_items SET availability_checked_at=now() WHERE id=candidate;
    target:=public.publish_employer_candidate(candidate);
    IF NOT EXISTS(SELECT 1 FROM public.theses WHERE id=target AND deadline IS NULL AND deadline_type='rolling' AND source_checked_at IS NOT NULL
      UNION ALL SELECT 1 FROM public.trainee_programs WHERE id=target AND deadline IS NULL AND deadline_type='rolling' AND source_checked_at IS NOT NULL) THEN RAISE EXCEPTION 'No-date publication metadata lost'; END IF;
    FOR attempt IN 1..3 LOOP
      SELECT * INTO claimed FROM public.claim_employer_availability(candidate);
      PERFORM public.finish_employer_availability(candidate,claimed.check_token,'failed','{}','Temporary timeout');
      IF NOT EXISTS(SELECT 1 FROM public.theses WHERE id=target AND source_status=CASE WHEN attempt<3 THEN 'active' ELSE 'unavailable' END
        UNION ALL SELECT 1 FROM public.trainee_programs WHERE id=target AND source_status=CASE WHEN attempt<3 THEN 'active' ELSE 'unavailable' END) THEN RAISE EXCEPTION 'Failure threshold wrong'; END IF;
    END LOOP;
    -- Recovery restores visibility while preserving moderation.
    UPDATE public.theses SET status='rejected' WHERE id=target;
    UPDATE public.trainee_programs SET status='rejected' WHERE id=target;
    SELECT * INTO claimed FROM public.claim_employer_availability(candidate);
    PERFORM public.finish_employer_availability(candidate,claimed.check_token,'active','{"deadline":null,"deadline_type":"not_specified","compensation":null,"description":"Fixture description","location":"Sweden","organization":"Test fixture"}');
    IF NOT EXISTS(SELECT 1 FROM public.theses WHERE id=target AND source_status='active' AND status='rejected'
      UNION ALL SELECT 1 FROM public.trainee_programs WHERE id=target AND source_status='active' AND status='rejected') THEN RAISE EXCEPTION 'Recovery overwrote moderation'; END IF;
    IF (SELECT check_failures FROM public.employer_import_items WHERE id=candidate)<>0 THEN RAISE EXCEPTION 'Recovery did not reset failures'; END IF;
    SELECT * INTO claimed FROM public.claim_employer_availability(candidate);
    PERFORM public.finish_employer_availability(candidate,claimed.check_token,'closed','{}','Applications closed');
    IF NOT EXISTS(SELECT 1 FROM public.theses WHERE id=target AND source_status='closed'
      UNION ALL SELECT 1 FROM public.trainee_programs WHERE id=target AND source_status='closed') THEN RAISE EXCEPTION 'Closure not archived'; END IF;
    BEGIN
      PERFORM public.finish_employer_availability(candidate,claimed.check_token,'active','{}');
      RAISE EXCEPTION 'TEST: replayed lease accepted';
    EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF; END;
  END LOOP;
  IF has_function_privilege('anon','public.claim_employer_availability(uuid)','EXECUTE') OR has_function_privilege('authenticated','public.finish_employer_availability(uuid,uuid,text,jsonb,text)','EXECUTE') THEN RAISE EXCEPTION 'Availability RPC exposed'; END IF;
END $$;
ROLLBACK;
SELECT 'PASS: no-date publication, stale proof, exclusive leases, failure threshold, recovery, moderation preservation, closure and RPC access' AS result;
