-- Run only against disposable local Supabase Postgres.
DO $$
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='lab_strong_verse_lookup'
    AND p.prosecdef=false
 ) THEN RAISE EXCEPTION 'FAIL: Strong lookup must be SECURITY INVOKER'; END IF;
 IF has_function_privilege('anon','public.lab_strong_verse_lookup(text,integer,integer)','EXECUTE')
 THEN RAISE EXCEPTION 'FAIL: anon can execute Strong lookup'; END IF;
 IF NOT has_function_privilege('authenticated','public.lab_strong_verse_lookup(text,integer,integer)','EXECUTE')
 THEN RAISE EXCEPTION 'FAIL: authenticated cannot execute Strong lookup'; END IF;
 IF NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname='public'
   AND tablename='verse_strong_links' AND cmd='SELECT'
   AND qual LIKE '%review_status = ''approved''%'
 ) THEN RAISE EXCEPTION 'FAIL: publication guard was not preserved'; END IF;
END $$;

BEGIN;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
 IF (SELECT COUNT(*) FROM public.lab_strong_verse_lookup('1:1',1,48))<>0
 THEN RAISE EXCEPTION 'FAIL: unpublished Strong rows leaked to anonymous JWT'; END IF;
END $$;
ROLLBACK;
SELECT 'PASS: strong invoker, grants and unapproved publication remain closed' AS status;
