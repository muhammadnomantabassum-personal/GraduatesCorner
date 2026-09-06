-- Additive indexes for current public listings and full-text search. Run off peak.
BEGIN;
CREATE INDEX IF NOT EXISTS theses_public_type_deadline ON public.theses(type,deadline,id) WHERE status='approved';
CREATE INDEX IF NOT EXISTS programs_public_deadline ON public.trainee_programs(deadline,id) WHERE status='approved';
-- Existing idx_theses_search_vector / idx_programs_search_vector already cover full-text queries.
COMMIT;
