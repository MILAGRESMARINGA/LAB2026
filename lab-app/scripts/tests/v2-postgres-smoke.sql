\set ON_ERROR_STOP on
-- Ephemeral PostgreSQL 16 ONLY, invoked by GitHub Actions v2-postgres job.
-- Isolated stubs replace Supabase auth; no user or production data is used.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
GRANT USAGE ON SCHEMA auth TO authenticated;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT NULLIF(current_setting('app.test_user',true),'')::uuid $$;
CREATE TABLE public.lab_game_runs(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id),
 status text NOT NULL
);
\i supabase/migrations/202610160100_lab_v2_shadow_game.sql
\i supabase/migrations/202610160101_lab_v2_plans_seed.sql

INSERT INTO auth.users(id) VALUES
('11111111-1111-4111-8111-111111111111'),
('22222222-2222-4222-8222-222222222222');
SELECT set_config('app.test_user','11111111-1111-4111-8111-111111111111',false);

-- Kill switch: no user may start a new V2 journey before staged approval.
DO $test$
BEGIN
 BEGIN
  PERFORM public.lab_v2_start(365);
  RAISE EXCEPTION 'FAIL: release guard unexpectedly allowed run';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE 'Jornada V2 não liberada%' THEN RAISE; END IF;
 END;
END
$test$;

-- Only this ephemeral test DB enables the release.
UPDATE public.lab_v2_release_controls SET enabled=true;
SET ROLE authenticated;

SELECT (public.lab_v2_start(365)->>'run_id')::uuid AS first_run \gset
SELECT public.lab_v2_activate(:'first_run'::uuid,1);
SELECT public.lab_v2_confirm(:'first_run'::uuid,1,'1:1');
SELECT public.lab_v2_confirm(:'first_run'::uuid,1,'19:1');
SELECT public.lab_v2_confirm(:'first_run'::uuid,1,'43:1');
-- Duplicated chapter must not create extra XP.
SELECT public.lab_v2_confirm(:'first_run'::uuid,1,'43:1');

DO $test$
DECLARE s jsonb;
BEGIN
 SELECT public.lab_v2_sync((SELECT id FROM public.lab_v2_runs
   WHERE user_id=auth.uid() AND status='active')) INTO s;
 IF (s->>'run_xp')::integer<>30 OR s->>'status'<>'active' THEN
  RAISE EXCEPTION 'FAIL: 3 chapter XP or active state mismatched: %',s;
 END IF;
END
$test$;
DO $test$
BEGIN
 BEGIN
  PERFORM public.lab_v2_activate((SELECT id FROM public.lab_v2_runs
    WHERE user_id=auth.uid() AND status='active'),2);
  RAISE EXCEPTION 'FAIL: advanced before 24h';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE 'A próxima etapa ainda não%' THEN RAISE; END IF;
 END;
END
$test$;

-- Controlled fault-injection: backdate one stage in the isolated DB so no
-- tests need to wait 24-104 real hours.
RESET ROLE;
UPDATE public.lab_v2_stages SET activated_at=statement_timestamp()-interval '25 hours'
 WHERE run_id=:'first_run'::uuid AND day_number=1;
SET ROLE authenticated;
SELECT public.lab_v2_activate(:'first_run'::uuid,2);
DO $test$
DECLARE s jsonb;
BEGIN
 SELECT public.lab_v2_sync((SELECT id FROM public.lab_v2_runs
   WHERE user_id=auth.uid() AND status='active')) INTO s;
 IF (s->>'run_xp')::integer<>27 THEN
  RAISE EXCEPTION 'FAIL: late penalty not applied exactly once: %',s;
 END IF;
END
$test$;

RESET ROLE;
UPDATE public.lab_v2_stages SET activated_at=statement_timestamp()-interval '31 hours'
 WHERE run_id=:'first_run'::uuid AND day_number=2;
SET ROLE authenticated;
SELECT public.lab_v2_sync(:'first_run'::uuid);
SELECT public.lab_v2_sync(:'first_run'::uuid);
DO $test$
DECLARE n integer;
BEGIN
 SELECT SUM(used_lives)::integer INTO n FROM public.lab_v2_monthly_lives
 WHERE user_id=auth.uid();
 IF n<>1 THEN RAISE EXCEPTION 'FAIL: retry consumed more than one life: %',n; END IF;
END
$test$;

RESET ROLE;
UPDATE public.lab_v2_stages SET activated_at=statement_timestamp()-interval '104 hours'
 WHERE run_id=:'first_run'::uuid AND day_number=2;
SET ROLE authenticated;
SELECT public.lab_v2_sync(:'first_run'::uuid);
DO $test$
DECLARE s text;n integer;
BEGIN
 SELECT status INTO s FROM public.lab_v2_runs WHERE id=
  (SELECT id FROM public.lab_v2_runs WHERE user_id=auth.uid() AND status='failed' LIMIT 1);
 SELECT SUM(used_lives)::integer INTO n FROM public.lab_v2_monthly_lives
  WHERE user_id=auth.uid();
 IF s<>'failed' OR n<>3 THEN RAISE EXCEPTION 'FAIL: fourth-life exhaustion (%, %)',s,n; END IF;
END
$test$;

-- Historical run stays as a record, new run starts from ZERO XP.
SELECT (public.lab_v2_start(365)->>'run_id')::uuid AS new_run \gset
DO $test$
DECLARE s jsonb;
BEGIN
 SELECT public.lab_v2_sync((SELECT id FROM public.lab_v2_runs
   WHERE user_id=auth.uid() AND status='active')) INTO s;
 IF s->>'status'<>'active' OR (s->>'run_xp')::integer<>0 OR
    (s->>'best_completed_stages')::integer<>1 THEN
  RAISE EXCEPTION 'FAIL: new run leaked archived XP or lost record: %',s;
 END IF;
END
$test$;

-- Second user must neither read nor mutate the first participant's run.
SELECT set_config('app.test_user','22222222-2222-4222-8222-222222222222',false);
DO $test$
DECLARE total integer;
BEGIN
 SELECT COUNT(*) INTO total FROM public.lab_v2_runs;
 IF total<>0 THEN RAISE EXCEPTION 'FAIL: RLS exposed another user run'; END IF;
 BEGIN
  PERFORM public.lab_v2_sync((SELECT id FROM public.lab_v2_runs LIMIT 1));
  RAISE EXCEPTION 'FAIL: other user run was readable';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE 'Jornada não encontrada%' THEN RAISE; END IF;
 END;
END
$test$;
SELECT (public.lab_v2_start(366)->>'run_id')::uuid AS second_run \gset
SELECT public.lab_v2_activate(:'second_run'::uuid,1);
SELECT public.lab_v2_confirm(:'second_run'::uuid,1,'1:1');
DO $test$
DECLARE count_ integer;
BEGIN
 SELECT COUNT(*) INTO count_ FROM public.lab_v2_chapter_checks;
 IF count_<>1 THEN RAISE EXCEPTION 'FAIL: chapter RLS leaked another user checks'; END IF;
END
$test$;
RESET ROLE;
SELECT 'LAB V2 POSTGRES SMOKE PASSED' AS result;
