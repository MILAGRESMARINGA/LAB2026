import {supabase} from "../lib/supabase";
export type BibleVerse={number:number;text:string};
export type BibleChapter={edition:string;chapter_id:string;book_name:string;chapter_number:number;verses:BibleVerse[]};
export const DEFAULT_EDITION="ALM1911";
export async function readBibleChapter(chapterId:string):Promise<BibleChapter>{
 if(!/^([1-9]|[1-5][0-9]|6[0-6]):([1-9][0-9]{0,2})$/.test(chapterId))throw Error("Referência inválida");
 if(!supabase)throw Error("Leitor indisponível: falta configurar a conexão do LABGAME");
 const {data,error}=await supabase.from("lab_bible_chapters")
 .select("edition,chapter_id,book_name,chapter_number,verses")
 .eq("edition",DEFAULT_EDITION).eq("chapter_id",chapterId).single();
 if(error)throw Error("Não foi possível carregar o capítulo da Bíblia. Tente novamente.");
 if(!data||!Array.isArray(data.verses)||data.verses.length===0)throw Error("Texto bíblico não disponível.");
 return data as BibleChapter;
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
