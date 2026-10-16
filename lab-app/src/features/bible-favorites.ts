import {supabase} from "../lib/supabase";
import {DEFAULT_EDITION} from "./bible";

/** Private chapter bookmarks. They never award XP or change daily progress. */
export async function listBibleFavorites():Promise<string[]>{
 if(!supabase)throw Error("Banco da Bíblia indisponível");
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return [];
 const {data,error}=await supabase.from("lab_bible_favorites")
  .select("chapter_id").eq("edition",DEFAULT_EDITION).order("created_at",{ascending:false});
 if(error)throw error;
 return (data??[]).map(row=>row.chapter_id as string);
}
export async function saveBibleFavorite(chapterId:string,add:boolean):Promise<void>{
 if(!supabase)throw Error("Banco da Bíblia indisponível");
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)throw Error("Entre na sua conta para salvar capítulos");
 if(add){
  const {error}=await supabase.from("lab_bible_favorites")
   .upsert({user_id:user.id,edition:DEFAULT_EDITION,chapter_id:chapterId},{onConflict:"user_id,edition,chapter_id"});
  if(error)throw error;
 }else{
  const {error}=await supabase.from("lab_bible_favorites")
   .delete().eq("user_id",user.id).eq("edition",DEFAULT_EDITION).eq("chapter_id",chapterId);
  if(error)throw error;
 }
}
