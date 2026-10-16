-- Fair V2 group league score: average server-awarded XP per opted-in member,
-- multiplied by a disclosed collective consistency factor over reading, study,
-- and video activity days in the last seven Sao Paulo calendar dates.
-- Group size never adds points by itself. GC O Caminho is not seeded or duplicated.
BEGIN;

CREATE OR REPLACE FUNCTION public.lab_v2_gc_score_rows()
RETURNS TABLE(
  group_id uuid,
  group_name text,
  competition_opt_in boolean,
  members integer,
  consenting_members integer,
  average_xp_per_member numeric,
  reading_member_days integer,
  study_member_days integer,
  video_member_days integer,
  available_member_days integer,
  reading_coverage_pct numeric,
  study_coverage_pct numeric,
  video_coverage_pct numeric,
  consistency_pct numeric,
  consistency_multiplier numeric,
  score numeric,
  window_start date,
  window_end date
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $fn$
WITH bounds AS (
  SELECT statement_timestamp() AS now_at,
         (statement_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date - 6 AS window_start,
         (statement_timestamp() AT TIME ZONE 'America/Sao_Paulo')::date AS window_end
),
roster AS (
  SELECT g.id AS group_id,
         g.name AS group_name,
         g.competition_opt_in,
         count(m.user_id)::integer AS members,
         count(m.user_id) FILTER (
           WHERE s.leaderboard_opt_in = true AND m.joined_at <= b.now_at
         )::integer AS consenting_members
    FROM public.reading_groups g
    JOIN public.reading_group_members m ON m.group_id = g.id
    LEFT JOIN public.lab_game_stats s ON s.user_id = m.user_id
    CROSS JOIN bounds b
   GROUP BY g.id, g.name, g.competition_opt_in
),
consented AS (
  SELECT m.group_id, m.user_id, m.joined_at
    FROM public.reading_group_members m
    JOIN public.lab_game_stats s ON s.user_id = m.user_id
    CROSS JOIN bounds b
   WHERE s.leaderboard_opt_in = true AND m.joined_at <= b.now_at
),
raw_events AS (
  SELECT cm.group_id, cm.user_id, 'reading'::text AS event_kind,
         c.confirmed_at AS occurred_at, 10::numeric AS xp
    FROM consented cm
    JOIN public.lab_v2_runs r ON r.user_id = cm.user_id
    JOIN public.lab_v2_chapter_checks c ON c.run_id = r.id
  UNION ALL
  SELECT cm.group_id, cm.user_id, 'study'::text,
         sr.confirmed_at, sr.awarded_xp::numeric
    FROM consented cm
    JOIN public.lab_v2_runs r ON r.user_id = cm.user_id
    JOIN public.lab_v2_study_rewards sr ON sr.run_id = r.id
  UNION ALL
  SELECT cm.group_id, cm.user_id, 'video'::text,
         vr.confirmed_at, vr.awarded_xp::numeric
    FROM consented cm
    JOIN public.lab_v2_runs r ON r.user_id = cm.user_id
    JOIN public.lab_v2_video_rewards vr ON vr.run_id = r.id
),
eligible_events AS (
  SELECT e.group_id, e.user_id, e.event_kind, e.occurred_at, e.xp
    FROM raw_events e
    JOIN consented cm ON cm.group_id = e.group_id AND cm.user_id = e.user_id
    CROSS JOIN bounds b
   WHERE e.occurred_at >= ((b.window_start::timestamp) AT TIME ZONE 'America/Sao_Paulo')
     AND e.occurred_at <= b.now_at
     AND e.occurred_at >= cm.joined_at
),
member_days AS (
  SELECT DISTINCT e.group_id,
         e.user_id,
         e.event_kind,
         (e.occurred_at AT TIME ZONE 'America/Sao_Paulo')::date AS activity_day
    FROM eligible_events e
),
coverage AS (
  SELECT d.group_id,
         count(*) FILTER (WHERE d.event_kind = 'reading')::integer AS reading_member_days,
         count(*) FILTER (WHERE d.event_kind = 'study')::integer AS study_member_days,
         count(*) FILTER (WHERE d.event_kind = 'video')::integer AS video_member_days
    FROM member_days d
   GROUP BY d.group_id
),
member_slots AS (
  SELECT cm.group_id,
         cm.user_id,
         LEAST(
           7,
           GREATEST(
             0,
             b.window_end - GREATEST(
               b.window_start,
               (cm.joined_at AT TIME ZONE 'America/Sao_Paulo')::date
             ) + 1
           )
         )::integer AS available_days
    FROM consented cm
    CROSS JOIN bounds b
),
member_xp AS (
  SELECT ms.group_id,
         ms.user_id,
         ms.available_days,
         COALESCE(sum(e.xp), 0)::numeric AS earned_xp
    FROM member_slots ms
    LEFT JOIN eligible_events e
      ON e.group_id = ms.group_id AND e.user_id = ms.user_id
   GROUP BY ms.group_id, ms.user_id, ms.available_days
),
group_totals AS (
  SELECT r.group_id,
         r.group_name,
         r.competition_opt_in,
         r.members,
         r.consenting_members,
         CASE WHEN r.consenting_members > 0
           THEN COALESCE(sum(mx.earned_xp), 0) / r.consenting_members
           ELSE 0::numeric END AS avg_xp,
         COALESCE(sum(mx.available_days), 0)::integer AS available_days,
         COALESCE(max(c.reading_member_days), 0)::integer AS reading_days,
         COALESCE(max(c.study_member_days), 0)::integer AS study_days,
         COALESCE(max(c.video_member_days), 0)::integer AS video_days,
         b.window_start,
         b.window_end
    FROM roster r
    LEFT JOIN member_xp mx ON mx.group_id = r.group_id
    LEFT JOIN coverage c ON c.group_id = r.group_id
    CROSS JOIN bounds b
   GROUP BY r.group_id, r.group_name, r.competition_opt_in,
            r.members, r.consenting_members, b.window_start, b.window_end
),
rates AS (
  SELECT gt.*,
         CASE WHEN gt.available_days > 0
           THEN LEAST(1::numeric, gt.reading_days::numeric / gt.available_days)
           ELSE 0::numeric END AS reading_rate,
         CASE WHEN gt.available_days > 0
           THEN LEAST(1::numeric, gt.study_days::numeric / gt.available_days)
           ELSE 0::numeric END AS study_rate,
         CASE WHEN gt.available_days > 0
           THEN LEAST(1::numeric, gt.video_days::numeric / gt.available_days)
           ELSE 0::numeric END AS video_rate,
         CASE WHEN gt.available_days > 0
           THEN LEAST(1::numeric,
             (gt.reading_days + gt.study_days + gt.video_days)::numeric
               / (gt.available_days * 3))
           ELSE 0::numeric END AS consistency
    FROM group_totals gt
),
scored AS (
  SELECT r.*,
         1::numeric + (0.20::numeric * r.consistency) AS multiplier,
         r.avg_xp * (1::numeric + (0.20::numeric * r.consistency)) AS final_score
    FROM rates r
)
SELECT s.group_id,
       s.group_name,
       s.competition_opt_in,
       s.members,
       s.consenting_members,
       round(s.avg_xp, 2),
       s.reading_days,
       s.study_days,
       s.video_days,
       s.available_days,
       round(s.reading_rate * 100, 1),
       round(s.study_rate * 100, 1),
       round(s.video_rate * 100, 1),
       round(s.consistency * 100, 1),
       round(s.multiplier, 4),
       round(s.final_score, 2),
       s.window_start,
       s.window_end
  FROM scored s;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_gc_score_rows()
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.lab_v2_gc_league_fair()
RETURNS TABLE(
  rank_position integer,
  group_id uuid,
  group_name text,
  members integer,
  consenting_members integer,
  average_xp_per_member numeric,
  reading_member_days integer,
  study_member_days integer,
  video_member_days integer,
  available_member_days integer,
  reading_coverage_pct numeric,
  study_coverage_pct numeric,
  video_coverage_pct numeric,
  consistency_pct numeric,
  consistency_multiplier numeric,
  score numeric,
  window_start date,
  window_end date
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
      FROM public.reading_group_members m
      JOIN public.reading_groups g ON g.id = m.group_id
     WHERE m.user_id = auth.uid() AND g.competition_opt_in = true
  ) THEN RAISE EXCEPTION 'Participe de um GC inscrito para consultar a Liga'; END IF;

  RETURN QUERY
  SELECT row_number() OVER (
           ORDER BY s.score DESC, s.average_xp_per_member DESC,
                    s.consistency_pct DESC, s.group_name ASC
         )::integer,
         s.group_id, s.group_name, s.members, s.consenting_members,
         s.average_xp_per_member, s.reading_member_days, s.study_member_days,
         s.video_member_days, s.available_member_days,
         s.reading_coverage_pct, s.study_coverage_pct, s.video_coverage_pct,
         s.consistency_pct, s.consistency_multiplier, s.score,
         s.window_start, s.window_end
    FROM public.lab_v2_gc_score_rows() s
   WHERE s.competition_opt_in = true
     AND s.members >= 3
     AND s.consenting_members >= 3
   ORDER BY s.score DESC, s.average_xp_per_member DESC,
            s.consistency_pct DESC, s.group_name ASC
   LIMIT 100;
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_gc_league_fair() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lab_v2_gc_league_fair() TO authenticated;

CREATE OR REPLACE FUNCTION public.lab_v2_gc_group_scorecard(p_group_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_score record;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.reading_group_members m
     WHERE m.group_id = p_group_id AND m.user_id = auth.uid()
  ) THEN RAISE EXCEPTION 'Acesso ao GC não autorizado'; END IF;
  SELECT * INTO v_score
    FROM public.lab_v2_gc_score_rows()
   WHERE group_id = p_group_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('available', false, 'reason', 'no_consented_activity');
  END IF;
  RETURN to_jsonb(v_score) || jsonb_build_object(
    'available', true,
    'eligible_for_league',
      v_score.competition_opt_in AND v_score.members >= 3 AND v_score.consenting_members >= 3,
    'formula',
      'score = average_xp_per_consented_member * (1 + 0.20 * mean(reading_coverage, study_coverage, video_coverage))'
  );
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_gc_group_scorecard(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lab_v2_gc_group_scorecard(uuid) TO authenticated;

-- Compatibility RPC keeps its established columns but now ranks from the fair
-- score; compliance_pct reflects the same three-category collective consistency.
CREATE OR REPLACE FUNCTION public.lab_v2_gc_league()
RETURNS TABLE(
  rank_position integer,
  group_id uuid,
  group_name text,
  members integer,
  consenting_members integer,
  days_completed bigint,
  compliance_pct numeric,
  window_start date,
  window_end date
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
      FROM public.reading_group_members m
      JOIN public.reading_groups g ON g.id = m.group_id
     WHERE m.user_id = auth.uid() AND g.competition_opt_in = true
  ) THEN RAISE EXCEPTION 'Participe de um GC inscrito para consultar a Liga'; END IF;

  RETURN QUERY
  SELECT row_number() OVER (
           ORDER BY s.score DESC, s.average_xp_per_member DESC,
                    s.consistency_pct DESC, s.group_name ASC
         )::integer,
         s.group_id, s.group_name, s.members, s.consenting_members,
         s.reading_member_days::bigint, s.consistency_pct,
         s.window_start, s.window_end
    FROM public.lab_v2_gc_score_rows() s
   WHERE s.competition_opt_in = true
     AND s.members >= 3
     AND s.consenting_members >= 3
   ORDER BY s.score DESC, s.average_xp_per_member DESC,
            s.consistency_pct DESC, s.group_name ASC
   LIMIT 100;
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_gc_league() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lab_v2_gc_league() TO authenticated;

COMMENT ON FUNCTION public.lab_v2_gc_league_fair() IS
  'Official V2 league ranking: average awarded XP per opted-in member times a 1.00-1.20 multiplier from seven-day reading, study, and video member-day coverage.';
COMMENT ON FUNCTION public.lab_v2_gc_group_scorecard(uuid) IS
  'Member-only aggregate scorecard; excludes non-consenting users and never returns member-level activity.';
COMMIT;
