-- Versioned, idempotent study content cache. Client roles may read only
-- published content whose layer is unlocked by their own completed journey.
-- Generated versions are append-only: a changed prompt/content uses a new version.
BEGIN;

CREATE TABLE public.lab_v2_study_layers (
  layer smallint PRIMARY KEY CHECK (layer BETWEEN 1 AND 3),
  minimum_completed_days smallint NOT NULL UNIQUE CHECK (minimum_completed_days BETWEEN 0 AND 365),
  title text NOT NULL,
  audience text NOT NULL,
  description text NOT NULL
);
ALTER TABLE public.lab_v2_study_layers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_v2_study_layers FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.lab_v2_study_layers TO authenticated, service_role;
CREATE POLICY "Study layer catalog is public to authenticated readers"
  ON public.lab_v2_study_layers FOR SELECT TO authenticated USING (true);

INSERT INTO public.lab_v2_study_layers(layer, minimum_completed_days, title, audience, description)
VALUES
  (1, 0, 'Discipulado para novos convertidos', 'Iniciantes', 'Leitura bíblica, fundamentos do evangelho e práticas devocionais.'),
  (2, 30, 'Preparação de liderança bíblica', 'Liderança em formação', 'Interpretação responsável, serviço cristão e cuidado de pessoas.'),
  (3, 90, 'Teologia completa e fim dos tempos', 'Formação teológica avançada', 'Teologia sistemática, missão, dons e escatologia bíblica.')
ON CONFLICT (layer) DO NOTHING;

CREATE TABLE public.lab_v2_study_content (
  study_key text PRIMARY KEY REFERENCES public.lab_v2_study_catalog(study_key) ON DELETE RESTRICT,
  journey_key text NOT NULL CHECK (journey_key ~ '^[a-z0-9-]{2,40}$'),
  journey_day smallint NOT NULL CHECK (journey_day BETWEEN 1 AND 366),
  chapter_refs text[] NOT NULL CHECK (
    cardinality(chapter_refs) BETWEEN 1 AND 4
    AND array_position(chapter_refs, NULL) IS NULL
    AND array_to_string(chapter_refs, ',') ~ '^[0-9]{1,2}:[0-9]{1,3}(,[0-9]{1,2}:[0-9]{1,3}){0,3}$'
  ),
  layer smallint NOT NULL REFERENCES public.lab_v2_study_layers(layer),
  content_version text NOT NULL CHECK (content_version ~ '^[A-Za-z0-9._-]{1,40}$'),
  cache_key text GENERATED ALWAYS AS (
    journey_key || ':' || journey_day::text || ':' || array_to_string(chapter_refs, ',')
      || ':L' || layer::text || ':' || content_version
  ) STORED UNIQUE,
  source_kind text NOT NULL CHECK (source_kind IN ('curated', 'generated_cache')),
  publication_status text NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft', 'published')),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 3 AND 180),
  content jsonb NOT NULL CHECK (jsonb_typeof(content) = 'object'),
  provider_model text CHECK (provider_model IS NULL OR length(provider_model) <= 100),
  cached_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  UNIQUE (journey_key, journey_day, chapter_refs, layer, content_version)
);
CREATE INDEX lab_v2_study_content_lookup
  ON public.lab_v2_study_content(journey_key, journey_day, layer, content_version);
ALTER TABLE public.lab_v2_study_content ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lab_v2_study_content FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.lab_v2_study_content TO authenticated;
GRANT SELECT, INSERT ON public.lab_v2_study_content TO service_role;
CREATE POLICY "Own journey may read published unlocked study cache"
  ON public.lab_v2_study_content FOR SELECT TO authenticated USING (
    publication_status = 'published'
    AND EXISTS (
      SELECT 1
        FROM public.lab_v2_runs r
        JOIN public.lab_v2_study_layers l ON l.layer = lab_v2_study_content.layer
       WHERE r.user_id = (SELECT auth.uid())
         AND r.plan_length IN (365, 366)
         AND (
           SELECT count(*)::integer
             FROM public.lab_v2_stages s
            WHERE s.run_id = r.id AND s.completed_at IS NOT NULL
         ) >= l.minimum_completed_days
    )
  );

-- A reward is one study unit per run, independent of generated content version.
-- Existing grants are preserved as legacy units; the new uniqueness key prevents
-- publishing a revised cache version from minting XP again for the same passages.
ALTER TABLE public.lab_v2_study_rewards
  ADD COLUMN study_unit_key text;
UPDATE public.lab_v2_study_rewards r
   SET study_unit_key = COALESCE(
     (
       SELECT c.journey_key || ':' || c.journey_day::text || ':'
         || pg_catalog.array_to_string(c.chapter_refs, ',')
         || ':L' || c.layer::text
         FROM public.lab_v2_study_content c
        WHERE c.study_key = r.study_key
     ),
     'legacy:' || r.study_key
   )
 WHERE r.study_unit_key IS NULL;
ALTER TABLE public.lab_v2_study_rewards
  ALTER COLUMN study_unit_key SET NOT NULL;
ALTER TABLE public.lab_v2_study_rewards
  ADD CONSTRAINT lab_v2_study_rewards_run_unit_unique
  UNIQUE (run_id, study_unit_key);
COMMENT ON COLUMN public.lab_v2_study_rewards.study_unit_key IS
  'Version-independent journey/day/reference/layer key; prevents duplicate XP across content revisions.';

-- Content catalog is an administrative lookup; direct client writes remain denied.
REVOKE INSERT, UPDATE, DELETE ON public.lab_v2_study_catalog FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.lab_v2_study_catalog TO service_role;

INSERT INTO public.lab_v2_study_catalog(study_key, title, xp)
VALUES
  ('d1-genesis1-john1-layer1-2026-10-v1', 'No princípio: o Criador e a Palavra', 15),
  ('d1-psalm1-layer1-2026-10-v1', 'Dois caminhos, uma escolha diária', 15),
  ('d2-genesis2-3-layer1-2026-10-v1', 'Vocação, limite e queda', 15),
  ('d2-john2-layer1-2026-10-v1', 'O primeiro sinal e a confiança em Jesus', 15),
  ('d3-genesis4-5-layer1-2026-10-v1', 'Violência, memória e esperança na genealogia', 15),
  ('d3-psalm2-layer1-2026-10-v1', 'O Rei de Deus e a esperança das nações', 15)
ON CONFLICT (study_key) DO NOTHING;

INSERT INTO public.lab_v2_study_content
  (study_key, journey_key, journey_day, chapter_refs, layer, content_version,
   source_kind, publication_status, title, content)
VALUES
('d1-genesis1-john1-layer1-2026-10-v1','bible-annual',1,'{1:1,43:1}'::text[],1,'2026-10-v1','curated','published','No princípio: o Criador e a Palavra','{"title":"No princípio: o Criador e a Palavra","summary":"Gênesis 1 apresenta Deus criando e ordenando todas as coisas; João 1 anuncia que a Palavra eterna estava com Deus e que tudo veio a existir por meio dela. João retoma a linguagem do princípio sem apagar o sentido próprio de Gênesis.","context":"Gênesis 1 organiza a narrativa da criação em atos de palavra, distinção e bondade. João 1 começa com um prólogo sobre a Palavra, a vida e a luz, e a identifica com Jesus Cristo, que se fez carne.","exegesis":"Em Gênesis, Deus fala, a criação responde e a humanidade recebe dignidade e responsabilidade como imagem de Deus. Em João, a Palavra não é uma criatura: ela existe no princípio, está com Deus e é Deus; a vida e a luz chegam às pessoas por meio dela.","theological_connection":"A conexão é direta: João 1:1 ecoa Gênesis 1:1 e João 1:3 atribui à Palavra a criação de todas as coisas. Os textos ensinam juntos que o Criador não depende da criação e que Jesus é a Palavra eterna, sem transformar cada detalhe de Gênesis em alegoria.","pentecostal_arminian_lens":"A criação é dom e chamado, não destino impessoal. Deus toma a iniciativa de revelar-se e chamar as pessoas; sua graça capacita uma resposta real de fé e obediência. Cristo é o centro da revelação e o Espírito Santo conduz a vida de discipulado.","application":"Receba a vida como dádiva de Deus. Separe alguns minutos para agradecer por algo criado, escolha uma responsabilidade concreta para cuidar bem hoje e leve uma decisão à luz das palavras de Jesus.","reflection_questions":["O que a criação revela sobre o caráter de Deus?","Como João apresenta a Palavra em relação ao Criador?","Que parte da sua rotina precisa ser vivida com mais gratidão e responsabilidade?"],"prayer":"Deus Criador, obrigado pela vida e pela luz que recebemos em Jesus. Ajuda-me a ouvir tua Palavra, responder com fé e cuidar com fidelidade do que confiaste a mim. Amém.","references":["Gênesis 1:1-31","João 1:1-14"]}'::jsonb),
('d1-psalm1-layer1-2026-10-v1','bible-annual',1,'{19:1}'::text[],1,'2026-10-v1','curated','published','Dois caminhos, uma escolha diária','{"title":"Dois caminhos, uma escolha diária","summary":"O Salmo 1 descreve a vida enraizada na instrução do Senhor e contrasta esse caminho com uma vida sem raízes.","context":"Este salmo abre o Saltério como uma introdução à oração e à sabedoria bíblica. A árvore junto às águas é uma imagem de permanência e fruto no tempo certo.","exegesis":"O justo não é apresentado como alguém sem luta, mas como quem recebe prazer e orientação na lei do Senhor. O contraste com a palha mostra que escolhas têm direção e consequência.","theological_connection":"Este estudo permanece separado de Gênesis 1 e João 1: o Salmo 1 desenvolve o tema da sabedoria e da fidelidade à instrução, sem uma ligação exegética direta com a narrativa da criação ou o prólogo de João.","pentecostal_arminian_lens":"A Palavra chama a pessoa a responder continuamente. A graça de Deus sustenta a obediência e a comunhão com o Espírito, sem tratar a escolha humana como irrelevante.","application":"Escolha um versículo do salmo para reler durante o dia. Identifique uma influência que o afasta de Deus e uma prática simples que pode criar raízes na Palavra.","reflection_questions":["Que imagens do salmo descrevem uma vida frutífera?","Qual hábito ajuda você a meditar na Palavra?","Que escolha concreta pode expressar fidelidade hoje?"],"prayer":"Senhor, firma meus passos na tua Palavra. Dá-me disposição para aprender, discernimento para escolher o bem e constância para produzir fruto no tempo certo. Amém.","references":["Salmo 1:1-6"]}'::jsonb),
('d2-genesis2-3-layer1-2026-10-v1','bible-annual',2,'{1:2,1:3}'::text[],1,'2026-10-v1','curated','published','Vocação, limite e queda','{"title":"Vocação, limite e queda","summary":"Gênesis 2 apresenta a humanidade no jardim com vocação e limite; Gênesis 3 narra a desconfiança, a desobediência e suas consequências.","context":"A narrativa aprofunda a criação da humanidade e descreve a ruptura da comunhão com Deus, entre as pessoas e com a terra.","exegesis":"O ser humano recebe tarefa e companhia, e o mandamento delimita a liberdade para proteger a vida. A serpente distorce a palavra de Deus; a escolha humana traz vergonha, acusação e afastamento, mas Deus continua procurando e falando com as pessoas.","theological_connection":"Gênesis 2 e 3 formam uma sequência narrativa direta: vocação e mandamento precedem a tentação e a queda. João 2 é um relato separado sobre o início dos sinais de Jesus e não será forçado a caber nesta conexão.","pentecostal_arminian_lens":"A tentação não torna a responsabilidade humana fictícia. Deus inicia a busca e oferece esperança; sua graça precede a resposta humana e chama à reconciliação.","application":"Nomeie um limite saudável que protege sua comunhão com Deus e com o próximo. Quando errar, procure a verdade, assuma responsabilidade e volte-se para Deus em arrependimento.","reflection_questions":["Que vocação o texto atribui à humanidade?","Como a tentação altera a compreensão da palavra de Deus?","Qual é a diferença entre culpa, responsabilidade e retorno a Deus?"],"prayer":"Deus de misericórdia, ajuda-me a confiar na tua palavra, assumir minhas escolhas e receber a graça que me chama de volta à comunhão contigo. Amém.","references":["Gênesis 2:1-25","Gênesis 3:1-24"]}'::jsonb),
('d2-john2-layer1-2026-10-v1','bible-annual',2,'{43:2}'::text[],1,'2026-10-v1','curated','published','O primeiro sinal e a confiança em Jesus','{"title":"O primeiro sinal e a confiança em Jesus","summary":"Em Caná, Jesus transforma água em vinho; João apresenta o sinal como manifestação de sua glória que conduz os discípulos à fé.","context":"O episódio está no início do ministério público de Jesus. O narrador relaciona o sinal à revelação da glória de Cristo e à resposta dos discípulos.","exegesis":"A necessidade é apresentada a Jesus, que age no tempo e do modo que determina. Os serventes obedecem a instrução recebida e testemunham o resultado. O centro do relato é a identidade de Jesus, não uma fórmula para obter prosperidade.","theological_connection":"João 2 é um estudo separado dos capítulos de Gênesis do mesmo dia: o texto apresenta um sinal de Jesus e uma resposta de fé, sem uma conexão exegética direta com Gênesis 2 ou 3.","pentecostal_arminian_lens":"Os sinais servem ao testemunho de Cristo e convidam à fé. A resposta dos discípulos é real, e a missão de Jesus revela a iniciativa graciosa de Deus.","application":"Leve uma necessidade a Jesus em oração, sem transformar a oração em exigência. Pratique uma instrução clara do evangelho e observe como ela serve ao próximo.","reflection_questions":["O que o sinal revela sobre Jesus?","Que papel os serventes desempenham na narrativa?","Como distinguir fé em Cristo de uma tentativa de controlar Deus?"],"prayer":"Jesus, revela tua glória e ensina-me a confiar em ti. Dá-me prontidão para obedecer à tua palavra e servir com humildade. Amém.","references":["João 2:1-11"]}'::jsonb),
('d3-genesis4-5-layer1-2026-10-v1','bible-annual',3,'{1:4,1:5}'::text[],1,'2026-10-v1','curated','published','Violência, memória e esperança na genealogia','{"title":"Violência, memória e esperança na genealogia","summary":"Gênesis 4 expõe a violência de Caim e registra a continuidade da vida; Gênesis 5 acompanha gerações e destaca a caminhada de Enoque com Deus.","context":"Depois da queda, os capítulos acompanham a expansão da humanidade e mostram tanto a violência quanto a preservação da vida ao longo das gerações.","exegesis":"Deus adverte Caim antes do assassinato e o responsabiliza depois. A genealogia de Gênesis 5 repete a realidade da morte, mas também nomeia pessoas, famílias e a caminhada de Enoque com Deus.","theological_connection":"Gênesis 4 e 5 são uma sequência narrativa: a história de Caim e a linhagem de Sete mostram rumos humanos distintos depois da queda. O Salmo 2, lido no mesmo dia, será estudado à parte por pertencer à poesia real e não à genealogia de Gênesis.","pentecostal_arminian_lens":"A advertência de Deus trata a escolha com seriedade, e sua preservação da vida mostra misericórdia. A comunhão com Deus é uma caminhada contínua, sustentada por sua graça.","application":"Interrompa cedo uma reação de ira; procure reconciliação segura e responsável. Registre o nome de alguém que lhe transmitiu fé e agradeça por essa herança.","reflection_questions":["Que advertência Deus faz a Caim?","O que as genealogias preservam na memória do povo?","Como a caminhada de Enoque oferece um exemplo de comunhão?"],"prayer":"Senhor, guarda meu coração da violência e ajuda-me a caminhar contigo com perseverança. Sustenta minha família e minha comunidade na verdade e na misericórdia. Amém.","references":["Gênesis 4:1-26","Gênesis 5:1-32"]}'::jsonb),
('d3-psalm2-layer1-2026-10-v1','bible-annual',3,'{19:2}'::text[],1,'2026-10-v1','curated','published','O Rei de Deus e a esperança das nações','{"title":"O Rei de Deus e a esperança das nações","summary":"O Salmo 2 retrata a oposição dos governantes ao Senhor e ao seu Ungido e convida as nações a se refugiarem em Deus.","context":"Este salmo real apresenta linguagem de entronização e autoridade. O Novo Testamento o lê à luz de Jesus, sem apagar seu contexto poético e político.","exegesis":"A rebelião humana não remove a autoridade de Deus. O salmo combina juízo e convite: os governantes são advertidos e, ao mesmo tempo, chamados a buscar refúgio no Senhor.","theological_connection":"O Salmo 2 é tratado separadamente de Gênesis 4 e 5: ele pertence à poesia real e apresenta um convite de esperança às nações, sem ligação direta com a genealogia.","pentecostal_arminian_lens":"A soberania de Deus é apresentada junto a um convite verdadeiro ao arrependimento e ao refúgio. A missão cristã anuncia Cristo às nações com esperança e responsabilidade.","application":"Ore por autoridades e povos em conflito. Em uma decisão de liderança, prefira justiça, serviço e reconciliação a domínio e autopromoção.","reflection_questions":["Como o salmo combina advertência e convite?","O que significa refugiar-se no Senhor?","Como anunciar a esperança de Cristo com humildade?"],"prayer":"Senhor, reina com justiça e conduz as nações à paz. Dá-me coragem para confiar em Cristo e humildade para servir. Amém.","references":["Salmo 2:1-12","Atos 4:25-27","Hebreus 1:5"]}'::jsonb)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.lab_v2_confirm_study(
  p_run uuid,
  p_study_key text,
  p_acknowledged boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = ''
AS $fn$
DECLARE
  v_user uuid := auth.uid();
  v_run public.lab_v2_runs%ROWTYPE;
  v_content public.lab_v2_study_content%ROWTYPE;
  v_minimum_days integer;
  v_completed_days integer;
  v_new integer;
  v_state jsonb;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Entre na sua conta'; END IF;
  IF p_acknowledged IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Confirme que examinou as referências do estudo';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 2116));
  SELECT * INTO v_run
    FROM public.lab_v2_runs
   WHERE id = p_run AND user_id = v_user
   FOR UPDATE;
  IF NOT FOUND OR v_run.status <> 'active' THEN
    RAISE EXCEPTION 'Jornada não ativa';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.lab_v2_release_controls
     WHERE singleton = true AND enabled = true
  ) THEN RAISE EXCEPTION 'Jornada V2 indisponível'; END IF;

  SELECT c.* INTO v_content
    FROM public.lab_v2_study_content c
   WHERE c.study_key = p_study_key
     AND c.journey_key = 'bible-annual'
     AND c.publication_status = 'published';
  IF NOT FOUND THEN RAISE EXCEPTION 'Estudo não credenciado ou indisponível'; END IF;
  SELECT l.minimum_completed_days INTO v_minimum_days
    FROM public.lab_v2_study_layers l
   WHERE l.layer = v_content.layer;
  SELECT count(*)::integer INTO v_completed_days
    FROM public.lab_v2_stages
   WHERE run_id = p_run AND completed_at IS NOT NULL;
  IF v_completed_days < v_minimum_days THEN
    RAISE EXCEPTION 'Camada % bloqueada: conclua % etapas para desbloquear',
      v_content.layer, v_minimum_days;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.lab_v2_stages s
     WHERE s.run_id = p_run
       AND s.day_number = v_content.journey_day
       AND s.completed_at IS NOT NULL
  ) THEN RAISE EXCEPTION 'Conclua a leitura do dia relacionado antes de confirmar o estudo'; END IF;
  IF EXISTS (
    SELECT ref.chapter_id
      FROM pg_catalog.unnest(v_content.chapter_refs) AS ref(chapter_id)
     WHERE NOT EXISTS (
       SELECT 1 FROM public.lab_v2_plan_chapters p
        WHERE p.plan_length = v_run.plan_length
          AND p.day_number = v_content.journey_day
          AND p.chapter_id = ref.chapter_id
     )
  ) THEN RAISE EXCEPTION 'As referências do estudo não pertencem ao plano deste dia'; END IF;
  IF EXISTS (
    SELECT ref.chapter_id
      FROM pg_catalog.unnest(v_content.chapter_refs) AS ref(chapter_id)
     WHERE NOT EXISTS (
       SELECT 1 FROM public.lab_v2_chapter_checks c
        WHERE c.run_id = p_run
          AND c.day_number = v_content.journey_day
          AND c.chapter_id = ref.chapter_id
     )
  ) THEN RAISE EXCEPTION 'Confirme a leitura de todos os capítulos deste estudo'; END IF;

  INSERT INTO public.lab_v2_study_rewards(run_id, study_key, study_unit_key)
  VALUES (
    p_run,
    p_study_key,
    v_content.journey_key || ':' || v_content.journey_day::text || ':'
      || pg_catalog.array_to_string(v_content.chapter_refs, ',')
      || ':L' || v_content.layer::text
  )
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_new = ROW_COUNT;
  v_state := public.lab_v2_sync(p_run);
  RETURN jsonb_build_object(
    'study_key', p_study_key,
    'awarded', v_new > 0,
    'study_xp', CASE WHEN v_new > 0 THEN 15 ELSE 0 END,
    'total_xp', (v_state->>'run_xp')::integer,
    'studies_this_run', (v_state->>'studies_this_run')::integer
  );
END;
$fn$;
REVOKE ALL ON FUNCTION public.lab_v2_confirm_study(uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lab_v2_confirm_study(uuid, text, boolean) TO authenticated;

COMMENT ON TABLE public.lab_v2_study_content IS
  'Append-only versioned study cache. Cache uniqueness includes content version; XP rewards remain idempotent across versions by study unit.';
COMMENT ON TABLE public.lab_v2_study_layers IS
  'Progressive study layers: new believer (0 days), leadership preparation (30), complete theology and eschatology (90).';
COMMENT ON COLUMN public.lab_v2_study_content.cache_key IS
  'Stable idempotency key; change content_version to create a new cache version.';

COMMIT;
