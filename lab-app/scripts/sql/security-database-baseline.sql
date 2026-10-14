-- LABGAME — leitura de linha de base antes/depois de migração (NÃO MODIFICA DADOS).
-- Projeto esperado: aze... — confirmar conexão no painel antes de executar.
WITH table_acl AS (
 SELECT c.relname AS table_name, r.role_name, p.priv
 FROM pg_class c
 JOIN pg_namespace n ON n.oid=c.relnamespace
 CROSS JOIN (VALUES ('anon'::text),('authenticated'::text)) r(role_name)
 CROSS JOIN (VALUES ('TRUNCATE'::text),('TRIGGER'::text),('REFERENCES'::text)) p(priv)
 WHERE n.nspname='public' AND c.relkind IN ('r','p')
  AND has_table_privilege(r.role_name,c.oid,p.priv)
), trigger_acl AS (
 SELECT p.proname,r.role_name
 FROM pg_proc p
 JOIN pg_namespace n ON n.oid=p.pronamespace
 CROSS JOIN (VALUES ('anon'::text),('authenticated'::text)) r(role_name)
 WHERE n.nspname='public'
  AND p.proname IN ('register_reading_group_owner','rls_auto_enable')
  AND has_function_privilege(r.role_name,p.oid,'EXECUTE')
), plan_summary AS (
 SELECT COUNT(*) AS count,
  COUNT(DISTINCT chapter_id) AS unique_chapters,
  COUNT(DISTINCT day_number) AS days
 FROM public.lab_game_plan_chapters
), max_daily AS (
 SELECT COALESCE(MAX(day_count),0) AS maximum
 FROM (
  SELECT COUNT(*) AS day_count FROM public.lab_game_plan_chapters
  GROUP BY version,day_number
 ) daily
), rls AS (
 SELECT COUNT(*) AS total_tables,
  COUNT(*) FILTER (WHERE c.relrowsecurity) AS rls_enabled
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p')
)
SELECT
  (SELECT count FROM plan_summary) AS plan_chapters,
  (SELECT unique_chapters FROM plan_summary) AS unique_plan_chapters,
  (SELECT days FROM plan_summary) AS plan_days,
  (SELECT maximum FROM max_daily) AS max_daily_chapters,
  (SELECT COUNT(*) FROM public.lab_bible_chapters) AS bible_chapters,
  (SELECT COUNT(*) FROM public.lab_bible_verses) AS bible_verses,
  (SELECT COUNT(*) FROM public.lab_game_video_resources) AS video_resources,
  (SELECT COUNT(*) FROM public.reading_groups) AS reading_groups,
  (SELECT COUNT(*) FROM public.lab_game_runs) AS game_runs,
  (SELECT total_tables FROM rls) AS public_tables,
  (SELECT rls_enabled FROM rls) AS tables_with_rls,
  (SELECT COUNT(*) FROM table_acl) AS excessive_table_grants,
  (SELECT COUNT(*) FROM trigger_acl) AS exposed_internal_trigger_grants;
-- Esperado antes do patch em 13/10: 1189,1189,365,4,1189,31101,71,0,0,15,15,51,4.
-- Depois: mesmos contadores de conteúdo/RLS; permissões excessivas=0 e execs trigger=0.
