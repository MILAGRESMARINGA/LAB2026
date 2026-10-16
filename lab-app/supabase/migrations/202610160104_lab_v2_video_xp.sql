-- Video rewards are V2 RUN scoped; no V1 lifetime XP mutation.
-- 90 seconds of server-paced, visible-tab heartbeats = eligibility signal,
-- NOT cryptographic proof the user watched external media.
CREATE TABLE public.lab_v2_video_sessions(
 run_id uuid NOT NULL REFERENCES public.lab_v2_runs(id) ON DELETE CASCADE,
 video_key text NOT NULL REFERENCES public.lab_game_video_resources(video_key),
 started_at timestamptz NOT NULL DEFAULT now(),
 heartbeat_at timestamptz NOT NULL DEFAULT now(),
 active_seconds integer NOT NULL DEFAULT 0 CHECK(active_seconds BETWEEN 0 AND 36000),
 PRIMARY KEY(run_id,video_key)
);
CREATE TABLE public.lab_v2_video_rewards(
 run_id uuid NOT NULL REFERENCES public.lab_v2_runs(id) ON DELETE CASCADE,
 video_key text NOT NULL REFERENCES public.lab_game_video_resources(video_key),
 awarded_xp smallint NOT NULL DEFAULT 5 CHECK(awarded_xp=5),
 confirmed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(run_id,video_key)
);
ALTER TABLE public.lab_v2_video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_v2_video_rewards ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_v2_video_sessions,public.lab_v2_video_rewards
 FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lab_v2_video_sessions,public.lab_v2_video_rewards TO authenticated;
CREATE POLICY "Own V2 video sessions" ON public.lab_v2_video_sessions
 FOR SELECT TO authenticated USING(EXISTS(
  SELECT 1 FROM public.lab_v2_runs r WHERE r.id=run_id AND r.user_id=(SELECT auth.uid())
 ));
CREATE POLICY "Own V2 video rewards" ON public.lab_v2_video_rewards
 FOR SELECT TO authenticated USING(EXISTS(
  SELECT 1 FROM public.lab_v2_runs r WHERE r.id=run_id AND r.user_id=(SELECT auth.uid())
 ));

CREATE OR REPLACE FUNCTION public.lab_v2_video_begin(p_run uuid,p_video_key text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
 v_user uuid:=auth.uid();
 v_run public.lab_v2_runs%ROWTYPE;
 v_session public.lab_v2_video_sessions%ROWTYPE;
 v_awarded boolean;
 v_at timestamptz:=statement_timestamp();
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text,2116));
 SELECT * INTO v_run FROM public.lab_v2_runs WHERE id=p_run AND user_id=v_user FOR UPDATE;
 IF NOT FOUND OR v_run.status<>'active' THEN RAISE EXCEPTION 'Ative sua Jornada V2 antes do vídeo'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.lab_v2_release_controls WHERE enabled=true)
 THEN RAISE EXCEPTION 'Jornada V2 indisponível'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.lab_game_video_resources WHERE video_key=p_video_key)
 THEN RAISE EXCEPTION 'Vídeo não credenciado no LABGAME'; END IF;
 INSERT INTO public.lab_v2_video_sessions(run_id,video_key,started_at,heartbeat_at)
 VALUES(p_run,p_video_key,v_at,v_at) ON CONFLICT DO NOTHING;
 SELECT * INTO v_session FROM public.lab_v2_video_sessions
  WHERE run_id=p_run AND video_key=p_video_key;
 SELECT EXISTS(SELECT 1 FROM public.lab_v2_video_rewards
  WHERE run_id=p_run AND video_key=p_video_key) INTO v_awarded;
 RETURN jsonb_build_object(
  'already_awarded',v_awarded,'active_seconds',v_session.active_seconds,
  'eligible_at',v_session.started_at+interval '90 seconds');
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_video_begin(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_v2_video_begin(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.lab_v2_video_ping(p_run uuid,p_video_key text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
 v_user uuid:=auth.uid();
 v_run public.lab_v2_runs%ROWTYPE;
 v_session public.lab_v2_video_sessions%ROWTYPE;
 v_at timestamptz:=statement_timestamp();
 v_delta integer;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text,2116));
 SELECT * INTO v_run FROM public.lab_v2_runs WHERE id=p_run AND user_id=v_user FOR UPDATE;
 IF NOT FOUND OR v_run.status<>'active' THEN RAISE EXCEPTION 'Jornada não ativa'; END IF;
 SELECT * INTO v_session FROM public.lab_v2_video_sessions
  WHERE run_id=p_run AND video_key=p_video_key FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Abra o panorama antes de contabilizar o tempo'; END IF;
 IF EXISTS(SELECT 1 FROM public.lab_v2_video_rewards WHERE run_id=p_run AND video_key=p_video_key)
 THEN RETURN jsonb_build_object('active_seconds',v_session.active_seconds,'already_awarded',true); END IF;
 v_delta:=LEAST(15,GREATEST(0,FLOOR(EXTRACT(EPOCH FROM v_at-v_session.heartbeat_at))::integer));
 IF v_delta>0 THEN
  UPDATE public.lab_v2_video_sessions SET
   active_seconds=LEAST(36000,active_seconds+v_delta),heartbeat_at=v_at
   WHERE run_id=p_run AND video_key=p_video_key
   RETURNING * INTO v_session;
 END IF;
 RETURN jsonb_build_object('active_seconds',v_session.active_seconds,'already_awarded',false);
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_video_ping(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_v2_video_ping(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.lab_v2_video_confirm(p_run uuid,p_video_key text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
 v_user uuid:=auth.uid();
 v_run public.lab_v2_runs%ROWTYPE;
 v_seconds integer;
 v_added integer;
 v_result jsonb;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text,2116));
 SELECT * INTO v_run FROM public.lab_v2_runs WHERE id=p_run AND user_id=v_user FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Jornada não encontrada'; END IF;
 IF EXISTS(SELECT 1 FROM public.lab_v2_video_rewards
   WHERE run_id=p_run AND video_key=p_video_key)
 THEN
  v_result:=public.lab_v2_sync(p_run);
  RETURN jsonb_build_object('awarded',false,'total_xp',(v_result->>'run_xp')::integer);
 END IF;
 IF v_run.status<>'active' THEN RAISE EXCEPTION 'Jornada já encerrada'; END IF;
 SELECT active_seconds INTO v_seconds FROM public.lab_v2_video_sessions
  WHERE run_id=p_run AND video_key=p_video_key;
 IF v_seconds IS NULL OR v_seconds<90 THEN
  RAISE EXCEPTION 'Assista ao panorama antes de confirmar (90 segundos de atividade)'; END IF;
 INSERT INTO public.lab_v2_video_rewards(run_id,video_key) VALUES(p_run,p_video_key)
 ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS v_added=ROW_COUNT;
 v_result:=public.lab_v2_sync(p_run);
 RETURN jsonb_build_object('awarded',v_added>0,'total_xp',(v_result->>'run_xp')::integer);
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_video_confirm(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_v2_video_confirm(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.lab_v2_sync(p_run uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
  v_user uuid:=auth.uid();
  v_run public.lab_v2_runs%ROWTYPE;
  v_stage public.lab_v2_stages%ROWTYPE;
  v_run_xp integer;
  v_bonus_xp integer;
  v_video_xp integer;
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
  SELECT COALESCE(SUM(awarded_xp),0)::integer INTO v_video_xp
    FROM public.lab_v2_video_rewards vr WHERE vr.run_id=p_run;
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
    'run_xp',GREATEST(v_run_xp,0)+v_bonus_xp+v_video_xp,
    'reading_xp',GREATEST(v_run_xp,0),'video_xp',v_video_xp,'cycle_bonus_xp',v_bonus_xp,
    'checked',v_checked,'completed_stages',v_completed_stages,
    'completed_bibles_historical',v_previous_completed+(
       SELECT COUNT(*) FROM public.lab_v2_cycle_awards a WHERE a.user_id=v_user),
    'cycle_award',v_award,'best_completed_stages',v_best_days,
    'remaining_lives_this_month',v_remaining,'server_at',v_at
  );
END;
$fn$;
