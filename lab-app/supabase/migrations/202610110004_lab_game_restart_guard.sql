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
 IF v_latest.finished_on >= (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN
  RAISE EXCEPTION 'Uma nova jornada só poderá começar amanhã';
 END IF;
 INSERT INTO public.lab_game_runs(user_id,started_on)
 VALUES(v_user,(now() AT TIME ZONE 'America/Sao_Paulo')::date);
 RETURN public.lab_game_sync();
END;$$;
REVOKE ALL ON FUNCTION public.lab_game_restart_completed() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_game_restart_completed() TO authenticated;
