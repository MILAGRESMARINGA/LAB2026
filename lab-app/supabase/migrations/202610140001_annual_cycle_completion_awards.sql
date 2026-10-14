-- LABGAME 3.0: annual completion bonuses APPROVED by product owner on 2026-10-14.
-- NOT applied to production by adding this file to GitHub. Requires isolated restore,
-- P0 privilege migration, staging acceptance and explicit production release approval.
-- +10,000 on first completed cycle, then +2,500 more on EACH subsequent cycle.
-- One award per COMPLETED run; chapter/video XP and GC scoring stay independent.
--
-- SECURITY: these rows can be read by their owner only. Only server-owned RPC
-- functions below can write awards and update the existing lifetime XP balance.

CREATE TABLE public.lab_game_cycle_awards (
  run_id uuid PRIMARY KEY REFERENCES public.lab_game_runs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_number integer NOT NULL CHECK (cycle_number BETWEEN 1 AND 100000),
  award_code text NOT NULL DEFAULT 'annual_bible_completion'
    CHECK (award_code = 'annual_bible_completion'),
  bonus_xp integer NOT NULL
    CHECK (bonus_xp::bigint = 10000::bigint + (cycle_number::bigint - 1) * 2500),
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, cycle_number)
);

CREATE INDEX lab_game_cycle_awards_user_history_idx
  ON public.lab_game_cycle_awards (user_id, cycle_number DESC);

ALTER TABLE public.lab_game_cycle_awards ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_game_cycle_awards FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.lab_game_cycle_awards TO authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES, MAINTAIN
  ON TABLE public.lab_game_cycle_awards FROM PUBLIC, anon, authenticated;
CREATE POLICY "Own annual Bible completion awards"
  ON public.lab_game_cycle_awards
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- The operation reuses the existing per-user stats lock from lab_game_sync().
-- Reading confirmation, 365th-day completion, unique award insertion and bonus
-- posting are one PostgreSQL transaction. Any failure rolls it ALL back.
CREATE OR REPLACE FUNCTION public.lab_game_confirm_chapter(p_chapter_id text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
 v_user uuid := auth.uid();
 v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
 v_run public.lab_game_runs%ROWTYPE;
 v_last public.lab_game_runs%ROWTYPE;
 v_day integer;
 v_expected integer;
 v_have integer;
 v_new integer;
 v_all integer;
 v_plan_count integer;
 v_cycle integer;
 v_bonus integer;
 v_added integer;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
 PERFORM public.lab_game_sync();

 SELECT * INTO v_run FROM public.lab_game_runs
 WHERE user_id=v_user AND status='active' FOR UPDATE;

 IF v_run.id IS NULL THEN
  -- Retry after finishing the 365th day: return the existing result,
  -- never award a second bonus and never create a new run.
  SELECT * INTO v_last FROM public.lab_game_runs
   WHERE user_id=v_user ORDER BY created_at DESC,id DESC LIMIT 1;
  IF v_last.status='completed' AND EXISTS (
    SELECT 1 FROM public.lab_game_chapter_checks c
    WHERE c.run_id=v_last.id AND c.day_number=365 AND c.chapter_id=p_chapter_id
  ) THEN
   RETURN public.lab_game_sync();
  END IF;
  RAISE EXCEPTION 'Etapa ainda não disponível ou já concluída';
 END IF;

 v_day:=v_today-v_run.started_on+1;
 IF v_day<1 OR v_day>365 OR v_day<>v_run.completed_days+1 THEN
  IF EXISTS (
   SELECT 1 FROM public.lab_game_chapter_checks
   WHERE run_id=v_run.id AND day_number=v_day AND chapter_id=p_chapter_id
  ) THEN RETURN public.lab_game_sync(); END IF;
  RAISE EXCEPTION 'Etapa ainda não disponível ou já concluída';
 END IF;

 IF NOT EXISTS (
  SELECT 1 FROM public.lab_game_plan_chapters
  WHERE version=1 AND day_number=v_day AND chapter_id=p_chapter_id
 ) THEN
  RAISE EXCEPTION 'Este capítulo não pertence à leitura de hoje';
 END IF;

 INSERT INTO public.lab_game_chapter_checks(run_id,day_number,chapter_id,read_on)
 VALUES(v_run.id,v_day,p_chapter_id,v_today) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS v_new=ROW_COUNT;
 IF v_new>0 THEN
  UPDATE public.lab_game_stats SET total_xp=total_xp+10,updated_at=now()
  WHERE user_id=v_user;
 END IF;

 SELECT COUNT(*) INTO v_have FROM public.lab_game_chapter_checks
 WHERE run_id=v_run.id AND day_number=v_day;
 SELECT COUNT(*) INTO v_expected FROM public.lab_game_plan_chapters
 WHERE version=1 AND day_number=v_day;

 IF v_have=v_expected AND v_run.completed_days<v_day THEN
  -- The final bonus additionally requires ALL 1,189 canonical chapters
  -- of the original plan, not just the last day's chapters.
  IF v_day=365 THEN
   SELECT COUNT(*) INTO v_all FROM public.lab_game_chapter_checks
   WHERE run_id=v_run.id;
   SELECT COUNT(*) INTO v_plan_count FROM public.lab_game_plan_chapters
   WHERE version=1;
   IF v_all<>1189 OR v_plan_count<>1189 OR EXISTS (
    SELECT 1 FROM public.lab_game_chapter_checks c
    LEFT JOIN public.lab_game_plan_chapters p
      ON p.version=1 AND p.day_number=c.day_number AND p.chapter_id=c.chapter_id
    WHERE c.run_id=v_run.id AND p.chapter_id IS NULL
   ) THEN
    RAISE EXCEPTION 'A jornada anual não contém todos os capítulos previstos';
   END IF;
  END IF;

  UPDATE public.lab_game_runs
   SET completed_days=v_day,
       status=CASE WHEN v_day=365 THEN 'completed' ELSE 'active' END,
       finished_on=CASE WHEN v_day=365 THEN v_today ELSE NULL END
   WHERE id=v_run.id;

  UPDATE public.lab_game_stats SET
   best_days=GREATEST(best_days,v_day),
   total_completed_days=total_completed_days+1,
   updated_at=now()
  WHERE user_id=v_user;

  IF v_day=365 THEN
   -- Count only COMPLETED runs (not failed/restarted attempts).
   SELECT COUNT(*)::integer INTO v_cycle FROM public.lab_game_runs
    WHERE user_id=v_user AND status='completed';
   IF v_cycle<1 OR v_cycle>100000 THEN
    RAISE EXCEPTION 'Quantidade de ciclos fora do limite técnico';
   END IF;
   v_bonus:=10000+(v_cycle-1)*2500;
   -- The UNIQUE keys also reject duplicate transactions and cycle-number races.
   INSERT INTO public.lab_game_cycle_awards
     (run_id,user_id,cycle_number,bonus_xp)
   VALUES(v_run.id,v_user,v_cycle,v_bonus)
   ON CONFLICT (run_id) DO NOTHING;
   GET DIAGNOSTICS v_added=ROW_COUNT;
   IF v_added=1 THEN
    UPDATE public.lab_game_stats
     SET total_xp=total_xp+v_bonus,updated_at=now()
     WHERE user_id=v_user;
   END IF;
  END IF;
 END IF;

 IF v_day=365 AND v_have=v_expected THEN
  RETURN jsonb_build_object(
   'run_id',v_run.id,'day',365,'completed_days',365,
   'finished',true,
   'checked',(SELECT COALESCE(jsonb_agg(chapter_id),'[]'::jsonb)
      FROM public.lab_game_chapter_checks
      WHERE run_id=v_run.id AND day_number=365),
   'best_days',365,
   'total_xp',(SELECT total_xp FROM public.lab_game_stats WHERE user_id=v_user)
  );
 END IF;
 RETURN public.lab_game_sync();
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_game_confirm_chapter(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_game_confirm_chapter(text) TO authenticated;

-- Scorecard now reconciles all THREE verifiable XP sources.
-- Retains previous keys for backward compatibility with earlier clients.
CREATE OR REPLACE FUNCTION public.lab_game_scorecard()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
 v_user uuid:=auth.uid();
 v_readings bigint;
 v_video_rewards bigint;
 v_chapter_xp bigint;
 v_video_xp bigint;
 v_completion_xp bigint;
 v_completed_cycles bigint;
 v_stored integer;
 v_best integer;
 v_total_days integer;
 v_current_days integer;
 v_awards jsonb;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;

 SELECT COUNT(*) INTO v_readings
 FROM public.lab_game_chapter_checks c
 JOIN public.lab_game_runs r ON r.id=c.run_id
 WHERE r.user_id=v_user;
 SELECT COUNT(*) INTO v_video_rewards FROM public.lab_game_video_rewards
 WHERE user_id=v_user;
 SELECT COALESCE(SUM(bonus_xp),0),COUNT(*)
 INTO v_completion_xp,v_completed_cycles
 FROM public.lab_game_cycle_awards
 WHERE user_id=v_user;
 SELECT COALESCE(jsonb_agg(jsonb_build_object(
   'run_id',a.run_id,'cycle_number',a.cycle_number,
   'bonus_xp',a.bonus_xp,'awarded_at',a.awarded_at
 ) ORDER BY a.cycle_number),'[]'::jsonb) INTO v_awards
 FROM public.lab_game_cycle_awards a WHERE a.user_id=v_user;

 SELECT total_xp,best_days,total_completed_days
 INTO v_stored,v_best,v_total_days FROM public.lab_game_stats WHERE user_id=v_user;
 SELECT completed_days INTO v_current_days FROM public.lab_game_runs
 WHERE user_id=v_user AND status='active' ORDER BY started_on DESC LIMIT 1;

 v_chapter_xp:=v_readings*10;
 v_video_xp:=v_video_rewards*5;
 RETURN jsonb_build_object(
  'chapters_confirmed',v_readings,'panoramas_confirmed',v_video_rewards,
  'reading_xp',v_chapter_xp,'video_xp',v_video_xp,
  'cycle_bonus_xp',v_completion_xp,'completed_cycles',v_completed_cycles,
  'cycle_awards',v_awards,
  'total_xp',v_chapter_xp+v_video_xp+v_completion_xp,
  'recorded_xp',COALESCE(v_stored,0),
  'balanced',COALESCE(v_stored,0)=v_chapter_xp+v_video_xp+v_completion_xp,
  'current_streak',COALESCE(v_current_days,0),
  'best_streak',COALESCE(v_best,0),
  'total_completed_days',COALESCE(v_total_days,0),
  'chapter_rate',10,'video_rate',5
 );
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_game_scorecard() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_game_scorecard() TO authenticated;

-- Important: no automatic backfill for pre-existing completed runs.
-- Backfill, if required, must be audited and explicitly approved before release.
