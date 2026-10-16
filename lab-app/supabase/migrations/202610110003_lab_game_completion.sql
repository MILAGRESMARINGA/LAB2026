CREATE OR REPLACE FUNCTION public.lab_game_sync()
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $$
DECLARE
 v_user uuid := auth.uid();
 v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
 v_run public.lab_game_runs%ROWTYPE;
 v_stats public.lab_game_stats%ROWTYPE;
 v_day integer;
 v_checked jsonb;
 v_previous public.lab_game_runs%ROWTYPE;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Faça login para participar'; END IF;
 -- Serialize all game updates per user by locking stats first.
 INSERT INTO public.lab_game_stats(user_id) VALUES(v_user) ON CONFLICT DO NOTHING;
 SELECT * INTO v_stats FROM public.lab_game_stats WHERE user_id=v_user FOR UPDATE;
 SELECT * INTO v_run FROM public.lab_game_runs
  WHERE user_id=v_user AND status='active' FOR UPDATE;
 IF FOUND AND v_today>v_run.started_on+v_run.completed_days THEN
  UPDATE public.lab_game_runs SET status='failed',finished_on=v_today WHERE id=v_run.id;
  v_run.id := NULL;
 END IF;
 IF v_run.id IS NULL THEN
  -- Do not automatically erase the completed 365-day journey on page refresh.
  -- A subsequent cycle is opened only after an explicit request.
  SELECT * INTO v_previous FROM public.lab_game_runs
    WHERE user_id=v_user ORDER BY created_at DESC,id DESC LIMIT 1;
  IF FOUND AND v_previous.status='completed' THEN
   RETURN jsonb_build_object(
    'run_id',v_previous.id,'day',365,'completed_days',365,
    'best_days',v_stats.best_days,'total_xp',v_stats.total_xp,
    'total_completed_days',v_stats.total_completed_days,
    'display_name',v_stats.display_name,'leaderboard_opt_in',v_stats.leaderboard_opt_in,
    'checked',(SELECT COALESCE(jsonb_agg(chapter_id ORDER BY chapter_id),'[]'::jsonb)
       FROM public.lab_game_chapter_checks
       WHERE run_id=v_previous.id AND day_number=365),
    'today',v_today,'finished',true
   );
  END IF;
  INSERT INTO public.lab_game_runs(user_id,started_on)
  VALUES(v_user,v_today) RETURNING * INTO v_run;
 END IF;
 v_day:=v_today-v_run.started_on+1;
 SELECT COALESCE(jsonb_agg(chapter_id ORDER BY chapter_id),'[]'::jsonb)
 INTO v_checked FROM public.lab_game_chapter_checks
 WHERE run_id=v_run.id AND day_number=v_day;
 RETURN jsonb_build_object(
  'run_id',v_run.id,'day',v_day,'completed_days',v_run.completed_days,
  'best_days',v_stats.best_days,'total_xp',v_stats.total_xp,
  'total_completed_days',v_stats.total_completed_days,
  'display_name',v_stats.display_name,
  'leaderboard_opt_in',v_stats.leaderboard_opt_in,
  'checked',v_checked,'today',v_today,
  'finished',v_run.status='completed'
 );
END;$$;
REVOKE ALL ON FUNCTION public.lab_game_sync() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_game_sync() TO authenticated;

CREATE OR REPLACE FUNCTION public.lab_game_restart_completed()
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $$
DECLARE
 v_user uuid:=auth.uid();
 v_latest public.lab_game_runs%ROWTYPE;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
 PERFORM 1 FROM public.lab_game_stats WHERE user_id=v_user FOR UPDATE;
 SELECT * INTO v_latest FROM public.lab_game_runs WHERE user_id=v_user
 ORDER BY created_at DESC,id DESC LIMIT 1;
 IF NOT FOUND OR v_latest.status<>'completed' THEN
  RAISE EXCEPTION 'Só é possível abrir outro ciclo após completar a Bíblia';
 END IF;
 INSERT INTO public.lab_game_runs(user_id,started_on)
 VALUES(v_user,(now() AT TIME ZONE 'America/Sao_Paulo')::date);
 RETURN public.lab_game_sync();
END;$$;
REVOKE ALL ON FUNCTION public.lab_game_restart_completed() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_game_restart_completed() TO authenticated;
