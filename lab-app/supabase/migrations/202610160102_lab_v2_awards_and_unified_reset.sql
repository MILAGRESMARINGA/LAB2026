-- LABGAME V2: complete-cycle crowns, historical records and full V1+V2 reset.
-- Version follows the shadow schema (100) and both validated canons (101).
-- All operations are scoped to the authenticated user's own run.
CREATE TABLE public.lab_v2_cycle_awards(
 run_id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 FOREIGN KEY(run_id,user_id) REFERENCES public.lab_v2_runs(id,user_id) ON DELETE CASCADE,
 cycle_number integer NOT NULL CHECK(cycle_number BETWEEN 1 AND 100000),
 bonus_xp integer NOT NULL CHECK(bonus_xp=10000+(cycle_number-1)*2500),
 perfect_constancy boolean NOT NULL DEFAULT false,
 awarded_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,cycle_number)
);
ALTER TABLE public.lab_v2_cycle_awards ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_v2_cycle_awards FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lab_v2_cycle_awards TO authenticated;
CREATE POLICY "Own V2 completed-cycle awards" ON public.lab_v2_cycle_awards
  FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.lab_v2_start(p_plan_length integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
  v_user uuid:=auth.uid();
  v_id uuid;
  v_previous public.lab_v2_runs%ROWTYPE;
  v_last public.lab_v2_stages%ROWTYPE;
  v_rows integer;
  v_days integer;
  v_bad integer;
  v_at timestamptz:=statement_timestamp();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
  IF p_plan_length NOT IN(365,366) THEN RAISE EXCEPTION 'Plano inválido'; END IF;
  -- Rolling journeys begun on any date use 365 steps. A 366-step plan is
  -- explicitly reserved for a cycle activated on January 1 of a leap year.
  IF p_plan_length=366 AND NOT (
    EXTRACT(MONTH FROM v_at AT TIME ZONE 'America/Sao_Paulo')=1
    AND EXTRACT(DAY FROM v_at AT TIME ZONE 'America/Sao_Paulo')=1
    AND MOD(EXTRACT(YEAR FROM v_at AT TIME ZONE 'America/Sao_Paulo')::integer,4)=0
    AND (
      MOD(EXTRACT(YEAR FROM v_at AT TIME ZONE 'America/Sao_Paulo')::integer,100)<>0
      OR MOD(EXTRACT(YEAR FROM v_at AT TIME ZONE 'America/Sao_Paulo')::integer,400)=0
    )
  ) THEN
   RAISE EXCEPTION 'Plano de 366 etapas disponível somente em 1º de janeiro de ano bissexto';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text,2116));
  IF NOT EXISTS(SELECT 1 FROM public.lab_v2_release_controls
                WHERE singleton=true AND enabled=true)
  THEN RAISE EXCEPTION 'Jornada V2 não liberada neste ambiente'; END IF;
  SELECT id INTO v_id FROM public.lab_v2_runs
    WHERE user_id=v_user AND status='active';
  IF v_id IS NOT NULL THEN RETURN public.lab_v2_sync(v_id); END IF;
  -- A V1 in progress is never silently superseded or combined with V2.
  -- V2 entry is EXPLICIT. Archive an unfinished V1 attempt, preserving all
  -- its chapter checks, previous XP, records and GC membership as history.
  UPDATE public.lab_game_runs
     SET status='failed',finished_on=(v_at AT TIME ZONE 'America/Sao_Paulo')::date
   WHERE user_id=v_user AND status='active';
  SELECT COUNT(*),COUNT(DISTINCT day_number) INTO v_rows,v_days
    FROM public.lab_v2_plan_chapters WHERE plan_length=p_plan_length;
  SELECT COUNT(*) INTO v_bad FROM(
    SELECT day_number,COUNT(*) n FROM public.lab_v2_plan_chapters
    WHERE plan_length=p_plan_length GROUP BY day_number
    HAVING COUNT(*) NOT IN (3,4) OR day_number>p_plan_length
  ) invalid_days;
  IF v_rows<>1189 OR v_days<>p_plan_length OR v_bad<>0
  THEN RAISE EXCEPTION 'O plano V2 precisa de validação integral antes da liberação'; END IF;
  SELECT * INTO v_previous FROM public.lab_v2_runs
    WHERE user_id=v_user ORDER BY started_at DESC,id DESC LIMIT 1;
  IF FOUND AND v_previous.status='completed' THEN
    SELECT * INTO v_last FROM public.lab_v2_stages
      WHERE run_id=v_previous.id ORDER BY day_number DESC LIMIT 1;
    IF v_at<GREATEST(v_last.activated_at+interval '24 hours',v_last.completed_at)
    THEN RAISE EXCEPTION 'O próximo ciclo ainda não está disponível'; END IF;
  END IF;
  INSERT INTO public.lab_v2_runs(user_id,plan_length,started_at)
    VALUES(v_user,p_plan_length,v_at) RETURNING id INTO v_id;
  RETURN public.lab_v2_sync(v_id);
END;
$fn$;
CREATE OR REPLACE FUNCTION public.lab_v2_sync(p_run uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
  v_user uuid:=auth.uid();
  v_run public.lab_v2_runs%ROWTYPE;
  v_stage public.lab_v2_stages%ROWTYPE;
  v_run_xp integer;
  v_bonus_xp integer;
  v_legacy_best integer;
  v_previous_completed integer;
  v_completed_stages integer;
  v_checked jsonb;
  v_award jsonb;
  v_best_days integer;
  v_remaining integer;
  v_period date;
  v_at timestamptz:=statement_timestamp();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text,2116));
  PERFORM public.lab_v2_resolve(p_run,v_at);
  SELECT * INTO v_run FROM public.lab_v2_runs WHERE id=p_run AND user_id=v_user;
  IF NOT FOUND THEN RAISE EXCEPTION 'Jornada não encontrada'; END IF;
  SELECT * INTO v_stage FROM public.lab_v2_stages
    WHERE run_id=p_run ORDER BY day_number DESC LIMIT 1;
  SELECT COALESCE(COUNT(c.chapter_id)*10,0)-COALESCE((
     SELECT SUM(s.late_penalty) FROM public.lab_v2_stages s WHERE s.run_id=p_run
  ),0) INTO v_run_xp FROM public.lab_v2_chapter_checks c WHERE c.run_id=p_run;
  SELECT COALESCE(MAX(completed),0) INTO v_best_days FROM (
    SELECT r.id,COUNT(s.day_number)::integer AS completed
    FROM public.lab_v2_runs r LEFT JOIN public.lab_v2_stages s
      ON s.run_id=r.id AND s.completed_at IS NOT NULL
    WHERE r.user_id=v_user GROUP BY r.id
  ) records;
  SELECT COALESCE(a.bonus_xp,0) INTO v_bonus_xp
    FROM public.lab_v2_cycle_awards a WHERE a.run_id=p_run;
  v_bonus_xp:=COALESCE(v_bonus_xp,0);
  SELECT COALESCE(MAX(s.best_days),0) INTO v_legacy_best
    FROM public.lab_game_stats s WHERE s.user_id=v_user;
  v_best_days:=GREATEST(v_best_days,v_legacy_best);
  SELECT COUNT(*) INTO v_previous_completed FROM public.lab_game_runs
    WHERE user_id=v_user AND status='completed';
  SELECT COUNT(*) INTO v_completed_stages FROM public.lab_v2_stages
    WHERE run_id=p_run AND completed_at IS NOT NULL;
  SELECT COALESCE(jsonb_agg(chapter_id ORDER BY chapter_id),'[]'::jsonb)
    INTO v_checked FROM public.lab_v2_chapter_checks
   WHERE run_id=p_run AND day_number=v_stage.day_number;
  SELECT to_jsonb(a) INTO v_award FROM public.lab_v2_cycle_awards a
    WHERE a.run_id=p_run;
  v_period:=date_trunc('month',v_at AT TIME ZONE 'America/Sao_Paulo')::date;
  SELECT 3-COALESCE((SELECT lives.used_lives FROM public.lab_v2_monthly_lives lives
    WHERE lives.user_id=v_user AND lives.month_start=v_period),0) INTO v_remaining;
  RETURN jsonb_build_object(
    'run_id',v_run.id,'status',v_run.status,
    'plan_length',v_run.plan_length,
    'stage',v_stage.day_number,
    'activated_at',v_stage.activated_at,
    'completed_at',v_stage.completed_at,
    'next_eligible_at',CASE WHEN v_stage.completed_at IS NULL THEN NULL
      ELSE GREATEST(v_stage.activated_at+interval '24 hours',v_stage.completed_at) END,
    'normal_deadline_at',v_stage.activated_at+interval '24 hours',
    'grace_deadline_at',v_stage.activated_at+interval '30 hours',
    'run_xp',GREATEST(v_run_xp,0)+v_bonus_xp,
    'reading_xp',GREATEST(v_run_xp,0),'cycle_bonus_xp',v_bonus_xp,
    'checked',v_checked,'completed_stages',v_completed_stages,
    'completed_bibles_historical',v_previous_completed+(
       SELECT COUNT(*) FROM public.lab_v2_cycle_awards a WHERE a.user_id=v_user),
    'cycle_award',v_award,'best_completed_stages',v_best_days,
    'remaining_lives_this_month',v_remaining,'server_at',v_at
  );
END;
$fn$;
CREATE OR REPLACE FUNCTION public.lab_v2_confirm(p_run uuid,p_stage integer,p_chapter text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
  v_user uuid:=auth.uid();
  v_run public.lab_v2_runs%ROWTYPE;
  v_stage public.lab_v2_stages%ROWTYPE;
  v_at timestamptz:=statement_timestamp();
  v_have integer;
  v_expected integer;
  v_penalty smallint;
  v_cycle integer;
  v_bonus integer;
  v_perfect boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text,2116));
  PERFORM public.lab_v2_resolve(p_run,v_at);
  SELECT * INTO v_run FROM public.lab_v2_runs
    WHERE id=p_run AND user_id=v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Jornada não encontrada'; END IF;
  SELECT * INTO v_stage FROM public.lab_v2_stages
    WHERE run_id=p_run AND day_number=p_stage FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ative esta etapa antes de ler'; END IF;
  -- A retry of an already confirmed chapter is idempotent, even after completion.
  IF EXISTS(SELECT 1 FROM public.lab_v2_chapter_checks
            WHERE run_id=p_run AND day_number=p_stage AND chapter_id=p_chapter)
  THEN RETURN public.lab_v2_sync(p_run); END IF;
  IF v_run.status<>'active' OR v_stage.completed_at IS NOT NULL OR
     v_stage.transitioned_at IS NOT NULL
  THEN RAISE EXCEPTION 'Etapa encerrada'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.lab_v2_plan_chapters
    WHERE plan_length=v_run.plan_length AND day_number=p_stage AND chapter_id=p_chapter)
  THEN RAISE EXCEPTION 'Capítulo não pertence à etapa ativa'; END IF;
  IF p_stage<>(SELECT MAX(day_number) FROM public.lab_v2_stages WHERE run_id=p_run)
  THEN RAISE EXCEPTION 'Apenas a etapa ativa permite confirmação'; END IF;
  INSERT INTO public.lab_v2_chapter_checks(run_id,day_number,chapter_id,confirmed_at)
    VALUES(p_run,p_stage,p_chapter,v_at) ON CONFLICT DO NOTHING;
  SELECT COUNT(*) INTO v_have FROM public.lab_v2_chapter_checks
    WHERE run_id=p_run AND day_number=p_stage;
  SELECT COUNT(*) INTO v_expected FROM public.lab_v2_plan_chapters
    WHERE plan_length=v_run.plan_length AND day_number=p_stage;
  IF v_have=v_expected THEN
    UPDATE public.lab_v2_stages SET completed_at=v_at
      WHERE run_id=p_run AND day_number=p_stage;
    IF p_stage=v_run.plan_length THEN
      v_penalty:=CASE WHEN v_at<=v_stage.activated_at+interval '24 hours' THEN 0
        WHEN v_at<=v_stage.activated_at+interval '27 hours' THEN 3 ELSE 6 END;
      UPDATE public.lab_v2_stages SET transitioned_at=v_at,late_penalty=v_penalty
        WHERE run_id=p_run AND day_number=p_stage;
      UPDATE public.lab_v2_runs SET status='completed',finished_at=v_at
        WHERE id=p_run;
      -- The annual crown and perfect-constancy distinction are awarded only
      -- for all 1189 real chapter confirmations, within the same run.
      SELECT COUNT(*)+1 INTO v_cycle FROM public.lab_v2_cycle_awards
       WHERE user_id=v_user;
      SELECT NOT EXISTS (
       SELECT 1 FROM public.lab_v2_stages s
       WHERE s.run_id=p_run AND
        (s.late_penalty<>0 OR s.completed_at IS NULL OR s.transitioned_at IS NULL)
      ) AND NOT EXISTS (
       SELECT 1 FROM public.lab_v2_incidents i WHERE i.run_id=p_run
      ) INTO v_perfect;
      v_bonus:=10000+(v_cycle-1)*2500;
      INSERT INTO public.lab_v2_cycle_awards
         (run_id,user_id,cycle_number,bonus_xp,perfect_constancy)
      VALUES (p_run,v_user,v_cycle,v_bonus,v_perfect)
      ON CONFLICT(run_id) DO NOTHING;
    END IF;
  END IF;
  RETURN public.lab_v2_sync(p_run);
END;
$fn$;
-- Same explicit full-reset confirmation as ProfileSettings; deletes ALL
-- legacy and V2 runs and historical crowns for the account, while leaving
-- member profile, notifications, favorites and reading-group membership.
CREATE OR REPLACE FUNCTION public.lab_game_full_reset(p_confirmation text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
 v_user uuid:=auth.uid();
 v_last_sign_in timestamptz;
 v_at timestamptz:=statement_timestamp();
 v_today date:=(v_at AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
 IF p_confirmation IS DISTINCT FROM 'ZERAR JORNADA' THEN
  RAISE EXCEPTION 'Digite ZERAR JORNADA para confirmar'; END IF;
 SELECT last_sign_in_at INTO v_last_sign_in FROM auth.users WHERE id=v_user;
 IF v_last_sign_in IS NULL OR v_last_sign_in<v_at-interval '5 minutes' THEN
  RAISE EXCEPTION 'Entre novamente na sua conta para confirmar'; END IF;
 -- The V1 and V2 scorekeepers share one user lock during reset.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text,2116));
 INSERT INTO public.lab_game_stats(user_id) VALUES(v_user) ON CONFLICT DO NOTHING;
 PERFORM 1 FROM public.lab_game_stats WHERE user_id=v_user FOR UPDATE;
 DELETE FROM public.lab_v2_runs WHERE user_id=v_user;
 DELETE FROM public.lab_v2_monthly_lives WHERE user_id=v_user;
 -- Chapter rows, V1 crowns and V2 crowns cascade through the run FK.
 DELETE FROM public.lab_game_runs WHERE user_id=v_user;
 DELETE FROM public.lab_game_video_sessions WHERE user_id=v_user;
 DELETE FROM public.lab_game_video_rewards WHERE user_id=v_user;
 DELETE FROM public.reading_completions WHERE user_id=v_user;
 UPDATE public.lab_game_stats
    SET best_days=0,total_xp=0,total_completed_days=0,updated_at=v_at
  WHERE user_id=v_user;
 -- Deliberately do NOT create or activate a run on the server here.
 -- When the player returns, V1 can start through its legacy synchronization,
 -- or V2 through an explicit new-stage activation. Only one rule set applies.
 RETURN jsonb_build_object('reset',true,'run_xp',0,'best_days',0,
   'completed_bibles_historical',0,'server_at',v_at);
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_game_full_reset(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_game_full_reset(text) TO authenticated;
