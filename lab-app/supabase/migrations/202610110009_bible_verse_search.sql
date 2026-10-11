-- Public full-text Bible search for Almeida 1911, no daily-game XP.
-- References are validated by canonical chapter text and verse numbering.
CREATE TABLE IF NOT EXISTS public.lab_bible_verses (
 edition text NOT NULL,
 chapter_id text NOT NULL,
 verse_number smallint NOT NULL CHECK(verse_number BETWEEN 1 AND 200),
 verse_text text NOT NULL CHECK(length(verse_text)>0),
 PRIMARY KEY (edition,chapter_id,verse_number),
 FOREIGN KEY (edition,chapter_id) REFERENCES public.lab_bible_chapters(edition,chapter_id) ON DELETE CASCADE
);
INSERT INTO public.lab_bible_verses(edition,chapter_id,verse_number,verse_text)
SELECT c.edition,c.chapter_id,
 (verse.element->>'number')::smallint,
 verse.element->>'text'
FROM public.lab_bible_chapters c
CROSS JOIN LATERAL jsonb_array_elements(c.verses) AS verse(element)
WHERE c.edition='ALM1911'
ON CONFLICT(edition,chapter_id,verse_number) DO NOTHING;

CREATE INDEX IF NOT EXISTS lab_bible_verses_pt_fts_idx
 ON public.lab_bible_verses USING gin(to_tsvector('portuguese',verse_text));

ALTER TABLE public.lab_bible_verses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_bible_verses FROM PUBLIC;
GRANT SELECT ON public.lab_bible_verses TO anon,authenticated;
CREATE POLICY "Search public-domain Bible verses"
 ON public.lab_bible_verses FOR SELECT TO anon,authenticated USING(true);

CREATE OR REPLACE FUNCTION public.lab_bible_search(p_query text,p_limit integer DEFAULT 40)
RETURNS TABLE (
 book_name text,chapter_id text,chapter_number smallint,
 verse_number smallint,verse_text text
)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path=''
AS $fn$
 SELECT ch.book_name,v.chapter_id,ch.chapter_number,v.verse_number,v.verse_text
 FROM public.lab_bible_verses v
 JOIN public.lab_bible_chapters ch
   ON ch.edition=v.edition AND ch.chapter_id=v.chapter_id
 WHERE v.edition='ALM1911'
 AND length(btrim(coalesce(p_query,''))) BETWEEN 2 AND 100
 AND to_tsvector('portuguese',v.verse_text) @@
     websearch_to_tsquery('portuguese',left(btrim(p_query),100))
 ORDER BY ts_rank(
   to_tsvector('portuguese',v.verse_text),
   websearch_to_tsquery('portuguese',left(btrim(p_query),100))
 ) DESC,
 split_part(v.chapter_id,':',1)::integer,v.verse_number
 LIMIT LEAST(GREATEST(coalesce(p_limit,40),1),50);
$fn$;
REVOKE ALL ON FUNCTION public.lab_bible_search(text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lab_bible_search(text,integer) TO anon,authenticated;
