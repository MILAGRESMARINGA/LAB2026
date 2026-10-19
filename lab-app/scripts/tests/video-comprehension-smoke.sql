-- Only synthetic CI accounts/catalogue; no provider calls or real users.
INSERT INTO public.lab_video_catalog VALUES('videos:genesis-1-11',4,'https://bibleproject.com/pt-br/videos/genesis-1-11/',true) ON CONFLICT(video_key) DO UPDATE SET duration_seconds=4,ready=true;
INSERT INTO lab_agent_private.video_questions VALUES
 ('videos:genesis-1-11',1,'Questão sintética um','["sim","não"]',0,'Explicação um'),
 ('videos:genesis-1-11',2,'Questão sintética dois','["não","sim"]',1,'Explicação dois');
SELECT set_config('app.test_user','f1000000-0000-4000-8000-000000000001',false);
SET ROLE authenticated;
DO $test$
DECLARE r jsonb;s uuid;old_s uuid;failed boolean:=false;
BEGIN
 BEGIN PERFORM 1 FROM lab_agent_private.video_questions;RAISE EXCEPTION 'Answers leaked';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.lab_game_video_confirm('videos:genesis-1-11');EXCEPTION WHEN raise_exception THEN failed:=true;END;
 IF NOT failed THEN RAISE EXCEPTION 'Legacy bypass allowed';END IF;
 r:=public.lab_video_watch('videos:genesis-1-11');s:=(r->>'session_id')::uuid;old_s:=s;
 r:=public.lab_video_watch('videos:genesis-1-11');s:=(r->>'session_id')::uuid;
 failed:=false;
 BEGIN PERFORM public.lab_video_watch('videos:genesis-1-11',NULL,'tick',0,1,NULL,old_s);EXCEPTION WHEN raise_exception THEN failed:=true;END;
 IF NOT failed THEN RAISE EXCEPTION 'Stale tab admitted';END IF;
 failed:=false;
 BEGIN PERFORM public.lab_video_watch('videos:genesis-1-11','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');EXCEPTION WHEN raise_exception THEN failed:=true;END;
 IF NOT failed THEN RAISE EXCEPTION 'Foreign/missing run admitted';END IF;
 failed:=false;
 BEGIN PERFORM public.lab_video_watch('videos:genesis-1-11',NULL,'quiz',0,1,'{"1":0,"2":1}',s);EXCEPTION WHEN raise_exception THEN failed:=true;END;
 IF NOT failed THEN RAISE EXCEPTION 'Premature quiz admitted';END IF;
 r:=public.lab_video_watch('videos:genesis-1-11',NULL,'tick',0,1,NULL,s);
 r:=public.lab_video_watch('videos:genesis-1-11',NULL,'tick',4,2,NULL,s);
 IF (r->>'covered_seconds')::float8>0.01 THEN RAISE EXCEPTION 'Fast forward credited';END IF;
 r:=public.lab_video_watch('videos:genesis-1-11',NULL,'tick',0,3,NULL,s);
 PERFORM pg_sleep(1.05);
 r:=public.lab_video_watch('videos:genesis-1-11',NULL,'tick',1,4,NULL,s);
 r:=public.lab_video_watch('videos:genesis-1-11',NULL,'tick',3,4,NULL,s);
 IF (r->>'covered_seconds')::float8>1.01 THEN RAISE EXCEPTION 'Replay credited';END IF;
 PERFORM pg_sleep(1.05);
 r:=public.lab_video_watch('videos:genesis-1-11',NULL,'tick',2,5,NULL,s);
 PERFORM pg_sleep(1.05);
 r:=public.lab_video_watch('videos:genesis-1-11',NULL,'tick',3,6,NULL,s);
 PERFORM pg_sleep(1.05);
 r:=public.lab_video_watch('videos:genesis-1-11',NULL,'ended',4,7,NULL,s);
 IF NOT (r->>'playback_complete')::boolean OR jsonb_array_length(r->'questions')<>2 OR r::text LIKE '%correct_option%' THEN RAISE EXCEPTION 'Completion/question contract failed: %',r;END IF;
 r:=public.lab_video_watch('videos:genesis-1-11',NULL,'quiz',4,8,'{"1":1,"2":0}',s);
 IF (r->>'passed')::boolean OR (r->>'already_awarded')::boolean THEN RAISE EXCEPTION 'Wrong quiz rewarded';END IF;
 r:=public.lab_video_watch('videos:genesis-1-11',NULL,'quiz',4,9,'{"1":0,"2":1}',s);
 IF NOT (r->>'passed')::boolean OR NOT (r->>'awarded')::boolean THEN RAISE EXCEPTION 'Valid quiz not rewarded: %',r;END IF;
 r:=public.lab_video_watch('videos:genesis-1-11',NULL,'quiz',4,9,'{"1":0,"2":1}',s);
 IF (r->>'awarded')::boolean THEN RAISE EXCEPTION 'Duplicate XP';END IF;
END;$test$;
SELECT set_config('app.test_user','f1000000-0000-4000-8000-000000000002',false);
DO $test$ DECLARE r jsonb;BEGIN
 r:=public.lab_video_watch('videos:genesis-1-11');
 IF (r->>'covered_seconds')::float8<>0 OR (r->>'already_awarded')::boolean THEN RAISE EXCEPTION 'Cross account watch leak';END IF;
END;$test$;
SELECT set_config('app.test_user','f1000000-0000-4000-8000-000000000003',false);
DO $test$
DECLARE r jsonb;s uuid;
BEGIN
 r:=public.lab_video_watch('videos:genesis-1-11');s:=(r->>'session_id')::uuid;
 r:=public.lab_video_watch('videos:genesis-1-11',NULL,'tick',0,1,NULL,s);
 PERFORM pg_sleep(0.8);
 r:=public.lab_video_watch('videos:genesis-1-11',NULL,'tick',0.92,2,NULL,s);
 r:=public.lab_video_watch('videos:genesis-1-11',NULL,'pause',0.92,3,NULL,s);
 IF (r->>'covered_seconds')::float8<0.75 THEN RAISE EXCEPTION 'Pause erased coverage';END IF;
 -- Resume from the last covered frontier, as the player does after interruption.
 r:=public.lab_video_watch('videos:genesis-1-11',NULL,'tick',0.8,4,NULL,s);
 PERFORM pg_sleep(1.3);
 r:=public.lab_video_watch('videos:genesis-1-11',NULL,'tick',2,5,NULL,s);
 PERFORM pg_sleep(0.8);
 r:=public.lab_video_watch('videos:genesis-1-11',NULL,'tick',2.92,6,NULL,s);
 PERFORM pg_sleep(1.3);
 r:=public.lab_video_watch('videos:genesis-1-11',NULL,'ended',4,7,NULL,s);
 IF NOT (r->>'playback_complete')::boolean THEN RAISE EXCEPTION 'Heartbeat jitter stranded completed video: %',r;END IF;
END;$test$;
RESET ROLE;
SET ROLE anon;
DO $test$ BEGIN
 BEGIN PERFORM public.lab_video_watch('videos:genesis-1-11');RAISE EXCEPTION 'Anonymous video admitted';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END;$test$;
RESET ROLE;
SELECT 'VIDEO COVERAGE, QUIZ, OWNERSHIP AND REPLAY PASSED' AS result;
