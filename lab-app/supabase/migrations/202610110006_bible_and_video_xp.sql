-- Public-domain 1911 Almeida text, preserved verbatim from book-level JSON,
-- and extra XP for BibleProject panoramas independent of reading progression.
CREATE TABLE public.lab_bible_editions(
 code text PRIMARY KEY,
 title text NOT NULL,
 language_code text NOT NULL DEFAULT 'pt',
 attribution text NOT NULL,
 source_url text NOT NULL,
 license_label text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.lab_bible_editions(code,title,attribution,source_url,license_label)
VALUES('ALM1911','Almeida 1911 (ortografia histórica)',
 'João Ferreira de Almeida, edição de 1911. Texto digital derivado da edição histórica de domínio público.',
 'https://www.gutenberg.org/ebooks/62383','Domínio público: texto da edição de 1911')
ON CONFLICT(code) DO NOTHING;

CREATE TABLE public.lab_bible_chapters (
 edition text NOT NULL REFERENCES public.lab_bible_editions(code),
 chapter_id text NOT NULL CHECK(chapter_id ~ '^[0-9]{1,2}:[0-9]{1,3}$'),
 book_name text NOT NULL,
 chapter_number smallint NOT NULL CHECK(chapter_number BETWEEN 1 AND 150),
 verses jsonb NOT NULL CHECK(jsonb_typeof(verses)='array' AND jsonb_array_length(verses)>0),
 PRIMARY KEY(edition,chapter_id)
);
CREATE INDEX lab_bible_chapters_book_idx ON public.lab_bible_chapters(edition,book_name,chapter_number);
ALTER TABLE public.lab_bible_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_bible_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public available Bible editions" ON public.lab_bible_editions FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY "Public available canonical chapters" ON public.lab_bible_chapters FOR SELECT TO anon,authenticated USING(true);
REVOKE ALL ON public.lab_bible_editions,public.lab_bible_chapters FROM PUBLIC;
GRANT SELECT ON public.lab_bible_editions,public.lab_bible_chapters TO anon,authenticated;

CREATE TABLE public.lab_game_video_resources(
 video_key text PRIMARY KEY CHECK(length(video_key) BETWEEN 5 AND 120),
 source_url text NOT NULL UNIQUE CHECK(source_url LIKE 'https://bibleproject.com/pt-br/%'),
 xp smallint NOT NULL DEFAULT 5 CHECK(xp=5)
);
INSERT INTO public.lab_game_video_resources(video_key,source_url) VALUES
('videos:genesis-1-11','https://bibleproject.com/pt-br/videos/genesis-1-11/'),
('videos:genesis-12-50','https://bibleproject.com/pt-br/videos/genesis-12-50/'),
('videos:exodo-1-18','https://bibleproject.com/pt-br/videos/exodo-1-18/'),
('videos:exodo-19-40','https://bibleproject.com/pt-br/videos/exodo-19-40/'),
('videos:levitico','https://bibleproject.com/pt-br/videos/levitico/'),
('videos:numeros','https://bibleproject.com/pt-br/videos/numeros/'),
('videos:deuteronomio','https://bibleproject.com/pt-br/videos/deuteronomio/'),
('videos:josue','https://bibleproject.com/pt-br/videos/josue/'),
('videos:juizes','https://bibleproject.com/pt-br/videos/juizes/'),
('videos:rute','https://bibleproject.com/pt-br/videos/rute/'),
('videos:1samuel','https://bibleproject.com/pt-br/videos/1samuel/'),
('videos:2samuel','https://bibleproject.com/pt-br/videos/2samuel/'),
('videos:1-e-2reis','https://bibleproject.com/pt-br/videos/1-e-2reis/'),
('videos:1-e-2cronicas','https://bibleproject.com/pt-br/videos/1-e-2cronicas/'),
('videos:esdras-neemias','https://bibleproject.com/pt-br/videos/esdras-neemias/'),
('videos:ester','https://bibleproject.com/pt-br/videos/ester/'),
('videos:jo-2','https://bibleproject.com/pt-br/videos/jo-2/'),
('videos:salmos','https://bibleproject.com/pt-br/videos/salmos/'),
('videos:proverbios-2','https://bibleproject.com/pt-br/videos/proverbios-2/'),
('videos:eclesiastes-2','https://bibleproject.com/pt-br/videos/eclesiastes-2/'),
('guides:cantico-dos-canticos','https://bibleproject.com/pt-br/guides/cantico-dos-canticos/'),
('videos:isaias-1-39','https://bibleproject.com/pt-br/videos/isaias-1-39/'),
('videos:isaias-40-66','https://bibleproject.com/pt-br/videos/isaias-40-66/'),
('videos:jeremias','https://bibleproject.com/pt-br/videos/jeremias/'),
('videos:lamentacoes','https://bibleproject.com/pt-br/videos/lamentacoes/'),
('videos:ezequiel-1-33','https://bibleproject.com/pt-br/videos/ezequiel-1-33/'),
('videos:ezequiel-34-48','https://bibleproject.com/pt-br/videos/ezequiel-34-48/'),
('videos:daniel','https://bibleproject.com/pt-br/videos/daniel/'),
('videos:oseias','https://bibleproject.com/pt-br/videos/oseias/'),
('videos:joel','https://bibleproject.com/pt-br/videos/joel/'),
('videos:amos','https://bibleproject.com/pt-br/videos/amos/'),
('videos:obadias','https://bibleproject.com/pt-br/videos/obadias/'),
('videos:jonas','https://bibleproject.com/pt-br/videos/jonas/'),
('videos:miqueias','https://bibleproject.com/pt-br/videos/miqueias/'),
('videos:naum','https://bibleproject.com/pt-br/videos/naum/'),
('videos:habacuque','https://bibleproject.com/pt-br/videos/habacuque/'),
('guides:sofonias','https://bibleproject.com/pt-br/guides/sofonias/'),
('videos:ageu','https://bibleproject.com/pt-br/videos/ageu/'),
('videos:zacarias','https://bibleproject.com/pt-br/videos/zacarias/'),
('videos:malaquias','https://bibleproject.com/pt-br/videos/malaquias/'),
('videos:mateus-1-13','https://bibleproject.com/pt-br/videos/mateus-1-13/'),
('videos:mateus-14-28','https://bibleproject.com/pt-br/videos/mateus-14-28/'),
('videos:marcos-2','https://bibleproject.com/pt-br/videos/marcos-2/'),
('videos:lucas-1-9','https://bibleproject.com/pt-br/videos/lucas-1-9/'),
('videos:lucas-10-24','https://bibleproject.com/pt-br/videos/lucas-10-24/'),
('videos:joao-1-12','https://bibleproject.com/pt-br/videos/joao-1-12/'),
('videos:joao-13-21','https://bibleproject.com/pt-br/videos/joao-13-21/'),
('videos:atos-1-12','https://bibleproject.com/pt-br/videos/atos-1-12/'),
('videos:atos-13-28','https://bibleproject.com/pt-br/videos/atos-13-28/'),
('videos:romanos-1-4','https://bibleproject.com/pt-br/videos/romanos-1-4/'),
('videos:romanos-5-16','https://bibleproject.com/pt-br/videos/romanos-5-16/'),
('videos:1corintios','https://bibleproject.com/pt-br/videos/1corintios/'),
('videos:2corintios','https://bibleproject.com/pt-br/videos/2corintios/'),
('videos:galatas','https://bibleproject.com/pt-br/videos/galatas/'),
('videos:efesios','https://bibleproject.com/pt-br/videos/efesios/'),
('videos:filipenses','https://bibleproject.com/pt-br/videos/filipenses/'),
('videos:colossenses','https://bibleproject.com/pt-br/videos/colossenses/'),
('videos:1tessalonicenses','https://bibleproject.com/pt-br/videos/1tessalonicenses/'),
('videos:2tessalonicenses','https://bibleproject.com/pt-br/videos/2tessalonicenses/'),
('videos:1timoteo','https://bibleproject.com/pt-br/videos/1timoteo/'),
('videos:2timoteo','https://bibleproject.com/pt-br/videos/2timoteo/'),
('videos:tito','https://bibleproject.com/pt-br/videos/tito/'),
('videos:filemom','https://bibleproject.com/pt-br/videos/filemom/'),
('videos:hebreus','https://bibleproject.com/pt-br/videos/hebreus/'),
('videos:tiago','https://bibleproject.com/pt-br/videos/tiago/'),
('videos:1pedro','https://bibleproject.com/pt-br/videos/1pedro/'),
('videos:2pedro','https://bibleproject.com/pt-br/videos/2pedro/'),
('guides:1-3-joao','https://bibleproject.com/pt-br/guides/1-3-joao/'),
('guides:judas','https://bibleproject.com/pt-br/guides/judas/'),
('videos:apocalipse-1-11','https://bibleproject.com/pt-br/videos/apocalipse-1-11/'),
('videos:apocalipse-12-22','https://bibleproject.com/pt-br/videos/apocalipse-12-22/')
ON CONFLICT (video_key) DO NOTHING;
ALTER TABLE public.lab_game_video_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public video resource index" ON public.lab_game_video_resources FOR SELECT TO anon,authenticated USING(true);
REVOKE ALL ON public.lab_game_video_resources FROM PUBLIC;
GRANT SELECT ON public.lab_game_video_resources TO anon,authenticated;

CREATE TABLE public.lab_game_video_sessions(
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 video_key text NOT NULL REFERENCES public.lab_game_video_resources(video_key),
 started_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,video_key)
);
CREATE TABLE public.lab_game_video_rewards(
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 video_key text NOT NULL REFERENCES public.lab_game_video_resources(video_key),
 confirmed_at timestamptz NOT NULL DEFAULT now(),
 awarded_xp smallint NOT NULL DEFAULT 5 CHECK(awarded_xp=5),
 PRIMARY KEY(user_id,video_key)
);
CREATE INDEX lab_game_video_rewards_user_idx ON public.lab_game_video_rewards(user_id,confirmed_at);
ALTER TABLE public.lab_game_video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_game_video_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own video starts" ON public.lab_game_video_sessions FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
CREATE POLICY "Own video XP" ON public.lab_game_video_rewards FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
REVOKE ALL ON public.lab_game_video_sessions,public.lab_game_video_rewards FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lab_game_video_sessions,public.lab_game_video_rewards TO authenticated;

CREATE OR REPLACE FUNCTION public.lab_game_video_begin(p_video_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path=''
AS $fn$
DECLARE v_user uuid:=auth.uid();v_started timestamptz;v_awarded boolean;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.lab_game_video_resources r WHERE r.video_key=p_video_key)
 THEN RAISE EXCEPTION 'Vídeo não registrado na biblioteca'; END IF;
 INSERT INTO public.lab_game_video_sessions(user_id,video_key)
 VALUES(v_user,p_video_key) ON CONFLICT DO NOTHING;
 SELECT started_at INTO v_started FROM public.lab_game_video_sessions
 WHERE user_id=v_user AND video_key=p_video_key;
 SELECT EXISTS(SELECT 1 FROM public.lab_game_video_rewards
 WHERE user_id=v_user AND video_key=p_video_key) INTO v_awarded;
 RETURN jsonb_build_object('video_key',p_video_key,'started_at',v_started,
  'eligible_at',v_started+interval '90 seconds','already_awarded',v_awarded);
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_game_video_begin(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_game_video_begin(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.lab_game_video_confirm(p_video_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path=''
AS $fn$
DECLARE v_user uuid:=auth.uid();v_started timestamptz;v_added integer;v_total integer;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
 INSERT INTO public.lab_game_stats(user_id) VALUES(v_user) ON CONFLICT DO NOTHING;
 PERFORM 1 FROM public.lab_game_stats WHERE user_id=v_user FOR UPDATE;
 SELECT started_at INTO v_started FROM public.lab_game_video_sessions
 WHERE user_id=v_user AND video_key=p_video_key;
 IF v_started IS NULL THEN RAISE EXCEPTION 'Abra o vídeo primeiro'; END IF;
 SELECT total_xp INTO v_total FROM public.lab_game_stats WHERE user_id=v_user;
 IF EXISTS(SELECT 1 FROM public.lab_game_video_rewards
 WHERE user_id=v_user AND video_key=p_video_key)
 THEN RETURN jsonb_build_object('awarded',false,'bonus_xp',0,'total_xp',v_total,'already_awarded',true);
 END IF;
 IF clock_timestamp()<v_started+interval '90 seconds'
 THEN RAISE EXCEPTION 'Continue assistindo antes de confirmar o panorama'; END IF;
 INSERT INTO public.lab_game_video_rewards(user_id,video_key)
 VALUES(v_user,p_video_key) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS v_added=ROW_COUNT;
 IF v_added>0 THEN
   UPDATE public.lab_game_stats SET total_xp=total_xp+5,updated_at=now()
   WHERE user_id=v_user RETURNING total_xp INTO v_total;
 END IF;
 RETURN jsonb_build_object('awarded',v_added>0,'bonus_xp',5*v_added,
   'total_xp',v_total,'already_awarded',true);
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_game_video_confirm(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_game_video_confirm(text) TO authenticated;
