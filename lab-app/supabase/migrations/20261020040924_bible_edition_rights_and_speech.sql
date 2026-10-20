-- Public metadata is not a license. Modern texts remain disabled until rights
-- evidence AND a complete licensed import have been independently recorded.
CREATE TABLE public.lab_bible_edition_availability (
 code text PRIMARY KEY REFERENCES public.lab_bible_editions(code),
 title text NOT NULL,
 display_order smallint NOT NULL UNIQUE,
 available boolean NOT NULL DEFAULT false,
 requires_auth boolean NOT NULL DEFAULT true,
 license_label text NOT NULL,
 rights_status text NOT NULL DEFAULT 'pending' CHECK(rights_status IN ('pending','public_domain','licensed')),
 rights_evidence_url text CHECK(rights_evidence_url ~ '^https://'),
 content_ready boolean NOT NULL DEFAULT false,
 CHECK (NOT available OR (rights_status <> 'pending' AND rights_evidence_url IS NOT NULL AND content_ready)),
 CHECK (rights_status <> 'licensed' OR requires_auth)
);
INSERT INTO public.lab_bible_editions(code,title,attribution,source_url,license_label) VALUES
 ('NVI','Nova Versão Internacional','Tradução moderna: utilização depende de autorização do titular.','https://www.biblica.com/permissions/','Direitos reservados; importação não autorizada'),
 ('NAA','Nova Almeida Atualizada','Tradução moderna: utilização depende de autorização do titular.','https://www.sbb.org.br/','Direitos reservados; importação não autorizada'),
 ('ARA','Almeida Revista e Atualizada','Tradução moderna: utilização depende de autorização do titular.','https://www.sbb.org.br/','Direitos reservados; importação não autorizada'),
 ('NTLH','Nova Tradução na Linguagem de Hoje','Tradução moderna: utilização depende de autorização do titular.','https://www.sbb.org.br/','Direitos reservados; importação não autorizada')
ON CONFLICT (code) DO NOTHING;
INSERT INTO public.lab_bible_edition_availability(code,title,display_order,available,requires_auth,license_label,rights_status,rights_evidence_url,content_ready) VALUES
 ('ALM1911','Almeida 1911',0,true,false,'Domínio público: edição histórica de 1911','public_domain','https://www.gutenberg.org/ebooks/62383',true),
 ('NVI','Nova Versão Internacional',1,false,true,'Aguardando autorização e importação licenciada','pending',NULL,false),
 ('NAA','Nova Almeida Atualizada',2,false,true,'Aguardando autorização e importação licenciada','pending',NULL,false),
 ('ARA','Almeida Revista e Atualizada',3,false,true,'Aguardando autorização e importação licenciada','pending',NULL,false),
 ('NTLH','Nova Tradução na Linguagem de Hoje',4,false,true,'Aguardando autorização e importação licenciada','pending',NULL,false);
ALTER TABLE public.lab_bible_edition_availability ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_bible_edition_availability FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lab_bible_edition_availability TO anon,authenticated;
CREATE POLICY "Public edition availability metadata" ON public.lab_bible_edition_availability FOR SELECT TO anon,authenticated USING(true);

-- Replace original public-all policies, including the full-text index. An
-- authenticated role with a missing subject is not treated as a signed-in user.
DROP POLICY "Public available canonical chapters" ON public.lab_bible_chapters;
CREATE POLICY "Available licensed Bible chapters" ON public.lab_bible_chapters FOR SELECT TO anon,authenticated USING (
 EXISTS (SELECT 1 FROM public.lab_bible_edition_availability a WHERE a.code=edition AND a.available AND (NOT a.requires_auth OR (current_user='authenticated' AND (SELECT auth.uid()) IS NOT NULL)))
);
DROP POLICY "Search public-domain Bible verses" ON public.lab_bible_verses;
CREATE POLICY "Available licensed Bible verses" ON public.lab_bible_verses FOR SELECT TO anon,authenticated USING (
 EXISTS (SELECT 1 FROM public.lab_bible_edition_availability a WHERE a.code=edition AND a.available AND (NOT a.requires_auth OR (current_user='authenticated' AND (SELECT auth.uid()) IS NOT NULL)))
);

-- Only individually reviewed spans may be displayed. No blanket Gospel/verse
-- flag and no automatic quotation guessing. Snapshot matching prevents offsets
-- from silently drifting when an edition's text changes.
CREATE TABLE public.lab_bible_jesus_speech (
 edition text NOT NULL,
 chapter_id text NOT NULL,
 verse_number smallint NOT NULL,
 start_utf16 integer NOT NULL CHECK(start_utf16>=0),
 end_utf16 integer NOT NULL,
 source_text text NOT NULL CHECK(length(source_text)>0),
 editorial_source_url text NOT NULL CHECK(editorial_source_url ~ '^https://'),
 review_status text NOT NULL DEFAULT 'draft' CHECK(review_status IN ('draft','published')),
 PRIMARY KEY(edition,chapter_id,verse_number,start_utf16),
 FOREIGN KEY(edition,chapter_id,verse_number) REFERENCES public.lab_bible_verses(edition,chapter_id,verse_number) ON DELETE CASCADE,
 CHECK(end_utf16>start_utf16 AND end_utf16<=length(source_text)*2),
 CHECK(split_part(chapter_id,':',1)::integer IN (40,41,42,43,44,66))
);
ALTER TABLE public.lab_bible_jesus_speech ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_bible_jesus_speech FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lab_bible_jesus_speech TO anon,authenticated;
CREATE POLICY "Reviewed licensed Jesus speech spans" ON public.lab_bible_jesus_speech FOR SELECT TO anon,authenticated USING (
 review_status='published' AND EXISTS (
  SELECT 1 FROM public.lab_bible_verses v
  WHERE v.edition=lab_bible_jesus_speech.edition AND v.chapter_id=lab_bible_jesus_speech.chapter_id
    AND v.verse_number=lab_bible_jesus_speech.verse_number AND v.verse_text=source_text
 )
);
COMMENT ON TABLE public.lab_bible_jesus_speech IS 'Curated UTF-16 spans; no complete red-letter corpus has been imported.';
