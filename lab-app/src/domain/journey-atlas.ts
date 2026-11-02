import {CANON,CHAPTERS,type Chapter} from './canon';
import type {GameDay} from './game-plan';
import {chapterJourneyContext} from './journey-geography';

export type AtlasBiome='river'|'desert'|'mountain'|'green'|'sea';
export type AtlasPlace={name:string;lon:number;lat:number;biome:AtlasBiome};
/** Regional scene anchors, rounded deliberately. Never coordinates of an unproven event. */
export const ATLAS_PLACES={
 mesopotamia:{name:'Mesopotâmia',lon:45,lat:33,biome:'river'},
 eden:{name:'Éden · localização incerta',lon:45,lat:33,biome:'river'},
 egypt:{name:'Egito · Nilo',lon:31,lat:29,biome:'desert'},
 goshen:{name:'Gósen · delta do Nilo',lon:31.9,lat:30.7,biome:'river'},
 midian:{name:'Midiã · região aproximada',lon:35.5,lat:28.5,biome:'desert'},
 sinai:{name:'Sinai',lon:34,lat:29,biome:'mountain'},
 wilderness:{name:'Deserto de Parã',lon:34.5,lat:30,biome:'desert'},
 kadesh:{name:'Cades-Barneia · região',lon:34.4,lat:30.6,biome:'desert'},
 canaan:{name:'Canaã',lon:35.2,lat:31.8,biome:'green'},
 edom:{name:'Edom · Seir',lon:35.5,lat:30.4,biome:'mountain'},
 rabbah:{name:'Rabá · Amom',lon:35.9,lat:32,biome:'mountain'},
 israel:{name:'Reino de Israel · norte',lon:35.3,lat:32.5,biome:'green'},
 moab:{name:'Moabe',lon:36,lat:31,biome:'desert'},
 nebo:{name:'Monte Nebo · região',lon:35.7,lat:31.8,biome:'mountain'},
 haran:{name:'Harã',lon:39,lat:37,biome:'green'},
 ur:{name:'Ur · identificação tradicional',lon:46.1,lat:31,biome:'river'},
 babel:{name:'Babel · Babilônia',lon:44.4,lat:32.5,biome:'river'},
 ararat:{name:'Montanhas de Ararate · região',lon:44,lat:39.5,biome:'mountain'},
 persia:{name:'Susã',lon:48.3,lat:32.2,biome:'desert'},
 nineveh:{name:'Nínive',lon:43.2,lat:36.4,biome:'river'},
 uz:{name:'Uz · localização incerta',lon:39,lat:30,biome:'desert'},
 jerusalem:{name:'Jerusalém',lon:35.23,lat:31.78,biome:'mountain'},
 bethlehem:{name:'Belém',lon:35.2,lat:31.7,biome:'mountain'},
 hebron:{name:'Hebrom',lon:35.1,lat:31.5,biome:'mountain'},
 shechem:{name:'Siquém',lon:35.3,lat:32.2,biome:'mountain'},
 bethel:{name:'Betel',lon:35.2,lat:31.9,biome:'mountain'},
 shiloh:{name:'Siló',lon:35.3,lat:32.1,biome:'mountain'},
 jericho:{name:'Jericó',lon:35.4,lat:31.9,biome:'river'},
 jordan:{name:'Vale do Jordão',lon:35.6,lat:32,biome:'river'},
 beersheba:{name:'Berseba',lon:34.8,lat:31.2,biome:'desert'},
 gaza:{name:'Gaza · território filisteu',lon:34.5,lat:31.5,biome:'green'},
 philistia:{name:'Planície dos filisteus',lon:34.7,lat:31.7,biome:'green'},
 ramah:{name:'Ramá · região de Samuel',lon:35.2,lat:31.85,biome:'mountain'},
 gibeah:{name:'Gibeá · região',lon:35.23,lat:31.82,biome:'mountain'},
 samaria:{name:'Samaria',lon:35.2,lat:32.3,biome:'mountain'},
 jezreel:{name:'Vale de Jezreel',lon:35.3,lat:32.6,biome:'green'},
 carmel:{name:'Monte Carmelo',lon:35,lat:32.7,biome:'mountain'},
 tyre:{name:'Tiro e Sidom',lon:35.2,lat:33.3,biome:'green'},
 damascus:{name:'Damasco',lon:36.3,lat:33.5,biome:'green'},
 gilead:{name:'Gileade',lon:35.8,lat:32.4,biome:'mountain'},
 galilee:{name:'Galileia',lon:35.5,lat:32.8,biome:'green'},
 nazareth:{name:'Nazaré',lon:35.3,lat:32.7,biome:'mountain'},
 capernaum:{name:'Cafarnaum · mar da Galileia',lon:35.6,lat:32.9,biome:'river'},
 bethany:{name:'Betânia · Judeia',lon:35.3,lat:31.8,biome:'mountain'},
 caesarea:{name:'Cesareia Marítima',lon:34.9,lat:32.5,biome:'green'},
 joppa:{name:'Jope',lon:34.8,lat:32.1,biome:'green'},
 antioch:{name:'Antioquia da Síria',lon:36.2,lat:36.2,biome:'green'},
 cyprus:{name:'Chipre',lon:33,lat:35,biome:'green'},
 anatolia:{name:'Ásia Menor',lon:32,lat:38,biome:'mountain'},
 lystra:{name:'Listra e Derbe',lon:32.4,lat:37.6,biome:'green'},
 troas:{name:'Trôade',lon:26.2,lat:39.8,biome:'green'},
 ephesus:{name:'Éfeso',lon:27.3,lat:37.9,biome:'green'},
 colossae:{name:'Colossos',lon:29.3,lat:37.8,biome:'mountain'},
 miletus:{name:'Mileto',lon:27.3,lat:37.5,biome:'green'},
 myra:{name:'Mira · Lícia',lon:30,lat:36.3,biome:'green'},
 cnidus:{name:'Cnido',lon:27.4,lat:36.7,biome:'green'},
 syracuse:{name:'Siracusa',lon:15.3,lat:37.1,biome:'green'},
 rhegium:{name:'Régio',lon:15.7,lat:38.1,biome:'green'},
 puteoli:{name:'Putéoli',lon:14.1,lat:40.8,biome:'green'},
 greece:{name:'Grécia',lon:23,lat:38,biome:'green'},
 philippi:{name:'Filipos',lon:24.3,lat:41,biome:'green'},
 thessalonica:{name:'Tessalônica',lon:22.9,lat:40.6,biome:'green'},
 athens:{name:'Atenas',lon:23.7,lat:38,biome:'green'},
 corinth:{name:'Corinto',lon:22.9,lat:37.9,biome:'green'},
 rome:{name:'Roma',lon:12.5,lat:41.9,biome:'green'},
 patmos:{name:'Patmos',lon:26.5,lat:37.3,biome:'green'},
 crete:{name:'Creta',lon:25,lat:35.2,biome:'green'},
 malta:{name:'Malta',lon:14.4,lat:35.9,biome:'green'},
 mediterranean:{name:'Mar Mediterrâneo',lon:24,lat:34,biome:'sea'},
 diaspora:{name:'Comunidades da diáspora · panorama',lon:32,lat:38,biome:'green'},
} as const satisfies Record<string,AtlasPlace>;
/** User-supplied photographs are reference evidence, not redistributed artwork. */
export const ATLAS_REFERENCE_MAPS=[
 {file:'550708.jpg',title:'Os Reinos de Israel e Judá',coverage:'Reino dividido, Samaria, Judá e Jordão'},
 {file:'550709.jpg',title:'O Mundo Antigo',coverage:'Mediterrâneo oriental, Mesopotâmia e grandes reinos'},
 {file:'550710.jpg',title:'Divisão das Tribos',coverage:'Territórios a oeste e a leste do Jordão'},
 {file:'550711.jpg',title:'Egito e Sinai',coverage:'Nilo, delta, Sinai, Cades-Barneia e Moabe'},
 {file:'550712.jpg',title:'Os Reinos de Saul, Davi e Salomão',coverage:'Reino unido e regiões vizinhas'},
] as const;
export const ATLAS_EDITORIAL_SOURCES=[
 {url:'https://pleiades.stoa.org/help/conceptual-overview',purpose:'Distinção entre lugar antigo, localização aproximada e lugar sem posição conhecida.'},
 {url:'https://www.biblegateway.com/passage/?search=Acts%2027-28&version=KJV',purpose:'Conferência do itinerário textual marítimo de Atos 27–28; não incorpora a tradução ao app.'},
] as const;
export type AtlasPlaceKey=keyof typeof ATLAS_PLACES;
export type AtlasChapterKind='narrative'|'recipient'|'literary'|'vision'|'symbolic';
export type AtlasChapter={place:AtlasPlace;route:AtlasPlace[];kind:AtlasChapterKind;confidence:'regional'|'approximate'|'uncertain';reference:string;note:string};
type Range={from:number;to:number;place:AtlasPlaceKey;route:AtlasPlaceKey[];kind:AtlasChapterKind;confidence:AtlasChapter['confidence'];note:string};
const n=(from:number,to:number,place:AtlasPlaceKey,route:AtlasPlaceKey[]=[],note='Cena regional principal; o capítulo pode citar outros lugares.'):Range=>({from,to,place,route,kind:'narrative',confidence:(['sinai','midian','kadesh','ur','ararat'].includes(place)?'approximate':'regional'),note});
const uncertain=(from:number,to:number,place:AtlasPlaceKey,note:string,kind:AtlasChapterKind='literary'):Range=>({...n(from,to,place,[],note),kind,confidence:'uncertain'});
const letter=(to:number,place:AtlasPlaceKey,note='Região dos destinatários; não representa necessariamente o local de composição.'):Range=>({...n(1,to,place,[],note),kind:'recipient'});
/**
 * Chapter ranges cover the canon exactly. Routes describe named textual movements,
 * not reconstructed roads. Supplied atlas photos provide visual regional references:
 * 550708 (Israel/Judah), 550709 (Ancient World), 550710 (tribes),
 * 550711 (Exodus/Sinai), 550712 (Saul/David/Solomon).
 * Coordinate anchors are illustrative editorial approximations, not digitised borders.
 */
export const ATLAS_RANGES:Readonly<Record<string,readonly Range[]>>={
 'Gênesis':[
  uncertain(1,5,'eden','Enquadramento regional sugerido pelos rios de Gn 2.10–14. A posição exata do Éden não é conhecida.','narrative'),
  uncertain(6,9,'ararat','Gn 8.4 menciona os montes de Ararate; não identifica um pico ou rota verificável.','narrative'),
  n(10,11,'babel',['mesopotamia','babel','ur','haran'],'Povos e Babel; a família de Abrão parte de Ur rumo a Harã em Gn 11.'),
  n(12,12,'canaan',['haran','shechem','bethel','egypt']),n(13,14,'hebron',['egypt','bethel','hebron']),n(15,18,'hebron'),n(19,19,'jordan',[],'Sodoma, Gomorra e Zoar: enquadramento no vale, sem identificar sítios debatidos.'),
  n(20,21,'beersheba'),{...n(22,22,'jerusalem',['beersheba','jerusalem'],'Moriá: associação tradicional à região de Jerusalém, não coordenada demonstrada do episódio.'),confidence:'approximate'},n(23,23,'hebron'),n(24,24,'haran',['hebron','haran','beersheba']),n(25,27,'beersheba'),n(28,28,'bethel',['beersheba','bethel','haran']),n(29,30,'haran'),n(31,31,'gilead',['haran','gilead']),n(32,33,'jordan',['gilead','jordan','shechem']),n(34,35,'shechem',['shechem','bethel','bethlehem','hebron']),n(36,36,'edom',[],'Edom e a região de Seir, ao sul de Moabe; marco regional, sem fronteiras exatas.'),n(37,37,'canaan',['hebron','shechem','egypt']),n(38,38,'canaan'),n(39,45,'egypt'),n(46,47,'goshen',['beersheba','egypt','goshen']),n(48,49,'egypt'),n(50,50,'egypt',['egypt','hebron','egypt'])],
 'Êxodo':[n(1,2,'egypt',['goshen','egypt','midian']),n(3,4,'midian',['midian','sinai','egypt'],'Horebe e Midiã: regiões tradicionais; identificação do monte é discutida.'),n(5,12,'goshen'),n(13,15,'sinai',['goshen','sinai'],'Travessia e deserto: percurso aproximado, sem afirmar o ponto da travessia.'),n(16,18,'sinai'),n(19,40,'sinai')],
 'Levítico':[n(1,27,'sinai',[],'Instruções do tabernáculo no contexto do Sinai; não uma viagem por capítulo.')],
 'Números':[n(1,9,'sinai'),n(10,12,'wilderness',['sinai','wilderness']),n(13,14,'kadesh',['kadesh','hebron','kadesh']),n(15,19,'wilderness'),n(20,20,'kadesh'),n(21,21,'moab',['kadesh','moab']),n(22,32,'moab'),n(33,33,'moab',['goshen','sinai','kadesh','moab'],'Lista de acampamentos: vários sítios e rota exata são incertos.'),n(34,36,'moab')],
 'Deuteronômio':[n(1,33,'moab',[],'Discursos em Moabe que relembram jornadas; lugares lembrados não são o local da fala.'),n(34,34,'nebo')],
 'Josué':[n(1,2,'moab',['moab','jericho']),n(3,5,'jordan',['moab','jordan','jericho']),n(6,6,'jericho'),n(7,8,'bethel',[],'Ai e Betel: região central; identificação de Ai é debatida.'),n(9,10,'jerusalem',['jericho','jerusalem','hebron']),n(11,12,'galilee',['galilee','canaan']),n(13,13,'gilead',[],'Heranças a leste do Jordão; distribuição territorial, não local único da narração.'),n(14,15,'hebron',[],'Herança de Calebe e território de Judá; distribuição regional.'),n(16,17,'shechem',[],'Efraim e Manassés na região central; fronteiras esquemáticas, não cadastrais.'),n(18,19,'shiloh',[],'Siló é o ponto de reunião e distribuição das heranças restantes (Js 18.1).'),n(20,20,'canaan',[],'Cidades de refúgio em diferentes regiões dos dois lados do Jordão.'),n(21,21,'shiloh',[],'Chefes levitas solicitam cidades em Siló; a lista cobre várias tribos.'),n(22,22,'jordan',['shiloh','jordan','gilead'],'Retorno das tribos orientais e o altar junto ao Jordão; localização exata do altar incerta.'),n(23,24,'shechem')],
 'Juízes':[n(1,3,'canaan'),n(4,5,'jezreel'),n(6,8,'jezreel',['jezreel','jordan','gilead']),n(9,9,'shechem'),n(10,12,'gilead'),n(13,16,'philistia',['philistia','gaza']),n(17,18,'canaan',['canaan','galilee'],'Mica e a migração danita ao norte.'),n(19,21,'gibeah',['bethlehem','gibeah','bethel','shiloh'])],
 'Rute':[n(1,1,'bethlehem',['moab','bethlehem']),n(2,4,'bethlehem')],
 '1 Samuel':[n(1,4,'shiloh'),n(5,6,'philistia',['philistia','canaan']),n(7,8,'ramah'),n(9,12,'gibeah',['gibeah','ramah','jordan']),n(13,15,'gibeah'),n(16,16,'bethlehem'),n(17,20,'canaan',['bethlehem','philistia','gibeah']),n(21,26,'canaan',['canaan','philistia','hebron']),n(27,30,'philistia'),n(31,31,'jezreel')],
 '2 Samuel':[n(1,4,'hebron'),n(5,10,'jerusalem',['hebron','jerusalem']),n(11,11,'jerusalem',['jerusalem','rabbah'],'Davi em Jerusalém e o cerco de Rabá dos amonitas; não confundir Amom com Moabe.'),n(12,12,'rabbah',['jerusalem','rabbah','jerusalem'],'Natã fala em Jerusalém; ao final, Davi toma Rabá dos amonitas e retorna. O capítulo reúne as duas regiões.'),n(13,14,'jerusalem'),n(15,18,'jordan',['jerusalem','jordan','gilead']),n(19,20,'jerusalem',['jordan','jerusalem']),n(21,24,'jerusalem')],
 '1 Reis':[n(1,11,'jerusalem'),n(12,14,'israel',['jerusalem','shechem','bethel'],'Cisão dos reinos; âncora no território setentrional, não na cidade de Samaria antes de sua fundação.'),n(15,15,'israel'),n(16,16,'samaria',[],'Onri funda Samaria em 1Rs 16.24; o capítulo também descreve governantes anteriores.'),n(17,17,'tyre',['gilead','jordan','tyre']),n(18,18,'carmel'),n(19,19,'sinai',['jezreel','beersheba','sinai']),n(20,22,'samaria',['samaria','gilead'])],
 '2 Reis':[n(1,2,'jordan',['samaria','bethel','jericho','jordan']),n(3,3,'moab'),n(4,4,'canaan'),n(5,5,'damascus',['damascus','samaria','jordan']),n(6,8,'samaria'),n(9,10,'jezreel'),n(11,12,'jerusalem'),n(13,17,'samaria',['samaria','nineveh'],'Israel e deportações assírias; não uma única rota de todos os deportados.'),n(18,23,'jerusalem'),n(24,25,'mesopotamia',['jerusalem','babel'])],
 '1 Crônicas':[uncertain(1,9,'canaan','Genealogias e retrospectiva: panorama dos povos e de Israel, sem itinerário único.'),n(10,10,'jezreel'),n(11,29,'jerusalem')],
 '2 Crônicas':[n(1,9,'jerusalem'),n(10,28,'jerusalem',[],'História de Judá e referências ao reino do norte; cenário principal de Jerusalém.'),n(29,35,'jerusalem'),n(36,36,'mesopotamia',['jerusalem','babel','persia'])],
 'Esdras':[n(1,2,'jerusalem',['persia','mesopotamia','jerusalem']),n(3,6,'jerusalem'),n(7,8,'jerusalem',['mesopotamia','jerusalem']),n(9,10,'jerusalem')],
 'Neemias':[n(1,1,'persia'),n(2,2,'jerusalem',['persia','jerusalem']),n(3,13,'jerusalem')],
 'Ester':[n(1,10,'persia')],
 'Jó':[uncertain(1,42,'uz','Uz é nomeada em Jó 1.1, mas sua localização permanece incerta. O ponto representa uma região hipotética, não um sítio confirmado.')],
 'Salmos':[uncertain(1,150,'jerusalem','Coleção de orações de diferentes tempos e lugares. Jerusalém é âncora literária, não local comprovado de composição de cada salmo.')],
 'Provérbios':[uncertain(1,31,'jerusalem','Sabedoria de diferentes coleções; panorama literário de Israel, sem localização física para cada provérbio.')],
 'Eclesiastes':[uncertain(1,12,'jerusalem','Jerusalém é o enquadramento literário de Ec 1.1; não um roteiro por capítulo.')],
 'Cânticos':[uncertain(1,8,'canaan','Poesia que evoca vários lugares; a âncora literária não fixa cada cena em uma cidade.')],
 'Isaías':[n(1,12,'jerusalem',[],'Visões e anúncios a Judá e Jerusalém; textos não são deslocamentos.'),uncertain(13,23,'canaan','Oráculos sobre diversas nações; marco regional não significa que Isaías visitou cada destinatário.','vision'),uncertain(24,35,'jerusalem','Panorama profético; imagens não formam um itinerário físico.','vision'),n(36,39,'jerusalem'),uncertain(40,66,'jerusalem','Consolo, retorno e horizonte profético de Sião; não coordenadas das visões.','vision')],
 'Jeremias':[n(1,38,'jerusalem'),n(39,41,'canaan',['jerusalem','canaan']),n(42,44,'egypt',['canaan','egypt']),n(45,45,'canaan'),uncertain(46,51,'mesopotamia','Oráculos às nações; o destino do anúncio não implica presença do profeta.','vision'),n(52,52,'mesopotamia',['jerusalem','babel'])],
 'Lamentações':[uncertain(1,5,'jerusalem','Poemas sobre a destruição de Jerusalém; âncora temática, não local de composição comprovado.')],
 'Ezequiel':[n(1,7,'mesopotamia',[],'Exilados junto ao Quebar; o curso exato antigo não é reconstruído pelo mapa.'),uncertain(8,11,'jerusalem','Ezequiel é levado a Jerusalém em visão; não representa viagem física.','vision'),n(12,24,'mesopotamia'),uncertain(25,32,'canaan','Oráculos às nações, sem itinerário do profeta.','vision'),n(33,39,'mesopotamia'),uncertain(40,48,'jerusalem','Templo e terra em visão: representação simbólica, sem implantação geográfica literal.','vision')],
 'Daniel':[n(1,6,'mesopotamia'),uncertain(7,7,'mesopotamia','Visão no contexto babilônico, com alcance além da cidade.','vision'),uncertain(8,8,'persia','Susã é nomeada no enquadramento da visão; a passagem não prova viagem física.','vision'),uncertain(9,12,'mesopotamia','Orações e visões no contexto do exílio; o capítulo 10 nomeia o Tigre.','vision')],
 'Oséias':[uncertain(1,14,'samaria','Anúncio ao reino de Israel; âncora dos destinatários e do contexto profético.','recipient')],
 'Joel':[uncertain(1,3,'jerusalem','Judá e Jerusalém no anúncio profético; data e local de composição não são estabelecidos pelo mapa.','recipient')],
 'Amós':[uncertain(1,9,'samaria','Anúncios a Israel e às nações; Amós se apresenta como de Tecoa, sem roteiro por oráculo.','recipient')],
 'Obadias':[uncertain(1,1,'edom','Edom, ao sul de Moabe, é alvo do anúncio; o ponto é regional, não o local de escrita.','recipient')],
 'Jonas':[n(1,1,'mediterranean',['joppa','mediterranean'],'Jope é explícita; a rota exata a Társis é debatida.'),uncertain(2,2,'mediterranean','A oração não permite coordenada verificável no mar.','narrative'),n(3,4,'nineveh')],
 'Miqueias':[letter(7,'jerusalem','Anúncios a Samaria e Jerusalém (Mq 1.1); regiões destinatárias, sem itinerário por oráculo.')],
 'Naum':[letter(3,'nineveh','Nínive é tema e destinatária do anúncio, não local de composição demonstrado.')],
 'Habacuque':[uncertain(1,3,'jerusalem','Diálogo e oração proféticos no contexto de Judá; sem localização exata.','vision')],
 'Sofonias':[letter(3,'jerusalem')], 'Ageu':[n(1,2,'jerusalem')], 'Zacarias':[uncertain(1,8,'jerusalem','Visões e reconstrução no contexto de Jerusalém; não trajetos físicos.','vision'),uncertain(9,14,'jerusalem','Oráculos e horizonte escatológico; não coordenadas das imagens.','vision')], 'Malaquias':[letter(4,'jerusalem','Comunidade de Judá e culto no templo; cenário regional do anúncio.')],
 'Mateus':[n(1,2,'bethlehem',['bethlehem','egypt','nazareth']),n(3,3,'jordan'),n(4,4,'galilee',['jordan','wilderness','galilee']),n(5,9,'galilee'),n(10,12,'galilee'),n(13,14,'capernaum'),n(15,15,'tyre',['galilee','tyre','galilee']),n(16,17,'galilee'),n(18,18,'capernaum'),n(19,20,'jordan',['galilee','jordan','jericho']),n(21,27,'jerusalem',['bethany','jerusalem']),n(28,28,'galilee',['jerusalem','galilee'])],
 'Marcos':[n(1,6,'galilee',['jordan','galilee']),n(7,7,'tyre',['galilee','tyre','galilee']),n(8,9,'galilee'),n(10,10,'jericho',['galilee','jordan','jericho']),n(11,15,'jerusalem',['bethany','jerusalem']),n(16,16,'jerusalem',[],'Túmulo e anúncio da ressurreição; variantes do final não mudam o plano de leitura.')],
 'Lucas':[n(1,2,'bethlehem',['jerusalem','nazareth','bethlehem','jerusalem','nazareth']),n(3,4,'galilee',['jordan','wilderness','nazareth','capernaum']),n(5,9,'galilee'),n(10,18,'canaan',[],'Grande seção de viagem rumo a Jerusalém; várias parábolas não descrevem viagens de Jesus.'),n(19,19,'jericho',['jericho','jerusalem']),n(20,23,'jerusalem'),n(24,24,'jerusalem',['jerusalem','bethany'],'Emaús é nomeada, mas sua identificação moderna é debatida; não fixamos ponto exato.')],
 'João':[uncertain(1,1,'jordan','Prólogo teológico seguido de testemunho junto ao Jordão; criação não é localizada num ponto geográfico.','literary'),n(2,2,'galilee',['galilee','jerusalem']),n(3,3,'jerusalem'),n(4,4,'samaria',['jerusalem','samaria','galilee']),n(5,5,'jerusalem'),n(6,6,'capernaum'),n(7,10,'jerusalem'),n(11,11,'bethany'),n(12,20,'jerusalem',['bethany','jerusalem']),n(21,21,'capernaum')],
 'Atos':[n(1,7,'jerusalem'),n(8,8,'samaria',['jerusalem','samaria','gaza']),n(9,9,'damascus',['jerusalem','damascus','jerusalem','joppa']),n(10,10,'caesarea',['joppa','caesarea']),n(11,11,'antioch',['jerusalem','antioch']),n(12,12,'jerusalem'),n(13,13,'anatolia',['antioch','cyprus','anatolia']),n(14,14,'lystra',['anatolia','lystra','antioch']),n(15,15,'jerusalem',['antioch','jerusalem','antioch']),n(16,16,'philippi',['lystra','anatolia','troas','philippi']),n(17,17,'athens',['philippi','thessalonica','athens']),n(18,18,'corinth',['athens','corinth','ephesus','caesarea','antioch']),n(19,19,'ephesus'),n(20,20,'miletus',['ephesus','greece','philippi','troas','miletus']),n(21,21,'jerusalem',['miletus','tyre','caesarea','jerusalem']),n(22,22,'jerusalem'),n(23,26,'caesarea',['jerusalem','caesarea']),n(27,27,'mediterranean',['caesarea','tyre','cyprus','myra','cnidus','crete','malta'],'Viagem marítima com naufrágio; a ilha é nomeada Malta em At 28.1. Linha de navegação aproximada.'),n(28,28,'rome',['malta','syracuse','rhegium','puteoli','rome'])],
 'Romanos':[letter(16,'rome')], '1 Coríntios':[letter(16,'corinth')], '2 Coríntios':[letter(13,'corinth')], 'Gálatas':[letter(6,'anatolia','Igrejas da Galácia: extensão e identificação regional debatidas; não uma cidade única.')], 'Efésios':[letter(6,'ephesus')], 'Filipenses':[letter(4,'philippi')], 'Colossenses':[letter(4,'colossae')], '1 Tessalonicenses':[letter(5,'thessalonica')], '2 Tessalonicenses':[letter(3,'thessalonica')],
 '1 Timóteo':[letter(6,'ephesus','Timóteo é instruído a permanecer em Éfeso (1Tm 1.3); o ponto indica contexto do destinatário.')], '2 Timóteo':[uncertain(1,4,'rome','A tradição associa a prisão final de Paulo a Roma; o destino exato de Timóteo não é explicitado.','recipient')], 'Tito':[letter(3,'crete')], 'Filemom':[uncertain(1,1,'colossae','Associação tradicional a Colossos, por pessoas relacionadas em Colossenses; o texto não nomeia a cidade.','recipient')],
 'Hebreus':[uncertain(1,13,'diaspora','Destinatários e local de composição não identificados com segurança; marco de comunidades cristãs.','recipient')], 'Tiago':[uncertain(1,5,'diaspora','Saudação às doze tribos na dispersão; sem uma cidade destinatária única.','recipient')], '1 Pedro':[letter(5,'anatolia','Destinatários em Ponto, Galácia, Capadócia, Ásia e Bitínia (1Pe 1.1); âncora regional.')], '2 Pedro':[uncertain(1,3,'diaspora','Destinatários não nomeados por cidade; não presumimos local de composição.','recipient')], '1 João':[uncertain(1,5,'ephesus','Associação tradicional à Ásia Menor; o texto não nomeia a cidade.','recipient')], '2 João':[uncertain(1,1,'diaspora','Destinatária e seus filhos não fornecem localização inequívoca.','recipient')], '3 João':[uncertain(1,1,'diaspora','Gaio e a comunidade não são localizados com segurança.','recipient')], 'Judas':[uncertain(1,1,'diaspora','Comunidade cristã sem cidade identificada no texto.','recipient')],
 'Apocalipse':[n(1,1,'patmos',[],'João se identifica em Patmos; a visão é dirigida às sete igrejas.'),letter(3,'anatolia','Cartas às sete igrejas da Ásia: Éfeso, Esmirna, Pérgamo, Tiatira, Sardes, Filadélfia e Laodiceia.'),uncertain(4,22,'patmos','Visões e Nova Jerusalém não constituem um roteiro físico; Patmos permanece o marco narrativo.','vision')].map((r,i)=>i===1?{...r,from:2}:r),
};

const chapterIndex=new Map<string,AtlasChapter>();
for(const [book,count] of CANON){
 const ranges=ATLAS_RANGES[book];
 for(let chapter=1;chapter<=count;chapter++){
  const matching=ranges?.filter(r=>chapter>=r.from&&chapter<=r.to)??[];
  if(matching.length!==1)throw new Error(`Atlas: cobertura inválida para ${book} ${chapter}`);
  const range=matching[0],place=ATLAS_PLACES[range.place];
  chapterIndex.set(`${book}:${chapter}`,{place,route:(range.route.length?range.route:[range.place]).map(key=>ATLAS_PLACES[key]),kind:range.kind,confidence:range.confidence,reference:`${book} ${chapter}`,note:range.note});
 }
}
/** All 1,189 canonical chapters resolve, with uncertainty visible instead of invented precision. */
export const ATLAS_CHAPTERS:ReadonlyArray<AtlasChapter&{book:string;chapter:number}>=CHAPTERS.map(ch=>({...chapterIndex.get(`${ch.book}:${ch.chapter}`)!,book:ch.book,chapter:ch.chapter}));
export function atlasChapter(ch:Pick<Chapter,'book'|'chapter'>):AtlasChapter{
 const entry=chapterIndex.get(`${ch.book}:${ch.chapter}`);
 if(!entry)throw new Error('Capítulo fora do cânon do atlas.');
 return entry;
}
export function atlasPlace(ch:Pick<Chapter,'book'|'chapter'>):AtlasPlace{return atlasChapter(ch).place}
export function atlasProject(lon:number,lat:number){return {x:90+(lon-5)*14+(lat-25)*8,y:550-(lat-25)*12+(lon-5)*6}}
export function atlasStage(day:GameDay){
 const chapter=day.old[0]??day.chapters[0],geography=atlasChapter(chapter),base=chapterJourneyContext(chapter);
 const context={...base,name:geography.place.name,region:geography.place.name,detail:geography.note,reference:geography.reference,kind:geography.kind==='symbolic'?'simbólico' as const:geography.kind==='recipient'?'destinatários' as const:geography.kind==='narrative'?'narrativa' as const:'panorama' as const};
 return {chapter,place:geography.place,context,geography};
}
export function weekWindow<T>(days:readonly T[],current:number){const start=Math.floor((Math.max(1,Math.min(days.length,current))-1)/7)*7;return {start,days:days.slice(start,start+7)}}
