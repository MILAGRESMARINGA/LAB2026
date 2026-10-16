-- LABGAME 2026-10-12: reduce API-role privileges without touching rows or game logic.
-- Security review: table TRUNCATE bypasses RLS. TRIGGER/REFERENCES/MAINTAIN are also
-- administrative privileges unsuitable for app users, even on public data.
-- Database target: LABGAME only (azejfxvaamgkmfmwdzjn); never run on CRM.
-- Apply through Supabase migration after human approval, backup verification
-- and read-only checks. This migration neither drops objects nor changes data.

REVOKE TRUNCATE, TRIGGER, REFERENCES, MAINTAIN ON TABLE
  public.reading_completions,
  public.reading_groups,
  public.reading_group_members,
  public.reading_group_invites,
  public.lab_game_plan_chapters,
  public.lab_game_runs,
  public.lab_game_chapter_checks,
  public.lab_game_stats,
  public.lab_game_video_resources,
  public.lab_game_video_sessions,
  public.lab_game_video_rewards,
  public.lab_bible_editions,
  public.lab_bible_chapters,
  public.lab_bible_favorites,
  public.lab_bible_verses
FROM PUBLIC, anon, authenticated;

-- Internal functions are invoked by the PostgreSQL trigger subsystem.
-- They do not need direct execution privileges on PostgREST roles.
-- Keep the owner role's EXECUTE so existing triggers continue to work.
-- Some legacy deployments created rls_auto_enable() manually; a fresh
-- installation does not contain it. Revoke only on functions that exist.
DO $privileges$
BEGIN
 IF to_regprocedure('public.register_reading_group_owner()') IS NOT NULL THEN
  REVOKE EXECUTE ON FUNCTION public.register_reading_group_owner()
  FROM PUBLIC, anon, authenticated;
 END IF;
 IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
  REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()
  FROM PUBLIC, anon, authenticated;
 END IF;
END;
$privileges$;

-- Prevent future tables created by the postgres migration owner from inheriting
-- these privileges through existing default-grant rules. RLS and narrow DML
-- policies/grants must still be reviewed for every newly created table.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE, TRIGGER, REFERENCES, MAINTAIN ON TABLES FROM anon, authenticated;

-- Fail atomically if these privileges remain granted (including inherited ACL).
DO $verify$
DECLARE
  tablename text;
  userrole text;
  permission text;
BEGIN
  FOREACH tablename IN ARRAY ARRAY[
    'reading_completions','reading_groups','reading_group_members',
    'reading_group_invites','lab_game_plan_chapters','lab_game_runs',
    'lab_game_chapter_checks','lab_game_stats','lab_game_video_resources',
    'lab_game_video_sessions','lab_game_video_rewards',
    'lab_bible_editions','lab_bible_chapters','lab_bible_favorites',
    'lab_bible_verses'
  ] LOOP
    FOREACH userrole IN ARRAY ARRAY['anon','authenticated'] LOOP
      FOREACH permission IN ARRAY ARRAY['TRUNCATE','TRIGGER','REFERENCES','MAINTAIN'] LOOP
        IF has_table_privilege(userrole, 'public.' || tablename, permission) THEN
          RAISE EXCEPTION 'LABGAME privilege still exposed: % % %',
            userrole, permission, tablename;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;

  IF to_regprocedure('public.register_reading_group_owner()') IS NOT NULL THEN
    IF has_function_privilege('anon','public.register_reading_group_owner()','EXECUTE')
       OR has_function_privilege('authenticated','public.register_reading_group_owner()','EXECUTE')
    THEN RAISE EXCEPTION 'LABGAME group-owner trigger exposed to API roles'; END IF;
  END IF;
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    IF has_function_privilege('anon','public.rls_auto_enable()','EXECUTE')
       OR has_function_privilege('authenticated','public.rls_auto_enable()','EXECUTE')
    THEN RAISE EXCEPTION 'LABGAME RLS trigger exposed to API roles'; END IF;
  END IF;
END;
$verify$;
