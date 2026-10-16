-- Server-side, cache-first study generation controls.
-- Private operational rows are inaccessible through the Data API. Only tightly
-- scoped SECURITY DEFINER RPCs, executable by the Edge Function service role,
-- may reserve, rate-limit, and publish generated content.
BEGIN;

CREATE TABLE public.lab_v2_study_generation_requests (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL CHECK (idempotency_key ~ '^[A-Za-z0-9._:-]{16,128}$'),
  cache_key text NOT NULL CHECK (length(btrim(cache_key)) BETWEEN 1 AND 240),
  reservation_id uuid NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('reserved', 'published', 'failed')),
  lease_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  PRIMARY KEY (user_id, idempotency_key),
  CHECK ((status = 'reserved' AND lease_until IS NOT NULL)
      OR (status <> 'reserved' AND lease_until IS NULL))
);
CREATE UNIQUE INDEX lab_v2_study_generation_one_reservation_per_cache_key
  ON public.lab_v2_study_generation_requests(cache_key)
  WHERE status = 'reserved';
CREATE INDEX lab_v2_study_generation_requests_by_user_time
  ON public.lab_v2_study_generation_requests(user_id, created_at DESC);
ALTER TABLE public.lab_v2_study_generation_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_v2_study_generation_requests
  FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE public.lab_v2_study_generation_global_buckets (
  window_start timestamptz PRIMARY KEY,
  request_count smallint NOT NULL CHECK (request_count BETWEEN 1 AND 10)
);
ALTER TABLE public.lab_v2_study_generation_global_buckets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_v2_study_generation_global_buckets
  FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE public.lab_v2_study_generation_user_buckets (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start timestamptz NOT NULL,
  request_count smallint NOT NULL CHECK (request_count BETWEEN 1 AND 3),
  PRIMARY KEY (user_id, window_start)
);
ALTER TABLE public.lab_v2_study_generation_user_buckets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_v2_study_generation_user_buckets
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.lab_v2_prepare_study_generation(
  p_user_id uuid,
  p_journey_day smallint,
  p_layer smallint
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_run public.lab_v2_runs%ROWTYPE;
  v_layer public.lab_v2_study_layers%ROWTYPE;
  v_completed integer;
  v_refs text[];
  v_chapters jsonb;
BEGIN
  IF p_user_id IS NULL
     OR p_journey_day NOT BETWEEN 1 AND 366
     OR p_layer NOT BETWEEN 1 AND 3 THEN
    RETURN jsonb_build_object('status', 'invalid_request');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.lab_v2_release_controls c
     WHERE c.singleton = true AND c.enabled = true
  ) THEN
    RETURN jsonb_build_object('status', 'unavailable');
  END IF;

  SELECT r.* INTO v_run
    FROM public.lab_v2_runs r
   WHERE r.user_id = p_user_id AND r.status = 'active'
   ORDER BY r.started_at DESC, r.id DESC
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'unavailable');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.lab_v2_stages s
     WHERE s.run_id = v_run.id AND s.day_number = p_journey_day
  ) THEN
    RETURN jsonb_build_object('status', 'unavailable');
  END IF;

  SELECT l.* INTO v_layer
    FROM public.lab_v2_study_layers l
   WHERE l.layer = p_layer;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'invalid_request');
  END IF;

  SELECT count(*)::integer INTO v_completed
    FROM public.lab_v2_stages s
   WHERE s.run_id = v_run.id AND s.completed_at IS NOT NULL;
  IF v_completed < v_layer.minimum_completed_days THEN
    RETURN jsonb_build_object('status', 'layer_locked');
  END IF;

  SELECT pg_catalog.array_agg(p.chapter_id ORDER BY p.slot),
         pg_catalog.jsonb_agg(
           pg_catalog.jsonb_build_object(
             'chapter_id', p.chapter_id,
             'verses', COALESCE((
               SELECT pg_catalog.jsonb_agg(
                 pg_catalog.jsonb_build_object(
                   'verse_number', v.verse_number,
                   'text', v.verse_text
                 ) ORDER BY v.verse_number
               )
                 FROM public.lab_bible_verses v
                WHERE v.edition = 'ALM1911'
                  AND v.chapter_id = p.chapter_id
             ), '[]'::jsonb)
           ) ORDER BY p.slot
         )
    INTO v_refs, v_chapters
    FROM public.lab_v2_plan_chapters p
   WHERE p.plan_length = v_run.plan_length
     AND p.day_number = p_journey_day;

  IF COALESCE(pg_catalog.cardinality(v_refs), 0) NOT BETWEEN 1 AND 4
     OR pg_catalog.jsonb_array_length(COALESCE(v_chapters, '[]'::jsonb))
          <> pg_catalog.cardinality(v_refs)
     OR EXISTS (
       SELECT 1
         FROM pg_catalog.jsonb_array_elements(COALESCE(v_chapters, '[]'::jsonb)) AS c
        WHERE pg_catalog.jsonb_array_length(c->'verses') = 0
     ) THEN
    RETURN jsonb_build_object('status', 'source_unavailable');
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'status', 'prepared',
    'run_id', v_run.id,
    'plan_length', v_run.plan_length,
    'journey_key', 'bible-annual',
    'journey_day', p_journey_day,
    'layer', p_layer,
    'layer_title', v_layer.title,
    'layer_audience', v_layer.audience,
    'layer_description', v_layer.description,
    'completed_days', v_completed,
    'chapter_refs', pg_catalog.to_jsonb(v_refs),
    'chapters', v_chapters
  );
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_prepare_study_generation(uuid, smallint, smallint)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lab_v2_prepare_study_generation(uuid, smallint, smallint)
  TO service_role;

CREATE OR REPLACE FUNCTION public.lab_v2_reserve_study_generation(
  p_user_id uuid,
  p_idempotency_key text,
  p_cache_key text,
  p_journey_day smallint,
  p_layer smallint,
  p_chapter_refs text[],
  p_content_version text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_now timestamptz := statement_timestamp();
  v_bucket timestamptz;
  v_expected_key text;
  v_context jsonb;
  v_request public.lab_v2_study_generation_requests%ROWTYPE;
  v_global_count integer := 0;
  v_user_count integer := 0;
  v_reservation uuid;
  v_retry integer;
  v_plan_refs text[];
  v_expected_refs text[];
BEGIN
  IF p_user_id IS NULL
     OR p_idempotency_key IS NULL
     OR p_idempotency_key !~ '^[A-Za-z0-9._:-]{16,128}$'
     OR p_content_version IS NULL
     OR p_content_version !~ '^[A-Za-z0-9._-]{1,40}$'
     OR p_journey_day NOT BETWEEN 1 AND 366
     OR p_layer NOT BETWEEN 1 AND 3
     OR p_chapter_refs IS NULL
     OR pg_catalog.cardinality(p_chapter_refs) NOT BETWEEN 1 AND 4
     OR pg_catalog.array_position(p_chapter_refs, NULL) IS NOT NULL THEN
    RETURN pg_catalog.jsonb_build_object('status', 'invalid_request');
  END IF;

  v_expected_key := 'bible-annual:' || p_journey_day::text || ':'
    || pg_catalog.array_to_string(p_chapter_refs, ',')
    || ':L' || p_layer::text || ':' || p_content_version;
  IF p_cache_key IS DISTINCT FROM v_expected_key
     OR length(p_cache_key) > 240 THEN
    RETURN pg_catalog.jsonb_build_object('status', 'invalid_request');
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('lab-study-cache:' || p_cache_key, 2112)
  );

  v_context := public.lab_v2_prepare_study_generation(
    p_user_id, p_journey_day, p_layer
  );
  IF v_context->>'status' <> 'prepared' THEN
    RETURN pg_catalog.jsonb_build_object('status', v_context->>'status');
  END IF;
  v_plan_refs := ARRAY(
    SELECT refs.ref
      FROM pg_catalog.jsonb_array_elements_text(v_context->'chapter_refs')
           WITH ORDINALITY AS refs(ref, ordinal)
     ORDER BY refs.ordinal
  );
  v_expected_refs := ARRAY(
    SELECT planned.ref
      FROM pg_catalog.unnest(v_plan_refs) WITH ORDINALITY AS planned(ref, ordinal)
     WHERE planned.ref = ANY(p_chapter_refs)
     ORDER BY planned.ordinal
  );
  IF v_expected_refs IS DISTINCT FROM p_chapter_refs THEN
    RETURN pg_catalog.jsonb_build_object('status', 'invalid_request');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.lab_v2_study_content c
     WHERE c.cache_key = p_cache_key
       AND c.publication_status = 'published'
  ) THEN
    RETURN pg_catalog.jsonb_build_object(
      'status', 'cache_hit',
      'study_key', (
        SELECT c.study_key FROM public.lab_v2_study_content c
         WHERE c.cache_key = p_cache_key
           AND c.publication_status = 'published'
      )
    );
  END IF;

  SELECT r.* INTO v_request
    FROM public.lab_v2_study_generation_requests r
   WHERE r.user_id = p_user_id AND r.idempotency_key = p_idempotency_key
   FOR UPDATE;
  IF FOUND THEN
    IF v_request.cache_key <> p_cache_key THEN
      RETURN pg_catalog.jsonb_build_object('status', 'idempotency_conflict');
    END IF;
    IF v_request.status = 'published' THEN
      RETURN pg_catalog.jsonb_build_object('status', 'cache_missing');
    END IF;
    IF v_request.status = 'reserved' AND v_request.lease_until > v_now THEN
      RETURN pg_catalog.jsonb_build_object('status', 'in_progress');
    END IF;
    IF v_request.status = 'reserved' THEN
      UPDATE public.lab_v2_study_generation_requests
         SET status = 'failed', lease_until = NULL, updated_at = v_now
       WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;
    END IF;
  END IF;

  SELECT r.* INTO v_request
    FROM public.lab_v2_study_generation_requests r
   WHERE r.cache_key = p_cache_key AND r.status = 'reserved'
   FOR UPDATE;
  IF FOUND THEN
    IF v_request.lease_until > v_now THEN
      RETURN pg_catalog.jsonb_build_object('status', 'in_progress');
    END IF;
    UPDATE public.lab_v2_study_generation_requests
       SET status = 'failed', lease_until = NULL, updated_at = v_now
     WHERE user_id = v_request.user_id
       AND idempotency_key = v_request.idempotency_key;
  END IF;

  v_bucket := pg_catalog.date_trunc('hour', v_now AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'lab-study-global:' || pg_catalog.to_char(
        v_bucket AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS'
      ), 2113
    )
  );
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'lab-study-user:' || p_user_id::text || ':' || pg_catalog.to_char(
        v_bucket AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS'
      ), 2114
    )
  );

  DELETE FROM public.lab_v2_study_generation_global_buckets
   WHERE window_start < v_bucket - interval '24 hours';
  DELETE FROM public.lab_v2_study_generation_user_buckets
   WHERE user_id = p_user_id
     AND window_start < v_bucket - interval '24 hours';

  SELECT b.request_count::integer INTO v_global_count
    FROM public.lab_v2_study_generation_global_buckets b
   WHERE b.window_start = v_bucket
   FOR UPDATE;
  v_global_count := COALESCE(v_global_count, 0);

  SELECT b.request_count::integer INTO v_user_count
    FROM public.lab_v2_study_generation_user_buckets b
   WHERE b.user_id = p_user_id AND b.window_start = v_bucket
   FOR UPDATE;
  v_user_count := COALESCE(v_user_count, 0);

  v_retry := GREATEST(1, ceil(extract(epoch FROM (v_bucket + interval '1 hour' - v_now)))::integer);
  IF v_global_count >= 10 THEN
    RETURN pg_catalog.jsonb_build_object(
      'status', 'rate_limited', 'scope', 'global', 'retry_after_seconds', v_retry
    );
  END IF;
  IF v_user_count >= 3 THEN
    RETURN pg_catalog.jsonb_build_object(
      'status', 'rate_limited', 'scope', 'user', 'retry_after_seconds', v_retry
    );
  END IF;

  INSERT INTO public.lab_v2_study_generation_global_buckets(window_start, request_count)
  VALUES (v_bucket, 1)
  ON CONFLICT (window_start) DO UPDATE
    SET request_count = public.lab_v2_study_generation_global_buckets.request_count + 1;

  INSERT INTO public.lab_v2_study_generation_user_buckets(user_id, window_start, request_count)
  VALUES (p_user_id, v_bucket, 1)
  ON CONFLICT (user_id, window_start) DO UPDATE
    SET request_count = public.lab_v2_study_generation_user_buckets.request_count + 1;

  v_reservation := pg_catalog.gen_random_uuid();
  INSERT INTO public.lab_v2_study_generation_requests(
    user_id, idempotency_key, cache_key, reservation_id, status, lease_until, created_at, updated_at
  )
  VALUES (
    p_user_id, p_idempotency_key, p_cache_key, v_reservation,
    'reserved', v_now + interval '2 minutes', v_now, v_now
  )
  ON CONFLICT (user_id, idempotency_key) DO UPDATE
    SET cache_key = EXCLUDED.cache_key,
        reservation_id = EXCLUDED.reservation_id,
        status = 'reserved',
        lease_until = EXCLUDED.lease_until,
        updated_at = EXCLUDED.updated_at
    WHERE public.lab_v2_study_generation_requests.status = 'failed'
  RETURNING reservation_id INTO v_reservation;

  IF v_reservation IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('status', 'in_progress');
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'status', 'reserved',
    'reservation_id', v_reservation,
    'lease_seconds', 120
  );
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_reserve_study_generation(
  uuid, text, text, smallint, smallint, text[], text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lab_v2_reserve_study_generation(
  uuid, text, text, smallint, smallint, text[], text
) TO service_role;

CREATE OR REPLACE FUNCTION public.lab_v2_publish_study_generation(
  p_user_id uuid,
  p_reservation_id uuid,
  p_cache_key text,
  p_study_key text,
  p_journey_day smallint,
  p_chapter_refs text[],
  p_layer smallint,
  p_content_version text,
  p_title text,
  p_content jsonb,
  p_provider_model text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_now timestamptz := statement_timestamp();
  v_request public.lab_v2_study_generation_requests%ROWTYPE;
  v_context jsonb;
  v_expected_key text;
  v_rows integer;
  v_plan_refs text[];
  v_expected_refs text[];
BEGIN
  IF p_user_id IS NULL OR p_reservation_id IS NULL
     OR p_journey_day NOT BETWEEN 1 AND 366
     OR p_layer NOT BETWEEN 1 AND 3
     OR p_chapter_refs IS NULL
     OR pg_catalog.cardinality(p_chapter_refs) NOT BETWEEN 1 AND 4
     OR p_study_key IS NULL OR p_study_key !~ '^ai-[a-f0-9]{64}$'
     OR p_content_version IS NULL
     OR p_content_version !~ '^[A-Za-z0-9._-]{1,40}$'
     OR p_provider_model IS DISTINCT FROM 'gpt-6-luna'
     OR p_title IS NULL OR length(btrim(p_title)) NOT BETWEEN 3 AND 180
     OR p_content IS NULL OR pg_catalog.jsonb_typeof(p_content) <> 'object'
     OR p_content->>'title' IS DISTINCT FROM p_title THEN
    RETURN pg_catalog.jsonb_build_object('status', 'invalid_content');
  END IF;

  v_expected_key := 'bible-annual:' || p_journey_day::text || ':'
    || pg_catalog.array_to_string(p_chapter_refs, ',')
    || ':L' || p_layer::text || ':' || p_content_version;
  IF p_cache_key IS DISTINCT FROM v_expected_key
     OR length(p_cache_key) > 240 THEN
    RETURN pg_catalog.jsonb_build_object('status', 'invalid_content');
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('lab-study-cache:' || p_cache_key, 2112)
  );
  v_context := public.lab_v2_prepare_study_generation(
    p_user_id, p_journey_day, p_layer
  );
  IF v_context->>'status' <> 'prepared' THEN
    RETURN pg_catalog.jsonb_build_object('status', 'not_eligible');
  END IF;
  v_plan_refs := ARRAY(
    SELECT refs.ref
      FROM pg_catalog.jsonb_array_elements_text(v_context->'chapter_refs')
           WITH ORDINALITY AS refs(ref, ordinal)
     ORDER BY refs.ordinal
  );
  v_expected_refs := ARRAY(
    SELECT planned.ref
      FROM pg_catalog.unnest(v_plan_refs) WITH ORDINALITY AS planned(ref, ordinal)
     WHERE planned.ref = ANY(p_chapter_refs)
     ORDER BY planned.ordinal
  );
  IF v_expected_refs IS DISTINCT FROM p_chapter_refs THEN
    RETURN pg_catalog.jsonb_build_object('status', 'not_eligible');
  END IF;

  SELECT r.* INTO v_request
    FROM public.lab_v2_study_generation_requests r
   WHERE r.user_id = p_user_id
     AND r.reservation_id = p_reservation_id
     AND r.cache_key = p_cache_key
     AND r.status = 'reserved'
   FOR UPDATE;
  IF NOT FOUND OR v_request.lease_until <= v_now THEN
    RETURN pg_catalog.jsonb_build_object('status', 'reservation_expired');
  END IF;

  IF NOT p_content ?& ARRAY[
    'title', 'summary', 'context', 'exegesis', 'theological_connection',
    'pentecostal_arminian_lens', 'application', 'reflection_questions',
    'prayer', 'references', 'study_groups'
  ] OR pg_catalog.jsonb_typeof(p_content->'references') <> 'array'
     OR pg_catalog.jsonb_typeof(p_content->'study_groups') <> 'array' THEN
    RETURN pg_catalog.jsonb_build_object('status', 'invalid_content');
  END IF;

  INSERT INTO public.lab_v2_study_catalog(study_key, title, xp)
  VALUES (p_study_key, p_title, 15)
  ON CONFLICT (study_key) DO NOTHING;
  IF EXISTS (
    SELECT 1 FROM public.lab_v2_study_catalog c
     WHERE c.study_key = p_study_key AND c.title <> p_title
  ) THEN
    RETURN pg_catalog.jsonb_build_object('status', 'invalid_content');
  END IF;

  INSERT INTO public.lab_v2_study_content(
    study_key, journey_key, journey_day, chapter_refs, layer,
    content_version, cache_key, source_kind, publication_status,
    title, content, provider_model, cached_at
  )
  VALUES (
    p_study_key, 'bible-annual', p_journey_day, p_chapter_refs, p_layer,
    p_content_version, p_cache_key, 'generated_cache', 'published',
    p_title, p_content, p_provider_model, v_now
  )
  ON CONFLICT (cache_key) DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 AND NOT EXISTS (
    SELECT 1 FROM public.lab_v2_study_content c
     WHERE c.cache_key = p_cache_key AND c.study_key = p_study_key
       AND c.publication_status = 'published'
  ) THEN
    RETURN pg_catalog.jsonb_build_object('status', 'cache_conflict');
  END IF;

  UPDATE public.lab_v2_study_generation_requests
     SET status = 'published', lease_until = NULL, updated_at = v_now
   WHERE user_id = p_user_id
     AND reservation_id = p_reservation_id
     AND cache_key = p_cache_key
     AND status = 'reserved';

  RETURN pg_catalog.jsonb_build_object(
    'status', 'published', 'study_key', p_study_key, 'cached', v_rows = 0
  );
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_publish_study_generation(
  uuid, uuid, text, text, smallint, text[], smallint, text, text, jsonb, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lab_v2_publish_study_generation(
  uuid, uuid, text, text, smallint, text[], smallint, text, text, jsonb, text
) TO service_role;

CREATE OR REPLACE FUNCTION public.lab_v2_fail_study_generation(
  p_user_id uuid,
  p_reservation_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_rows integer;
BEGIN
  UPDATE public.lab_v2_study_generation_requests
     SET status = 'failed', lease_until = NULL, updated_at = statement_timestamp()
   WHERE user_id = p_user_id
     AND reservation_id = p_reservation_id
     AND status = 'reserved';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows = 1;
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_fail_study_generation(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lab_v2_fail_study_generation(uuid, uuid)
  TO service_role;

COMMENT ON TABLE public.lab_v2_study_generation_requests IS
  'Server-only idempotency records and short generation leases. Account deletion cascades requests.';
COMMENT ON TABLE public.lab_v2_study_generation_global_buckets IS
  'Server-only UTC-hour global generation cap: ten cache-miss provider calls per hour.';
COMMENT ON TABLE public.lab_v2_study_generation_user_buckets IS
  'Server-only UTC-hour per-user generation cap: three cache-miss provider calls per hour.';
COMMENT ON FUNCTION public.lab_v2_prepare_study_generation(uuid, smallint, smallint) IS
  'Authenticated user id is verified by the Edge Function; returns only active plan chapters and ALM1911 verse text for an unlocked layer.';
COMMENT ON FUNCTION public.lab_v2_reserve_study_generation(uuid, text, text, smallint, smallint, text[], text) IS
  'Service-role-only atomic idempotency, global/per-user rate cap and cache-key lease; cache hits are free.';
COMMENT ON FUNCTION public.lab_v2_publish_study_generation(uuid, uuid, text, text, smallint, text[], smallint, text, text, jsonb, text) IS
  'Service-role-only idempotent publication of model output to the append-only study cache.';

COMMIT;