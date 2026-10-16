\set ON_ERROR_STOP on
-- Ephemeral PostgreSQL 16 ONLY, invoked by GitHub Actions v2-postgres job.
-- Isolated stubs replace Supabase auth; no user or production data is used.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
GRANT USAGE ON SCHEMA auth TO authenticated;
CREATE TABLE auth.users(id uuid PRIMARY KEY,last_sign_in_at timestamptz DEFAULT now());
-- Disposable Auth stub: a fresh session is tied to the JWT identity.
CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,created_at timestamptz NOT NULL DEFAULT now());
CREATE OR REPLACE FUNCTION auth.fake_session() RETURNS trigger LANGUAGE plpgsql AS $fake$
BEGIN
 INSERT INTO auth.sessions(id,user_id,created_at) VALUES(NEW.id,NEW.id,statement_timestamp());
 RETURN NEW;
END $fake$;
CREATE TRIGGER fake_auth_session AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION auth.fake_session();
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS
$jwt$ SELECT jsonb_build_object('session_id',NULLIF(current_setting('app.test_user',true),'')::text) $jwt$;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT NULLIF(current_setting('app.test_user',true),'')::uuid $$;
CREATE TABLE public.lab_game_runs(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id),
 started_on date NOT NULL,
 status text NOT NULL DEFAULT 'active',
 completed_days smallint NOT NULL DEFAULT 0,
 finished_on date,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (id,user_id)
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
CREATE TABLE public.lab_game_plan_chapters(
 version smallint NOT NULL,day_number smallint NOT NULL,slot smallint NOT NULL,chapter_id text NOT NULL,
 PRIMARY KEY(version,day_number,slot),UNIQUE(version,chapter_id)
);
INSERT INTO public.lab_game_plan_chapters VALUES
 (1,1,1,'1:1'),(1,1,2,'19:1'),(1,1,3,'43:1');
ALTER TABLE public.lab_game_plan_chapters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_game_plan_chapters FROM PUBLIC,anon,authenticated;
CREATE TABLE public.lab_game_chapter_checks(
 run_id uuid NOT NULL REFERENCES public.lab_game_runs(id) ON DELETE CASCADE,
 day_number smallint NOT NULL,chapter_id text NOT NULL,read_on date NOT NULL,
 confirmed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(run_id,day_number,chapter_id)
);
ALTER TABLE public.lab_game_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_game_chapter_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_game_stats ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.lab_game_runs,public.lab_game_chapter_checks,public.lab_game_stats TO authenticated;
CREATE POLICY "Own challenge runs" ON public.lab_game_runs
 FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE POLICY "Own challenge stats" ON public.lab_game_stats
 FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE POLICY "Own chapter checks" ON public.lab_game_chapter_checks
 FOR SELECT TO authenticated USING (EXISTS(
  SELECT 1 FROM public.lab_game_runs r WHERE r.id=run_id AND r.user_id=(SELECT auth.uid())
 ));
CREATE TABLE public.lab_bible_verses(
 edition text NOT NULL,chapter_id text NOT NULL,verse_number smallint NOT NULL,verse_text text NOT NULL,
 PRIMARY KEY(edition,chapter_id,verse_number)
);
ALTER TABLE public.lab_bible_verses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_bible_verses FROM PUBLIC,anon,authenticated;
INSERT INTO public.lab_bible_verses(edition,chapter_id,verse_number,verse_text)
VALUES
 ('ALM1911','1:1',1,array_to_string(array_fill('palavra'::text,ARRAY[200]),' ')),
 ('ALM1911','43:1',1,'palavra');
INSERT INTO public.lab_bible_verses(edition,chapter_id,verse_number,verse_text)
SELECT 'ALM1911','19:1',g,'palavra' FROM generate_series(1,20) AS g;
CREATE TABLE public.lab_game_cycle_awards(
 run_id uuid PRIMARY KEY REFERENCES public.lab_game_runs(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 cycle_number integer NOT NULL,bonus_xp integer NOT NULL,
 awarded_at timestamptz NOT NULL DEFAULT now(),UNIQUE(user_id,cycle_number)
);
ALTER TABLE public.lab_game_cycle_awards ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_game_cycle_awards FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lab_game_cycle_awards TO authenticated;
CREATE POLICY "Own test awards" ON public.lab_game_cycle_awards
 FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE OR REPLACE FUNCTION public.lab_game_sync()
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $sync$
DECLARE v_user uuid:=auth.uid();v_run public.lab_game_runs%ROWTYPE;v_xp integer;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
 SELECT * INTO v_run FROM public.lab_game_runs
  WHERE user_id=v_user AND status='active' ORDER BY created_at DESC,id DESC LIMIT 1;
 SELECT COALESCE(total_xp,0) INTO v_xp FROM public.lab_game_stats WHERE user_id=v_user;
 RETURN jsonb_build_object('run_id',v_run.id,'day',1,'completed_days',v_run.completed_days,
   'total_xp',COALESCE(v_xp,0),'checked','[]'::jsonb);
END
$sync$;
REVOKE ALL ON FUNCTION public.lab_game_sync() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lab_game_sync() TO authenticated;

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

RESET ROLE;
-- V1 and V2 server-timed chapter confirmation (all rows are ephemeral CI fixtures).
\i supabase/migrations/202610160109_server_side_reading_speed_guard.sql

INSERT INTO auth.users(id) VALUES('ab0de1f4-54dd-4caf-92ca-1b355b612fea');
INSERT INTO public.lab_game_stats(user_id) VALUES('ab0de1f4-54dd-4caf-92ca-1b355b612fea');
INSERT INTO public.lab_game_runs(user_id,started_on,status,completed_days)
VALUES(
 'ab0de1f4-54dd-4caf-92ca-1b355b612fea',
 (clock_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date,'active',0
) RETURNING id AS speed_v1_run \gset
SELECT set_config('app.speed_v1_run', :'speed_v1_run',false);
SELECT set_config('app.test_user','ab0de1f4-54dd-4caf-92ca-1b355b612fea',false);

SET ROLE authenticated;
SELECT public.lab_game_begin_chapter('1:1');
DO $speed$
BEGIN
 BEGIN
  PERFORM public.lab_game_confirm_chapter('1:1');
  RAISE EXCEPTION 'FAIL: V1 accepted an immediate chapter confirmation';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE 'Leitura muito rápida:%' THEN RAISE; END IF;
 END;
END $speed$;
RESET ROLE;
DO $speed$
BEGIN
 IF public.lab_chapter_minimum_read_seconds('1:1')<>50 THEN
  RAISE EXCEPTION 'FAIL: V1 duration did not use the 200-word fixture';
 END IF;
END $speed$;
UPDATE public.lab_game_chapter_read_sessions SET started_at=statement_timestamp()-interval '2 minutes'
 WHERE run_id=:'speed_v1_run'::uuid AND day_number=1 AND chapter_id='1:1';
SET ROLE authenticated;
SELECT public.lab_game_confirm_chapter('1:1');
SELECT public.lab_game_confirm_chapter('1:1');
DO $speed$
DECLARE xp integer;checks integer;
BEGIN
 SELECT total_xp INTO xp FROM public.lab_game_stats WHERE user_id=auth.uid();
 SELECT count(*) INTO checks FROM public.lab_game_chapter_checks
  WHERE run_id=current_setting('app.speed_v1_run',true)::uuid;
 IF xp<>10 OR checks<>1 THEN
  RAISE EXCEPTION 'FAIL: V1 confirmation did not award exactly once (XP %, checks %)',xp,checks;
 END IF;
END $speed$;
RESET ROLE;
DO $speed_v1_sessions$
DECLARE starts integer;
BEGIN
 SELECT count(*) INTO starts FROM public.lab_game_chapter_read_sessions
  WHERE run_id=current_setting('app.speed_v1_run',true)::uuid;
 IF starts<>0 THEN RAISE EXCEPTION 'FAIL: V1 reading session was not consumed'; END IF;
END $speed_v1_sessions$;

-- The release remains enabled only in this disposable PostgreSQL fixture.
SET ROLE authenticated;
SELECT (public.lab_v2_start(365)->>'run_id')::uuid AS speed_v2_run \gset
SELECT set_config('app.speed_v2_run', :'speed_v2_run',false);
SELECT public.lab_v2_activate(:'speed_v2_run'::uuid,1);
SELECT public.lab_v2_begin_chapter(:'speed_v2_run'::uuid,1,'19:1');
DO $speed$
BEGIN
 BEGIN
  PERFORM public.lab_v2_confirm(
   current_setting('app.speed_v2_run',true)::uuid,1,'19:1');
  RAISE EXCEPTION 'FAIL: V2 accepted an immediate chapter confirmation';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE 'Leitura muito rápida:%' THEN RAISE; END IF;
 END;
END $speed$;
RESET ROLE;
DO $speed$
BEGIN
 IF public.lab_chapter_minimum_read_seconds('19:1')<>40 THEN
  RAISE EXCEPTION 'FAIL: V2 duration did not use the 20-verse fixture';
 END IF;
END $speed$;
UPDATE public.lab_v2_chapter_read_sessions SET started_at=statement_timestamp()-interval '2 minutes'
 WHERE run_id=:'speed_v2_run'::uuid AND day_number=1 AND chapter_id='19:1';
SET ROLE authenticated;
SELECT public.lab_v2_confirm(:'speed_v2_run'::uuid,1,'19:1');
SELECT public.lab_v2_confirm(:'speed_v2_run'::uuid,1,'19:1');
DO $speed$
DECLARE score jsonb;checks integer;
BEGIN
 SELECT public.lab_v2_sync(current_setting('app.speed_v2_run',true)::uuid) INTO score;
 SELECT count(*) INTO checks FROM public.lab_v2_chapter_checks
  WHERE run_id=current_setting('app.speed_v2_run',true)::uuid
    AND day_number=1 AND chapter_id='19:1';
 IF checks<>1 OR (score->>'run_xp')::integer<>10 THEN
  RAISE EXCEPTION 'FAIL: V2 confirmation did not award exactly once (score %, checks %)',
    score,checks;
 END IF;
END $speed$;
RESET ROLE;
DO $speed_v2_sessions$
DECLARE starts integer;
BEGIN
 SELECT count(*) INTO starts FROM public.lab_v2_chapter_read_sessions
  WHERE run_id=current_setting('app.speed_v2_run',true)::uuid;
 IF starts<>0 THEN RAISE EXCEPTION 'FAIL: V2 reading session was not consumed'; END IF;
END $speed_v2_sessions$;
DO $speed$
BEGIN
 IF EXISTS(
  SELECT 1 FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.prosecdef
    AND NOT ('search_path=""'=ANY(COALESCE(p.proconfig,ARRAY[]::text[])))
 ) THEN
  RAISE EXCEPTION 'FAIL: a public SECURITY DEFINER function lacks fixed search_path';
 END IF;
 IF NOT (
  SELECT c.relrowsecurity FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname='lab_game_plan_chapters'
 ) THEN RAISE EXCEPTION 'FAIL: chapter plan RLS was disabled'; END IF;
 IF EXISTS(
  SELECT 1 FROM pg_catalog.pg_policies
  WHERE schemaname='public' AND tablename='lab_game_plan_chapters'
 ) THEN RAISE EXCEPTION 'FAIL: a policy opened the internal chapter plan'; END IF;
 IF has_table_privilege('anon','public.lab_game_plan_chapters','SELECT')
    OR has_table_privilege('authenticated','public.lab_game_plan_chapters','SELECT') THEN
  RAISE EXCEPTION 'FAIL: API roles can read the internal chapter plan directly';
 END IF;
END $speed$;
RESET ROLE;
SELECT 'LAB SERVER-SIDE READING SPEED GUARDS PASSED' AS result;



-- Versioned study cache and fair GC XP score. This is still the disposable PG16/17 fixture.
\i supabase/migrations/202610160110_lab_v2_study_content_cache.sql
\i supabase/migrations/202610160111_lab_v2_gc_fair_xp_ranking.sql

DO $study_seed$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.lab_v2_study_content
  WHERE journey_key='bible-annual' AND layer=1 AND journey_day BETWEEN 1 AND 3
    AND publication_status='published';
 IF n<>6 THEN RAISE EXCEPTION 'FAIL: expected six curated Layer 1 studies for days 1-3, got %',n; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.lab_v2_study_content
   WHERE study_key='d1-genesis1-john1-layer1-2026-10-v1'
     AND chapter_refs=ARRAY['1:1','43:1']::text[])
    OR NOT EXISTS(SELECT 1 FROM public.lab_v2_study_content
   WHERE study_key='d1-psalm1-layer1-2026-10-v1'
     AND chapter_refs=ARRAY['19:1']::text[])
    OR NOT EXISTS(SELECT 1 FROM public.lab_v2_study_content
   WHERE study_key='d2-genesis2-3-layer1-2026-10-v1'
     AND chapter_refs=ARRAY['1:2','1:3']::text[])
    OR NOT EXISTS(SELECT 1 FROM public.lab_v2_study_content
   WHERE study_key='d2-john2-layer1-2026-10-v1'
     AND chapter_refs=ARRAY['43:2']::text[])
    OR NOT EXISTS(SELECT 1 FROM public.lab_v2_study_content
   WHERE study_key='d3-genesis4-5-layer1-2026-10-v1'
     AND chapter_refs=ARRAY['1:4','1:5']::text[])
    OR NOT EXISTS(SELECT 1 FROM public.lab_v2_study_content
   WHERE study_key='d3-psalm2-layer1-2026-10-v1'
     AND chapter_refs=ARRAY['19:2']::text[])
 THEN RAISE EXCEPTION 'FAIL: connected and separate day-reference keys are wrong'; END IF;
 IF (SELECT cache_key FROM public.lab_v2_study_content
       WHERE study_key='d1-genesis1-john1-layer1-2026-10-v1')
    <>'bible-annual:1:1:1,43:1:L1:2026-10-v1'
 THEN RAISE EXCEPTION 'FAIL: study cache key omits journey/day/references/layer/version'; END IF;
END $study_seed$;

-- Replaying a cache tuple under a different study ID cannot insert a duplicate.
INSERT INTO public.lab_v2_study_catalog(study_key,title,xp)
VALUES ('ci-duplicate-cache-key','Fixture duplicate cache unit',15)
ON CONFLICT (study_key) DO NOTHING;
INSERT INTO public.lab_v2_study_content
  (study_key,journey_key,journey_day,chapter_refs,layer,content_version,cache_key,
   source_kind,publication_status,title,content)
SELECT 'ci-duplicate-cache-key',journey_key,journey_day,chapter_refs,layer,
       content_version,cache_key,source_kind,publication_status,title,content
  FROM public.lab_v2_study_content
 WHERE study_key='d1-genesis1-john1-layer1-2026-10-v1'
ON CONFLICT DO NOTHING;
DO $study_idempotency$
BEGIN
 IF (SELECT count(*) FROM public.lab_v2_study_content
      WHERE journey_key='bible-annual' AND journey_day=1
        AND chapter_refs=ARRAY['1:1','43:1']::text[]
        AND layer=1 AND content_version='2026-10-v1')<>1
 THEN RAISE EXCEPTION 'FAIL: versioned study cache inserted twice'; END IF;
END $study_idempotency$;

-- An alternate published version is a distinct cache row but the same XP unit.
INSERT INTO public.lab_v2_study_catalog(study_key,title,xp)
VALUES ('d1-genesis1-john1-layer1-2026-10-v2','Fixture alternate study version',15)
ON CONFLICT (study_key) DO NOTHING;
INSERT INTO public.lab_v2_study_content
  (study_key,journey_key,journey_day,chapter_refs,layer,content_version,cache_key,
   source_kind,publication_status,title,content)
SELECT 'd1-genesis1-john1-layer1-2026-10-v2',journey_key,journey_day,chapter_refs,
       layer,'ci-v2','bible-annual:1:1:1,43:1:L1:ci-v2',
       'curated','published','Fixture alternate study version',content
  FROM public.lab_v2_study_content
 WHERE study_key='d1-genesis1-john1-layer1-2026-10-v1'
ON CONFLICT DO NOTHING;

-- Test-only published layer fixtures exercise the 30/90 day policy without
-- inventing any production Layer 2 or Layer 3 study content.
INSERT INTO public.lab_v2_study_catalog(study_key,title,xp) VALUES
 ('ci-layer2-unlock-v1','Fixture: camada 2',15),
 ('ci-layer3-unlock-v1','Fixture: camada 3',15);
INSERT INTO public.lab_v2_study_content
 (study_key,journey_key,journey_day,chapter_refs,layer,content_version,cache_key,
  source_kind,publication_status,title,content)
VALUES
 ('ci-layer2-unlock-v1','bible-annual',1,ARRAY['1:1']::text[],2,'ci-v1','bible-annual:1:1:1:L2:ci-v1',
  'curated','published','Fixture: camada 2','{"title":"Fixture"}'::jsonb),
 ('ci-layer3-unlock-v1','bible-annual',1,ARRAY['1:1']::text[],3,'ci-v1','bible-annual:1:1:1:L3:ci-v1',
  'curated','published','Fixture: camada 3','{"title":"Fixture"}'::jsonb);

INSERT INTO auth.users(id) VALUES
 ('c7777777-c777-4c77-8c77-c77777777777'),
 ('c8888888-c888-4c88-8c88-c88888888888'),
 ('c9999999-c999-4c99-8c99-c99999999999');
INSERT INTO public.lab_game_stats(user_id,display_name,leaderboard_opt_in)
VALUES
 ('c7777777-c777-4c77-8c77-c77777777777','Study Fixture',false),
 ('c8888888-c888-4c88-8c88-c88888888888','Layer 2 Fixture',false),
 ('c9999999-c999-4c99-8c99-c99999999999','Layer 3 Fixture',false);
INSERT INTO public.lab_v2_runs(id,user_id,plan_length,status,started_at)
VALUES
 ('a7777777-7777-4777-8777-777777777777','c7777777-c777-4c77-8c77-c77777777777',365,'active',statement_timestamp()-interval '1 day'),
 ('a8888888-8888-4888-8888-888888888888','c8888888-c888-4c88-8c88-c88888888888',365,'active',statement_timestamp()-interval '1 day'),
 ('a9999999-9999-4999-8999-999999999999','c9999999-c999-4c99-8c99-c99999999999',365,'active',statement_timestamp()-interval '1 day');
INSERT INTO public.lab_v2_stages(run_id,day_number,activated_at,completed_at)
VALUES
 ('a7777777-7777-4777-8777-777777777777',1,statement_timestamp()-interval '1 hour',statement_timestamp()-interval '10 minutes');
INSERT INTO public.lab_v2_stages(run_id,day_number,activated_at,completed_at)
SELECT 'a8888888-8888-4888-8888-888888888888',g,
       statement_timestamp()-interval '1 hour',statement_timestamp()-interval '10 minutes'
  FROM generate_series(1,30) AS g;
INSERT INTO public.lab_v2_stages(run_id,day_number,activated_at,completed_at)
SELECT 'a9999999-9999-4999-8999-999999999999',g,
       statement_timestamp()-interval '1 hour',statement_timestamp()-interval '10 minutes'
  FROM generate_series(1,90) AS g;
INSERT INTO public.lab_v2_chapter_checks(run_id,day_number,chapter_id,confirmed_at)
VALUES
 ('a7777777-7777-4777-8777-777777777777',1,'1:1',statement_timestamp()-interval '10 minutes'),
 ('a7777777-7777-4777-8777-777777777777',1,'19:1',statement_timestamp()-interval '10 minutes'),
 ('a7777777-7777-4777-8777-777777777777',1,'43:1',statement_timestamp()-interval '10 minutes');

SET ROLE authenticated;
SELECT set_config('app.test_user','c7777777-c777-4c77-8c77-c77777777777',false);
DO $study_rls$
BEGIN
 IF (SELECT count(DISTINCT (journey_day,chapter_refs)) FROM public.lab_v2_study_content
      WHERE journey_day BETWEEN 1 AND 3 AND layer=1)<>6
 THEN RAISE EXCEPTION 'FAIL: signed-in new learner cannot read published Layer 1 seeds'; END IF;
 IF EXISTS(SELECT 1 FROM public.lab_v2_study_content WHERE layer IN(2,3))
 THEN RAISE EXCEPTION 'FAIL: Layer 2 or 3 unlocked before its progress threshold'; END IF;
 IF (SELECT count(*) FROM public.lab_v2_study_content WHERE layer=2 AND publication_status='published')<>0
 THEN RAISE EXCEPTION 'FAIL: unpublished layer content leaked'; END IF;
END $study_rls$;
DO $study_reward$
DECLARE s jsonb; rewards integer;xp integer;
BEGIN
 BEGIN
  PERFORM public.lab_v2_confirm_study(
    'a7777777-7777-4777-8777-777777777777','ci-layer2-unlock-v1',true);
  RAISE EXCEPTION 'FAIL: layer 2 study reward bypassed 30-day unlock';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE 'Camada 2 bloqueada:%' THEN RAISE; END IF;
 END;
 BEGIN
  PERFORM public.lab_v2_confirm_study(
    'a7777777-7777-4777-8777-777777777777','d2-genesis2-3-layer1-2026-10-v1',true);
  RAISE EXCEPTION 'FAIL: a study was rewarded before its day was completed';
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE 'Conclua a leitura do dia relacionado%' THEN RAISE; END IF;
 END;
 SELECT public.lab_v2_confirm_study(
   'a7777777-7777-4777-8777-777777777777','d1-genesis1-john1-layer1-2026-10-v1',true) INTO s;
 IF s->>'awarded'<>'true' THEN RAISE EXCEPTION 'FAIL: connected Day 1 study was not awarded'; END IF;
 SELECT public.lab_v2_confirm_study(
   'a7777777-7777-4777-8777-777777777777','d1-genesis1-john1-layer1-2026-10-v1',true) INTO s;
 IF s->>'awarded'<>'false' THEN RAISE EXCEPTION 'FAIL: repeated study confirmation awarded XP twice'; END IF;
 SELECT public.lab_v2_confirm_study(
   'a7777777-7777-4777-8777-777777777777','d1-genesis1-john1-layer1-2026-10-v2',true) INTO s;
 IF s->>'awarded'<>'false' THEN
   RAISE EXCEPTION 'FAIL: a new content version awarded XP for the same study unit';
 END IF;
 SELECT public.lab_v2_confirm_study(
   'a7777777-7777-4777-8777-777777777777','d1-psalm1-layer1-2026-10-v1',true) INTO s;
 IF s->>'awarded'<>'true' THEN RAISE EXCEPTION 'FAIL: separate Psalm study was not awarded'; END IF;
 SELECT count(*),sum(awarded_xp)::integer INTO rewards,xp
   FROM public.lab_v2_study_rewards
  WHERE run_id='a7777777-7777-4777-8777-777777777777';
 IF rewards<>2 OR xp<>30 THEN RAISE EXCEPTION 'FAIL: study XP was duplicated (rows %, XP %)',rewards,xp; END IF;
 SELECT public.lab_v2_sync('a7777777-7777-4777-8777-777777777777') INTO s;
 IF (s->>'study_xp')::integer<>30 OR (s->>'run_xp')::integer<>60
 THEN RAISE EXCEPTION 'FAIL: study XP not included in server score: %',s; END IF;
END $study_reward$;
RESET ROLE;

SET ROLE authenticated;
SELECT set_config('app.test_user','c8888888-c888-4c88-8c88-c88888888888',false);
DO $study_layer2$
BEGIN
 IF (SELECT count(*) FROM public.lab_v2_study_content WHERE layer=2)<>1
 THEN RAISE EXCEPTION 'FAIL: Layer 2 did not unlock at 30 completed days'; END IF;
 IF EXISTS(SELECT 1 FROM public.lab_v2_study_content WHERE layer=3)
 THEN RAISE EXCEPTION 'FAIL: Layer 3 unlocked before 90 completed days'; END IF;
END $study_layer2$;
SELECT set_config('app.test_user','c9999999-c999-4c99-8c99-c99999999999',false);
DO $study_layer3$
BEGIN
 IF (SELECT count(*) FROM public.lab_v2_study_content WHERE layer=3)<>1
 THEN RAISE EXCEPTION 'FAIL: Layer 3 did not unlock at 90 completed days'; END IF;
END $study_layer3$;
RESET ROLE;
SELECT 'LAB STUDY CACHE, LAYERS AND IDEMPOTENT XP PASSED' AS result;

-- Synthetic consented participants prove per-member averaging and the declared
-- three-category consistency multiplier without exposing personal activity.
RESET ROLE;
WITH ids AS (
  SELECT g,
    ('80000000-0000-4000-8000-' || lpad(to_hex(g),12,'0'))::uuid AS user_id
  FROM generate_series(1,24) AS g
)
INSERT INTO auth.users(id) SELECT user_id FROM ids;
WITH ids AS (
  SELECT g,
    ('80000000-0000-4000-8000-' || lpad(to_hex(g),12,'0'))::uuid AS user_id
  FROM generate_series(1,24) AS g
)
INSERT INTO public.lab_game_stats(user_id,display_name,leaderboard_opt_in)
SELECT user_id,'CI GC Fixture '||g, g<>4 FROM ids;
INSERT INTO public.reading_groups(name,owner_id,competition_opt_in)
VALUES
 ('LAB Fairness Small','80000000-0000-4000-8000-000000000001',true)
RETURNING id AS group_small \gset
INSERT INTO public.reading_groups(name,owner_id,competition_opt_in)
VALUES
 ('LAB Fairness Large','80000000-0000-4000-8000-000000000005',true)
RETURNING id AS group_large \gset
WITH ids AS (
 SELECT g,('80000000-0000-4000-8000-'||lpad(to_hex(g),12,'0'))::uuid AS user_id
 FROM generate_series(1,4) AS g
)
INSERT INTO public.reading_group_members(group_id,user_id,role,joined_at)
SELECT :'group_small'::uuid,user_id,
       CASE WHEN g=1 THEN 'leader' ELSE 'member' END,
       statement_timestamp()-interval '7 days'
 FROM ids;
WITH ids AS (
 SELECT g,('80000000-0000-4000-8000-'||lpad(to_hex(g),12,'0'))::uuid AS user_id
 FROM generate_series(5,24) AS g
)
INSERT INTO public.reading_group_members(group_id,user_id,role,joined_at)
SELECT :'group_large'::uuid,user_id,
       CASE WHEN g=5 THEN 'leader' ELSE 'member' END,
       statement_timestamp()-interval '7 days'
 FROM ids;
WITH ids AS (
 SELECT g,
  ('80000000-0000-4000-8000-'||lpad(to_hex(g),12,'0'))::uuid AS user_id,
  ('90000000-0000-4000-8000-'||lpad(to_hex(g),12,'0'))::uuid AS run_id
 FROM generate_series(1,24) AS g
)
INSERT INTO public.lab_v2_runs(id,user_id,plan_length,status,started_at,finished_at)
SELECT run_id,user_id,365,'completed',
       statement_timestamp()-interval '2 days',
       statement_timestamp()-interval '1 day'
 FROM ids;
WITH ids AS (
 SELECT g,
  ('90000000-0000-4000-8000-'||lpad(to_hex(g),12,'0'))::uuid AS run_id
 FROM generate_series(1,24) AS g
)
INSERT INTO public.lab_v2_stages(run_id,day_number,activated_at,completed_at)
SELECT run_id,1,statement_timestamp()-interval '2 hours',statement_timestamp()-interval '1 hour'
 FROM ids;
WITH ids AS (
 SELECT g,
  ('90000000-0000-4000-8000-'||lpad(to_hex(g),12,'0'))::uuid AS run_id
 FROM generate_series(1,24) AS g
)
INSERT INTO public.lab_v2_chapter_checks(run_id,day_number,chapter_id,confirmed_at)
SELECT run_id,1,'19:1',statement_timestamp()
 FROM ids;
WITH ids AS (
 SELECT g,
  ('90000000-0000-4000-8000-'||lpad(to_hex(g),12,'0'))::uuid AS run_id
 FROM generate_series(1,24) AS g
)
INSERT INTO public.lab_v2_study_rewards(run_id,study_key,study_unit_key,awarded_xp,confirmed_at)
SELECT run_id,'d1-psalm1-layer1-2026-10-v1',
       'fixture:psalm1:'||run_id::text,15,statement_timestamp()
 FROM ids;
WITH ids AS (
 SELECT g,
  ('90000000-0000-4000-8000-'||lpad(to_hex(g),12,'0'))::uuid AS run_id
 FROM generate_series(1,24) AS g
)
INSERT INTO public.lab_v2_video_rewards(run_id,video_key,awarded_xp,confirmed_at)
SELECT run_id,'videos:genesis-1-11',5,statement_timestamp()
 FROM ids;

SET ROLE authenticated;
SELECT set_config('app.test_user','80000000-0000-4000-8000-000000000001',false);
SELECT set_config('app.group_small', :'group_small', false);
SELECT set_config('app.group_large', :'group_large', false);
SELECT * FROM public.lab_v2_gc_league_fair();
SELECT public.lab_v2_gc_group_scorecard(:'group_small'::uuid);
DO $fair_score$
DECLARE
  small jsonb;
  large jsonb;
  listed integer;
BEGIN
 SELECT public.lab_v2_gc_group_scorecard(current_setting('app.group_small')::uuid) INTO small;
 SELECT public.lab_v2_gc_group_scorecard(current_setting('app.group_large')::uuid) INTO large;
 IF (small->>'average_xp_per_member')::numeric<>30
    OR (large->>'average_xp_per_member')::numeric<>30
    OR (small->>'score')::numeric<>(large->>'score')::numeric
    OR (small->>'consistency_multiplier')::numeric<>(large->>'consistency_multiplier')::numeric
 THEN RAISE EXCEPTION 'FAIL: group size changed mean XP/consistency/score (% / %)',small,large; END IF;
 IF (small->>'members')::integer<>4 OR (small->>'consenting_members')::integer<>3
    OR (large->>'members')::integer<>20 OR (large->>'consenting_members')::integer<>20
 THEN RAISE EXCEPTION 'FAIL: group leaderboard counts do not respect consent (% / %)',small,large; END IF;
 IF (small->>'reading_member_days')::integer<>3
    OR (small->>'study_member_days')::integer<>3
    OR (small->>'video_member_days')::integer<>3
    OR (small->>'reading_coverage_pct')::numeric<>14.3
 THEN RAISE EXCEPTION 'FAIL: transparent activity coverage calculation is wrong: %',small; END IF;
 SELECT count(*) INTO listed FROM public.lab_v2_gc_league_fair()
 WHERE group_id IN (current_setting('app.group_small')::uuid,
                    current_setting('app.group_large')::uuid);
 IF listed<>2 THEN RAISE EXCEPTION 'FAIL: expected both eligible national groups, got %',listed; END IF;
END $fair_score$;
RESET ROLE;
SELECT 'LAB FAIR GC AVERAGE XP AND THREE-CATEGORY CONSISTENCY PASSED' AS result;
