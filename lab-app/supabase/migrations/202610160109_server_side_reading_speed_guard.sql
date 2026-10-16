-- LABGAME server-side anti-speedrun guard for the active V1 and shadow V2 journeys.
-- No client timestamp is accepted. Start and confirmation timestamps are captured by PostgreSQL.
-- Keep V2 behind lab_v2_release_controls; this migration does not open the release switch.
-- lab_game_plan_chapters intentionally remains RLS-enabled and without an API policy.

CREATE TABLE public.lab_game_chapter_read_sessions (
  run_id uuid NOT NULL REFERENCES public.lab_game_runs(id) ON DELETE CASCADE,
  day_number smallint NOT NULL CHECK (day_number BETWEEN 1 AND 365),
  chapter_id text NOT NULL CHECK (chapter_id ~ '^[0-9]{1,2}:[0-9]{1,3}$'),
  started_at timestamptz NOT NULL,
  PRIMARY KEY (run_id, day_number, chapter_id)
);
ALTER TABLE public.lab_game_chapter_read_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_game_chapter_read_sessions FROM PUBLIC, anon, authenticated;

CREATE TABLE public.lab_v2_chapter_read_sessions (
  run_id uuid NOT NULL,
  day_number smallint NOT NULL CHECK (day_number BETWEEN 1 AND 366),
  chapter_id text NOT NULL CHECK (chapter_id ~ '^[0-9]{1,2}:[0-9]{1,3}$'),
  started_at timestamptz NOT NULL,
  PRIMARY KEY (run_id, day_number, chapter_id),
  FOREIGN KEY (run_id, day_number)
    REFERENCES public.lab_v2_stages(run_id, day_number) ON DELETE CASCADE
);
ALTER TABLE public.lab_v2_chapter_read_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_v2_chapter_read_sessions FROM PUBLIC, anon, authenticated;

-- 240 words/minute is a deliberately permissive lower bound. The 30-second floor
-- protects short chapters; two seconds per verse prevents a dense short-text edge case.
CREATE OR REPLACE FUNCTION public.lab_chapter_minimum_read_seconds(p_chapter_id text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $fn$
DECLARE
  v_verse_count integer;
  v_word_count integer;
BEGIN
  SELECT count(*)::integer,
         COALESCE(
           sum(array_length(regexp_split_to_array(btrim(v.verse_text), '\s+'), 1))
             FILTER (WHERE btrim(v.verse_text) <> ''),
           0
         )::integer
    INTO v_verse_count, v_word_count
    FROM public.lab_bible_verses v
   WHERE v.edition = 'ALM1911'
     AND v.chapter_id = p_chapter_id;

  IF v_verse_count < 1 OR v_word_count < 1 THEN
    RAISE EXCEPTION 'Texto bíblico indisponível para validar a duração da leitura';
  END IF;

  RETURN GREATEST(
    30,
    ceil(v_word_count * 60.0 / 240)::integer,
    v_verse_count * 2
  );
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_chapter_minimum_read_seconds(text)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.lab_game_begin_chapter(p_chapter_id text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_user uuid := auth.uid();
  v_run public.lab_game_runs%ROWTYPE;
  v_at timestamptz;
  v_today date;
  v_day integer;
  v_started timestamptz;
  v_minimum_seconds integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  IF p_chapter_id IS NULL OR p_chapter_id !~ '^[0-9]{1,2}:[0-9]{1,3}$'
  THEN RAISE EXCEPTION 'Capítulo inválido'; END IF;

  -- Synchronization creates/locks today's V1 run using the server's São Paulo clock.
  PERFORM public.lab_game_sync();
  SELECT * INTO v_run
    FROM public.lab_game_runs
   WHERE user_id = v_user AND status = 'active'
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Jornada ativa não encontrada'; END IF;

  v_at := clock_timestamp();
  v_today := (v_at AT TIME ZONE 'America/Sao_Paulo')::date;
  v_day := v_today - v_run.started_on + 1;
  IF v_day < 1 OR v_day > 365 OR v_day <> v_run.completed_days + 1
  THEN RAISE EXCEPTION 'Etapa ainda não disponível ou já concluída'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.lab_game_plan_chapters p
     WHERE p.version = 1 AND p.day_number = v_day AND p.chapter_id = p_chapter_id
  ) THEN RAISE EXCEPTION 'Este capítulo não pertence à leitura de hoje'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.lab_game_chapter_checks c
     WHERE c.run_id = v_run.id AND c.day_number = v_day AND c.chapter_id = p_chapter_id
  ) THEN
    RETURN jsonb_build_object('already_confirmed', true, 'minimum_read_seconds', 0);
  END IF;

  v_minimum_seconds := public.lab_chapter_minimum_read_seconds(p_chapter_id);
  -- Reopening the same chapter does not reset the server timestamp.
  INSERT INTO public.lab_game_chapter_read_sessions(run_id, day_number, chapter_id, started_at)
  VALUES (v_run.id, v_day, p_chapter_id, clock_timestamp())
  ON CONFLICT (run_id, day_number, chapter_id) DO NOTHING;
  SELECT s.started_at INTO v_started
    FROM public.lab_game_chapter_read_sessions s
   WHERE s.run_id = v_run.id AND s.day_number = v_day AND s.chapter_id = p_chapter_id;

  RETURN jsonb_build_object(
    'run_id', v_run.id,
    'day', v_day,
    'chapter_id', p_chapter_id,
    'minimum_read_seconds', v_minimum_seconds,
    'eligible_at', v_started + v_minimum_seconds * interval '1 second'
  );
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_game_begin_chapter(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lab_game_begin_chapter(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.lab_game_confirm_chapter(p_chapter_id text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_user uuid := auth.uid();
  v_run public.lab_game_runs%ROWTYPE;
  v_last public.lab_game_runs%ROWTYPE;
  v_today date;
  v_at timestamptz;
  v_day integer;
  v_expected integer;
  v_have integer;
  v_new integer;
  v_all integer;
  v_plan_count integer;
  v_started timestamptz;
  v_minimum_seconds integer;
  v_cycle integer;
  v_bonus integer;
  v_added integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  IF p_chapter_id IS NULL OR p_chapter_id !~ '^[0-9]{1,2}:[0-9]{1,3}$'
  THEN RAISE EXCEPTION 'Capítulo inválido'; END IF;

  PERFORM public.lab_game_sync();
  SELECT * INTO v_run
    FROM public.lab_game_runs
   WHERE user_id = v_user AND status = 'active'
   FOR UPDATE;
  IF NOT FOUND THEN
    SELECT * INTO v_last
      FROM public.lab_game_runs
     WHERE user_id = v_user
     ORDER BY created_at DESC, id DESC
     LIMIT 1;
    IF v_last.status = 'completed' AND EXISTS (
      SELECT 1 FROM public.lab_game_chapter_checks c
       WHERE c.run_id = v_last.id AND c.day_number = 365 AND c.chapter_id = p_chapter_id
    ) THEN
      RETURN public.lab_game_sync();
    END IF;
    RAISE EXCEPTION 'Etapa ainda não disponível ou já concluída';
  END IF;

  v_at := clock_timestamp();
  v_today := (v_at AT TIME ZONE 'America/Sao_Paulo')::date;
  v_day := v_today - v_run.started_on + 1;
  IF v_day < 1 OR v_day > 365 OR v_day <> v_run.completed_days + 1 THEN
    IF EXISTS (
      SELECT 1 FROM public.lab_game_chapter_checks c
       WHERE c.run_id = v_run.id AND c.day_number = v_day AND c.chapter_id = p_chapter_id
    ) THEN RETURN public.lab_game_sync(); END IF;
    RAISE EXCEPTION 'Etapa ainda não disponível ou já concluída';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.lab_game_plan_chapters p
     WHERE p.version = 1 AND p.day_number = v_day AND p.chapter_id = p_chapter_id
  ) THEN RAISE EXCEPTION 'Este capítulo não pertence à leitura de hoje'; END IF;

  -- A recorded retry is safe and never earns XP twice.
  IF EXISTS (
    SELECT 1 FROM public.lab_game_chapter_checks c
     WHERE c.run_id = v_run.id AND c.day_number = v_day AND c.chapter_id = p_chapter_id
  ) THEN RETURN public.lab_game_sync(); END IF;

  v_minimum_seconds := public.lab_chapter_minimum_read_seconds(p_chapter_id);
  SELECT s.started_at INTO v_started
    FROM public.lab_game_chapter_read_sessions s
   WHERE s.run_id = v_run.id AND s.day_number = v_day AND s.chapter_id = p_chapter_id
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Abra este capítulo para iniciar a leitura'; END IF;
  IF v_at < v_started + v_minimum_seconds * interval '1 second' THEN
    RAISE EXCEPTION 'Leitura muito rápida: aguarde ao menos % segundos desde o início no servidor',
      v_minimum_seconds;
  END IF;

  INSERT INTO public.lab_game_chapter_checks
    (run_id, day_number, chapter_id, read_on, confirmed_at)
  VALUES (v_run.id, v_day, p_chapter_id, v_today, v_at)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_new = ROW_COUNT;
  IF v_new > 0 THEN
    UPDATE public.lab_game_stats
       SET total_xp = total_xp + 10, updated_at = v_at
     WHERE user_id = v_user;
  END IF;
  DELETE FROM public.lab_game_chapter_read_sessions s
   WHERE s.run_id = v_run.id AND s.day_number = v_day AND s.chapter_id = p_chapter_id;

  SELECT COUNT(*) INTO v_have
    FROM public.lab_game_chapter_checks c
   WHERE c.run_id = v_run.id AND c.day_number = v_day;
  SELECT COUNT(*) INTO v_expected
    FROM public.lab_game_plan_chapters p
   WHERE p.version = 1 AND p.day_number = v_day;

  IF v_have = v_expected AND v_run.completed_days < v_day THEN
    -- A final award requires the complete canonical 1,189-chapter plan.
    IF v_day = 365 THEN
      SELECT COUNT(*) INTO v_all FROM public.lab_game_chapter_checks c
       WHERE c.run_id = v_run.id;
      SELECT COUNT(*) INTO v_plan_count FROM public.lab_game_plan_chapters p
       WHERE p.version = 1;
      IF v_all <> 1189 OR v_plan_count <> 1189 OR EXISTS (
        SELECT 1
          FROM public.lab_game_chapter_checks c
          LEFT JOIN public.lab_game_plan_chapters p
            ON p.version = 1 AND p.day_number = c.day_number AND p.chapter_id = c.chapter_id
         WHERE c.run_id = v_run.id AND p.chapter_id IS NULL
      ) THEN
        RAISE EXCEPTION 'A jornada anual não contém todos os capítulos previstos';
      END IF;
    END IF;

    UPDATE public.lab_game_runs
       SET completed_days = v_day,
           status = CASE WHEN v_day = 365 THEN 'completed' ELSE 'active' END,
           finished_on = CASE WHEN v_day = 365 THEN v_today ELSE NULL END
     WHERE id = v_run.id;
    UPDATE public.lab_game_stats
       SET best_days = GREATEST(best_days, v_day),
           total_completed_days = total_completed_days + 1,
           updated_at = v_at
     WHERE user_id = v_user;

    IF v_day = 365 THEN
      SELECT COUNT(*)::integer INTO v_cycle
        FROM public.lab_game_runs r
       WHERE r.user_id = v_user AND r.status = 'completed';
      IF v_cycle < 1 OR v_cycle > 100000 THEN
        RAISE EXCEPTION 'Quantidade de ciclos fora do limite técnico';
      END IF;
      v_bonus := 10000 + (v_cycle - 1) * 2500;
      INSERT INTO public.lab_game_cycle_awards(run_id, user_id, cycle_number, bonus_xp)
      VALUES (v_run.id, v_user, v_cycle, v_bonus)
      ON CONFLICT (run_id) DO NOTHING;
      GET DIAGNOSTICS v_added = ROW_COUNT;
      IF v_added = 1 THEN
        UPDATE public.lab_game_stats
           SET total_xp = total_xp + v_bonus, updated_at = v_at
         WHERE user_id = v_user;
      END IF;
    END IF;
  END IF;

  IF v_day = 365 AND v_have = v_expected THEN
    RETURN jsonb_build_object(
      'run_id', v_run.id,
      'day', 365,
      'completed_days', 365,
      'finished', true,
      'checked', (
        SELECT COALESCE(jsonb_agg(c.chapter_id), '[]'::jsonb)
          FROM public.lab_game_chapter_checks c
         WHERE c.run_id = v_run.id AND c.day_number = 365
      ),
      'best_days', 365,
      'total_xp', (SELECT s.total_xp FROM public.lab_game_stats s WHERE s.user_id = v_user)
    );
  END IF;
  RETURN public.lab_game_sync();
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_game_confirm_chapter(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lab_game_confirm_chapter(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.lab_v2_begin_chapter(p_run uuid, p_stage integer, p_chapter text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_user uuid := auth.uid();
  v_run public.lab_v2_runs%ROWTYPE;
  v_stage public.lab_v2_stages%ROWTYPE;
  v_at timestamptz;
  v_started timestamptz;
  v_minimum_seconds integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
  IF p_run IS NULL OR p_stage IS NULL OR p_stage < 1 OR p_stage > 366
     OR p_chapter IS NULL OR p_chapter !~ '^[0-9]{1,2}:[0-9]{1,3}$'
  THEN RAISE EXCEPTION 'Referência de leitura inválida'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 2116));
  IF NOT EXISTS (
    SELECT 1 FROM public.lab_v2_release_controls c WHERE c.singleton = true AND c.enabled = true
  ) THEN RAISE EXCEPTION 'Jornada V2 não liberada neste ambiente'; END IF;

  v_at := clock_timestamp();
  PERFORM public.lab_v2_resolve(p_run, v_at);
  SELECT * INTO v_run
    FROM public.lab_v2_runs r
   WHERE r.id = p_run AND r.user_id = v_user
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Jornada não encontrada'; END IF;
  IF v_run.status <> 'active' THEN
    RETURN jsonb_build_object('already_started', false, 'finished', true);
  END IF;
  SELECT * INTO v_stage
    FROM public.lab_v2_stages s
   WHERE s.run_id = p_run AND s.day_number = p_stage
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ative esta etapa antes de ler'; END IF;
  IF v_stage.completed_at IS NOT NULL OR v_stage.transitioned_at IS NOT NULL
  THEN RAISE EXCEPTION 'Etapa encerrada'; END IF;
  IF p_stage <> (
    SELECT max(s.day_number) FROM public.lab_v2_stages s WHERE s.run_id = p_run
  ) THEN RAISE EXCEPTION 'Apenas a etapa ativa permite leitura'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.lab_v2_plan_chapters p
     WHERE p.plan_length = v_run.plan_length
       AND p.day_number = p_stage
       AND p.chapter_id = p_chapter
  ) THEN RAISE EXCEPTION 'Capítulo não pertence à etapa ativa'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.lab_v2_chapter_checks c
     WHERE c.run_id = p_run AND c.day_number = p_stage AND c.chapter_id = p_chapter
  ) THEN
    RETURN jsonb_build_object('already_confirmed', true, 'minimum_read_seconds', 0);
  END IF;

  v_minimum_seconds := public.lab_chapter_minimum_read_seconds(p_chapter);
  INSERT INTO public.lab_v2_chapter_read_sessions(run_id, day_number, chapter_id, started_at)
  VALUES (p_run, p_stage, p_chapter, clock_timestamp())
  ON CONFLICT (run_id, day_number, chapter_id) DO NOTHING;
  SELECT s.started_at INTO v_started
    FROM public.lab_v2_chapter_read_sessions s
   WHERE s.run_id = p_run AND s.day_number = p_stage AND s.chapter_id = p_chapter;

  RETURN jsonb_build_object(
    'run_id', p_run,
    'stage', p_stage,
    'chapter_id', p_chapter,
    'minimum_read_seconds', v_minimum_seconds,
    'eligible_at', v_started + v_minimum_seconds * interval '1 second'
  );
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_begin_chapter(uuid, integer, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lab_v2_begin_chapter(uuid, integer, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.lab_v2_confirm(p_run uuid, p_stage integer, p_chapter text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_user uuid := auth.uid();
  v_run public.lab_v2_runs%ROWTYPE;
  v_stage public.lab_v2_stages%ROWTYPE;
  v_at timestamptz;
  v_started timestamptz;
  v_minimum_seconds integer;
  v_have integer;
  v_expected integer;
  v_penalty smallint;
  v_cycle integer;
  v_bonus integer;
  v_perfect boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
  IF p_run IS NULL OR p_stage IS NULL OR p_stage < 1 OR p_stage > 366
     OR p_chapter IS NULL OR p_chapter !~ '^[0-9]{1,2}:[0-9]{1,3}$'
  THEN RAISE EXCEPTION 'Referência de leitura inválida'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 2116));
  IF NOT EXISTS (
    SELECT 1 FROM public.lab_v2_release_controls c WHERE c.singleton = true AND c.enabled = true
  ) THEN RAISE EXCEPTION 'Jornada V2 não liberada neste ambiente'; END IF;

  v_at := clock_timestamp();
  PERFORM public.lab_v2_resolve(p_run, v_at);
  SELECT * INTO v_run
    FROM public.lab_v2_runs r
   WHERE r.id = p_run AND r.user_id = v_user
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Jornada não encontrada'; END IF;
  IF v_run.status <> 'active' THEN RETURN public.lab_v2_sync(p_run); END IF;
  SELECT * INTO v_stage
    FROM public.lab_v2_stages s
   WHERE s.run_id = p_run AND s.day_number = p_stage
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ative esta etapa antes de ler'; END IF;

  -- A retry of a confirmed chapter remains idempotent and grants no duplicate XP.
  IF EXISTS (
    SELECT 1 FROM public.lab_v2_chapter_checks c
     WHERE c.run_id = p_run AND c.day_number = p_stage AND c.chapter_id = p_chapter
  ) THEN RETURN public.lab_v2_sync(p_run); END IF;
  IF v_stage.completed_at IS NOT NULL OR v_stage.transitioned_at IS NOT NULL
  THEN RAISE EXCEPTION 'Etapa encerrada'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.lab_v2_plan_chapters p
     WHERE p.plan_length = v_run.plan_length
       AND p.day_number = p_stage
       AND p.chapter_id = p_chapter
  ) THEN RAISE EXCEPTION 'Capítulo não pertence à etapa ativa'; END IF;
  IF p_stage <> (
    SELECT max(s.day_number) FROM public.lab_v2_stages s WHERE s.run_id = p_run
  ) THEN RAISE EXCEPTION 'Apenas a etapa ativa permite confirmação'; END IF;

  v_minimum_seconds := public.lab_chapter_minimum_read_seconds(p_chapter);
  SELECT s.started_at INTO v_started
    FROM public.lab_v2_chapter_read_sessions s
   WHERE s.run_id = p_run AND s.day_number = p_stage AND s.chapter_id = p_chapter
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Abra este capítulo para iniciar a leitura'; END IF;
  IF v_at < v_started + v_minimum_seconds * interval '1 second' THEN
    RAISE EXCEPTION 'Leitura muito rápida: aguarde ao menos % segundos desde o início no servidor',
      v_minimum_seconds;
  END IF;

  INSERT INTO public.lab_v2_chapter_checks(run_id, day_number, chapter_id, confirmed_at)
  VALUES (p_run, p_stage, p_chapter, v_at)
  ON CONFLICT DO NOTHING;
  SELECT count(*) INTO v_have
    FROM public.lab_v2_chapter_checks c
   WHERE c.run_id = p_run AND c.day_number = p_stage;
  SELECT count(*) INTO v_expected
    FROM public.lab_v2_plan_chapters p
   WHERE p.plan_length = v_run.plan_length AND p.day_number = p_stage;
  IF v_have = v_expected THEN
    UPDATE public.lab_v2_stages s SET completed_at = v_at
     WHERE s.run_id = p_run AND s.day_number = p_stage;
    IF p_stage = v_run.plan_length THEN
      v_penalty := CASE WHEN v_at <= v_stage.activated_at + interval '24 hours' THEN 0
        WHEN v_at <= v_stage.activated_at + interval '27 hours' THEN 3 ELSE 6 END;
      UPDATE public.lab_v2_stages s
         SET transitioned_at = v_at, late_penalty = v_penalty
       WHERE s.run_id = p_run AND s.day_number = p_stage;
      UPDATE public.lab_v2_runs r SET status = 'completed', finished_at = v_at
       WHERE r.id = p_run;
      SELECT count(*) + 1 INTO v_cycle
        FROM public.lab_v2_cycle_awards a WHERE a.user_id = v_user;
      SELECT NOT EXISTS (
        SELECT 1 FROM public.lab_v2_stages s
         WHERE s.run_id = p_run
           AND (s.late_penalty <> 0 OR s.completed_at IS NULL OR s.transitioned_at IS NULL)
      ) AND NOT EXISTS (
        SELECT 1 FROM public.lab_v2_incidents i WHERE i.run_id = p_run
      ) INTO v_perfect;
      v_bonus := 10000 + (v_cycle - 1) * 2500;
      INSERT INTO public.lab_v2_cycle_awards
        (run_id, user_id, cycle_number, bonus_xp, perfect_constancy)
      VALUES (p_run, v_user, v_cycle, v_bonus, v_perfect)
      ON CONFLICT (run_id) DO NOTHING;
    END IF;
  END IF;

  DELETE FROM public.lab_v2_chapter_read_sessions s
   WHERE s.run_id = p_run AND s.day_number = p_stage AND s.chapter_id = p_chapter;
  RETURN public.lab_v2_sync(p_run);
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_confirm(uuid, integer, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lab_v2_confirm(uuid, integer, text) TO authenticated;
