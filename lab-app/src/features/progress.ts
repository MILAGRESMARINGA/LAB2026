import {supabase} from "../lib/supabase";
export async function getCompletedChapters(year:number):Promise<string[]>{
 if(!supabase)throw Error("Supabase não configurado");
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)throw Error("Faça login para salvar seu progresso");
 const {data,error}=await supabase.from("reading_completions").select("chapter_id").eq("user_id",user.id).eq("reading_year",year);
 if(error)throw error;
 return (data??[]).map(x=>x.chapter_id);
}
export async function setChapterCompleted(year:number,chapterId:string,completed:boolean):Promise<void>{
 if(!supabase)throw Error("Supabase não configurado");
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)throw Error("Faça login para salvar seu progresso");
 if(completed){
 const {error}=await supabase.from("reading_completions").upsert({user_id:user.id,reading_year:year,chapter_id:chapterId},{onConflict:"user_id,reading_year,chapter_id"});
 if(error)throw error;
 }else{
 const {error}=await supabase.from("reading_completions").delete().eq("user_id",user.id).eq("reading_year",year).eq("chapter_id",chapterId);
 if(error)throw error;
 }
}
