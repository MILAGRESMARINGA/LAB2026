import {CANON} from './canon';

/** Curated retrieval, not a claim that an LLM or a fine-tuned model was deployed. */
export const JOURNEY_EVIDENCE_POLICY = {
  version: '2026-11-02',
  retrieval: 'deterministic-book-chapter',
  llmGeneration: 'not-enabled',
  fineTuning: 'not-performed',
  readingOrder: 'preserve-existing-plan',
  review: 'Human editorial review is required before adding chronology, coordinates or theological claims.',
} as const;

export type EvidenceConfidence = 'textual' | 'corroborated' | 'approximate' | 'disputed';
export type JourneyEvidence = {
  id: string;
  title: string;
  kind: 'scriptural-narrative' | 'historical-corroboration' | 'editorial-inference';
  references: readonly string[];
  url: string;
  claim: string;
  confidence: EvidenceConfidence;
  source: {publisher: string; title: string; url: string; retrievedAt: string};
  /** Describes what the source supports; never automatically dates every chapter. */
  scope: string;
  caution?: string;
};
type Range = readonly [book: string, from: number, to: number];
type Entry = {evidence: JourneyEvidence; ranges: readonly Range[]};
const scripture = (reference: string) => `https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=ARC`;
const entry = (
  id: string, title: string, kind: JourneyEvidence['kind'], confidence: EvidenceConfidence,
  references: string[], claim: string, ranges: Range[],
  publisher = 'Texto bíblico', url = scripture(references[0]), caution?: string,
): Entry => ({ranges, evidence: {
  id, title, kind, confidence, references, claim, url,
  source: {publisher, title, url, retrievedAt: '2026-11-02'},
  scope: references.join('; '), ...(caution ? {caution} : {}),
}});

/** Sources are curated independently of the user's reference illustrations. */
const CATALOG: readonly Entry[] = [
  entry('eden-region', 'Éden: referência narrativa, localização incerta', 'editorial-inference', 'disputed',
    ['Gênesis 2:8-14'], 'O texto nomeia rios; o marco regional do jogo é simbólico e não comprova coordenadas do jardim.', [['Gênesis',1,3]],
    'Texto bíblico', undefined, 'Não existe localização exata consensual a apresentar como descoberta arqueológica.'),
  entry('ararat-region', 'Noé: montanhas, não um pico comprovado', 'scriptural-narrative', 'textual',
    ['Gênesis 8:4'], 'A narrativa menciona as montanhas de Ararate; um ponto gráfico representa a região, sem identificar um sítio da arca.', [['Gênesis',6,9]]),
  entry('patriarch-route', 'Abraão: etapas nomeadas no relato', 'scriptural-narrative', 'textual',
    ['Gênesis 11:31–12:9'], 'Ur, Harã e Canaã estruturam a caminhada de Abraão; os traçados entre marcos são ilustrações editoriais.', [['Gênesis',11,12]]),
  entry('joseph-egypt', 'José no Egito', 'scriptural-narrative', 'textual',
    ['Gênesis 39:1','Gênesis 46:28-34'], 'A narrativa situa José no Egito e a chegada da família em Gósen.', [['Gênesis',39,50]]),
  entry('exodus-route', 'Êxodo: sequência narrativa e rota aproximada', 'editorial-inference', 'approximate',
    ['Êxodo 13:17-22','Êxodo 14','Êxodo 19:1-2','Números 33'], 'Egito, deserto e Sinai seguem a sequência do relato; linhas no mapa não estabelecem a rota moderna exata.', [['Êxodo',13,19],['Números',33,33]],
    'BibleProject', 'https://bibleproject.com/pt-br/guides/exodo/', 'A fonte contextualiza o relato; não valida coordenadas ou uma identificação exclusiva do Sinai.'),
  entry('sinai-stay', 'Uma mesma região atravessa livros', 'scriptural-narrative', 'textual',
    ['Êxodo 19:1-2','Levítico 27:34','Números 10:11-12'], 'A mudança de livro não exige mudar a câmera: a narrativa permanece no Sinai até a partida em Números.', [['Êxodo',19,40],['Levítico',1,27],['Números',1,10]],
    'BibleProject', 'https://bibleproject.com/podcasts/testing-mount-sinai/'),
  entry('temple-reconstruction', 'Templo: visualização baseada no texto', 'editorial-inference', 'approximate',
    ['1 Reis 6–7','2 Crônicas 3–4'], 'Os capítulos descrevem o templo e seus utensílios; a maquete 3D é uma reconstrução interpretativa.', [['1 Reis',6,7],['2 Crônicas',3,4]],
    'Texto bíblico', undefined, 'Não tratar a imagem enviada como fotografia histórica ou planta arqueológica exata.'),
  entry('priestly-breastpiece', 'Peitoral sacerdotal: texto e ilustração', 'editorial-inference', 'approximate',
    ['Êxodo 28:15-30','Êxodo 39:8-21'], 'O texto descreve doze pedras e os nomes das tribos; cores e aparência do modelo são escolhas de reconstrução.', [['Êxodo',28,28],['Êxodo',39,39]],
    'Texto bíblico', undefined, 'Não inventar um mecanismo de uso do Urim e Tumim a partir da ilustração.'),
  entry('isaiah-kings', 'Isaías e os reis de Judá', 'scriptural-narrative', 'textual',
    ['Isaías 1:1','2 Reis 15–20','2 Crônicas 26–32'], 'O cabeçalho de Isaías nomeia Uzias, Jotão, Acaz e Ezequias; as leituras históricas oferecem contexto paralelo.', [['Isaías',1,66],['2 Reis',15,20],['2 Crônicas',26,32]]),
  entry('hosea-amos-kings', 'Oséias e Amós: contexto dos reinos', 'scriptural-narrative', 'textual',
    ['Oséias 1:1','Amós 1:1','2 Reis 14–15'], 'Os cabeçalhos ligam esses profetas aos reinados citados; isso oferece contexto sem reorganizar o plano de leitura.', [['Oséias',1,14],['Amós',1,9],['2 Reis',14,15]]),
  entry('micah-kings', 'Miqueias no contexto de Judá', 'scriptural-narrative', 'textual',
    ['Miqueias 1:1','2 Reis 15–20'], 'Miqueias nomeia Jotão, Acaz e Ezequias e anuncia palavras sobre Samaria e Jerusalém.', [['Miqueias',1,7]]),
  entry('jeremiah-exile', 'Jeremias e o fim do reino de Judá', 'scriptural-narrative', 'textual',
    ['Jeremias 1:1-3','2 Reis 22–25','2 Crônicas 34–36'], 'O cabeçalho situa o ministério entre Josias e o exílio de Jerusalém; os livros históricos contextualizam os reis.', [['Jeremias',1,52],['2 Reis',22,25],['2 Crônicas',34,36]]),
  entry('ezekiel-exile', 'Ezequiel entre os exilados', 'scriptural-narrative', 'textual',
    ['Ezequiel 1:1-3','2 Reis 24:10-16'], 'Ezequiel se apresenta entre os exilados junto ao rio Quebar, datando a visão pelo exílio de Joaquim.', [['Ezequiel',1,48]]),
  entry('lachish-object', 'Laquis: testemunho assírio', 'historical-corroboration', 'corroborated',
    ['2 Reis 18:13-17','Isaías 36:1-3','2 Crônicas 32:9'], 'Relevos assírios e achados de Laquis documentam o cerco de Senaqueribe em 701 a.C., contextualizando a campanha em Judá.', [['2 Reis',18,18],['Isaías',36,36],['2 Crônicas',32,32]],
    'British Museum', 'https://britishmuseum.iro.bl.uk/entities/publication/9b64b0c6-4d6e-4b08-9b15-b60c77e1d8fc', 'Corrobora a campanha; não comprova automaticamente todos os detalhes dos relatos bíblicos.'),
  entry('cyrus-context', 'Ciro: contexto persa do retorno', 'historical-corroboration', 'corroborated',
    ['Esdras 1:1-4','Esdras 6:1-5'], 'O Cilindro de Ciro registra sua conquista de Babilônia e medidas de restauração de cultos e povos.', [['Esdras',1,1],['Esdras',6,6]],
    'British Museum', 'https://artsandculture.google.com/asset/cyrus-cylinder/4wHjbQnYhZgzVQ?hl=en', 'O cilindro não menciona os judeus: é contexto imperial, não uma cópia do decreto de Esdras.'),
  entry('haggai-zechariah-ezra', 'Ageu e Zacarias na reconstrução', 'scriptural-narrative', 'textual',
    ['Esdras 5:1-2','Esdras 6:14-15','Ageu 1:1','Zacarias 1:1'], 'Esdras conecta explicitamente Ageu e Zacarias ao incentivo à reconstrução do templo.', [['Ageu',1,2],['Zacarias',1,14],['Esdras',5,6]],
    'BibleProject', 'https://bibleproject.com/guides/book-of-zechariah/', 'Esse vínculo não situa todos os profetas no tempo de Neemias.'),
  entry('joel-date', 'Joel: datação debatida', 'editorial-inference', 'disputed',
    ['Joel 1:1'], 'Joel não fornece um reinado no cabeçalho; a cronologia não deve receber um ano exato por causa de uma tabela ilustrativa.', [['Joel',1,3]],
    'Crossway · ESV Global Study Bible', 'https://www.esv.org/resources/esv-global-study-bible/introduction-to-joel/', 'Existem propostas diferentes; o posicionamento cronológico exige revisão editorial.'),
  entry('obadiah-date', 'Obadias: datação debatida', 'editorial-inference', 'disputed',
    ['Obadias 1:1','Obadias 1:10-14'], 'A data de Obadias não pode ser estabelecida com segurança apenas pelo cabeçalho ou pela ordem canônica.', [['Obadias',1,1]],
    'Reformed Theological Review', 'https://rtrjournal.org/index.php/RTR/article/view/286', 'O artigo apresenta uma proposta de data, reconhecendo a dificuldade de estabelecer a proveniência com confiança.'),
];

/** Invalid chapters yield no evidence. Absence is explicit, never replaced by invented context. */
export function getJourneyEvidence({book, chapter}: {book: string; chapter: number}): JourneyEvidence[] {
  const canonical = CANON.find(([name]) => name === book);
  if (!canonical || !Number.isInteger(chapter) || chapter < 1 || chapter > canonical[1]) return [];
  return CATALOG.filter(({ranges}) => ranges.some(([name, from, to]) => name === book && chapter >= from && chapter <= to))
    .map(({evidence}) => ({...evidence, references: [...evidence.references], source: {...evidence.source}}));
}
