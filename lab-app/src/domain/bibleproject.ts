import {OLD_TESTAMENT,NEW_TESTAMENT} from "./canon";
/**
 * Curated official Portuguese BibleProject resources, checked against their
 * panorama collections. Multiple canonical books can share one video.
 * Some video pages were unavailable to the indexer; in those cases, use
 * a verified official guide containing the panorama video.
 *
 * These supplementary resources never count as LABGAME daily chapters.
 */
export type BibleProjectResource={
 title:string;url:string;fromChapter?:number;toChapter?:number;kind?:"guide";
};
export const BIBLEPROJECT_PLAYLISTS={
 AT:"https://www.youtube.com/playlist?list=PLsDpUPJTUcXEhw6rCZF7EZDapThr6o0KP",
 NT:"https://www.youtube.com/playlist?list=PLsDpUPJTUcXGo-fUpDSrWPyOWNUMnGNOT"
} as const;
export const BIBLEPROJECT_OFFICIAL_COLLECTIONS={
 AT:"https://bibleproject.com/pt-br/videos/collections/panoramas-do-antigo-testamento/",
 NT:"https://bibleproject.com/pt-br/videos/collections/panoramas-do-novo-testamento/"
} as const;
export const BIBLEPROJECT_VIDEO_LINKS:Readonly<Record<string,ReadonlyArray<BibleProjectResource>>> = {
  "Gênesis": [{title:"Gênesis 1–11",url:"https://bibleproject.com/pt-br/videos/genesis-1-11/",fromChapter:1,toChapter:11}, {title:"Gênesis 12–50",url:"https://bibleproject.com/pt-br/videos/genesis-12-50/",fromChapter:12,toChapter:50}],
  "Êxodo": [{title:"Êxodo 1–18",url:"https://bibleproject.com/pt-br/videos/exodo-1-18/",fromChapter:1,toChapter:18}, {title:"Êxodo 19–40",url:"https://bibleproject.com/pt-br/videos/exodo-19-40/",fromChapter:19,toChapter:40}],
  "Levítico": [{title:"Levítico",url:"https://bibleproject.com/pt-br/videos/levitico/"}],
  "Números": [{title:"Números",url:"https://bibleproject.com/pt-br/videos/numeros/"}],
  "Deuteronômio": [{title:"Deuteronômio",url:"https://bibleproject.com/pt-br/videos/deuteronomio/"}],
  "Josué": [{title:"Josué",url:"https://bibleproject.com/pt-br/videos/josue/"}],
  "Juízes": [{title:"Juízes",url:"https://bibleproject.com/pt-br/videos/juizes/"}],
  "Rute": [{title:"Rute",url:"https://bibleproject.com/pt-br/videos/rute/"}],
  "1 Samuel": [{title:"1 Samuel",url:"https://bibleproject.com/pt-br/videos/1samuel/"}],
  "2 Samuel": [{title:"2 Samuel",url:"https://bibleproject.com/pt-br/videos/2samuel/"}],
  "1 Reis": [{title:"1 e 2 Reis",url:"https://bibleproject.com/pt-br/videos/1-e-2reis/"}],
  "2 Reis": [{title:"1 e 2 Reis",url:"https://bibleproject.com/pt-br/videos/1-e-2reis/"}],
  "1 Crônicas": [{title:"1 e 2 Crônicas",url:"https://bibleproject.com/pt-br/videos/1-e-2cronicas/"}],
  "2 Crônicas": [{title:"1 e 2 Crônicas",url:"https://bibleproject.com/pt-br/videos/1-e-2cronicas/"}],
  "Esdras": [{title:"Esdras e Neemias",url:"https://bibleproject.com/pt-br/videos/esdras-neemias/"}],
  "Neemias": [{title:"Esdras e Neemias",url:"https://bibleproject.com/pt-br/videos/esdras-neemias/"}],
  "Ester": [{title:"Ester",url:"https://bibleproject.com/pt-br/videos/ester/"}],
  "Jó": [{title:"Jó",url:"https://bibleproject.com/pt-br/videos/jo-2/"}],
  "Salmos": [{title:"Salmos",url:"https://bibleproject.com/pt-br/videos/salmos/"}],
  "Provérbios": [{title:"Provérbios",url:"https://bibleproject.com/pt-br/videos/proverbios-2/"}],
  "Eclesiastes": [{title:"Eclesiastes",url:"https://bibleproject.com/pt-br/videos/eclesiastes-2/"}],
  "Cânticos": [{title:"Cântico dos Cânticos — guia e vídeo",url:"https://bibleproject.com/pt-br/guides/cantico-dos-canticos/",kind:"guide"}],
  "Isaías": [{title:"Isaías 1–39",url:"https://bibleproject.com/pt-br/videos/isaias-1-39/",fromChapter:1,toChapter:39}, {title:"Isaías 40–66",url:"https://bibleproject.com/pt-br/videos/isaias-40-66/",fromChapter:40,toChapter:66}],
  "Jeremias": [{title:"Jeremias",url:"https://bibleproject.com/pt-br/videos/jeremias/"}],
  "Lamentações": [{title:"Lamentações",url:"https://bibleproject.com/pt-br/videos/lamentacoes/"}],
  "Ezequiel": [{title:"Ezequiel 1–33",url:"https://bibleproject.com/pt-br/videos/ezequiel-1-33/",fromChapter:1,toChapter:33}, {title:"Ezequiel 34–48",url:"https://bibleproject.com/pt-br/videos/ezequiel-34-48/",fromChapter:34,toChapter:48}],
  "Daniel": [{title:"Daniel",url:"https://bibleproject.com/pt-br/videos/daniel/"}],
  "Oséias": [{title:"Oseias",url:"https://bibleproject.com/pt-br/videos/oseias/"}],
  "Joel": [{title:"Joel",url:"https://bibleproject.com/pt-br/videos/joel/"}],
  "Amós": [{title:"Amós",url:"https://bibleproject.com/pt-br/videos/amos/"}],
  "Obadias": [{title:"Obadias",url:"https://bibleproject.com/pt-br/videos/obadias/"}],
  "Jonas": [{title:"Jonas",url:"https://bibleproject.com/pt-br/videos/jonas/"}],
  "Miqueias": [{title:"Miqueias",url:"https://bibleproject.com/pt-br/videos/miqueias/"}],
  "Naum": [{title:"Naum",url:"https://bibleproject.com/pt-br/videos/naum/"}],
  "Habacuque": [{title:"Habacuque",url:"https://bibleproject.com/pt-br/videos/habacuque/"}],
  "Sofonias": [{title:"Sofonias — guia e vídeo",url:"https://bibleproject.com/pt-br/guides/sofonias/",kind:"guide"}],
  "Ageu": [{title:"Ageu",url:"https://bibleproject.com/pt-br/videos/ageu/"}],
  "Zacarias": [{title:"Zacarias",url:"https://bibleproject.com/pt-br/videos/zacarias/"}],
  "Malaquias": [{title:"Malaquias",url:"https://bibleproject.com/pt-br/videos/malaquias/"}],
  "Mateus": [{title:"Mateus 1–13",url:"https://bibleproject.com/pt-br/videos/mateus-1-13/",fromChapter:1,toChapter:13}, {title:"Mateus 14–28",url:"https://bibleproject.com/pt-br/videos/mateus-14-28/",fromChapter:14,toChapter:28}],
  "Marcos": [{title:"Marcos",url:"https://bibleproject.com/pt-br/videos/marcos-2/"}],
  "Lucas": [{title:"Lucas 1–9",url:"https://bibleproject.com/pt-br/videos/lucas-1-9/",fromChapter:1,toChapter:9}, {title:"Lucas 10–24",url:"https://bibleproject.com/pt-br/videos/lucas-10-24/",fromChapter:10,toChapter:24}],
  "João": [{title:"João 1–12",url:"https://bibleproject.com/pt-br/videos/joao-1-12/",fromChapter:1,toChapter:12}, {title:"João 13–21",url:"https://bibleproject.com/pt-br/videos/joao-13-21/",fromChapter:13,toChapter:21}],
  "Atos": [{title:"Atos 1–12",url:"https://bibleproject.com/pt-br/videos/atos-1-12/",fromChapter:1,toChapter:12}, {title:"Atos 13–28",url:"https://bibleproject.com/pt-br/videos/atos-13-28/",fromChapter:13,toChapter:28}],
  "Romanos": [{title:"Romanos 1–4",url:"https://bibleproject.com/pt-br/videos/romanos-1-4/",fromChapter:1,toChapter:4}, {title:"Romanos 5–16",url:"https://bibleproject.com/pt-br/videos/romanos-5-16/",fromChapter:5,toChapter:16}],
  "1 Coríntios": [{title:"1 Coríntios",url:"https://bibleproject.com/pt-br/videos/1corintios/"}],
  "2 Coríntios": [{title:"2 Coríntios",url:"https://bibleproject.com/pt-br/videos/2corintios/"}],
  "Gálatas": [{title:"Gálatas",url:"https://bibleproject.com/pt-br/videos/galatas/"}],
  "Efésios": [{title:"Efésios",url:"https://bibleproject.com/pt-br/videos/efesios/"}],
  "Filipenses": [{title:"Filipenses",url:"https://bibleproject.com/pt-br/videos/filipenses/"}],
  "Colossenses": [{title:"Colossenses",url:"https://bibleproject.com/pt-br/videos/colossenses/"}],
  "1 Tessalonicenses": [{title:"1 Tessalonicenses",url:"https://bibleproject.com/pt-br/videos/1tessalonicenses/"}],
  "2 Tessalonicenses": [{title:"2 Tessalonicenses",url:"https://bibleproject.com/pt-br/videos/2tessalonicenses/"}],
  "1 Timóteo": [{title:"1 Timóteo",url:"https://bibleproject.com/pt-br/videos/1timoteo/"}],
  "2 Timóteo": [{title:"2 Timóteo",url:"https://bibleproject.com/pt-br/videos/2timoteo/"}],
  "Tito": [{title:"Tito",url:"https://bibleproject.com/pt-br/videos/tito/"}],
  "Filemom": [{title:"Filemom",url:"https://bibleproject.com/pt-br/videos/filemom/"}],
  "Hebreus": [{title:"Hebreus",url:"https://bibleproject.com/pt-br/videos/hebreus/"}],
  "Tiago": [{title:"Tiago",url:"https://bibleproject.com/pt-br/videos/tiago/"}],
  "1 Pedro": [{title:"1 Pedro",url:"https://bibleproject.com/pt-br/videos/1pedro/"}],
  "2 Pedro": [{title:"2 Pedro",url:"https://bibleproject.com/pt-br/videos/2pedro/"}],
  "1 João": [{title:"1, 2 e 3 João — guia e vídeo",url:"https://bibleproject.com/pt-br/guides/1-3-joao/",kind:"guide"}],
  "2 João": [{title:"1, 2 e 3 João — guia e vídeo",url:"https://bibleproject.com/pt-br/guides/1-3-joao/",kind:"guide"}],
  "3 João": [{title:"1, 2 e 3 João — guia e vídeo",url:"https://bibleproject.com/pt-br/guides/1-3-joao/",kind:"guide"}],
  "Judas": [{title:"Judas — guia e vídeo",url:"https://bibleproject.com/pt-br/guides/judas/",kind:"guide"}],
  "Apocalipse": [{title:"Apocalipse 1–11",url:"https://bibleproject.com/pt-br/videos/apocalipse-1-11/",fromChapter:1,toChapter:11}, {title:"Apocalipse 12–22",url:"https://bibleproject.com/pt-br/videos/apocalipse-12-22/",fromChapter:12,toChapter:22}],
};
export function getBibleProjectVideos(book:string):ReadonlyArray<BibleProjectResource>{
 return BIBLEPROJECT_VIDEO_LINKS[book]??[];
}
export function getBibleProjectVideoForChapter(book:string,chapter:number):BibleProjectResource|undefined{
 return getBibleProjectVideos(book).find(item=>
  (!item.fromChapter||chapter>=item.fromChapter)&&(!item.toChapter||chapter<=item.toChapter));
}
export function getBibleProjectTestament(book:string):"AT"|"NT"|null{
 if(OLD_TESTAMENT.some(([name])=>name===book))return "AT";
 if(NEW_TESTAMENT.some(([name])=>name===book))return "NT";
 return null;
}
export function getBibleProjectPlaylist(book:string):string|undefined{
 const testament=getBibleProjectTestament(book);
 return testament?BIBLEPROJECT_PLAYLISTS[testament]:undefined;
}
