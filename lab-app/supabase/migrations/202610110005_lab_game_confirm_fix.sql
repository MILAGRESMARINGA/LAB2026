CREATE OR REPLACE FUNCTION public.lab_game_confirm_chapter(p_chapter_id text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $$
DECLARE
 v_user uuid:=auth.uid();
 v_today date:=(now() AT TIME ZONE 'America/Sao_Paulo')::date;
 v_run public.lab_game_runs%ROWTYPE;
 v_day integer; v_expected integer; v_have integer; v_new integer;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
 PERFORM public.lab_game_sync();
 SELECT * INTO v_run FROM public.lab_game_runs
  WHERE user_id=v_user AND status='active' FOR UPDATE;
 v_day:=v_today-v_run.started_on+1;
 IF v_day<1 OR v_day>365 OR v_day<>v_run.completed_days+1 THEN
  IF EXISTS(SELECT 1 FROM public.lab_game_chapter_checks
   WHERE run_id=v_run.id AND day_number=v_day AND chapter_id=p_chapter_id)
  THEN RETURN public.lab_game_sync(); END IF;
  RAISE EXCEPTION 'Etapa ainda não disponível ou já concluída';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.lab_game_plan_chapters
  WHERE version=1 AND day_number=v_day AND chapter_id=p_chapter_id)
 THEN RAISE EXCEPTION 'Este capítulo não pertence à leitura de hoje'; END IF;
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
  UPDATE public.lab_game_runs
   SET completed_days=v_day,
       status=CASE WHEN v_day=365 THEN 'completed' ELSE 'active' END,
       finished_on=CASE WHEN v_day=365 THEN v_today ELSE NULL END
   WHERE id=v_run.id;
  UPDATE public.lab_game_stats SET
   best_days=GREATEST(best_days,v_day),
   total_completed_days=total_completed_days+1,
   updated_at=now() WHERE user_id=v_user;
 END IF;
 -- Return final success without auto-creating a new run on stage 365.
 IF v_day=365 AND v_have=v_expected THEN
  RETURN jsonb_build_object('run_id',v_run.id,'day',365,'completed_days',365,
   'finished',true,'checked',(SELECT jsonb_agg(chapter_id) FROM public.lab_game_chapter_checks WHERE run_id=v_run.id AND day_number=365),
   'best_days',365,
   'total_xp',(SELECT total_xp FROM public.lab_game_stats WHERE user_id=v_user));
 END IF;
 RETURN public.lab_game_sync();
END;$$;
REVOKE ALL ON FUNCTION public.lab_game_confirm_chapter(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_game_confirm_chapter(text) TO authenticated;
