-- Disposable PostgreSQL database only. Run after the Bible migrations in a fresh test database.
BEGIN;
INSERT INTO public.lab_bible_chapters(edition,chapter_id,book_name,chapter_number,verses) VALUES
 ('ALM1911','40:1','Mateus',1,'[{"number":1,"text":"Disse: Paz!"}]'),
 ('NVI','40:1','Mateus',1,'[{"number":1,"text":"Private licensed fixture only"}]');
INSERT INTO public.lab_bible_verses(edition,chapter_id,verse_number,verse_text) VALUES
 ('ALM1911','40:1',1,'Disse: Paz!'),('NVI','40:1',1,'Private licensed fixture only');
INSERT INTO public.lab_bible_jesus_speech(edition,chapter_id,verse_number,start_utf16,end_utf16,source_text,editorial_source_url,review_status) VALUES
 ('ALM1911','40:1',1,7,11,'Disse: Paz!','https://example.org/editorial-fixture','published'),
 ('ALM1911','40:1',1,0,5,'Disse: Paz!','https://example.org/editorial-fixture','draft'),
 ('NVI','40:1',1,0,5,'Private licensed fixture only','https://example.org/editorial-fixture','published');
SET LOCAL ROLE anon;
DO $test$ BEGIN
 IF (SELECT count(*) FROM public.lab_bible_edition_availability)<>5 THEN RAISE EXCEPTION 'edition metadata unavailable'; END IF;
 IF (SELECT count(*) FROM public.lab_bible_chapters)<>1 THEN RAISE EXCEPTION 'pending licensed chapter leaked'; END IF;
 IF (SELECT count(*) FROM public.lab_bible_verses)<>1 THEN RAISE EXCEPTION 'pending licensed verse leaked'; END IF;
 IF (SELECT count(*) FROM public.lab_bible_jesus_speech)<>1 THEN RAISE EXCEPTION 'unreviewed or pending annotation leaked'; END IF;
 BEGIN
  UPDATE public.lab_bible_edition_availability SET available=true WHERE code='NVI';
  RAISE EXCEPTION 'anon can enable protected edition';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.lab_bible_jesus_speech(edition,chapter_id,verse_number,start_utf16,end_utf16,source_text,editorial_source_url) VALUES ('ALM1911','40:1',1,2,3,'Disse: Paz!','https://example.org/fixture');
  RAISE EXCEPTION 'anon can insert annotation';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;
-- Disabled editions cannot be turned on merely by toggling a UI flag.
DO $test$ BEGIN
 BEGIN
  UPDATE public.lab_bible_edition_availability SET available=true WHERE code='NVI';
  RAISE EXCEPTION 'edition enabled without rights and import';
 EXCEPTION WHEN check_violation THEN NULL; END;
END $test$;
UPDATE public.lab_bible_edition_availability SET rights_status='licensed',license_status='licensed_by_rightsholder',rights_evidence_url='https://example.org/disposable-license-fixture',content_ready=true,available=true WHERE code='NVI';
SET LOCAL ROLE anon;
DO $test$ BEGIN
 IF EXISTS(SELECT 1 FROM public.lab_bible_chapters WHERE edition='NVI') THEN RAISE EXCEPTION 'licensed content visible without sign in'; END IF;
END $test$;
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $test$ BEGIN
 IF EXISTS(SELECT 1 FROM public.lab_bible_chapters WHERE edition='NVI') THEN RAISE EXCEPTION 'missing JWT subject accepted'; END IF;
END $test$;
RESET ROLE;
SELECT set_config('app.test_user','00000000-0000-4000-8000-000000000001',true);
SET LOCAL ROLE authenticated;
DO $test$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.lab_bible_chapters WHERE edition='NVI') THEN RAISE EXCEPTION 'authorized licensed fixture unavailable'; END IF;
 BEGIN
  DELETE FROM public.lab_bible_jesus_speech;
  RAISE EXCEPTION 'authenticated can remove annotations';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  UPDATE public.lab_bible_jesus_speech SET review_status='published';
  RAISE EXCEPTION 'authenticated can publish annotations';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;
UPDATE public.lab_bible_verses SET verse_text='Texto alterado' WHERE edition='ALM1911';
SET LOCAL ROLE anon;
DO $test$ BEGIN
 IF EXISTS(SELECT 1 FROM public.lab_bible_jesus_speech) THEN RAISE EXCEPTION 'stale annotation still visible'; END IF;
END $test$;
RESET ROLE;
ROLLBACK;
