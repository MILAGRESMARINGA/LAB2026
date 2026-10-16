-- V2 GC contribution is based on the ACTUAL stage completion timestamp,
-- not the V1 civil read_on date, and never mixes V1 cumulative XP.
-- Existing memberships get the migration instant as their join timestamp;
-- V2 stages do not exist in production yet, so no historical V2 result is lost.
ALTER TABLE public.reading_group_members
 ADD COLUMN IF NOT EXISTS joined_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.lab_v2_group_ranking(p_group_id uuid)
RETURNS TABLE(participant text,completed_days integer,best_days integer,total_xp integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (
  SELECT 1 FROM public.reading_group_members m
  WHERE m.group_id=p_group_id AND m.user_id=auth.uid()
 ) THEN RAISE EXCEPTION 'Acesso ao GC não autorizado'; END IF;
 RETURN QUERY
 SELECT s.display_name,
   COALESCE((SELECT count(*)::integer FROM public.lab_v2_stages d
     JOIN public.lab_v2_runs r ON r.id=d.run_id
     WHERE r.user_id=m.user_id AND r.status='active' AND d.completed_at IS NOT NULL),0),
   GREATEST(s.best_days::integer,COALESCE((
    SELECT max(days) FROM (
      SELECT count(*)::integer days FROM public.lab_v2_stages d
      JOIN public.lab_v2_runs r ON r.id=d.run_id
      WHERE r.user_id=m.user_id AND d.completed_at IS NOT NULL
      GROUP BY r.id
    ) trials
   ),0)),
   GREATEST(0,COALESCE((
    SELECT COUNT(c.chapter_id)::integer*10
    FROM public.lab_v2_runs r JOIN public.lab_v2_chapter_checks c ON c.run_id=r.id
    WHERE r.user_id=m.user_id AND r.status='active'
   ),0)-COALESCE((
    SELECT SUM(d.late_penalty)::integer
    FROM public.lab_v2_runs r JOIN public.lab_v2_stages d ON d.run_id=r.id
    WHERE r.user_id=m.user_id AND r.status='active'
   ),0))
 FROM public.reading_group_members m
 JOIN public.lab_game_stats s ON s.user_id=m.user_id
 WHERE m.group_id=p_group_id AND s.leaderboard_opt_in=true
 ORDER BY 3 DESC,2 DESC,4 DESC,1 ASC
 LIMIT 100;
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_group_ranking(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_v2_group_ranking(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.lab_v2_group_summary(p_group_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE
 v_members integer;
 v_consent integer;
 v_days integer;
 v_name text;
 v_owner uuid;
 v_now timestamptz:=statement_timestamp();
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(
  SELECT 1 FROM public.reading_group_members m
  WHERE m.group_id=p_group_id AND m.user_id=auth.uid()
 ) THEN RAISE EXCEPTION 'Acesso ao GC não autorizado'; END IF;
 SELECT g.name,g.owner_id,COUNT(m.user_id)::integer,
  COUNT(m.user_id) FILTER(WHERE s.leaderboard_opt_in=true)::integer
 INTO v_name,v_owner,v_members,v_consent
 FROM public.reading_groups g
 JOIN public.reading_group_members m ON m.group_id=g.id
 LEFT JOIN public.lab_game_stats s ON s.user_id=m.user_id
 WHERE g.id=p_group_id GROUP BY g.id,g.name,g.owner_id;
 IF v_members IS NULL THEN RAISE EXCEPTION 'GC não encontrado'; END IF;
 SELECT count(*)::integer INTO v_days
 FROM public.reading_group_members m
 JOIN public.lab_game_stats s ON s.user_id=m.user_id AND s.leaderboard_opt_in=true
 JOIN public.lab_v2_runs r ON r.user_id=m.user_id
 JOIN public.lab_v2_stages d ON d.run_id=r.id
 WHERE m.group_id=p_group_id
 AND d.completed_at IS NOT NULL AND d.completed_at>=m.joined_at
 AND d.completed_at>v_now-interval '7 days' AND d.completed_at<=v_now;
 RETURN jsonb_build_object(
  'group_id',p_group_id,'name',v_name,'owner_id',v_owner,
  'members',v_members,'consenting_members',v_consent,
  'completed_member_days_7',LEAST(v_days,7*v_consent),
  'compliance_pct',CASE WHEN v_consent>0
   THEN ROUND(LEAST(v_days,7*v_consent)*100.0/(7*v_consent),1) ELSE 0 END,
  'window_start',(v_now AT TIME ZONE 'America/Sao_Paulo')::date-6,
  'window_end',(v_now AT TIME ZONE 'America/Sao_Paulo')::date
 );
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_group_summary(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_v2_group_summary(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.lab_v2_gc_league()
RETURNS TABLE(
 rank_position integer,group_id uuid,group_name text,
 members integer,consenting_members integer,days_completed bigint,
 compliance_pct numeric,window_start date,window_end date
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE v_now timestamptz:=statement_timestamp();
DECLARE v_today date:=(v_now AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(
  SELECT 1 FROM public.reading_group_members m
  JOIN public.reading_groups g ON g.id=m.group_id
  WHERE m.user_id=auth.uid() AND g.competition_opt_in=true
 ) THEN RAISE EXCEPTION 'Participe de um GC inscrito para consultar a Liga'; END IF;
 RETURN QUERY
 WITH group_candidates AS (
  SELECT g.id,g.name,COUNT(m.user_id)::integer total,
   COUNT(m.user_id) FILTER(WHERE s.leaderboard_opt_in=true)::integer consenting
  FROM public.reading_groups g JOIN public.reading_group_members m ON m.group_id=g.id
  LEFT JOIN public.lab_game_stats s ON s.user_id=m.user_id
  WHERE g.competition_opt_in=true
  GROUP BY g.id,g.name
  HAVING COUNT(m.user_id)>=3
    AND COUNT(m.user_id) FILTER(WHERE s.leaderboard_opt_in=true)>=3
 ), score AS (
  SELECT gc.id,gc.name,gc.total,gc.consenting,
   LEAST(COUNT(d.day_number) FILTER(WHERE d.completed_at IS NOT NULL),7*gc.consenting)::bigint AS stage_count
  FROM group_candidates gc
  JOIN public.reading_group_members m ON m.group_id=gc.id
  LEFT JOIN public.lab_game_stats s ON s.user_id=m.user_id
  LEFT JOIN public.lab_v2_runs r ON r.user_id=m.user_id AND s.leaderboard_opt_in=true
  LEFT JOIN public.lab_v2_stages d ON d.run_id=r.id
   AND d.completed_at>v_now-interval '7 days' AND d.completed_at<=v_now
   AND d.completed_at>=m.joined_at
  GROUP BY gc.id,gc.name,gc.total,gc.consenting
 )
 SELECT ROW_NUMBER() OVER(ORDER BY
   sc.stage_count::numeric/sc.consenting DESC,sc.stage_count DESC,sc.name ASC)::integer,
   sc.id,sc.name,sc.total,sc.consenting,sc.stage_count,
   ROUND(100.0*sc.stage_count/(7*sc.consenting),1),v_today-6,v_today
 FROM score sc
 ORDER BY sc.stage_count::numeric/sc.consenting DESC,sc.stage_count DESC,sc.name ASC
 LIMIT 100;
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_gc_league() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_v2_gc_league() TO authenticated;
