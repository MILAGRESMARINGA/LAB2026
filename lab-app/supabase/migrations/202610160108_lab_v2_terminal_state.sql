-- LABGAME P0: Preserve terminal status and monthly life charges when a late
-- request arrives as activation/chapter confirmation rather than a sync.
-- PostgreSQL exceptions abort the whole transaction; returning the current
-- server-authoritative FAILED scorecard lets the client show a restart CTA.
-- No direct table writes granted to authenticated or anonymous roles.
CREATE OR REPLACE FUNCTION public.lab_v2_activate(p_run uuid,p_stage integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
  v_user uuid:=auth.uid();
  v_run public.lab_v2_runs%ROWTYPE;
  v_last public.lab_v2_stages%ROWTYPE;
  v_at timestamptz:=statement_timestamp();
  v_penalty smallint;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text,2116));
  PERFORM public.lab_v2_resolve(p_run,v_at);
  SELECT * INTO v_run FROM public.lab_v2_runs
    WHERE id=p_run AND user_id=v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Jornada não encontrada'; END IF;
  -- Return the failed state rather than throwing: PostgreSQL exceptions would
  -- roll back the life debits and terminal status recorded by lab_v2_resolve.
  IF v_run.status<>'active' THEN RETURN public.lab_v2_sync(p_run); END IF;
  IF p_stage<1 OR p_stage>v_run.plan_length THEN RAISE EXCEPTION 'Etapa inválida'; END IF;
  SELECT * INTO v_last FROM public.lab_v2_stages
    WHERE run_id=p_run ORDER BY day_number DESC LIMIT 1 FOR UPDATE;
  IF FOUND AND v_last.day_number=p_stage THEN RETURN public.lab_v2_sync(p_run); END IF;
  IF NOT FOUND THEN
    IF p_stage<>1 THEN RAISE EXCEPTION 'Comece pela etapa 1'; END IF;
  ELSE
    IF p_stage<>v_last.day_number+1 OR v_last.completed_at IS NULL
    THEN RAISE EXCEPTION 'Conclua a etapa atual antes de avançar'; END IF;
    IF v_at<v_last.activated_at+interval '24 hours'
    THEN RAISE EXCEPTION 'A próxima etapa ainda não foi liberada'; END IF;
    v_penalty:=CASE WHEN v_at<=v_last.activated_at+interval '24 hours' THEN 0
      WHEN v_at<=v_last.activated_at+interval '27 hours' THEN 3 ELSE 6 END;
    UPDATE public.lab_v2_stages
      SET transitioned_at=v_at,late_penalty=v_penalty
      WHERE run_id=p_run AND day_number=v_last.day_number;
  END IF;
  INSERT INTO public.lab_v2_stages(run_id,day_number,activated_at)
    VALUES(p_run,p_stage,v_at);
  RETURN public.lab_v2_sync(p_run);
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_activate(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_v2_activate(uuid,integer) TO authenticated;

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
  -- Failed state must commit even when the last request was a chapter confirm.
  IF v_run.status<>'active' THEN RETURN public.lab_v2_sync(p_run); END IF;
  SELECT * INTO v_stage FROM public.lab_v2_stages
    WHERE run_id=p_run AND day_number=p_stage FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ative esta etapa antes de ler'; END IF;
  -- A retry of an already confirmed chapter is idempotent, even after completion.
  IF EXISTS(SELECT 1 FROM public.lab_v2_chapter_checks
            WHERE run_id=p_run AND day_number=p_stage AND chapter_id=p_chapter)
  THEN RETURN public.lab_v2_sync(p_run); END IF;
  IF v_stage.completed_at IS NOT NULL OR
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
REVOKE ALL ON FUNCTION public.lab_v2_confirm(uuid,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_v2_confirm(uuid,integer,text) TO authenticated;
