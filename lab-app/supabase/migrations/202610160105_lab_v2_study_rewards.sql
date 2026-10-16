-- Only six reviewed, published study blocks can receive voluntary V2
-- study XP. The acknowledgement is a self-declaration, not proof of faith.
CREATE TABLE public.lab_v2_study_catalog(
 study_key text PRIMARY KEY CHECK(length(study_key) BETWEEN 2 AND 100),
 title text NOT NULL,
 xp smallint NOT NULL DEFAULT 15 CHECK(xp=15)
);
INSERT INTO public.lab_v2_study_catalog(study_key,title) VALUES
('criacao','A criação e a Palavra'),('promessa','A promessa da redenção'),
('lucas-atos','Lucas e Atos'),('profetas','Profetas e história de Israel'),
('espirito','A promessa do Espírito'),('salvacao','Salvação e nova vida');
ALTER TABLE public.lab_v2_study_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_v2_study_catalog FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lab_v2_study_catalog TO authenticated;
CREATE POLICY "Published V2 study catalog" ON public.lab_v2_study_catalog
 FOR SELECT TO authenticated USING(true);

CREATE TABLE public.lab_v2_study_rewards(
 run_id uuid NOT NULL REFERENCES public.lab_v2_runs(id) ON DELETE CASCADE,
 study_key text NOT NULL REFERENCES public.lab_v2_study_catalog(study_key),
 awarded_xp smallint NOT NULL DEFAULT 15 CHECK(awarded_xp=15),
 confirmed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(run_id,study_key)
);
ALTER TABLE public.lab_v2_study_rewards ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_v2_study_rewards FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lab_v2_study_rewards TO authenticated;
CREATE POLICY "Own V2 study rewards" ON public.lab_v2_study_rewards
 FOR SELECT TO authenticated USING(EXISTS(
  SELECT 1 FROM public.lab_v2_runs r WHERE r.id=run_id AND r.user_id=(SELECT auth.uid())
 ));

CREATE OR REPLACE FUNCTION public.lab_v2_confirm_study(p_run uuid,p_study_key text,p_acknowledged boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path=''
AS $fn$
DECLARE
 v_user uuid:=auth.uid();
 v_run public.lab_v2_runs%ROWTYPE;
 v_new integer;
 v_state jsonb;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
 IF p_acknowledged IS DISTINCT FROM true THEN
  RAISE EXCEPTION 'Confirme que examinou as referências do estudo'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text,2116));
 SELECT * INTO v_run FROM public.lab_v2_runs
   WHERE id=p_run AND user_id=v_user FOR UPDATE;
 IF NOT FOUND OR v_run.status<>'active' THEN
  RAISE EXCEPTION 'Jornada não ativa'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.lab_v2_release_controls WHERE enabled=true)
 THEN RAISE EXCEPTION 'Jornada V2 indisponível'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.lab_v2_study_catalog WHERE study_key=p_study_key)
 THEN RAISE EXCEPTION 'Estudo não credenciado'; END IF;
 INSERT INTO public.lab_v2_study_rewards(run_id,study_key)
 VALUES(p_run,p_study_key) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS v_new=ROW_COUNT;
 v_state:=public.lab_v2_sync(p_run);
 RETURN jsonb_build_object('awarded',v_new>0,
   'study_xp',15,'total_xp',(v_state->>'run_xp')::integer,
   'studies_this_run',(v_state->>'studies_this_run')::integer);
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_confirm_study(uuid,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_v2_confirm_study(uuid,text,boolean) TO authenticated;

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
  v_study_xp integer;
  v_study_count integer;
  v_historic_studies integer;
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
  SELECT COALESCE(SUM(awarded_xp),0)::integer,COUNT(*)::integer
    INTO v_study_xp,v_study_count FROM public.lab_v2_study_rewards WHERE run_id=p_run;
  SELECT COUNT(*) INTO v_historic_studies FROM public.lab_v2_study_rewards sr
   JOIN public.lab_v2_runs r ON r.id=sr.run_id WHERE r.user_id=v_user;
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
    'run_xp',GREATEST(v_run_xp,0)+v_bonus_xp+v_video_xp+v_study_xp,
    'reading_xp',GREATEST(v_run_xp,0),'video_xp',v_video_xp,'study_xp',v_study_xp,
    'studies_this_run',v_study_count,'studies_completed_historical',v_historic_studies,
    'cycle_bonus_xp',v_bonus_xp,
    'checked',v_checked,'completed_stages',v_completed_stages,
    'completed_bibles_historical',v_previous_completed+(
       SELECT COUNT(*) FROM public.lab_v2_cycle_awards a WHERE a.user_id=v_user),
    'cycle_award',v_award,'best_completed_stages',v_best_days,
    'remaining_lives_this_month',v_remaining,'server_at',v_at
  );
END;
$fn$;
