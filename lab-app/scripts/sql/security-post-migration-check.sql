-- LABGAME permission acceptance check — READ ONLY.
-- Run on Supabase LABGAME project aze... only AFTER applying the reviewed
-- 202610120001_lab_privileges_hardening.sql migration.
-- Success = zero rows; any row = release blocker.
-- Does not access account/user data or change any database objects.
WITH
 client_roles(role_name) AS (
  VALUES ('anon'::text), ('authenticated'::text)
 ),
 privileges(privilege_name) AS (
  VALUES ('TRUNCATE'::text), ('TRIGGER'::text), ('REFERENCES'::text), ('MAINTAIN'::text)
 ),
 tables(table_name) AS (
  VALUES
   ('public.reading_completions'::text),
   ('public.reading_groups'::text),
   ('public.reading_group_members'::text),
   ('public.reading_group_invites'::text),
   ('public.lab_game_plan_chapters'::text),
   ('public.lab_game_runs'::text),
   ('public.lab_game_chapter_checks'::text),
   ('public.lab_game_stats'::text),
   ('public.lab_game_video_resources'::text),
   ('public.lab_game_video_sessions'::text),
   ('public.lab_game_video_rewards'::text),
   ('public.lab_bible_editions'::text),
   ('public.lab_bible_chapters'::text),
   ('public.lab_bible_favorites'::text),
   ('public.lab_bible_verses'::text)
 ),
 issues AS (
  SELECT 'table' AS object_type,t.table_name AS target,r.role_name,p.privilege_name
  FROM tables t CROSS JOIN client_roles r CROSS JOIN privileges p
  WHERE has_table_privilege(r.role_name,t.table_name,p.privilege_name)
  UNION ALL
  SELECT 'function',f.fn_name,r.role_name,'EXECUTE'
  FROM (
    VALUES
      ('public.register_reading_group_owner()'::text),
      ('public.rls_auto_enable()'::text)
  ) AS f(fn_name)
  CROSS JOIN client_roles r
  WHERE has_function_privilege(r.role_name,f.fn_name,'EXECUTE')
 )
SELECT object_type,target,role_name,privilege_name
FROM issues
ORDER BY object_type,target,role_name,privilege_name;
