-- LABGAME 3.0 READ-ONLY annual bonus acceptance audit.
-- Run ONLY in isolated/staging LABGAME after applying migrations in chronological order.
-- Expected: ZERO ROWS. Any nonzero count is a release blocker.
-- No user names, e-mails or user IDs are returned, and this script changes no data.
WITH
  user_readings AS (
    SELECT r.user_id,COUNT(c.chapter_id)::bigint*10 AS xp
    FROM public.lab_game_runs r
    JOIN public.lab_game_chapter_checks c ON c.run_id=r.id
    GROUP BY r.user_id
  ),
  video_points AS (
    SELECT user_id,COUNT(*)::bigint*5 AS xp
    FROM public.lab_game_video_rewards GROUP BY user_id
  ),
  cycle_points AS (
    SELECT user_id,COALESCE(SUM(bonus_xp),0)::bigint AS xp
    FROM public.lab_game_cycle_awards GROUP BY user_id
  ),
  problems AS (
    SELECT 'not_completed_run' AS check_name,COUNT(*)::bigint AS problem_count
    FROM public.lab_game_cycle_awards a
    JOIN public.lab_game_runs r ON r.id=a.run_id
    WHERE r.status<>'completed' OR r.completed_days<>365 OR r.finished_on IS NULL
    UNION ALL
    SELECT 'wrong_award_user',COUNT(*)::bigint
    FROM public.lab_game_cycle_awards a
    JOIN public.lab_game_runs r ON r.id=a.run_id
    WHERE a.user_id<>r.user_id
    UNION ALL
    SELECT 'wrong_award_formula',COUNT(*)::bigint
    FROM public.lab_game_cycle_awards a
    WHERE a.bonus_xp::bigint <> 10000::bigint + (a.cycle_number::bigint-1)*2500
    UNION ALL
    SELECT 'completed_without_award',COUNT(*)::bigint
    FROM public.lab_game_runs r
    WHERE r.status='completed' AND NOT EXISTS (
      SELECT 1 FROM public.lab_game_cycle_awards a WHERE a.run_id=r.id
    )
    UNION ALL
    SELECT 'lifetime_xp_unbalanced',COUNT(*)::bigint
    FROM public.lab_game_stats s
    LEFT JOIN user_readings r ON r.user_id=s.user_id
    LEFT JOIN video_points v ON v.user_id=s.user_id
    LEFT JOIN cycle_points c ON c.user_id=s.user_id
    WHERE s.total_xp::bigint<>COALESCE(r.xp,0)+COALESCE(v.xp,0)+COALESCE(c.xp,0)
    UNION ALL
    SELECT 'anon_has_write_privileges',CASE WHEN
      has_table_privilege('anon','public.lab_game_cycle_awards','INSERT')
      OR has_table_privilege('anon','public.lab_game_cycle_awards','UPDATE')
      OR has_table_privilege('anon','public.lab_game_cycle_awards','DELETE')
      OR has_table_privilege('anon','public.lab_game_cycle_awards','TRUNCATE')
      THEN 1 ELSE 0 END::bigint
    UNION ALL
    SELECT 'authenticated_has_write_privileges',CASE WHEN
      has_table_privilege('authenticated','public.lab_game_cycle_awards','INSERT')
      OR has_table_privilege('authenticated','public.lab_game_cycle_awards','UPDATE')
      OR has_table_privilege('authenticated','public.lab_game_cycle_awards','DELETE')
      OR has_table_privilege('authenticated','public.lab_game_cycle_awards','TRUNCATE')
      THEN 1 ELSE 0 END::bigint
    UNION ALL
    SELECT 'rls_not_enabled',CASE WHEN EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname='lab_game_cycle_awards'
        AND NOT c.relrowsecurity
    ) THEN 1 ELSE 0 END::bigint
  )
SELECT check_name,problem_count FROM problems
WHERE problem_count<>0 ORDER BY check_name;
