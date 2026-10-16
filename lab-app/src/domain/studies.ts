import type {Chapter} from "./canon";
export type BibleCategory="Pentateuco"|"Históricos"|"Poéticos"|"Profetas maiores"|"Profetas menores"|"Evangelhos"|"Atos"|"Cartas paulinas"|"Cartas gerais"|"Apocalíptico";
const categories:Record<BibleCategory,string[]>={
 "Pentateuco":["Gênesis","Êxodo","Levítico","Números","Deuteronômio"],
 "Históricos":["Josué","Juízes","Rute","1 Samuel","2 Samuel","1 Reis","2 Reis","1 Crônicas","2 Crônicas","Esdras","Neemias","Ester"],
 "Poéticos":["Jó","Salmos","Provérbios","Eclesiastes","Cânticos"],
 "Profetas maiores":["Isaías","Jeremias","Lamentações","Ezequiel","Daniel"],
 "Profetas menores":["Oséias","Joel","Amós","Obadias","Jonas","Miqueias","Naum","Habacuque","Sofonias","Ageu","Zacarias","Malaquias"],
 "Evangelhos":["Mateus","Marcos","Lucas","João"],
 "Atos":["Atos"],
 "Cartas paulinas":["Romanos","1 Coríntios","2 Coríntios","Gálatas","Efésios","Filipenses","Colossenses","1 Tessalonicenses","2 Tessalonicenses","1 Timóteo","2 Timóteo","Tito","Filemom"],
 "Cartas gerais":["Hebreus","Tiago","1 Pedro","2 Pedro","1 João","2 João","3 João","Judas"],
 "Apocalíptico":["Apocalipse"]
};
export function categoryOfBook(book:string):BibleCategory{
 const pair=Object.entries(categories).find(([,books])=>books.includes(book));
 if(!pair)throw Error("Livro desconhecido: "+book);
 return pair[0] as BibleCategory;
}
export function categoryOfChapter(ch:Chapter):BibleCategory{return categoryOfBook(ch.book)}
export type StudyBlock={id:string;title:string;references:string[];intro:string;type:"conexão"|"tema"};
/** Short editorial introductions, not substitutes for Bible text or a reviewed exegesis. */
export const STUDY_BLOCKS:StudyBlock[]=[
 {id:"criacao",title:"A criação e a Palavra",references:["Gênesis 1","João 1"],intro:"Compare o princípio da criação em Gênesis com o prólogo do Evangelho de João.",type:"conexão"},
 {id:"promessa",title:"A promessa da redenção",references:["Gênesis 12","Gálatas 3"],intro:"Observe a promessa a Abraão e como Paulo a relaciona à fé.",type:"conexão"},
 {id:"lucas-atos",title:"Lucas e Atos: uma narrativa",references:["Lucas 1","Atos 1"],intro:"Leia as aberturas das duas obras e identifique a continuidade do testemunho cristão.",type:"conexão"},
 {id:"profetas",title:"Profetas e história de Israel",references:["2 Reis 17","Isaías 1","Oséias 1"],intro:"Considere o contexto histórico e a mensagem profética, respeitando cada livro.",type:"conexão"},
 {id:"espirito",title:"A promessa do Espírito",references:["Joel 2","João 14","Atos 2"],intro:"Acompanhe a promessa, o ensino de Jesus e o relato de Pentecostes.",type:"tema"},
 {id:"salvacao",title:"Salvação e nova vida",references:["João 3","Romanos 5","Efésios 2"],intro:"Explore a linguagem bíblica da graça, da fé e da regeneração.",type:"tema"}
];
export {BIBLEPROJECT_VIDEO_LINKS,BIBLEPROJECT_PLAYLISTS,BIBLEPROJECT_OFFICIAL_COLLECTIONS,getBibleProjectVideos,getBibleProjectVideoForChapter,getBibleProjectPlaylist} from "./bibleproject";
