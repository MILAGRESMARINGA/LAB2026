-- Playback evidence is not proof of human attention. Answers remain private.
CREATE TABLE public.lab_video_catalog(
 video_key text PRIMARY KEY REFERENCES public.lab_game_video_resources(video_key),
 duration_seconds numeric NOT NULL CHECK(duration_seconds>0 AND duration_seconds<=36000),
 source_url text NOT NULL CHECK(source_url LIKE 'https://bibleproject.com/%'),
 ready boolean NOT NULL DEFAULT false
);
ALTER TABLE public.lab_video_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reviewed video metadata" ON public.lab_video_catalog FOR SELECT TO anon,authenticated USING(true);
REVOKE ALL ON public.lab_video_catalog FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lab_video_catalog TO anon,authenticated;
CREATE TABLE lab_agent_private.video_questions(
 video_key text NOT NULL REFERENCES public.lab_video_catalog(video_key),
 id integer NOT NULL CHECK(id IN(1,2)),prompt text NOT NULL,
 options jsonb NOT NULL CHECK(jsonb_typeof(options)='array' AND jsonb_array_length(options) BETWEEN 2 AND 5),
 correct_option integer NOT NULL CHECK(correct_option BETWEEN 0 AND 4),
 explanation text NOT NULL,PRIMARY KEY(video_key,id),
 CHECK(correct_option<jsonb_array_length(options))
);
CREATE TABLE lab_agent_private.video_watch(
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 video_key text NOT NULL REFERENCES public.lab_video_catalog(video_key),
 scope_id uuid NOT NULL,run_id uuid REFERENCES public.lab_v2_runs(id) ON DELETE CASCADE,
 session_id uuid NOT NULL DEFAULT gen_random_uuid(),sequence integer NOT NULL DEFAULT 0,
 covered_seconds double precision NOT NULL DEFAULT 0,
 active_seconds double precision NOT NULL DEFAULT 0,
 position double precision,heartbeat_at timestamptz,ended boolean NOT NULL DEFAULT false,
 passed boolean NOT NULL DEFAULT false,feedback jsonb NOT NULL DEFAULT '[]',
 PRIMARY KEY(user_id,video_key,scope_id)
);
CREATE TABLE lab_agent_private.video_active(
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 session_id uuid NOT NULL
);
ALTER TABLE lab_agent_private.video_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_agent_private.video_watch ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_agent_private.video_active ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON lab_agent_private.video_questions,lab_agent_private.video_watch,lab_agent_private.video_active FROM PUBLIC,anon,authenticated;

-- Replace both old entry points: elapsed wall time alone never grants new XP.
CREATE OR REPLACE FUNCTION public.lab_game_video_confirm(p_video_key text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $f$
DECLARE u uuid:=auth.uid();n integer;t integer;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,2116));
 INSERT INTO public.lab_game_stats(user_id) VALUES(u) ON CONFLICT DO NOTHING;
 PERFORM 1 FROM public.lab_game_stats WHERE user_id=u FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.lab_game_video_rewards WHERE user_id=u AND video_key=p_video_key) THEN
  IF NOT EXISTS(SELECT 1 FROM lab_agent_private.video_watch w JOIN public.lab_video_catalog c USING(video_key)
   WHERE w.user_id=u AND w.video_key=p_video_key AND w.run_id IS NULL AND w.passed AND w.ended
    AND w.covered_seconds>=c.duration_seconds AND w.active_seconds>=c.duration_seconds-0.2 AND c.ready)
  THEN RAISE EXCEPTION 'Conclua a reprodução e as duas perguntas'; END IF;
  INSERT INTO public.lab_game_video_rewards(user_id,video_key) VALUES(u,p_video_key) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n=ROW_COUNT;
  UPDATE public.lab_game_stats SET total_xp=total_xp+5*n,updated_at=now() WHERE user_id=u;
 ELSE n:=0; END IF;
 SELECT total_xp INTO t FROM public.lab_game_stats WHERE user_id=u;
 RETURN jsonb_build_object('awarded',n>0,'bonus_xp',5*n,'total_xp',t,'already_awarded',true);
END;$f$;
CREATE OR REPLACE FUNCTION public.lab_v2_video_confirm(p_run uuid,p_video_key text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $f$
DECLARE u uuid:=auth.uid();n integer:=0;r jsonb;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,2116));
 IF NOT EXISTS(SELECT 1 FROM public.lab_v2_runs WHERE id=p_run AND user_id=u) THEN RAISE EXCEPTION 'Jornada não encontrada'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.lab_v2_video_rewards WHERE run_id=p_run AND video_key=p_video_key) THEN
  IF NOT EXISTS(SELECT 1 FROM public.lab_v2_runs WHERE id=p_run AND user_id=u AND status='active')
   OR NOT EXISTS(SELECT 1 FROM public.lab_v2_release_controls WHERE enabled)
  THEN RAISE EXCEPTION 'Jornada indisponível'; END IF;
  IF NOT EXISTS(SELECT 1 FROM lab_agent_private.video_watch w JOIN public.lab_video_catalog c USING(video_key)
   WHERE w.user_id=u AND w.video_key=p_video_key AND w.run_id=p_run AND w.passed AND w.ended
    AND w.covered_seconds>=c.duration_seconds AND w.active_seconds>=c.duration_seconds-0.2 AND c.ready)
  THEN RAISE EXCEPTION 'Conclua a reprodução e as duas perguntas'; END IF;
  INSERT INTO public.lab_v2_video_rewards(run_id,video_key) VALUES(p_run,p_video_key) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n=ROW_COUNT;
 END IF;
 r:=public.lab_v2_sync(p_run);
 RETURN jsonb_build_object('awarded',n>0,'total_xp',r->'run_xp','already_awarded',true);
END;$f$;

CREATE FUNCTION public.lab_video_watch(p_video_key text,p_run uuid DEFAULT NULL,p_action text DEFAULT 'state',
 p_position double precision DEFAULT 0,p_sequence integer DEFAULT 0,p_answers jsonb DEFAULT NULL,p_session uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $f$
DECLARE
 u uuid:=auth.uid();scope uuid:=COALESCE(p_run,'00000000-0000-0000-0000-000000000000');
 c public.lab_video_catalog%ROWTYPE;w lab_agent_private.video_watch%ROWTYPE;
 at_time timestamptz:=clock_timestamp();elapsed double precision;delta double precision;
 qs jsonb:='[]';fb jsonb:='[]';ok boolean;awarded boolean;reward jsonb;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
 IF p_action NOT IN('state','tick','pause','ended','quiz') OR p_action IS NULL THEN RAISE EXCEPTION 'Ação inválida'; END IF;
 IF p_position IS NULL OR p_position<0 OR p_position='Infinity'::float8 OR p_position='NaN'::float8 OR p_sequence IS NULL OR p_sequence<0 THEN RAISE EXCEPTION 'Posição inválida'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,2116));
 IF p_run IS NOT NULL AND (NOT EXISTS(SELECT 1 FROM public.lab_v2_runs WHERE id=p_run AND user_id=u AND status='active')
   OR NOT EXISTS(SELECT 1 FROM public.lab_v2_release_controls WHERE enabled)) THEN RAISE EXCEPTION 'Jornada indisponível'; END IF;
 SELECT * INTO c FROM public.lab_video_catalog WHERE video_key=p_video_key;
 IF NOT FOUND OR NOT c.ready OR (SELECT count(*) FROM lab_agent_private.video_questions WHERE video_key=p_video_key)<>2 THEN
  SELECT CASE WHEN p_run IS NULL THEN EXISTS(SELECT 1 FROM public.lab_game_video_rewards WHERE user_id=u AND video_key=p_video_key)
   ELSE EXISTS(SELECT 1 FROM public.lab_v2_video_rewards WHERE run_id=p_run AND video_key=p_video_key) END INTO awarded;
  RETURN jsonb_build_object('ready',false,'duration_seconds',COALESCE(c.duration_seconds,0),'covered_seconds',0,
   'next_position',0,'already_awarded',awarded,'awarded',false,'playback_complete',false,'passed',false,
   'questions','[]'::jsonb,'feedback','[]'::jsonb);
 END IF;
 IF p_position>c.duration_seconds+0.5 THEN RAISE EXCEPTION 'Posição fora do vídeo'; END IF;
 INSERT INTO lab_agent_private.video_watch(user_id,video_key,scope_id,run_id) VALUES(u,p_video_key,scope,p_run) ON CONFLICT DO NOTHING;
 SELECT * INTO w FROM lab_agent_private.video_watch WHERE user_id=u AND video_key=p_video_key AND scope_id=scope FOR UPDATE;
 IF p_action='state' THEN
  w.session_id:=gen_random_uuid();w.sequence:=0;w.position:=NULL;w.heartbeat_at:=NULL;
  INSERT INTO lab_agent_private.video_active VALUES(u,w.session_id) ON CONFLICT(user_id) DO UPDATE SET session_id=EXCLUDED.session_id;
 ELSE
  IF p_session IS DISTINCT FROM w.session_id OR NOT EXISTS(SELECT 1 FROM lab_agent_private.video_active WHERE user_id=u AND session_id=p_session) THEN RAISE EXCEPTION 'Sessão substituída; reabra o panorama'; END IF;
  IF p_sequence>w.sequence THEN
   IF p_action IN('tick','ended') THEN
    elapsed:=EXTRACT(epoch FROM at_time-w.heartbeat_at);delta:=p_position-w.position;
    -- Contiguous frontier: skipped ranges never count. Active time uses the server clock
    -- only during forward, near-1x playback; jitter must not accumulate lost seconds.
    IF w.position IS NOT NULL AND elapsed>0 AND elapsed<=7 AND delta>0 AND delta<=elapsed*1.15+0.25
      AND w.position<=w.covered_seconds+0.15 THEN
     w.covered_seconds:=LEAST(c.duration_seconds,GREATEST(w.covered_seconds,p_position));
     w.active_seconds:=LEAST(c.duration_seconds,w.active_seconds+elapsed);
    END IF;
    -- Once every frame has been covered, allow the terminal receipt to settle the
    -- remaining server-clock/network offset. Coverage itself never advances here.
    IF p_action='ended' AND delta=0 AND elapsed>0 AND elapsed<=7
      AND w.covered_seconds>=c.duration_seconds AND p_position>=c.duration_seconds-0.2 THEN
     w.active_seconds:=LEAST(c.duration_seconds,w.active_seconds+elapsed);
    END IF;
    w.position:=p_position;w.heartbeat_at:=at_time;
    IF p_action='ended' AND p_position>=c.duration_seconds-0.2 AND w.covered_seconds>=c.duration_seconds-0.2 AND w.active_seconds>=c.duration_seconds-0.2 THEN
     -- Last fractional decoder frame tolerance is at most 200 ms.
     w.covered_seconds:=c.duration_seconds;w.ended:=true;
    END IF;
   ELSIF p_action='pause' THEN w.position:=NULL;w.heartbeat_at:=NULL;
   ELSIF p_action='quiz' THEN
    IF NOT w.ended OR w.covered_seconds<c.duration_seconds THEN RAISE EXCEPTION 'Assista a todos os trechos primeiro'; END IF;
    IF jsonb_typeof(p_answers) IS DISTINCT FROM 'object' OR (SELECT count(*) FROM jsonb_object_keys(p_answers))<>2
       OR NOT (p_answers ? '1' AND p_answers ? '2') THEN RAISE EXCEPTION 'Responda às duas perguntas'; END IF;
    SELECT bool_and(p_answers->>(q.id::text)=q.correct_option::text),jsonb_agg(q.explanation ORDER BY q.id)
     INTO ok,fb FROM lab_agent_private.video_questions q WHERE q.video_key=p_video_key;
    w.passed:=w.passed OR COALESCE(ok,false);w.feedback:=fb;
   END IF;
   w.sequence:=p_sequence;
  END IF;
 END IF;
 UPDATE lab_agent_private.video_watch SET session_id=w.session_id,sequence=w.sequence,covered_seconds=w.covered_seconds,active_seconds=w.active_seconds,
 position=w.position,heartbeat_at=w.heartbeat_at,ended=w.ended,passed=w.passed,feedback=w.feedback
 WHERE user_id=u AND video_key=p_video_key AND scope_id=scope;
 IF w.passed AND p_action='quiz' THEN
  IF p_run IS NULL THEN reward:=public.lab_game_video_confirm(p_video_key);ELSE reward:=public.lab_v2_video_confirm(p_run,p_video_key);END IF;
 END IF;
 SELECT CASE WHEN p_run IS NULL THEN EXISTS(SELECT 1 FROM public.lab_game_video_rewards WHERE user_id=u AND video_key=p_video_key)
 ELSE EXISTS(SELECT 1 FROM public.lab_v2_video_rewards WHERE run_id=p_run AND video_key=p_video_key) END INTO awarded;
 IF w.ended THEN SELECT jsonb_agg(jsonb_build_object('id',id,'prompt',prompt,'options',options) ORDER BY id) INTO qs FROM lab_agent_private.video_questions WHERE video_key=p_video_key; END IF;
 RETURN jsonb_build_object('ready',true,'session_id',w.session_id,'sequence',w.sequence,'duration_seconds',c.duration_seconds,
 'covered_seconds',w.covered_seconds,'next_position',w.covered_seconds,'playback_complete',w.ended,
 'already_awarded',awarded,'questions',qs,'feedback',w.feedback,'passed',w.passed,'reward',reward,
 'awarded',COALESCE((reward->>'awarded')::boolean,false),'total_xp',reward->'total_xp');
END;$f$;
REVOKE ALL ON FUNCTION public.lab_video_watch(text,uuid,text,double precision,integer,jsonb,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_video_watch(text,uuid,text,double precision,integer,jsonb,uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.lab_game_video_confirm(text),public.lab_v2_video_confirm(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lab_game_video_confirm(text),public.lab_v2_video_confirm(uuid,text) TO authenticated;

-- Durations verified against official VOD manifests; answer keys are provisioned privately.
INSERT INTO public.lab_video_catalog(video_key,duration_seconds,source_url,ready) VALUES
('guides:1-3-joao',579.91363,'https://bibleproject.com/pt-br/guides/1-3-joao/',false),
('guides:cantico-dos-canticos',408.29267,'https://bibleproject.com/pt-br/guides/cantico-dos-canticos/',false),
('guides:judas',481.001,'https://bibleproject.com/pt-br/guides/judas/',false),
('guides:sofonias',340.83433,'https://bibleproject.com/pt-br/guides/sofonias/',false),
('videos:1-e-2cronicas',402.04427,'https://bibleproject.com/pt-br/videos/1-e-2cronicas/',false),
('videos:1-e-2reis',505.33433,'https://bibleproject.com/pt-br/videos/1-e-2reis/',false),
('videos:1corintios',502.66767,'https://bibleproject.com/pt-br/videos/1corintios/',false),
('videos:1pedro',514.9237,'https://bibleproject.com/pt-br/videos/1pedro/',false),
('videos:1samuel',416.125,'https://bibleproject.com/pt-br/videos/1samuel/',false),
('videos:1tessalonicenses',434.8437,'https://bibleproject.com/pt-br/videos/1tessalonicenses/',false),
('videos:1timoteo',565.04267,'https://bibleproject.com/pt-br/videos/1timoteo/',false),
('videos:2corintios',537.71313,'https://bibleproject.com/pt-br/videos/2corintios/',false),
('videos:2pedro',505.501,'https://bibleproject.com/pt-br/videos/2pedro/',false),
('videos:2samuel',348.72433,'https://bibleproject.com/pt-br/videos/2samuel/',false),
('videos:2tessalonicenses',420.7296,'https://bibleproject.com/pt-br/videos/2tessalonicenses/',false),
('videos:2timoteo',472.70933,'https://bibleproject.com/pt-br/videos/2timoteo/',false),
('videos:ageu',358.626,'https://bibleproject.com/pt-br/videos/ageu/',false),
('videos:amos',450.16767,'https://bibleproject.com/pt-br/videos/amos/',false),
('videos:apocalipse-1-11',745.20933,'https://bibleproject.com/pt-br/videos/apocalipse-1-11/',false),
('videos:apocalipse-12-22',744.126,'https://bibleproject.com/pt-br/videos/apocalipse-12-22/',false),
('videos:atos-1-12',504.41767,'https://bibleproject.com/pt-br/videos/atos-1-12/',false),
('videos:atos-13-28',288.08333,'https://bibleproject.com/pt-br/videos/atos-13-28/',false),
('videos:colossenses',514.28973,'https://bibleproject.com/pt-br/videos/colossenses/',false),
('videos:daniel',584.501,'https://bibleproject.com/pt-br/videos/daniel/',false),
('videos:deuteronomio',537.0458,'https://bibleproject.com/pt-br/videos/deuteronomio/',false),
('videos:eclesiastes-2',502.9117,'https://bibleproject.com/pt-br/videos/eclesiastes-2/',false),
('videos:efesios',545.41767,'https://bibleproject.com/pt-br/videos/efesios/',false),
('videos:esdras-neemias',525.90133,'https://bibleproject.com/pt-br/videos/esdras-neemias/',false),
('videos:ester',564.54267,'https://bibleproject.com/pt-br/videos/ester/',false),
('videos:exodo-1-18',370.83433,'https://bibleproject.com/pt-br/videos/exodo-1-18/',false),
('videos:exodo-19-40',379.20933,'https://bibleproject.com/pt-br/videos/exodo-19-40/',false),
('videos:ezequiel-1-33',433.80933,'https://bibleproject.com/pt-br/videos/ezequiel-1-33/',false),
('videos:ezequiel-34-48',413.45933,'https://bibleproject.com/pt-br/videos/ezequiel-34-48/',false),
('videos:filemom',373.83433,'https://bibleproject.com/pt-br/videos/filemom/',false),
('videos:filipenses',539.29267,'https://bibleproject.com/pt-br/videos/filipenses/',false),
('videos:galatas',579.95933,'https://bibleproject.com/pt-br/videos/galatas/',false),
('videos:genesis-1-11',470.04267,'https://bibleproject.com/pt-br/videos/genesis-1-11/',false),
('videos:genesis-12-50',491.20933,'https://bibleproject.com/pt-br/videos/genesis-12-50/',false),
('videos:habacuque',434.001,'https://bibleproject.com/pt-br/videos/habacuque/',false),
('videos:hebreus',525.376,'https://bibleproject.com/pt-br/videos/hebreus/',false),
('videos:isaias-1-39',516.6254,'https://bibleproject.com/pt-br/videos/isaias-1-39/',false),
('videos:isaias-40-66',533.47557,'https://bibleproject.com/pt-br/videos/isaias-40-66/',false),
('videos:jeremias',455.04267,'https://bibleproject.com/pt-br/videos/jeremias/',false),
('videos:jo-2',713.1217,'https://bibleproject.com/pt-br/videos/jo-2/',false),
('videos:joao-1-12',535.58433,'https://bibleproject.com/pt-br/videos/joao-1-12/',false),
('videos:joao-13-21',520.95933,'https://bibleproject.com/pt-br/videos/joao-13-21/',false),
('videos:joel',433.66767,'https://bibleproject.com/pt-br/videos/joel/',false),
('videos:jonas',564.60667,'https://bibleproject.com/pt-br/videos/jonas/',false),
('videos:josue',495.501,'https://bibleproject.com/pt-br/videos/josue/',false),
('videos:juizes',419.626,'https://bibleproject.com/pt-br/videos/juizes/',false),
('videos:lamentacoes',433.70933,'https://bibleproject.com/pt-br/videos/lamentacoes/',false),
('videos:levitico',527.45933,'https://bibleproject.com/pt-br/videos/levitico/',false),
('videos:lucas-1-9',545.88797,'https://bibleproject.com/pt-br/videos/lucas-1-9/',false),
('videos:lucas-10-24',517.89333,'https://bibleproject.com/pt-br/videos/lucas-10-24/',false),
('videos:malaquias',435.001,'https://bibleproject.com/pt-br/videos/malaquias/',false),
('videos:marcos-2',580.66767,'https://bibleproject.com/pt-br/videos/marcos-2/',false),
('videos:mateus-1-13',541.58367,'https://bibleproject.com/pt-br/videos/mateus-1-13/',false),
('videos:mateus-14-28',462.50467,'https://bibleproject.com/pt-br/videos/mateus-14-28/',false),
('videos:miqueias',440.04267,'https://bibleproject.com/pt-br/videos/miqueias/',false),
('videos:naum',304.33433,'https://bibleproject.com/pt-br/videos/naum/',false),
('videos:numeros',407.29267,'https://bibleproject.com/pt-br/videos/numeros/',false),
('videos:obadias',299.79267,'https://bibleproject.com/pt-br/videos/obadias/',false),
('videos:oseias',440.45933,'https://bibleproject.com/pt-br/videos/oseias/',false),
('videos:proverbios-2',469.126,'https://bibleproject.com/pt-br/videos/proverbios-2/',false),
('videos:romanos-1-4',483.33433,'https://bibleproject.com/pt-br/videos/romanos-1-4/',false),
('videos:romanos-5-16',586.20933,'https://bibleproject.com/pt-br/videos/romanos-5-16/',false),
('videos:rute',450.66767,'https://bibleproject.com/pt-br/videos/rute/',false),
('videos:salmos',519.66767,'https://bibleproject.com/pt-br/videos/salmos/',false),
('videos:tiago',484.41767,'https://bibleproject.com/pt-br/videos/tiago/',false),
('videos:tito',521.626,'https://bibleproject.com/pt-br/videos/tito/',false),
('videos:zacarias',510.001,'https://bibleproject.com/pt-br/videos/zacarias/',false)
ON CONFLICT(video_key) DO NOTHING;
