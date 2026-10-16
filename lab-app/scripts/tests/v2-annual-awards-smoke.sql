-- Complete-Bible P0 awards and destructive reset.
-- This script runs ONLY after v2-postgres-smoke.sql, on ephemeral CI PostgreSQL.
-- The 364 earlier stages are historical fixtures inserted by privileged CI;
-- only the final chapter is confirmed through a real authenticated RPC.
INSERT INTO auth.users(id,last_sign_in_at)
 VALUES('77777777-7777-4777-8777-777777777777',statement_timestamp()),
       ('88888888-8888-4888-8888-888888888888',statement_timestamp());
INSERT INTO public.lab_game_stats(user_id,best_days,total_xp)
 VALUES('77777777-7777-4777-8777-777777777777',0,0),
       ('88888888-8888-4888-8888-888888888888',0,0);
-- Membership and profile must survive reset.
INSERT INTO public.reading_groups(id,name,owner_id)
 VALUES('99999999-9999-4999-8999-999999999999',
        'GC de teste preservado','88888888-8888-4888-8888-888888888888');
INSERT INTO public.reading_group_members(group_id,user_id,role)
 VALUES('99999999-9999-4999-8999-999999999999',
        '77777777-7777-4777-8777-777777777777','member');
INSERT INTO public.lab_v2_runs(user_id,plan_length,status)
 SELECT id,365,'active' FROM auth.users
 WHERE id IN('77777777-7777-4777-8777-777777777777',
             '88888888-8888-4888-8888-888888888888');

-- Simulate all 365 activated stages, with all earlier stages finished and
-- on-time, and exactly one unconfirmed chapter in stage 365 per run.
INSERT INTO public.lab_v2_stages(run_id,day_number,activated_at,completed_at,transitioned_at,late_penalty)
 SELECT r.id,d.day_number,statement_timestamp()-interval '2 hours',
        CASE WHEN d.day_number=365 THEN NULL ELSE statement_timestamp()-interval '1 hour' END,
        CASE WHEN d.day_number=365 THEN NULL ELSE statement_timestamp()-interval '1 hour' END,
        CASE WHEN r.user_id='88888888-8888-4888-8888-888888888888'::uuid
                       AND d.day_number=13 THEN 3 ELSE 0 END
 FROM public.lab_v2_runs r
 JOIN (SELECT DISTINCT day_number FROM public.lab_v2_plan_chapters
       WHERE plan_length=365) d ON true
 WHERE r.user_id IN('77777777-7777-4777-8777-777777777777',
                    '88888888-8888-4888-8888-888888888888');

INSERT INTO public.lab_v2_chapter_checks(run_id,day_number,chapter_id,confirmed_at)
 SELECT r.id,p.day_number,p.chapter_id,statement_timestamp()-interval '1 hour'
 FROM public.lab_v2_runs r CROSS JOIN public.lab_v2_plan_chapters p
 WHERE r.plan_length=p.plan_length
   AND r.user_id IN('77777777-7777-4777-8777-777777777777',
                    '88888888-8888-4888-8888-888888888888')
   AND NOT(p.day_number=365 AND p.slot=4);

-- Guard against phantom crowns before the complete last chapter.
DO $award$
DECLARE n integer;
BEGIN
 SELECT COUNT(*) INTO n FROM public.lab_v2_cycle_awards
 WHERE user_id IN('77777777-7777-4777-8777-777777777777',
                  '88888888-8888-4888-8888-888888888888');
 IF n<>0 THEN RAISE EXCEPTION 'FAIL: granted crown before last Bible chapter'; END IF;
END $award$;

SELECT set_config('app.test_user','77777777-7777-4777-8777-777777777777',false);
SELECT public.lab_v2_confirm(r.id,365,p.chapter_id) AS finished
 FROM public.lab_v2_runs r
 JOIN public.lab_v2_plan_chapters p
  ON p.plan_length=365 AND p.day_number=365 AND p.slot=4
 WHERE r.user_id=auth.uid();
DO $award$
DECLARE state_ text; perfect_ boolean;bonus integer;chapters integer;
BEGIN
 SELECT status INTO state_ FROM public.lab_v2_runs WHERE user_id=auth.uid();
 SELECT perfect_constancy,bonus_xp INTO perfect_,bonus
 FROM public.lab_v2_cycle_awards WHERE user_id=auth.uid();
 SELECT COUNT(*) INTO chapters FROM public.lab_v2_chapter_checks c
 JOIN public.lab_v2_runs r ON r.id=c.run_id WHERE r.user_id=auth.uid();
 IF state_<>'completed' OR perfect_ IS DISTINCT FROM true OR bonus<>10000 OR chapters<>1189
 THEN RAISE EXCEPTION 'FAIL: 1189 chapters did not earn first perfect crown (% % % %)',
  state_,perfect_,bonus,chapters; END IF;
END $award$;
-- Repeating confirmation never creates another crown or bonus.
SELECT public.lab_v2_confirm(r.id,365,p.chapter_id)
 FROM public.lab_v2_runs r
 JOIN public.lab_v2_plan_chapters p
  ON p.plan_length=365 AND p.day_number=365 AND p.slot=4
 WHERE r.user_id=auth.uid();
DO $award$
DECLARE n integer;
BEGIN
 SELECT COUNT(*) INTO n FROM public.lab_v2_cycle_awards WHERE user_id=auth.uid();
 IF n<>1 THEN RAISE EXCEPTION 'FAIL: duplicate crown for same Bible'; END IF;
END $award$;

-- Same 1,189 chapters, but once late: crown yes, perfect-constancy no.
SELECT set_config('app.test_user','88888888-8888-4888-8888-888888888888',false);
SELECT public.lab_v2_confirm(r.id,365,p.chapter_id)
 FROM public.lab_v2_runs r JOIN public.lab_v2_plan_chapters p
  ON p.plan_length=365 AND p.day_number=365 AND p.slot=4
 WHERE r.user_id=auth.uid();
DO $award$
DECLARE state_ text;perfect_ boolean;bonus integer;
BEGIN
 SELECT status INTO state_ FROM public.lab_v2_runs WHERE user_id=auth.uid();
 SELECT perfect_constancy,bonus_xp INTO perfect_,bonus
 FROM public.lab_v2_cycle_awards WHERE user_id=auth.uid();
 IF state_<>'completed' OR perfect_ IS DISTINCT FROM false OR bonus<>10000
 THEN RAISE EXCEPTION 'FAIL: late Bible wrongly earned perfect-constancy badge'; END IF;
END $award$;

-- Protected total reset erases historical crowns and all XP, but NOT GC identity.
SELECT set_config('app.test_user','77777777-7777-4777-8777-777777777777',false);
SELECT public.lab_game_full_reset('ZERAR JORNADA');
DO $award$
DECLARE n integer;stats_ public.lab_game_stats%ROWTYPE;
BEGIN
 SELECT COUNT(*) INTO n FROM public.lab_v2_runs WHERE user_id=auth.uid();
 IF n<>0 THEN RAISE EXCEPTION 'FAIL: reset left V2 runs behind'; END IF;
 SELECT COUNT(*) INTO n FROM public.lab_v2_cycle_awards WHERE user_id=auth.uid();
 IF n<>0 THEN RAISE EXCEPTION 'FAIL: reset left crowns behind'; END IF;
 SELECT * INTO stats_ FROM public.lab_game_stats WHERE user_id=auth.uid();
 IF stats_.total_xp<>0 OR stats_.best_days<>0 THEN
  RAISE EXCEPTION 'FAIL: reset did not clear lifetime records'; END IF;
 SELECT COUNT(*) INTO n FROM public.reading_group_members WHERE user_id=auth.uid();
 IF n<>1 THEN RAISE EXCEPTION 'FAIL: reset incorrectly removed GC membership'; END IF;
END $award$;
SELECT (public.lab_v2_start(365)->>'run_id')::uuid AS restarted_run \gset
DO $award$
DECLARE s jsonb;
BEGIN
 SELECT public.lab_v2_sync(current_setting('app.last_restart_run')::uuid) INTO s;
 IF s->>'status'<>'active' OR (s->>'run_xp')::integer<>0 OR
    (s->>'best_completed_stages')::integer<>0 OR
    (s->>'completed_bibles_historical')::integer<>0 THEN
   RAISE EXCEPTION 'FAIL: new run inherited historical awards: %',s;
 END IF;
END $award$;
SELECT 'LAB V2 1189-CHAPTER CROWNS AND ZERO-HISTORY RESET PASSED' AS result;
