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
