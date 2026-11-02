-- Run after the journey editorial migration against an isolated PostgreSQL DB.
BEGIN;
INSERT INTO public.lab_journey_releases(id,title) VALUES ('qa-draft','Rascunho QA');
INSERT INTO public.lab_journey_releases(id,title,publication_status,reviewed_by,reviewed_at,published_at)
 VALUES ('qa-published','Publicação QA','published','Equipe editorial',now(),now());
INSERT INTO public.lab_journey_sources(release_id,id,title,publisher,url,retrieved_at,scope)
 SELECT id,'source','Texto bíblico','Bíblia','https://example.org/reference',current_date,'Gênesis 1' FROM public.lab_journey_releases WHERE id IN ('qa-draft','qa-published');
INSERT INTO public.lab_journey_episodes(release_id,id,book,from_chapter,to_chapter,title,period,person,summary,reference,kind)
 SELECT id,'origins','Gênesis',1,2,'Origens','Origens','Humanidade','Narrativa das origens','Gênesis 1–2','narrative' FROM public.lab_journey_releases WHERE id IN ('qa-draft','qa-published');
INSERT INTO public.lab_journey_chapter_anchors(release_id,book,chapter,episode_id,lon,lat,place_name,biome,confidence,note,reference,kind)
 SELECT id,'Gênesis',1,'origins',45,33,'Éden · região incerta','river','uncertain','Marco regional editorial','Gênesis 1','narrative' FROM public.lab_journey_releases WHERE id IN ('qa-draft','qa-published');
INSERT INTO public.lab_journey_evidence(release_id,id,source_id,book,from_chapter,to_chapter,title,kind,"references",claim,confidence,scope,caution)
 SELECT id,'eden','source','Gênesis',1,2,'Localização incerta','editorial-inference',ARRAY['Gênesis 2:8-14'],'Marco regional, não sítio comprovado','disputed','Localização','Sem coordenada consensual' FROM public.lab_journey_releases WHERE id IN ('qa-draft','qa-published');
DO $qa$
BEGIN
 BEGIN
  INSERT INTO public.lab_journey_releases(id,title,publication_status) VALUES ('qa-invalid','Sem revisão','published');
  RAISE EXCEPTION 'unreviewed release accepted';
 EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN
  INSERT INTO public.lab_journey_chapter_anchors SELECT release_id,book,3,episode_id,lon,lat,place_name,biome,confidence,note,reference,kind FROM public.lab_journey_chapter_anchors WHERE release_id='qa-published';
  RAISE EXCEPTION 'out-of-episode anchor accepted';
 EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN
  UPDATE public.lab_journey_episodes SET to_chapter=51 WHERE release_id='qa-draft';
  RAISE EXCEPTION 'noncanonical chapter accepted';
 EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN
  UPDATE public.lab_journey_episodes SET from_chapter=2 WHERE release_id='qa-draft';
  RAISE EXCEPTION 'episode invalidated existing anchor';
 EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN
  INSERT INTO public.lab_journey_episodes SELECT release_id,'overlap',book,from_chapter,to_chapter,title,period,person,summary,reference,kind,place_name FROM public.lab_journey_episodes WHERE release_id='qa-draft';
  RAISE EXCEPTION 'overlapping episodes accepted';
 EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN
  UPDATE public.lab_journey_evidence SET source_id='missing' WHERE release_id='qa-draft';
  RAISE EXCEPTION 'missing source accepted';
 EXCEPTION WHEN foreign_key_violation THEN NULL; END;
END;
$qa$;
SET LOCAL ROLE anon;
DO $qa$
DECLARE table_name text; found integer;
BEGIN
 FOREACH table_name IN ARRAY ARRAY['lab_journey_releases','lab_journey_sources','lab_journey_episodes','lab_journey_chapter_anchors','lab_journey_evidence'] LOOP
  EXECUTE format('SELECT count(*) FROM public.%I WHERE %I = $1',table_name,CASE WHEN table_name='lab_journey_releases' THEN 'id' ELSE 'release_id' END) INTO found USING 'qa-draft';
  IF found <> 0 THEN RAISE EXCEPTION 'draft leaked: %',table_name; END IF;
  EXECUTE format('SELECT count(*) FROM public.%I WHERE %I = $1',table_name,CASE WHEN table_name='lab_journey_releases' THEN 'id' ELSE 'release_id' END) INTO found USING 'qa-published';
  IF found <> 1 THEN RAISE EXCEPTION 'published row missing: %',table_name; END IF;
  IF has_table_privilege(current_user,'public.'||table_name,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN RAISE EXCEPTION 'browser write grant: %',table_name; END IF;
 END LOOP;
 BEGIN
  INSERT INTO public.lab_journey_releases(id,title) VALUES ('qa-hack','Browser write');
  RAISE EXCEPTION 'anon write accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END;
$qa$;
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $qa$
BEGIN
 IF EXISTS(SELECT 1 FROM public.lab_journey_releases WHERE id='qa-draft') THEN RAISE EXCEPTION 'authenticated draft leak'; END IF;
 BEGIN
  UPDATE public.lab_journey_releases SET publication_status='published' WHERE id='qa-draft';
  RAISE EXCEPTION 'authenticated publication accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END;
$qa$;
RESET ROLE;
SET LOCAL ROLE service_role;
DO $qa$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.lab_journey_releases WHERE id='qa-draft') THEN RAISE EXCEPTION 'service cannot curate draft'; END IF;
 INSERT INTO public.lab_journey_releases(id,title) VALUES ('qa-service','Service draft');
END;
$qa$;
RESET ROLE;
ROLLBACK;
