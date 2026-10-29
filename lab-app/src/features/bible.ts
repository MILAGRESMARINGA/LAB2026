import {supabase} from "../lib/supabase";
import {bibleReferenceById} from "../domain/bible-navigation";
import type {JesusSpeechSpan} from "../domain/bible-speech";
export {splitVerseSpeech} from "../domain/bible-speech";
export type {JesusSpeechSpan} from "../domain/bible-speech";
export type BibleVerse={number:number;text:string};
export type BibleChapter={edition:string;chapter_id:string;book_name:string;chapter_number:number;verses:BibleVerse[]};
export const DEFAULT_EDITION="ALM1911";
export type BibleEdition={code:string;title:string;available:boolean;requires_auth:boolean;license_label:string};
export const FALLBACK_BIBLE_EDITIONS:readonly BibleEdition[]=[
 {code:"ALM1911",title:"Almeida 1911",available:true,requires_auth:false,license_label:"Domínio público: edição histórica de 1911"},
 ...["NVI","NAA","ARA","NTLH"].map(code=>({code,title:code,available:false,requires_auth:true,license_label:"Direitos reservados: contrato de distribuição ou API oficial necessária."})),
 {code:"BLIVRE",title:"Bíblia Livre (TR, 2018)",available:false,requires_auth:false,license_label:"CC BY 3.0 Brasil — importação e atribuição em homologação."},
 {code:"BPM",title:"Bíblia Portuguesa Mundial",available:false,requires_auth:false,license_label:"Domínio público (eBible.org) — importação em homologação."},
];
function validateReference(chapterId:string){try{bibleReferenceById(chapterId)}catch{throw Error("Referência inválida")}}
function validateEdition(edition:string){if(!/^[A-Z0-9]{2,12}$/.test(edition))throw Error("Versão bíblica inválida")}
export async function listBibleEditions():Promise<BibleEdition[]>{
 if(!supabase)return FALLBACK_BIBLE_EDITIONS.map(edition=>({...edition}));
 const {data,error}=await supabase.from("lab_bible_edition_availability").select("code,title,available,requires_auth,license_label").order("display_order");
 if(error||!Array.isArray(data)||!data.length)return FALLBACK_BIBLE_EDITIONS.map(edition=>({...edition}));
 return data as BibleEdition[];
}
export async function readBibleChapter(chapterId:string,edition=DEFAULT_EDITION):Promise<BibleChapter>{
 validateReference(chapterId);validateEdition(edition);
 if(!supabase)throw Error("Leitor indisponível: falta configurar a conexão do LABGAME");
 const {data,error}=await supabase.from("lab_bible_chapters")
 .select("edition,chapter_id,book_name,chapter_number,verses")
 .eq("edition",edition).eq("chapter_id",chapterId).single();
 if(error)throw Error("Não foi possível carregar o capítulo da Bíblia. Tente novamente.");
 if(!data||!Array.isArray(data.verses)||data.verses.length===0)throw Error("Texto bíblico não disponível.");
 return data as BibleChapter;
}

/** Missing/unreviewed annotations never imply that a complete verse is Jesus' speech. */
export async function readBibleSpeechSpans(chapterId:string,edition=DEFAULT_EDITION):Promise<Record<number,JesusSpeechSpan[]>>{
 validateReference(chapterId);validateEdition(edition);
 if(!supabase)return {};
 const {data,error}=await supabase.from("lab_bible_jesus_speech").select("verse_number,start_utf16,end_utf16,source_text").eq("edition",edition).eq("chapter_id",chapterId);
 if(error||!Array.isArray(data))return {};
 const result:Record<number,JesusSpeechSpan[]>={};
 for(const row of data){
  if(!Number.isInteger(row.verse_number)||row.verse_number<1||typeof row.source_text!=="string")continue;
  (result[row.verse_number]??=[]).push({start:row.start_utf16,end:row.end_utf16,sourceText:row.source_text});
 }
 return result;
}

export type BibleSearchHit={
 book_name:string;chapter_id:string;chapter_number:number;
 verse_number:number;verse_text:string;
};
export async function searchBibleVerses(query:string,limit=40):Promise<BibleSearchHit[]>{
 if(!supabase)throw Error("Banco da Bíblia indisponível");
 const term=query.trim();
 if(term.length<2||term.length>100)throw Error("Digite de 2 a 100 caracteres para pesquisar");
 const {data,error}=await supabase.rpc("lab_bible_search",{p_query:term,p_limit:Math.min(50,Math.max(1,limit))});
 if(error)throw Error("Não foi possível pesquisar os versículos. Tente novamente.");
 return (data??[]) as BibleSearchHit[];
}
