-- Ephemeral SQL regression: life debits MUST survive a client request made
-- AFTER the player has exhausted available time, even if not calling sync.
INSERT INTO auth.users(id) VALUES
 ('99999999-9999-4999-8999-999999999991'),
 ('99999999-9999-4999-8999-999999999992');
UPDATE public.lab_v2_release_controls SET enabled=true WHERE singleton=true;

-- Late attempt to activate a next step must return FAILED and commit 3 debits.
SELECT set_config('app.test_user','99999999-9999-4999-8999-999999999991',false);
SELECT (public.lab_v2_start(365)->>'run_id')::uuid AS terminal_run_a \gset
SELECT set_config('app.terminal_run_a', :'terminal_run_a',false);
SELECT public.lab_v2_activate(:'terminal_run_a'::uuid,1);
UPDATE public.lab_v2_stages SET activated_at=statement_timestamp()-interval '104 hours'
 WHERE run_id=:'terminal_run_a'::uuid AND day_number=1;
SELECT public.lab_v2_activate(:'terminal_run_a'::uuid,2);
DO $terminal$
DECLARE state_ text;spent integer;end_ timestamptz;
BEGIN
 SELECT status,finished_at INTO state_,end_ FROM public.lab_v2_runs
 WHERE id=current_setting('app.terminal_run_a')::uuid;
 SELECT SUM(used_lives) INTO spent FROM public.lab_v2_monthly_lives
 WHERE user_id=auth.uid();
 IF state_<>'failed' OR spent<>3 OR end_ IS NULL THEN
  RAISE EXCEPTION 'FAIL: late stage activation rolled back FAILED status or life charges (% % %)',
  state_,spent,end_; END IF;
END $terminal$;

-- Late chapter confirmation on an unfinished stage must behave identically.
SELECT set_config('app.test_user','99999999-9999-4999-8999-999999999992',false);
SELECT (public.lab_v2_start(365)->>'run_id')::uuid AS terminal_run_b \gset
SELECT set_config('app.terminal_run_b', :'terminal_run_b',false);
SELECT public.lab_v2_activate(:'terminal_run_b'::uuid,1);
UPDATE public.lab_v2_stages SET activated_at=statement_timestamp()-interval '104 hours'
 WHERE run_id=:'terminal_run_b'::uuid AND day_number=1;
SELECT public.lab_v2_confirm(:'terminal_run_b'::uuid,1,'1:1');
DO $terminal$
DECLARE state_ text;spent integer;chapters integer;
BEGIN
 SELECT status INTO state_ FROM public.lab_v2_runs WHERE id=current_setting('app.terminal_run_b')::uuid;
 SELECT SUM(used_lives) INTO spent FROM public.lab_v2_monthly_lives
 WHERE user_id=auth.uid();
 SELECT COUNT(*) INTO chapters FROM public.lab_v2_chapter_checks
 WHERE run_id=current_setting('app.terminal_run_b')::uuid;
 IF state_<>'failed' OR spent<>3 OR chapters<>0 THEN
  RAISE EXCEPTION 'FAIL: late chapter confirmation rolled back FAIL or granted XP (% % %)',
   state_,spent,chapters; END IF;
END $terminal$;
SELECT 'LAB V2 TERMINAL-STATE ATOMICITY PASSED' AS result;
