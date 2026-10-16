\set ON_ERROR_STOP on
-- Ephemeral PostgreSQL 16 ONLY, invoked by GitHub Actions v2-postgres job.
-- Isolated stubs replace Supabase auth; no user or production data is used.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
GRANT USAGE ON SCHEMA auth TO authenticated;
CREATE TABLE auth.users(id uuid PRIMARY KEY,last_sign_in_at timestamptz DEFAULT now());
-- Disposable Auth stub: a fresh session is tied to the JWT identity.
CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,created_at timestamptz NOT NULL DEFAULT now());
CREATE OR REPLACE FUNCTION auth.fake_session() RETURNS trigger LANGUAGE plpgsql AS $
BEGIN
 INSERT INTO auth.sessions(id,user_id,created_at) VALUES(NEW.id,NEW.id,statement_timestamp());
 RETURN NEW;
END $;
CREATE TRIGGER fake_auth_session AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION auth.fake_session();
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS
$ SELECT jsonb_build_object('session_id',NULLIF(current_setting('app.test_user',true),'')::text) $;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT NULLIF(current_setting('app.test_user',true),'')::uuid $$;
CREATE TABLE public.lab_game_runs(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id),
 status text NOT NULL,
 finished_on date
);
CREATE TABLE public.lab_game_stats(
 user_id uuid PRIMARY KEY REFERENCES auth.users(id),
 best_days smallint NOT NULL DEFAULT 0,
 total_xp integer NOT NULL DEFAULT 0,
 total_completed_days integer NOT NULL DEFAULT 0,
 updated_at timestamptz NOT NULL DEFAULT now(),
 display_name text NOT NULL DEFAULT 'Leitor LAB',
 leaderboard_opt_in boolean NOT NULL DEFAULT false
);
CREATE TABLE public.lab_game_video_resources(video_key text PRIMARY KEY);
INSERT INTO public.lab_game_video_resources VALUES('videos:genesis-1-11');
CREATE TABLE public.lab_game_video_sessions(user_id uuid NOT NULL REFERENCES auth.users(id));
CREATE TABLE public.lab_game_video_rewards(user_id uuid NOT NULL REFERENCES auth.users(id));
CREATE TABLE public.reading_completions(user_id uuid NOT NULL REFERENCES auth.users(id));
CREATE TABLE public.reading_groups(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL,
 owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 competition_opt_in boolean NOT NULL DEFAULT false
);
CREATE TABLE public.reading_group_members(
 group_id uuid NOT NULL REFERENCES public.reading_groups(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 role text NOT NULL DEFAULT 'member',
 PRIMARY KEY(group_id,user_id)
);
-- Profile migrations run first in the same chronological order as production.
\i supabase/migrations/202610160001_profile_notification_preferences.sql
\i supabase/migrations/202610160106_notification_channel_matrix.sql
\i supabase/migrations/202610160100_lab_v2_shadow_game.sql
\i supabase/migrations/202610160101_lab_v2_plans_seed.sql
\i supabase/migrations/202610160102_lab_v2_awards_and_unified_reset.sql
\i supabase/migrations/202610160103_lab_v2_gc_rankings.sql
\i supabase/migrations/202610160104_lab_v2_video_xp.sql
\i supabase/migrations/202610160105_lab_v2_study_rewards.sql
\i supabase/migrations/202610160108_lab_v2_terminal_state.sql

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

-- V2 video credit only when the server has accumulated actual session
-- heartbeat windows (the test injects times only into the disposable DB).
SELECT public.lab_v2_video_begin(:'first_run'::uuid,'videos:genesis-1-11');
DO $test$
BEGIN
 BEGIN
  PERFORM public.lab_v2_video_confirm((SELECT id FROM public.lab_v2_runs
    WHERE user_id=auth.uid() AND status='active'),'videos:genesis-1-11');
  RAISE EXCEPTION 'FAIL: unobserved video granted XP';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE 'Assista ao panorama%' THEN RAISE; END IF;
 END;
END $test$;
RESET ROLE;
UPDATE public.lab_v2_video_sessions SET heartbeat_at=statement_timestamp()-interval '15 seconds'
 WHERE run_id=:'first_run'::uuid;
SET ROLE authenticated;
SELECT public.lab_v2_video_ping(:'first_run'::uuid,'videos:genesis-1-11');
RESET ROLE;
UPDATE public.lab_v2_video_sessions SET active_seconds=90
 WHERE run_id=:'first_run'::uuid;
SET ROLE authenticated;
SELECT public.lab_v2_video_confirm(:'first_run'::uuid,'videos:genesis-1-11');
SELECT public.lab_v2_video_confirm(:'first_run'::uuid,'videos:genesis-1-11');
DO $test$
DECLARE score jsonb;
BEGIN
 SELECT public.lab_v2_sync((SELECT id FROM public.lab_v2_runs
  WHERE user_id=auth.uid() AND status='active')) INTO score;
 IF (score->>'video_xp')::integer<>5 OR (score->>'run_xp')::integer<>35 THEN
  RAISE EXCEPTION 'FAIL: V2 video duplicated or missing: %',score;
 END IF;
END $test$;

-- Six catalog studies are independently awarded once per RUN, never as
-- substitutes for chapters or XP in an archived previous attempt.
DO $test$
BEGIN
 BEGIN
  PERFORM public.lab_v2_confirm_study(
   (SELECT id FROM public.lab_v2_runs WHERE user_id=auth.uid() AND status='active'),
   'criacao',false);
  RAISE EXCEPTION 'FAIL: study without acknowledgement';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE 'Confirme que examinou%' THEN RAISE; END IF;
 END;
END $test$;
SELECT public.lab_v2_confirm_study(:'first_run'::uuid,'criacao',true);
SELECT public.lab_v2_confirm_study(:'first_run'::uuid,'criacao',true);
DO $test$
DECLARE score jsonb;
BEGIN
 SELECT public.lab_v2_sync((SELECT id FROM public.lab_v2_runs
  WHERE user_id=auth.uid() AND status='active')) INTO score;
 IF (score->>'study_xp')::integer<>15 OR (score->>'studies_this_run')::integer<>1 OR
   (score->>'run_xp')::integer<>50 THEN
  RAISE EXCEPTION 'FAIL: study double-credit or missing bonus: %',score;
 END IF;
END $test$;
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
 IF (s->>'reading_xp')::integer<>27 OR (s->>'video_xp')::integer<>5 OR
    (s->>'study_xp')::integer<>15 OR (s->>'run_xp')::integer<>47 THEN
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

-- The 366-step plan is not a selectable shortcut in a non-leap October.
DO $test$
BEGIN
 BEGIN
  PERFORM public.lab_v2_start(366);
  RAISE EXCEPTION 'FAIL: 366-day plan was enabled outside leap-year January 1';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE 'Plano de 366 etapas disponível somente%' THEN RAISE; END IF;
 END;
END $test$;
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
SELECT (public.lab_v2_start(365)->>'run_id')::uuid AS second_run \gset
SELECT public.lab_v2_activate(:'second_run'::uuid,1);
SELECT public.lab_v2_confirm(:'second_run'::uuid,1,'1:1');
DO $test$
DECLARE count_ integer;
BEGIN
 SELECT COUNT(*) INTO count_ FROM public.lab_v2_chapter_checks;
 IF count_<>1 THEN RAISE EXCEPTION 'FAIL: chapter RLS leaked another user checks'; END IF;
END
$test$;
-- Simulate an almost-complete annual run in the ephemeral DB only.
-- Stage 364 was activated 26h earlier; activating stage 365 is 2h late,
-- hence -3 XP and NO perfect badge. The crown must still be awarded.
-- No production account is used and no reward is manually written.
SELECT set_config('app.test_user','11111111-1111-4111-8111-111111111111',false);
RESET ROLE;
INSERT INTO public.lab_v2_stages(run_id,day_number,activated_at,completed_at,transitioned_at)
 SELECT :'new_run'::uuid,n,
  statement_timestamp()-interval '26 hours',
  statement_timestamp()-interval '25 hours',
  statement_timestamp()-interval '25 hours'
 FROM generate_series(1,364) n;
INSERT INTO public.lab_v2_chapter_checks(run_id,day_number,chapter_id,confirmed_at)
 SELECT :'new_run'::uuid,p.day_number,p.chapter_id,statement_timestamp()-interval '25 hours'
 FROM public.lab_v2_plan_chapters p WHERE p.plan_length=365 AND p.day_number<=364;
SET ROLE authenticated;
SELECT public.lab_v2_activate(:'new_run'::uuid,365);
SELECT public.lab_v2_confirm(:'new_run'::uuid,365,'39:3');
SELECT public.lab_v2_confirm(:'new_run'::uuid,365,'39:4');
SELECT public.lab_v2_confirm(:'new_run'::uuid,365,'19:150');
SELECT public.lab_v2_confirm(:'new_run'::uuid,365,'66:22');
DO $test$
DECLARE s jsonb;c integer;
BEGIN
 SELECT public.lab_v2_sync((SELECT id FROM public.lab_v2_runs WHERE user_id=auth.uid() AND status='completed' LIMIT 1)) INTO s;
 SELECT COUNT(*) INTO c FROM public.lab_v2_cycle_awards WHERE run_id=(SELECT id FROM public.lab_v2_runs WHERE user_id=auth.uid() AND status='completed' LIMIT 1);
 IF s->>'status'<>'completed' OR (s->>'run_xp')::integer<>21887 OR c<>1 OR
   s->'cycle_award'->>'perfect_constancy'<>'false' THEN
  RAISE EXCEPTION 'FAIL: V2 annual bonus/perfect badge: % count %',s,c;
 END IF;
END $test$;
-- Repeated RPC confirmations cannot issue another completed-cycle award.
SELECT public.lab_v2_confirm((SELECT id FROM public.lab_v2_runs WHERE user_id=auth.uid() AND status='completed' LIMIT 1),365,'66:22');
DO $test$
BEGIN
 IF (SELECT COUNT(*) FROM public.lab_v2_cycle_awards WHERE run_id=(SELECT id FROM public.lab_v2_runs WHERE user_id=auth.uid() AND status='completed' LIMIT 1))<>1
 THEN RAISE EXCEPTION 'FAIL: annual crown duplicated'; END IF;
END $test$;
-- Regression: another session's recent login must NOT authorize a stale JWT.
RESET ROLE;
UPDATE auth.sessions SET created_at=statement_timestamp()-interval '10 minutes'
 WHERE user_id='11111111-1111-4111-8111-111111111111'::uuid;
SET ROLE authenticated;
DO $test$
BEGIN
 BEGIN
  PERFORM public.lab_game_full_reset('ZERAR JORNADA');
  RAISE EXCEPTION 'FAIL: stale session reset another device journey';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE 'Entre novamente na sua conta%' THEN RAISE; END IF;
 END;
 IF NOT EXISTS(SELECT 1 FROM public.lab_v2_cycle_awards WHERE user_id=auth.uid())
 THEN RAISE EXCEPTION 'FAIL: old session removed a completed Bible award'; END IF;
END $test$;
RESET ROLE;
UPDATE auth.sessions SET created_at=statement_timestamp()
 WHERE user_id='11111111-1111-4111-8111-111111111111'::uuid;
SET ROLE authenticated;
-- Explicit verified reset removes V1+V2 historical XP, awards and all lives.
DO $test$
DECLARE s jsonb;
BEGIN
 SELECT public.lab_game_full_reset('ZERAR JORNADA') INTO s;
 IF s->>'reset'<>'true' THEN RAISE EXCEPTION 'FAIL: total reset'; END IF;
 IF EXISTS (SELECT 1 FROM public.lab_v2_runs WHERE user_id=auth.uid()) OR
   EXISTS (SELECT 1 FROM public.lab_v2_cycle_awards WHERE user_id=auth.uid()) OR
   EXISTS (SELECT 1 FROM public.lab_v2_monthly_lives WHERE user_id=auth.uid())
 THEN RAISE EXCEPTION 'FAIL: V2 results survived full reset'; END IF;
END $test$;
-- GC integration: new participants cannot transfer pre-join completion.
RESET ROLE;
INSERT INTO auth.users(id) VALUES('33333333-3333-4333-8333-333333333333');
INSERT INTO public.lab_game_stats(user_id,leaderboard_opt_in) VALUES
 ('11111111-1111-4111-8111-111111111111',true),
 ('22222222-2222-4222-8222-222222222222',true),
 ('33333333-3333-4333-8333-333333333333',true)
ON CONFLICT(user_id) DO UPDATE SET leaderboard_opt_in=true;
-- The smoke profile table needs leaderboard columns for the GC views.
INSERT INTO public.reading_groups(name,owner_id,competition_opt_in)
 VALUES('GC Integracao','11111111-1111-4111-8111-111111111111',true)
 RETURNING id AS gc_id \gset
SELECT set_config('app.test_group_id', :'gc_id',false);
INSERT INTO public.reading_group_members(group_id,user_id,role) VALUES
 (:'gc_id'::uuid,'11111111-1111-4111-8111-111111111111','leader'),
 (:'gc_id'::uuid,'22222222-2222-4222-8222-222222222222','member'),
 (:'gc_id'::uuid,'33333333-3333-4333-8333-333333333333','member');
SELECT set_config('app.test_user','22222222-2222-4222-8222-222222222222',false);
SET ROLE authenticated;
SELECT * FROM public.lab_v2_gc_league();
SELECT public.lab_v2_group_summary(:'gc_id'::uuid);
SELECT * FROM public.lab_v2_group_ranking(:'gc_id'::uuid);
DO $test$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.lab_v2_gc_league();
 IF n<>1 THEN RAISE EXCEPTION 'FAIL: eligible opted-in GC not in V2 league'; END IF;
END $test$;
-- Authenticated stranger (non-member) cannot browse the GC's private scores.
SELECT set_config('app.test_user','44444444-4444-4444-8444-444444444444',false);
DO $test$
BEGIN
 BEGIN
  PERFORM public.lab_v2_group_summary(current_setting('app.test_group_id')::uuid);
  RAISE EXCEPTION 'FAIL: non-member viewed private GC';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE 'Acesso ao GC não autorizado%' THEN RAISE; END IF;
 END;
END $test$;
RESET ROLE;
SELECT 'LAB V2 POSTGRES SMOKE PASSED' AS result;


-- Profile & notice matrix must also compile on the target PostgreSQL engine.
-- This portion is evaluated after the V2 game tests to avoid replacing the
-- smoke-specific unified-reset function before it has been exercised.

SELECT set_config('app.test_user','11111111-1111-4111-8111-111111111111',false);
SET ROLE authenticated;
INSERT INTO public.lab_notification_preferences(user_id,enabled,in_app_popup,email,reading_reminders,gc_activity)
VALUES(auth.uid(),true,true,true,true,false);
RESET ROLE;
-- Re-running the single additive backfill statement simulates a user record
-- from before the migration without mutating production data.
UPDATE public.lab_notification_preferences
 SET reading_popup=enabled AND in_app_popup AND reading_reminders,
     reading_email=enabled AND email AND reading_reminders,
     gc_popup=enabled AND in_app_popup AND gc_activity,
     gc_email=enabled AND email AND gc_activity;
SET ROLE authenticated;
DO $notice$
DECLARE r public.lab_notification_preferences%ROWTYPE;
BEGIN
 SELECT * INTO r FROM public.lab_notification_preferences WHERE user_id=auth.uid();
 IF r.reading_popup IS DISTINCT FROM true OR r.reading_email IS DISTINCT FROM true
    OR r.gc_popup IS DISTINCT FROM false OR r.stage_email IS DISTINCT FROM false THEN
  RAISE EXCEPTION 'FAIL: notification category-channel consent incorrectly backfilled';
 END IF;
END $notice$;
SELECT set_config('app.test_user','22222222-2222-4222-8222-222222222222',false);
DO $notice$
DECLARE total integer;
BEGIN
 SELECT COUNT(*) INTO total FROM public.lab_notification_preferences;
 IF total<>0 THEN RAISE EXCEPTION 'FAIL: another user sees private notification settings'; END IF;
 BEGIN
  INSERT INTO public.lab_notification_preferences(user_id,enabled,reading_popup)
  VALUES('11111111-1111-4111-8111-111111111111',true,true);
  RAISE EXCEPTION 'FAIL: user can create settings belonging to another user';
 EXCEPTION WHEN insufficient_privilege OR check_violation OR unique_violation THEN NULL;
 END;
END $notice$;
RESET ROLE;
SELECT 'LAB PROFILE AND NOTIFICATION MATRIX PASSED' AS result;


-- Optional email audit has private, append-only browser visibility.
\i supabase/migrations/202610160107_notification_delivery_audit.sql
INSERT INTO public.lab_notification_deliveries
 (user_id,category,channel,local_day,status)
 VALUES('11111111-1111-4111-8111-111111111111','reading','email',DATE '2026-10-16','reserved');
SELECT set_config('app.test_user','22222222-2222-4222-8222-222222222222',false);
SET ROLE authenticated;
DO $notice$
DECLARE n integer;
BEGIN
 SELECT COUNT(*) INTO n FROM public.lab_notification_deliveries;
 IF n<>0 THEN RAISE EXCEPTION 'FAIL: email delivery audit visible to another user'; END IF;
 BEGIN
  INSERT INTO public.lab_notification_deliveries
   (user_id,category,channel,local_day)
  VALUES(auth.uid(),'reading','email',DATE '2026-10-16');
  RAISE EXCEPTION 'FAIL: browser inserted an email delivery';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $notice$;
RESET ROLE;
SELECT 'LAB OPTIONAL EMAIL DELIVERY SECURITY PASSED' AS result;

-- INVARIANTE: falha iniciada em outubro belongs to October, EVEN across
-- Nov 1. Controlled timestamps are fed to the private helper exclusively
-- on this disposable CI database, never through an authenticated public RPC.
INSERT INTO auth.users(id) VALUES
 ('55555555-5555-4555-8555-555555555555'),
 ('66666666-6666-4666-8666-666666666666');
INSERT INTO public.lab_v2_runs(user_id,plan_length,status,started_at)
 VALUES('55555555-5555-4555-8555-555555555555',365,'active',
        TIMESTAMPTZ '2026-10-30 17:00:00+00')
 RETURNING id AS month_run \gset
SELECT set_config('app.month_run', :'month_run',false);
INSERT INTO public.lab_v2_stages(run_id,day_number,activated_at)
 VALUES(:'month_run'::uuid,1,TIMESTAMPTZ '2026-10-30 17:00:00+00');
SELECT set_config('app.test_user','55555555-5555-4555-8555-555555555555',false);
SELECT public.lab_v2_resolve(:'month_run'::uuid,TIMESTAMPTZ '2026-11-01 00:00:00+00');
DO $period$
DECLARE lives integer;the_month date;
BEGIN
 SELECT used_lives,month_start INTO lives,the_month
 FROM public.lab_v2_monthly_lives WHERE user_id=auth.uid();
 IF lives<>1 OR the_month<>DATE '2026-10-01'
 THEN RAISE EXCEPTION 'FAIL: October incident was charged to another month (% %)',lives,the_month; END IF;
END $period$;
SELECT public.lab_v2_resolve(:'month_run'::uuid,TIMESTAMPTZ '2026-11-02 00:00:00+00');
DO $period$
DECLARE october integer;november integer;
BEGIN
 SELECT used_lives INTO october FROM public.lab_v2_monthly_lives
 WHERE user_id=auth.uid() AND month_start=DATE '2026-10-01';
 SELECT used_lives INTO november FROM public.lab_v2_monthly_lives
 WHERE user_id=auth.uid() AND month_start=DATE '2026-11-01';
 IF october<>2 OR november IS NOT NULL
 THEN RAISE EXCEPTION 'FAIL: old incident used November lives (% %)',october,november; END IF;
END $period$;
SELECT public.lab_v2_resolve(:'month_run'::uuid,TIMESTAMPTZ '2026-11-04 00:00:00+00');
DO $period$
DECLARE october integer;november integer;state_ text;ended timestamptz;
BEGIN
 SELECT used_lives INTO october FROM public.lab_v2_monthly_lives
 WHERE user_id=auth.uid() AND month_start=DATE '2026-10-01';
 SELECT used_lives INTO november FROM public.lab_v2_monthly_lives
 WHERE user_id=auth.uid() AND month_start=DATE '2026-11-01';
 SELECT status,finished_at INTO state_,ended FROM public.lab_v2_runs
 WHERE id=current_setting('app.month_run')::uuid;
 IF october<>3 OR november IS NOT NULL OR state_<>'failed' OR
    ended<>TIMESTAMPTZ '2026-11-03 23:00:00+00'
 THEN RAISE EXCEPTION 'FAIL: month rollover resurrected a failed stage (% % % %)',
  october,november,state_,ended; END IF;
END $period$;

-- A still-valid October 31 stage must NOT lose a life merely when November starts.
INSERT INTO public.lab_v2_runs(user_id,plan_length,status,started_at)
 VALUES('66666666-6666-4666-8666-666666666666',365,'active',
        TIMESTAMPTZ '2026-11-01 01:00:00+00')
 RETURNING id AS crossing_run \gset
SELECT set_config('app.crossing_run', :'crossing_run',false);
INSERT INTO public.lab_v2_stages(run_id,day_number,activated_at)
 VALUES(:'crossing_run'::uuid,1,TIMESTAMPTZ '2026-11-01 01:00:00+00');
SELECT set_config('app.test_user','66666666-6666-4666-8666-666666666666',false);
SELECT public.lab_v2_resolve(:'crossing_run'::uuid,TIMESTAMPTZ '2026-11-01 03:00:00+00');
DO $period$
BEGIN
 IF EXISTS (SELECT 1 FROM public.lab_v2_monthly_lives WHERE user_id=auth.uid()) OR
    EXISTS (SELECT 1 FROM public.lab_v2_incidents WHERE run_id=current_setting('app.crossing_run')::uuid)
 THEN RAISE EXCEPTION 'FAIL: crossing midnight consumed a life before 24+6 hours'; END IF;
END $period$;
SELECT 'LAB V2 CROSS-MONTH SAFETY PASSED' AS result;

-- Final full-year crown/constancy and irreversible reset gates.
\i scripts/tests/v2-annual-awards-smoke.sql

\i scripts/tests/v2-terminal-state-smoke.sql
