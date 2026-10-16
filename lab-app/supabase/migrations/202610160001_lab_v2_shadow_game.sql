-- LABGAME V2 SHADOW SCHEMA. STAGING ONLY: never apply to production before P0.
-- V1 tables, RPCs, profiles, GCs and XP are untouched.
-- The release switch starts FALSE. A DBA must seed/audit the V2 plans,
-- run 2-account/RLS/clock tests, and explicitly enable V2 in staging.
CREATE TABLE public.lab_v2_release_controls (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.lab_v2_release_controls(singleton,enabled) VALUES(true,false);
ALTER TABLE public.lab_v2_release_controls ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_v2_release_controls FROM PUBLIC,anon,authenticated;

CREATE TABLE public.lab_v2_plan_chapters (
  plan_length smallint NOT NULL CHECK(plan_length IN(365,366)),
  day_number smallint NOT NULL CHECK(day_number BETWEEN 1 AND 366),
  slot smallint NOT NULL CHECK(slot BETWEEN 1 AND 4),
  chapter_id text NOT NULL CHECK(chapter_id ~ '^[0-9]{1,2}:[0-9]{1,3}$'),
  PRIMARY KEY(plan_length,day_number,slot),
  UNIQUE(plan_length,chapter_id)
);
ALTER TABLE public.lab_v2_plan_chapters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_v2_plan_chapters FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lab_v2_plan_chapters TO authenticated;
CREATE POLICY "V2 plan available to authenticated readers"
  ON public.lab_v2_plan_chapters FOR SELECT TO authenticated USING(true);

CREATE TABLE public.lab_v2_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_length smallint NOT NULL CHECK(plan_length IN(365,366)),
  status text NOT NULL DEFAULT 'active' CHECK(status IN('active','failed','completed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  CHECK ((status='active' AND finished_at IS NULL) OR
         (status<>'active' AND finished_at IS NOT NULL)),
  UNIQUE(id,user_id)
);
CREATE UNIQUE INDEX lab_v2_one_active_run_per_user ON public.lab_v2_runs(user_id) WHERE status='active';
CREATE INDEX lab_v2_runs_by_user ON public.lab_v2_runs(user_id,started_at DESC);
ALTER TABLE public.lab_v2_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_v2_runs FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lab_v2_runs TO authenticated;
CREATE POLICY "Own V2 runs" ON public.lab_v2_runs
  FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));

CREATE TABLE public.lab_v2_stages (
  run_id uuid NOT NULL REFERENCES public.lab_v2_runs(id) ON DELETE CASCADE,
  day_number smallint NOT NULL CHECK(day_number BETWEEN 1 AND 366),
  activated_at timestamptz NOT NULL,
  completed_at timestamptz,
  transitioned_at timestamptz,
  late_penalty smallint NOT NULL DEFAULT 0 CHECK(late_penalty IN(0,3,6)),
  PRIMARY KEY(run_id,day_number),
  CHECK (completed_at IS NULL OR completed_at>=activated_at),
  CHECK (transitioned_at IS NULL OR (completed_at IS NOT NULL AND transitioned_at>=completed_at))
);
ALTER TABLE public.lab_v2_stages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_v2_stages FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lab_v2_stages TO authenticated;
CREATE POLICY "Own V2 stages" ON public.lab_v2_stages
  FOR SELECT TO authenticated USING(
    EXISTS (SELECT 1 FROM public.lab_v2_runs r WHERE r.id=run_id AND r.user_id=(SELECT auth.uid()))
  );

CREATE TABLE public.lab_v2_chapter_checks (
  run_id uuid NOT NULL,
  day_number smallint NOT NULL,
  chapter_id text NOT NULL,
  confirmed_at timestamptz NOT NULL,
  PRIMARY KEY(run_id,day_number,chapter_id),
  FOREIGN KEY(run_id,day_number) REFERENCES public.lab_v2_stages(run_id,day_number) ON DELETE CASCADE
);
ALTER TABLE public.lab_v2_chapter_checks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_v2_chapter_checks FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lab_v2_chapter_checks TO authenticated;
CREATE POLICY "Own V2 chapters" ON public.lab_v2_chapter_checks
  FOR SELECT TO authenticated USING(
    EXISTS (SELECT 1 FROM public.lab_v2_runs r WHERE r.id=run_id AND r.user_id=(SELECT auth.uid()))
  );

CREATE TABLE public.lab_v2_monthly_lives (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_start date NOT NULL CHECK(EXTRACT(DAY FROM month_start)=1),
  used_lives smallint NOT NULL DEFAULT 0 CHECK(used_lives BETWEEN 0 AND 3),
  PRIMARY KEY(user_id,month_start)
);
ALTER TABLE public.lab_v2_monthly_lives ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_v2_monthly_lives FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lab_v2_monthly_lives TO authenticated;
CREATE POLICY "Own V2 lives" ON public.lab_v2_monthly_lives
  FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));

CREATE TABLE public.lab_v2_incidents (
  run_id uuid NOT NULL,
  day_number smallint NOT NULL,
  occurred_at timestamptz NOT NULL,
  month_start date NOT NULL CHECK(EXTRACT(DAY FROM month_start)=1),
  lives_consumed smallint NOT NULL DEFAULT 0 CHECK(lives_consumed BETWEEN 0 AND 3),
  last_rescue_deadline timestamptz,
  PRIMARY KEY(run_id,day_number),
  FOREIGN KEY(run_id,day_number) REFERENCES public.lab_v2_stages(run_id,day_number) ON DELETE CASCADE
);
ALTER TABLE public.lab_v2_incidents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_v2_incidents FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lab_v2_incidents TO authenticated;
CREATE POLICY "Own V2 incidents" ON public.lab_v2_incidents
  FOR SELECT TO authenticated USING(
    EXISTS (SELECT 1 FROM public.lab_v2_runs r WHERE r.id=run_id AND r.user_id=(SELECT auth.uid()))
  );

-- Resolves an incident using its ORIGINAL grace deadline and ORIGINAL month.
-- All caller RPCs first take the SAME advisory lock based on auth.uid().
-- No direct client grants: only security-definer server entry points call this.
CREATE OR REPLACE FUNCTION public.lab_v2_resolve(p_run uuid,p_at timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
  v_user uuid:=auth.uid();
  v_run public.lab_v2_runs%ROWTYPE;
  v_stage public.lab_v2_stages%ROWTYPE;
  v_inc public.lab_v2_incidents%ROWTYPE;
  v_grace timestamptz;
  v_month date;
  v_required integer;
  v_remaining integer;
  v_debit integer;
  v_wallet_used integer;
  v_allowed integer;
  v_failure_at timestamptz;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
  SELECT * INTO v_run FROM public.lab_v2_runs WHERE id=p_run AND user_id=v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Jornada não encontrada'; END IF;
  IF v_run.status<>'active' THEN RETURN; END IF;
  SELECT * INTO v_stage FROM public.lab_v2_stages
    WHERE run_id=p_run AND transitioned_at IS NULL
    ORDER BY day_number DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  v_grace:=v_stage.activated_at+interval '30 hours';
  IF p_at<=v_grace THEN RETURN; END IF;
  v_required:=CEIL(EXTRACT(EPOCH FROM(p_at-v_grace))/86400.0)::integer;
  v_month:=date_trunc('month',v_grace AT TIME ZONE 'America/Sao_Paulo')::date;
  INSERT INTO public.lab_v2_monthly_lives(user_id,month_start)
    VALUES(v_user,v_month) ON CONFLICT DO NOTHING;
  SELECT used_lives INTO v_wallet_used FROM public.lab_v2_monthly_lives
    WHERE user_id=v_user AND month_start=v_month FOR UPDATE;
  INSERT INTO public.lab_v2_incidents(run_id,day_number,occurred_at,month_start)
    VALUES(p_run,v_stage.day_number,v_grace,v_month) ON CONFLICT DO NOTHING;
  SELECT * INTO v_inc FROM public.lab_v2_incidents
    WHERE run_id=p_run AND day_number=v_stage.day_number FOR UPDATE;
  -- If two requests race, the first has already reserved its lives in
  -- monthly wallet; only additional required lives can be charged.
  v_remaining:=3-v_wallet_used;
  v_debit:=LEAST(GREATEST(0,v_required-v_inc.lives_consumed),v_remaining);
  IF v_debit>0 THEN
    UPDATE public.lab_v2_monthly_lives SET used_lives=used_lives+v_debit
      WHERE user_id=v_user AND month_start=v_month;
    UPDATE public.lab_v2_incidents SET
      lives_consumed=lives_consumed+v_debit,
      last_rescue_deadline=v_grace+(v_inc.lives_consumed+v_debit)*interval '24 hours'
      WHERE run_id=p_run AND day_number=v_stage.day_number;
  END IF;
  v_allowed:=v_inc.lives_consumed+v_debit;
  IF v_required>v_allowed THEN
    v_failure_at:=v_grace+v_allowed*interval '24 hours';
    UPDATE public.lab_v2_runs SET status='failed',finished_at=v_failure_at
      WHERE id=p_run AND status='active';
    -- If the stage was complete but the player never activated the next,
    -- preserve its historical completion, not a perfect on-time transition.
    IF v_stage.completed_at IS NOT NULL THEN
      UPDATE public.lab_v2_stages SET late_penalty=6
        WHERE run_id=p_run AND day_number=v_stage.day_number AND transitioned_at IS NULL;
    END IF;
  END IF;
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_resolve(uuid,timestamptz) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.lab_v2_sync(p_run uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
  v_user uuid:=auth.uid();
  v_run public.lab_v2_runs%ROWTYPE;
  v_stage public.lab_v2_stages%ROWTYPE;
  v_run_xp integer;
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
    'run_xp',GREATEST(v_run_xp,0),'best_completed_stages',v_best_days,
    'remaining_lives_this_month',v_remaining,'server_at',v_at
  );
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_sync(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_v2_sync(uuid) TO authenticated;

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
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text,2116));
  IF NOT EXISTS(SELECT 1 FROM public.lab_v2_release_controls
                WHERE singleton=true AND enabled=true)
  THEN RAISE EXCEPTION 'Jornada V2 não liberada neste ambiente'; END IF;
  SELECT id INTO v_id FROM public.lab_v2_runs
    WHERE user_id=v_user AND status='active';
  IF v_id IS NOT NULL THEN RETURN public.lab_v2_sync(v_id); END IF;
  -- A V1 in progress is never silently superseded or combined with V2.
  IF EXISTS(SELECT 1 FROM public.lab_game_runs
            WHERE user_id=v_user AND status='active')
  THEN RAISE EXCEPTION 'Conclua ou migre a Jornada anterior antes de iniciar V2'; END IF;
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
REVOKE ALL ON FUNCTION public.lab_v2_start(integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_v2_start(integer) TO authenticated;

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
  IF v_run.status<>'active' THEN RAISE EXCEPTION 'Jornada já encerrada'; END IF;
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
    END IF;
  END IF;
  RETURN public.lab_v2_sync(p_run);
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_confirm(uuid,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_v2_confirm(uuid,integer,text) TO authenticated;
