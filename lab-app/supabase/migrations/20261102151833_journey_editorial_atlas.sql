-- Editorial geography is independent of annual plans, progress, XP and clocks.
-- A new revision uses a new release id; only human-reviewed releases are public.
BEGIN;
CREATE FUNCTION public.lab_journey_chapter_count(p_book text)
RETURNS smallint LANGUAGE sql IMMUTABLE STRICT SECURITY INVOKER SET search_path='' AS $fn$
 SELECT chapters::smallint FROM (VALUES ('Gênesis',50),('Êxodo',40),('Levítico',27),('Números',36),('Deuteronômio',34),('Josué',24),('Juízes',21),('Rute',4),('1 Samuel',31),('2 Samuel',24),('1 Reis',22),('2 Reis',25),('1 Crônicas',29),('2 Crônicas',36),('Esdras',10),('Neemias',13),('Ester',10),('Jó',42),('Salmos',150),('Provérbios',31),('Eclesiastes',12),('Cânticos',8),('Isaías',66),('Jeremias',52),('Lamentações',5),('Ezequiel',48),('Daniel',12),('Oséias',14),('Joel',3),('Amós',9),('Obadias',1),('Jonas',4),('Miqueias',7),('Naum',3),('Habacuque',3),('Sofonias',3),('Ageu',2),('Zacarias',14),('Malaquias',4),('Mateus',28),('Marcos',16),('Lucas',24),('João',21),('Atos',28),('Romanos',16),('1 Coríntios',16),('2 Coríntios',13),('Gálatas',6),('Efésios',6),('Filipenses',4),('Colossenses',4),('1 Tessalonicenses',5),('2 Tessalonicenses',3),('1 Timóteo',6),('2 Timóteo',4),('Tito',3),('Filemom',1),('Hebreus',13),('Tiago',5),('1 Pedro',5),('2 Pedro',3),('1 João',5),('2 João',1),('3 João',1),('Judas',1),('Apocalipse',22)) AS canon(book,chapters) WHERE book=p_book;
$fn$;
REVOKE ALL ON FUNCTION public.lab_journey_chapter_count(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lab_journey_chapter_count(text) TO service_role;

CREATE TABLE public.lab_journey_releases (
 id text PRIMARY KEY CHECK (id ~ '^[a-z0-9][a-z0-9._-]{0,79}$'),
 publication_status text NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft','published','archived')),
 title text NOT NULL CHECK (length(btrim(title)) BETWEEN 3 AND 240),
 reviewed_by text,
 reviewed_at timestamptz,
 published_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 CHECK (publication_status <> 'published' OR
   (length(btrim(reviewed_by)) > 0 AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL AND published_at IS NOT NULL AND published_at >= reviewed_at))
);
CREATE TABLE public.lab_journey_sources (
 release_id text NOT NULL REFERENCES public.lab_journey_releases(id) ON DELETE RESTRICT,
 id text NOT NULL CHECK (length(btrim(id)) BETWEEN 1 AND 160),
 title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 500),
 publisher text NOT NULL CHECK (length(btrim(publisher)) BETWEEN 1 AND 240),
 url text NOT NULL CHECK (url ~ '^https://[^[:space:]]+$'),
 retrieved_at date NOT NULL,
 scope text NOT NULL CHECK (length(btrim(scope)) > 0),
 rights_note text NOT NULL DEFAULT 'Referência e síntese editorial; conteúdo integral não reproduzido.',
 PRIMARY KEY (release_id,id)
);
CREATE TABLE public.lab_journey_episodes (
 release_id text NOT NULL REFERENCES public.lab_journey_releases(id) ON DELETE RESTRICT,
 id text NOT NULL CHECK (length(btrim(id)) BETWEEN 1 AND 160),
 book text NOT NULL CHECK (length(btrim(book)) BETWEEN 1 AND 80),
 from_chapter smallint NOT NULL CHECK (from_chapter BETWEEN 1 AND 150),
 to_chapter smallint NOT NULL CHECK (to_chapter BETWEEN from_chapter AND COALESCE(public.lab_journey_chapter_count(book),0)),
 title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 300),
 period text NOT NULL,
 person text NOT NULL,
 summary text NOT NULL,
 reference text NOT NULL,
 kind text NOT NULL CHECK (kind IN ('narrative','literary','prophetic','letter','vision')),
 place_name text,
 PRIMARY KEY (release_id,id),
 UNIQUE (release_id,id,book)
);
CREATE TABLE public.lab_journey_chapter_anchors (
 release_id text NOT NULL REFERENCES public.lab_journey_releases(id) ON DELETE RESTRICT,
 book text NOT NULL,
 chapter smallint NOT NULL CHECK (chapter BETWEEN 1 AND COALESCE(public.lab_journey_chapter_count(book),0)),
 episode_id text NOT NULL,
 lon double precision NOT NULL CHECK (lon BETWEEN -180 AND 180),
 lat double precision NOT NULL CHECK (lat BETWEEN -90 AND 90),
 place_name text NOT NULL CHECK (length(btrim(place_name)) > 0),
 biome text NOT NULL CHECK (biome IN ('river','desert','mountain','green','sea')),
 confidence text NOT NULL CHECK (confidence IN ('regional','approximate','uncertain')),
 note text NOT NULL,
 reference text NOT NULL,
 kind text NOT NULL CHECK (kind IN ('narrative','symbolic','recipient','literary','vision')),
 PRIMARY KEY (release_id,book,chapter),
 FOREIGN KEY (release_id,episode_id,book) REFERENCES public.lab_journey_episodes(release_id,id,book) ON DELETE RESTRICT
);
CREATE TABLE public.lab_journey_evidence (
 release_id text NOT NULL REFERENCES public.lab_journey_releases(id) ON DELETE RESTRICT,
 id text NOT NULL CHECK (length(btrim(id)) BETWEEN 1 AND 160),
 source_id text NOT NULL,
 book text NOT NULL CHECK (length(btrim(book)) BETWEEN 1 AND 80),
 from_chapter smallint NOT NULL CHECK (from_chapter BETWEEN 1 AND 150),
 to_chapter smallint NOT NULL CHECK (to_chapter BETWEEN from_chapter AND COALESCE(public.lab_journey_chapter_count(book),0)),
 title text NOT NULL CHECK (length(btrim(title)) > 0),
 kind text NOT NULL CHECK (kind IN ('scriptural-narrative','historical-corroboration','editorial-inference')),
 "references" text[] NOT NULL CHECK (cardinality("references") > 0 AND array_position("references",NULL) IS NULL),
 claim text NOT NULL CHECK (length(btrim(claim)) > 0),
 confidence text NOT NULL CHECK (confidence IN ('textual','corroborated','approximate','disputed')),
 scope text NOT NULL CHECK (length(btrim(scope)) > 0),
 caution text,
 PRIMARY KEY (release_id,id),
 FOREIGN KEY (release_id,source_id) REFERENCES public.lab_journey_sources(release_id,id) ON DELETE RESTRICT
);

CREATE FUNCTION public.lab_journey_validate_anchor()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.lab_journey_episodes e WHERE e.release_id=NEW.release_id AND e.id=NEW.episode_id AND e.book=NEW.book AND NEW.chapter BETWEEN e.from_chapter AND e.to_chapter) THEN
   RAISE EXCEPTION 'Anchor chapter must belong to its episode' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_journey_validate_anchor() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lab_journey_validate_anchor() TO service_role;
CREATE TRIGGER lab_journey_anchor_range BEFORE INSERT OR UPDATE ON public.lab_journey_chapter_anchors FOR EACH ROW EXECUTE FUNCTION public.lab_journey_validate_anchor();

CREATE FUNCTION public.lab_journey_validate_episode()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
BEGIN
 IF EXISTS (SELECT 1 FROM public.lab_journey_episodes e WHERE e.release_id=NEW.release_id AND e.book=NEW.book AND e.id<>NEW.id AND e.from_chapter<=NEW.to_chapter AND e.to_chapter>=NEW.from_chapter) THEN
   RAISE EXCEPTION 'Episode chapter ranges must not overlap within a release' USING ERRCODE='23514';
 END IF;
 IF TG_OP='UPDATE' AND EXISTS (SELECT 1 FROM public.lab_journey_chapter_anchors a WHERE a.release_id=OLD.release_id AND a.episode_id=OLD.id AND (a.book<>NEW.book OR a.chapter NOT BETWEEN NEW.from_chapter AND NEW.to_chapter)) THEN
   RAISE EXCEPTION 'Episode revision would invalidate existing anchors' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_journey_validate_episode() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lab_journey_validate_episode() TO service_role;
CREATE TRIGGER lab_journey_episode_range BEFORE INSERT OR UPDATE ON public.lab_journey_episodes FOR EACH ROW EXECUTE FUNCTION public.lab_journey_validate_episode();

CREATE INDEX lab_journey_episode_lookup ON public.lab_journey_episodes(release_id,book,from_chapter,to_chapter);
CREATE INDEX lab_journey_anchor_episode ON public.lab_journey_chapter_anchors(release_id,episode_id,book);
CREATE INDEX lab_journey_evidence_lookup ON public.lab_journey_evidence(release_id,book,from_chapter,to_chapter);
CREATE INDEX lab_journey_evidence_source ON public.lab_journey_evidence(release_id,source_id);
CREATE INDEX lab_journey_published_releases ON public.lab_journey_releases(published_at DESC,id) WHERE publication_status='published';

ALTER TABLE public.lab_journey_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_journey_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_journey_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_journey_chapter_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_journey_evidence ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_journey_releases,public.lab_journey_sources,public.lab_journey_episodes,public.lab_journey_chapter_anchors,public.lab_journey_evidence FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lab_journey_releases,public.lab_journey_sources,public.lab_journey_episodes,public.lab_journey_chapter_anchors,public.lab_journey_evidence TO anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.lab_journey_releases,public.lab_journey_sources,public.lab_journey_episodes,public.lab_journey_chapter_anchors,public.lab_journey_evidence TO service_role;
CREATE POLICY "Published journey releases" ON public.lab_journey_releases FOR SELECT TO anon,authenticated USING (publication_status='published');
CREATE POLICY "Published journey sources" ON public.lab_journey_sources FOR SELECT TO anon,authenticated USING (EXISTS (SELECT 1 FROM public.lab_journey_releases r WHERE r.id=release_id AND r.publication_status='published'));
CREATE POLICY "Published journey episodes" ON public.lab_journey_episodes FOR SELECT TO anon,authenticated USING (EXISTS (SELECT 1 FROM public.lab_journey_releases r WHERE r.id=release_id AND r.publication_status='published'));
CREATE POLICY "Published journey anchors" ON public.lab_journey_chapter_anchors FOR SELECT TO anon,authenticated USING (EXISTS (SELECT 1 FROM public.lab_journey_releases r WHERE r.id=release_id AND r.publication_status='published'));
CREATE POLICY "Published journey evidence" ON public.lab_journey_evidence FOR SELECT TO anon,authenticated USING (EXISTS (SELECT 1 FROM public.lab_journey_releases r WHERE r.id=release_id AND r.publication_status='published'));
COMMENT ON TABLE public.lab_journey_releases IS 'Versioned curated map content. Review metadata is an editorial attestation, never proof of archaeological certainty or model training.';
COMMENT ON TABLE public.lab_journey_evidence IS 'Sources support scoped claims, not automatic chronology. LLM-generated proposals must remain drafts until editorial review.';
COMMIT;
