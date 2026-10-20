\set ON_ERROR_STOP on
-- Fresh disposable database only; compatible with PostgreSQL 16 and 17.
-- Minimal legacy Bible tables/policies match migrations 202610110006/009.
DO $roles$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
END $roles$;
CREATE SCHEMA auth;
GRANT USAGE ON SCHEMA auth TO anon,authenticated;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('app.test_user',true),'')::uuid $$;
CREATE TABLE public.lab_bible_editions(
 code text PRIMARY KEY,title text NOT NULL,language_code text NOT NULL DEFAULT 'pt',
 attribution text NOT NULL,source_url text NOT NULL,license_label text NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.lab_bible_editions(code,title,attribution,source_url,license_label) VALUES
 ('ALM1911','Almeida 1911','Fixture','https://www.gutenberg.org/ebooks/62383','Domínio público');
CREATE TABLE public.lab_bible_chapters(
 edition text NOT NULL REFERENCES public.lab_bible_editions(code),chapter_id text NOT NULL,
 book_name text NOT NULL,chapter_number smallint NOT NULL,verses jsonb NOT NULL,PRIMARY KEY(edition,chapter_id)
);
CREATE TABLE public.lab_bible_verses(
 edition text NOT NULL,chapter_id text NOT NULL,verse_number smallint NOT NULL,verse_text text NOT NULL,
 PRIMARY KEY(edition,chapter_id,verse_number),FOREIGN KEY(edition,chapter_id) REFERENCES public.lab_bible_chapters(edition,chapter_id) ON DELETE CASCADE
);
ALTER TABLE public.lab_bible_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_bible_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_bible_verses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_bible_editions,public.lab_bible_chapters,public.lab_bible_verses FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lab_bible_editions,public.lab_bible_chapters,public.lab_bible_verses TO anon,authenticated;
CREATE POLICY "Public available Bible editions" ON public.lab_bible_editions FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY "Public available canonical chapters" ON public.lab_bible_chapters FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY "Search public-domain Bible verses" ON public.lab_bible_verses FOR SELECT TO anon,authenticated USING(true);
\i supabase/migrations/20261020040924_bible_edition_rights_and_speech.sql
\i scripts/tests/bible-edition-rights-smoke.sql
SELECT 'BIBLE EDITION RIGHTS AND CURATED JESUS SPEECH RLS PASSED' AS result;
