import {supabase} from "../lib/supabase";

/**
 * User-controlled JSON export of their own LABGAME information. Uses only
 * authenticated RLS reads. No service_role, access token, other user data,
 * API key or password is included in the exported document.
 */
type ExportRecord=Record<string,unknown>;
type ExportTable={
 table:string;
 filter:"user_id"|"run_id"|"none";
 ids?:string[];
};
const OPTIONAL_MISSING=new Set(["42P01","PGRST205","PGRST116"]);
async function pageTable({table,filter,ids}:ExportTable,userId:string):Promise<ExportRecord[]>{
 if(!supabase)throw Error("Serviço de exportação indisponível.");
 if(filter==="run_id"&&(!ids||ids.length===0))return [];
 const values:ExportRecord[]=[];
 for(let page=0;page<100;page++){
  let query=supabase.from(table).select("*");
  if(filter==="user_id")query=query.eq("user_id",userId);
  if(filter==="run_id")query=query.in("run_id",ids!);
  const {data,error}=await query.range(page*1000,page*1000+999);
  if(error){
   if(OPTIONAL_MISSING.has(error.code??""))return [];
   throw Error("Não foi possível exportar "+table+": "+error.message);
  }
  values.push(...(data??[]) as ExportRecord[]);
  if((data??[]).length<1000)return values;
 }
 throw Error("Exportação muito grande; solicite a exportação completa ao suporte.");
}
export async function buildAccountExport():Promise<{
 exported_at:string;format:string;account:{id:string;email:string};
 tables:Record<string,ExportRecord[]>
}>{
 if(!supabase)throw Error("Serviço de exportação indisponível.");
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user?.email)throw Error("Entre na sua conta para exportar seus dados.");
 const tables:Record<string,ExportRecord[]>={};
 for(const table of [
  "lab_game_stats","lab_member_profiles","lab_notification_preferences",
  "lab_game_runs","lab_game_video_rewards","lab_game_video_sessions",
  "lab_game_cycle_awards","lab_v2_runs","lab_v2_cycle_awards",
  "lab_v2_monthly_lives","reading_group_members","reading_completions"
 ]){
  tables[table]=await pageTable({table,filter:"user_id"},user.id);
 }
 for(const [table,source] of [
  ["lab_game_chapter_checks","lab_game_runs"],
  ["lab_v2_stages","lab_v2_runs"],
  ["lab_v2_chapter_checks","lab_v2_runs"],
  ["lab_v2_incidents","lab_v2_runs"],
  ["lab_v2_video_sessions","lab_v2_runs"],
  ["lab_v2_video_rewards","lab_v2_runs"],
  ["lab_v2_study_rewards","lab_v2_runs"]
 ]){
  const ids=tables[source].map(row=>row.id).filter((id):id is string=>typeof id==="string");
  tables[table]=await pageTable({table,filter:"run_id",ids},user.id);
 }
 // Favorites have user_id and remain user-private. They may be absent on old backends.
 tables.lab_bible_favorites=await pageTable({table:"lab_bible_favorites",filter:"user_id"},user.id);
 return {
  exported_at:new Date().toISOString(),format:"labgame-user-export-v2",
  account:{id:user.id,email:user.email},tables
 };
}
export async function downloadMyAccountData():Promise<void>{
 const snapshot=await buildAccountExport();
 const blob=new Blob([JSON.stringify(snapshot,null,2)],{type:"application/json;charset=utf-8"});
 const url=URL.createObjectURL(blob);
 try{
  const link=document.createElement("a");
  link.href=url;
  link.download="labgame-meus-dados-"+new Date().toISOString().slice(0,10)+".json";
  link.style.display="none";
  document.body.appendChild(link);
  link.click();
  link.remove();
 }finally{URL.revokeObjectURL(url)}
}
