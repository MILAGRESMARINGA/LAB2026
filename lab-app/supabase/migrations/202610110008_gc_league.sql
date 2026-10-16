-- Private, voluntary GC-vs-GC league. Group owners explicitly opt in.
-- Scores aggregate unique completed reading days, never expose individuals.
ALTER TABLE public.reading_groups
 ADD COLUMN IF NOT EXISTS competition_opt_in boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS lab_game_checks_recent_idx
 ON public.lab_game_chapter_checks(read_on,run_id,day_number);

CREATE OR REPLACE FUNCTION public.lab_game_set_gc_competition(
 p_group_id uuid,p_enabled boolean
)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $fn$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária';END IF;
 UPDATE public.reading_groups
 SET competition_opt_in=COALESCE(p_enabled,false)
 WHERE id=p_group_id AND owner_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Somente o líder pode alterar a participação do GC';END IF;
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_game_set_gc_competition(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_game_set_gc_competition(uuid,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.lab_game_gc_league()
RETURNS TABLE(
 rank_position integer,group_id uuid,group_name text,
 members integer,consenting_members integer,days_completed bigint,
 compliance_pct numeric,window_start date,window_end date
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(
   SELECT 1 FROM public.reading_group_members member
   JOIN public.reading_groups grp ON grp.id=member.group_id
   WHERE member.user_id=auth.uid() AND grp.competition_opt_in=true
 ) THEN
   RAISE EXCEPTION 'Participe de um GC inscrito na liga para consultar resultados';
 END IF;

 RETURN QUERY
 WITH eligible_groups AS (
   SELECT g.id,g.name,COUNT(m.user_id)::integer AS size_total,
     COUNT(s.user_id) FILTER(WHERE s.leaderboard_opt_in=true)::integer AS consenting
   FROM public.reading_groups g
   JOIN public.reading_group_members m ON m.group_id=g.id
   LEFT JOIN public.lab_game_stats s ON s.user_id=m.user_id
   WHERE g.competition_opt_in=true
   GROUP BY g.id,g.name
   HAVING COUNT(m.user_id)>=3
      AND COUNT(s.user_id) FILTER(WHERE s.leaderboard_opt_in=true)>=3
 ),
 complete_day AS (
   SELECT r.user_id,c.read_on,c.run_id,c.day_number
   FROM public.lab_game_chapter_checks c
   JOIN public.lab_game_runs r ON r.id=c.run_id
   WHERE c.read_on BETWEEN v_today-6 AND v_today
   AND r.started_on+(c.day_number::integer-1)=c.read_on
   GROUP BY r.user_id,c.read_on,c.run_id,c.day_number
   HAVING COUNT(DISTINCT c.chapter_id)=(
     SELECT COUNT(*) FROM public.lab_game_plan_chapters plan
     WHERE plan.version=1 AND plan.day_number=c.day_number
   )
 ),
 score AS (
   SELECT grp.id,grp.name,grp.size_total,grp.consenting,
      COUNT(DISTINCT (complete_day.user_id,complete_day.read_on)) FILTER(WHERE complete_day.user_id IS NOT NULL)::bigint AS complete_count,
      ROUND(100.0*COUNT(DISTINCT (complete_day.user_id,complete_day.read_on)) FILTER(WHERE complete_day.user_id IS NOT NULL)
         /(7*grp.size_total),1) AS rate
   FROM eligible_groups grp
   JOIN public.reading_group_members m ON m.group_id=grp.id
   LEFT JOIN public.lab_game_stats s ON s.user_id=m.user_id
   LEFT JOIN complete_day ON complete_day.user_id=m.user_id
      AND s.leaderboard_opt_in=true
   GROUP BY grp.id,grp.name,grp.size_total,grp.consenting
 )
 SELECT ROW_NUMBER() OVER(ORDER BY score.rate DESC,score.complete_count DESC,score.name ASC)::integer,
   score.id,score.name,score.size_total,score.consenting,score.complete_count,
   score.rate,v_today-6,v_today
 FROM score
 ORDER BY score.rate DESC,score.complete_count DESC,score.name ASC
 LIMIT 100;
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_game_gc_league() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_game_gc_league() TO authenticated;
