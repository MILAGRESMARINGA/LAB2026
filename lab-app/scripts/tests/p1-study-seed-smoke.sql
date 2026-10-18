-- Included only by the existing disposable PG16/PG17 smoke suite.
CREATE TEMP TABLE p1_seed_existing_content AS
SELECT study_key, to_jsonb(c) AS snapshot FROM public.lab_v2_study_content c;
CREATE TEMP TABLE p1_seed_security AS
SELECT c.oid, c.relacl, c.relrowsecurity, c.relforcerowsecurity
FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r';
\i scripts/sql/seeds/p1-study-days-4-7.sql
CREATE TEMP TABLE p1_seed_first_pass AS
SELECT study_key, to_jsonb(c) AS snapshot FROM public.lab_v2_study_content c
WHERE content_version='2026-10-p1-v1';
\i scripts/sql/seeds/p1-study-days-4-7.sql
DO $p1_seed_check$
BEGIN
 IF (SELECT count(*) FROM p1_seed_first_pass) <> 9
 THEN RAISE EXCEPTION 'FAIL: expected nine draft units for days4-7 and both plan variants'; END IF;
 IF EXISTS(SELECT 1 FROM public.lab_v2_study_content
   WHERE content_version='2026-10-p1-v1' AND (publication_status<>'draft' OR layer<>1 OR provider_model IS NOT NULL))
 THEN RAISE EXCEPTION 'FAIL: seed changed publication status, layer or provider provenance'; END IF;
 IF EXISTS(SELECT 1 FROM p1_seed_existing_content old
   LEFT JOIN public.lab_v2_study_content c USING(study_key)
   WHERE to_jsonb(c) IS DISTINCT FROM old.snapshot)
 THEN RAISE EXCEPTION 'FAIL: existing study was modified'; END IF;
 IF EXISTS(SELECT 1 FROM p1_seed_first_pass first_run
   LEFT JOIN public.lab_v2_study_content c USING(study_key)
   WHERE to_jsonb(c) IS DISTINCT FROM first_run.snapshot)
 THEN RAISE EXCEPTION 'FAIL: seed retry changed cache content or timestamp'; END IF;
 IF EXISTS(SELECT 1 FROM p1_seed_security before_seed JOIN pg_catalog.pg_class c ON c.oid=before_seed.oid
   WHERE (c.relacl,c.relrowsecurity,c.relforcerowsecurity) IS DISTINCT FROM
     (before_seed.relacl,before_seed.relrowsecurity,before_seed.relforcerowsecurity))
 THEN RAISE EXCEPTION 'FAIL: seed changed table privileges/RLS'; END IF;
END $p1_seed_check$;
SET ROLE authenticated;
DO $p1_seed_draft_rls$
BEGIN
 IF EXISTS(SELECT 1 FROM public.lab_v2_study_content WHERE content_version='2026-10-p1-v1')
 THEN RAISE EXCEPTION 'FAIL: authenticated reader sees unpublished drafts'; END IF;
END $p1_seed_draft_rls$;
RESET ROLE;
SELECT 'P1 CURATED DRAFTS, IDEMPOTENCY, PLAN COVERAGE AND RLS PASSED' AS result;
