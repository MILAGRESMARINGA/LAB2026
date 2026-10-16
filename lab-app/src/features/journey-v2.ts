import {supabase} from "../lib/supabase";
import type {GCLeagueEntry,GCGroupSummary,LabRankingEntry} from "./lab-game";

/**
 * Shadow V2 transport. Not imported by the live App or the V1 journey.
 * Both checks are intentional:
 * - VITE_LAB_V2_READY gates the client at build time (default OFF).
 * - lab_v2_release_controls gates the PostgreSQL RPC (default OFF).
 * Do not add V2 to navigation until migrations, staging E2E and opt-in migration.
 */
export type JourneyV2Length=365|366;
export type JourneyV2Status="active"|"failed"|"completed";
export type JourneyV2State={
 run_id:string;
 status:JourneyV2Status;
 plan_length:JourneyV2Length;
 stage:number|null;
 activated_at:string|null;
 completed_at:string|null;
 next_eligible_at:string|null;
 normal_deadline_at:string|null;
 grace_deadline_at:string|null;
 run_xp:number;
 reading_xp?:number;
 cycle_bonus_xp?:number;
 video_xp?:number;
 study_xp?:number;
 studies_this_run?:number;
 studies_completed_historical?:number;
 checked?:string[];
 completed_stages?:number;
 completed_bibles_historical?:number;
 cycle_award?:{cycle_number:number;bonus_xp:number;perfect_constancy:boolean;awarded_at:string}|null;
 best_completed_stages:number;
 remaining_lives_this_month:number;
 server_at:string;
};
export type JourneyV2Chapter={day_number:number;slot:number;chapter_id:string};

export function assertV2ClientEnabled():void{
 if(import.meta.env.VITE_LAB_V2_READY!=="true")
  throw Error("A Jornada V2 está em homologação e ainda não foi liberada neste aplicativo.");
 if(!supabase)throw Error("Serviço da Jornada indisponível.");
}
function validRunId(runId:string):string{
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(runId))
  throw Error("Identificador da jornada inválido.");
 return runId;
}
function validStage(stage:number):number{
 if(!Number.isSafeInteger(stage)||stage<1||stage>366)throw Error("Etapa inválida.");
 return stage;
}
function validLength(days:number):JourneyV2Length{
 if(days!==365&&days!==366)throw Error("Plano inválido.");
 return days;
}
async function requestV2(rpc:string,args:Record<string,string|number>):Promise<JourneyV2State>{
 assertV2ClientEnabled();
 const {data,error}=await supabase!.rpc(rpc,args);
 if(error)throw error;
 const item=data as JourneyV2State|null;
 if(!item||!["active","completed","failed"].includes(item.status)||
    !Number.isFinite(item.run_xp)||item.run_xp<0)
  throw Error("Resposta de Jornada V2 inválida. Nenhum progresso foi confirmado.");
 return item;
}

/** User must explicitly choose and activate a 365/366 plan after eligibility checks. */
export function startJourneyV2(days:JourneyV2Length){
 return requestV2("lab_v2_start",{p_plan_length:validLength(days)});
}
/** Reads server-authoritative timestamps; never calculates a deadline to commit to SQL. */
export function syncJourneyV2(runId:string){
 return requestV2("lab_v2_sync",{p_run:validRunId(runId)});
}
export function activateJourneyV2(runId:string,stage:number){
 return requestV2("lab_v2_activate",{
  p_run:validRunId(runId),p_stage:validStage(stage)
 });
}
/** Start the chapter timer on the database server; callers never submit timestamps. */
export async function beginJourneyV2Chapter(runId:string,stage:number,chapterId:string):Promise<void>{
 assertV2ClientEnabled();
 if(!/^\d{1,2}:\d{1,3}$/.test(chapterId))throw Error("Capítulo inválido.");
 const {error}=await supabase!.rpc("lab_v2_begin_chapter",{
  p_run:validRunId(runId),p_stage:validStage(stage),p_chapter:chapterId
 });
 if(error)throw error;
}
export function confirmJourneyV2Chapter(runId:string,stage:number,chapterId:string){
 if(!/^\d{1,2}:\d{1,3}$/.test(chapterId))throw Error("Capítulo inválido.");
 return requestV2("lab_v2_confirm",{
  p_run:validRunId(runId),p_stage:validStage(stage),p_chapter:chapterId
 });
}
/** Read-only canonical reference; the server is the source of truth for progression. */
export async function getJourneyV2Chapters(days:JourneyV2Length,stage:number):Promise<JourneyV2Chapter[]>{
 assertV2ClientEnabled();
 const {data,error}=await supabase!.from("lab_v2_plan_chapters")
  .select("day_number,slot,chapter_id")
  .eq("plan_length",validLength(days))
  .eq("day_number",validStage(stage))
  .order("slot",{ascending:true});
 if(error)throw error;
 const chapters=(data??[]) as JourneyV2Chapter[];
 if(chapters.length<3||chapters.length>4)throw Error("Plano V2 incompleto neste servidor.");
 return chapters;
}

/** No legacy lab_game_sync side effect: reads only V2 runs under RLS. */
export async function loadLatestJourneyV2():Promise<JourneyV2State|null>{
 assertV2ClientEnabled();
 const {data,error}=await supabase!.from("lab_v2_runs")
  .select("id,status,started_at").order("started_at",{ascending:false}).limit(1).maybeSingle();
 if(error)throw error;
 if(!data)return null;
 return syncJourneyV2(data.id as string);
}
export async function getJourneyV2Checks(runId:string,stage:number):Promise<string[]>{
 assertV2ClientEnabled();
 const {data,error}=await supabase!.from("lab_v2_chapter_checks")
  .select("chapter_id").eq("run_id",validRunId(runId))
  .eq("day_number",validStage(stage));
 if(error)throw error;
 return (data??[]).map(row=>row.chapter_id as string);
}

/** Rankings for 24h rolling stages; never substitute the V1 civil-day functions. */
export async function getV2GCLeague():Promise<GCLeagueEntry[]>{
 assertV2ClientEnabled();
 const {data,error}=await supabase!.rpc("lab_v2_gc_league");
 if(error)throw error;
 return (data??[]) as GCLeagueEntry[];
}
export async function getV2GroupSummary(groupId:string):Promise<GCGroupSummary>{
 assertV2ClientEnabled();
 const {data,error}=await supabase!.rpc("lab_v2_group_summary",{p_group_id:validRunId(groupId)});
 if(error)throw error;
 if(!data)throw Error("GC indisponível");
 return data as GCGroupSummary;
}
export async function getV2GroupRanking(groupId:string):Promise<LabRankingEntry[]>{
 assertV2ClientEnabled();
 const {data,error}=await supabase!.rpc("lab_v2_group_ranking",{p_group_id:validRunId(groupId)});
 if(error)throw error;
 return (data??[]) as LabRankingEntry[];
}

/** Self-confirmed, canonical study completion; no effect on chapter unlocks. */
export async function getV2StudyRewards(runId:string):Promise<string[]>{
 assertV2ClientEnabled();
 const {data,error}=await supabase!.from("lab_v2_study_rewards")
  .select("study_key").eq("run_id",validRunId(runId));
 if(error)throw error;
 return (data??[]).map(row=>String(row.study_key));
}
export async function confirmV2Study(runId:string,studyKey:string,acknowledged:boolean):Promise<{
 awarded:boolean;total_xp:number;study_xp:number;studies_this_run:number
}>{
 assertV2ClientEnabled();
 if(!/^[a-z0-9-]{2,100}$/.test(studyKey))throw Error("Estudo inválido.");
 if(!acknowledged)throw Error("Confirme que examinou as referências bíblicas.");
 const {data,error}=await supabase!.rpc("lab_v2_confirm_study",{
  p_run:validRunId(runId),p_study_key:studyKey,p_acknowledged:true
 });
 if(error)throw error;
 if(!data||typeof data.awarded!=="boolean")throw Error("O servidor não confirmou o estudo.");
 return data as {awarded:boolean;total_xp:number;study_xp:number;studies_this_run:number};
}
