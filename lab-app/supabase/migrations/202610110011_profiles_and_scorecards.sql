-- Initialize the profile at the first authenticated session, using validated signup metadata.
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
 INSERT INTO public.lab_game_stats(user_id,display_name)
 SELECT v_user,
  CASE
   WHEN length(btrim(coalesce(u.raw_user_meta_data->>'display_name',''))) BETWEEN 2 AND 60
   THEN btrim(u.raw_user_meta_data->>'display_name')
   ELSE 'Leitor LAB'
  END
 FROM auth.users u WHERE u.id=v_user
 ON CONFLICT(user_id) DO NOTHING;
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

-- XP mathematics are authoritative and easy to audit: 10 per completed chapter,
-- 5 per distinct confirmed BibleProject panorama. A video never completes a day.
CREATE OR REPLACE FUNCTION public.lab_game_scorecard()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
 v_user uuid:=auth.uid();
 v_readings bigint;
 v_video_rewards bigint;
 v_chapter_xp bigint;
 v_video_xp bigint;
 v_stored integer;
 v_best integer;
 v_total_days integer;
 v_current_days integer;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Autenticação necessária';END IF;
 SELECT COUNT(*) INTO v_readings
 FROM public.lab_game_chapter_checks c
 JOIN public.lab_game_runs r ON r.id=c.run_id
 WHERE r.user_id=v_user;
 SELECT COUNT(*) INTO v_video_rewards FROM public.lab_game_video_rewards
 WHERE user_id=v_user;
 SELECT total_xp,best_days,total_completed_days INTO v_stored,v_best,v_total_days
 FROM public.lab_game_stats WHERE user_id=v_user;
 SELECT completed_days INTO v_current_days FROM public.lab_game_runs
 WHERE user_id=v_user AND status='active' ORDER BY started_on DESC LIMIT 1;
 v_chapter_xp:=v_readings*10;
 v_video_xp:=v_video_rewards*5;
 RETURN jsonb_build_object(
  'chapters_confirmed',v_readings,'panoramas_confirmed',v_video_rewards,
  'reading_xp',v_chapter_xp,'video_xp',v_video_xp,
  'total_xp',v_chapter_xp+v_video_xp,
  'recorded_xp',COALESCE(v_stored,0),
  'balanced',COALESCE(v_stored,0)=v_chapter_xp+v_video_xp,
  'current_streak',COALESCE(v_current_days,0),
  'best_streak',COALESCE(v_best,0),
  'total_completed_days',COALESCE(v_total_days,0),
  'chapter_rate',10,'video_rate',5
 );
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_game_scorecard() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_game_scorecard() TO authenticated;

-- Group summary is visible only to current members. No participant identities leak.
CREATE OR REPLACE FUNCTION public.lab_game_group_summary(p_group_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
 v_user uuid:=auth.uid();
 v_name text;
 v_owner uuid;
 v_members integer;
 v_consented integer;
 v_completed bigint;
 v_pct numeric;
 v_today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
 IF v_user IS NULL OR NOT EXISTS(
  SELECT 1 FROM public.reading_group_members m
  WHERE m.group_id=p_group_id AND m.user_id=v_user
 ) THEN RAISE EXCEPTION 'Acesso ao grupo não autorizado';END IF;
 SELECT name,owner_id INTO v_name,v_owner FROM public.reading_groups WHERE id=p_group_id;
 SELECT COUNT(*)::integer,COUNT(*) FILTER(WHERE s.leaderboard_opt_in=true)::integer
 INTO v_members,v_consented
 FROM public.reading_group_members m
 LEFT JOIN public.lab_game_stats s ON s.user_id=m.user_id
 WHERE m.group_id=p_group_id;
 WITH completed_days AS (
  SELECT r.user_id,c.read_on,c.run_id,c.day_number
  FROM public.lab_game_chapter_checks c
  JOIN public.lab_game_runs r ON r.id=c.run_id
  JOIN public.reading_group_members m ON m.user_id=r.user_id AND m.group_id=p_group_id
  JOIN public.lab_game_stats s ON s.user_id=r.user_id AND s.leaderboard_opt_in=true
  WHERE c.read_on BETWEEN v_today-6 AND v_today
   AND r.started_on+(c.day_number::integer-1)=c.read_on
  GROUP BY r.user_id,c.read_on,c.run_id,c.day_number
  HAVING COUNT(DISTINCT c.chapter_id)=(
   SELECT COUNT(*) FROM public.lab_game_plan_chapters p
    WHERE p.version=1 AND p.day_number=c.day_number
  )
 )
 SELECT COUNT(DISTINCT (user_id,read_on)) INTO v_completed FROM completed_days;
 v_pct:=CASE WHEN v_consented>0 THEN ROUND(100.0*v_completed/(7*v_consented),1) ELSE 0 END;
 RETURN jsonb_build_object(
  'group_id',p_group_id,'name',v_name,'owner_id',v_owner,
  'members',v_members,'consenting_members',v_consented,
  'completed_member_days_7',v_completed,
  'compliance_pct',v_pct,
  'window_start',v_today-6,'window_end',v_today
 );
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_game_group_summary(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_game_group_summary(uuid) TO authenticated;
