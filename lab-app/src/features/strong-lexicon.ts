import {supabase} from "../lib/supabase";
import {bibleReferenceById} from "../domain/bible-navigation";

/** Current verse-tagging dataset is aligned to KJV, not a direct PT-BR word map. */
export type StrongTerm={
 strong_number:string; token_ordinal:number; token_text:string|null;
 language:"hebrew"|"greek"|"aramaic";lemma:string;
 transliteration:string|null;translated_gloss:string|null;
 translated_definition:string|null;translation_status:"machine"|"reviewed"|null;
 gloss_status?:"editorial_reviewed_pt"|"stepbible_auto_translated_pt"|null;
 source_name:string;link_review_status?:"source_verified_stepbible"|"editorial_reviewed";
};
export const STRONG_READER_READY=import.meta.env.VITE_LAB_STRONG_READY==="true";
export function validateStrongReference(chapterId:string,verse:number){
 bibleReferenceById(chapterId);
 if(!Number.isInteger(verse)||verse<1||verse>176)throw Error("Versículo inválido.");
}
const CODE=/^[HG]\d{1,4}$/;
export function normalizeStrongTerms(rows:unknown):StrongTerm[]{
 if(!Array.isArray(rows))return [];
 return rows.filter((x):x is StrongTerm=>{
  if(!x||typeof x!=="object")return false;
  const r=x as Record<string,unknown>;
  return typeof r.strong_number==="string"&&CODE.test(r.strong_number)
   &&Number.isInteger(r.token_ordinal)&&(r.token_ordinal as number)>0
   &&typeof r.lemma==="string"&&r.lemma.length>0
   &&["hebrew","greek","aramaic"].includes(String(r.language))
   &&[null,"machine","reviewed"].includes(r.translation_status as string|null);
 }).slice(0,48);
}
export async function getStrongTerms(chapterId:string,verse:number):Promise<StrongTerm[]>{
 validateStrongReference(chapterId,verse);
 if(!STRONG_READER_READY) return [];
 if(!supabase)throw Error("Consulta Strong indisponível. Entre na sua conta.");
 const {data,error}=await supabase.rpc("lab_strong_verse_lookup",{
  p_chapter_id:chapterId,p_verse_number:verse,p_limit:48
 });
 if(error)throw Error("Não foi possível consultar o léxico Strong agora.");
 return normalizeStrongTerms(data);
}
