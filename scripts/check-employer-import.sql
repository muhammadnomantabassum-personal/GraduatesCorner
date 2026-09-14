-- Run after supabase_employer_imports_setup.sql. All fixture writes are rolled back.
BEGIN;
DO $$
DECLARE candidate UUID; target UUID; repeated UUID; token UUID; label TEXT;
BEGIN
  IF public.employer_canonical_url('https://jobs.example.com/job/42/?utm_source=x&jobId=42#apply') <> 'https://jobs.example.com/job/42?jobId=42' THEN RAISE EXCEPTION 'Tracking canonicalization failed'; END IF;
  IF public.employer_canonical_url('https://abb.wd3.myworkdayjobs.com/en-US/Board/job/City/Title_JR1/apply?source=careers') <> 'https://abb.wd3.myworkdayjobs.com/Board/job/City/Title_JR1' THEN RAISE EXCEPTION 'Workday canonicalization failed'; END IF;
  IF has_table_privilege('anon','public.employer_import_items','SELECT') OR has_table_privilege('authenticated','public.employer_import_items','SELECT') OR has_function_privilege('authenticated','public.publish_employer_candidate(uuid)','EXECUTE') THEN RAISE EXCEPTION 'Import data is exposed'; END IF;
  INSERT INTO public.employer_import_sources(id) VALUES('__employer_test_fixture');
  token := public.claim_employer_import('__employer_test_fixture');
  IF token IS NULL OR public.claim_employer_import('__employer_test_fixture') IS NOT NULL THEN RAISE EXCEPTION 'Source lock failed'; END IF;
  FOREACH label IN ARRAY ARRAY['master_thesis','internship','trainee'] LOOP
    INSERT INTO public.employer_import_items(source_id,external_id,canonical_url,title,kind,organization,location,description,field,deadline,compensation)
    VALUES('__employer_test_fixture',label,'https://example.com/employer-test/'||label,'Importer transaction test',label,'Test fixture','Sweden','Transaction-only fixture','Engineering',CURRENT_DATE+30,'paid') RETURNING id INTO candidate;
    target := public.publish_employer_candidate(candidate);
    repeated := public.publish_employer_candidate(candidate);
    IF target IS NULL OR target<>repeated THEN RAISE EXCEPTION 'Repeat publication is not idempotent'; END IF;
    IF label='trainee' THEN
      IF NOT EXISTS(SELECT 1 FROM public.trainee_programs WHERE id=target) THEN RAISE EXCEPTION 'Wrong trainee destination'; END IF;
    ELSE
      IF NOT EXISTS(SELECT 1 FROM public.theses WHERE id=target AND type='master' AND opportunity_kind=label) THEN RAISE EXCEPTION 'Wrong thesis destination'; END IF;
    END IF;
    BEGIN
      INSERT INTO public.employer_import_items(source_id,external_id,canonical_url,title,kind,organization,location,description,field)
      VALUES('__employer_test_fixture','duplicate-'||label,'https://example.com/employer-test/'||label,'Duplicate test',label,'Test fixture','Sweden','Fixture','Engineering');
      RAISE EXCEPTION 'Duplicate URL accepted';
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
  END LOOP;
  INSERT INTO public.employer_import_items(source_id,external_id,canonical_url,title,kind,organization,location,description,field)
  VALUES('__employer_test_fixture','missing','https://example.com/employer-test/missing','Incomplete fixture','internship','Test fixture','Sweden','Fixture','Engineering') RETURNING id INTO candidate;
  BEGIN
    PERFORM public.publish_employer_candidate(candidate);
    RAISE EXCEPTION 'TEST: missing metadata published';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF;
  END;
  UPDATE public.employer_import_items SET deadline=CURRENT_DATE+30 WHERE id=candidate;
  target := public.publish_employer_candidate(candidate);
  IF NOT EXISTS(SELECT 1 FROM public.theses WHERE id=target AND compensation='not_specified') THEN RAISE EXCEPTION 'Unknown compensation was not preserved'; END IF;
  INSERT INTO public.employer_import_items(source_id,external_id,canonical_url,title,kind,organization,location,description,field)
  VALUES('__employer_test_fixture','ignored','https://example.com/employer-test/ignored','Ignored fixture','internship','Test fixture','Sweden','Fixture','Engineering') RETURNING id INTO candidate;
  UPDATE public.employer_import_items SET status='ignored',deadline=CURRENT_DATE+30,compensation='paid' WHERE id=candidate;
  BEGIN
    PERFORM public.publish_employer_candidate(candidate);
    RAISE EXCEPTION 'TEST: ignored candidate published';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF;
  END;
END $$;
ROLLBACK;
SELECT 'PASS: canonical URLs, private queue, source lock, all destinations, repeat publication, unique URLs, missing metadata and ignored rows' AS result;
