import {supabase} from "../lib/supabase";
export type LabGameState={
 run_id:string;day:number;completed_days:number;best_days:number;
 total_xp:number;total_completed_days:number;checked:string[];today:string;
 finished?:boolean;display_name?:string;leaderboard_opt_in?:boolean;
};
export type LabRankingEntry={participant:string;completed_days:number;best_days:number;total_xp:number};
export async function loadGameState():Promise<LabGameState>{
 if(!supabase)throw Error("Serviço de leitura indisponível.");
 const {data,error}=await supabase.rpc("lab_game_sync");
 if(error)throw error;
 return data as LabGameState;
}
export async function confirmGameChapter(chapterId:string):Promise<LabGameState>{
 if(!supabase)throw Error("Serviço de leitura indisponível.");
 const {data,error}=await supabase.rpc("lab_game_confirm_chapter",{p_chapter_id:chapterId});
 if(error)throw error;
 return data as LabGameState;
}
export async function saveGameProfile(name:string,optIn:boolean):Promise<void>{
 if(!supabase)throw Error("Serviço de leitura indisponível.");
 const {error}=await supabase.rpc("lab_game_update_profile",{p_name:name,p_opt_in:optIn});
 if(error)throw error;
}
export async function getGameRanking(groupId:string):Promise<LabRankingEntry[]>{
 if(!supabase)throw Error("Serviço de leitura indisponível.");
 const {data,error}=await supabase.rpc("lab_game_group_ranking",{p_group_id:groupId});
 if(error)throw error;
 return (data??[]) as LabRankingEntry[];
}

export async function startNewGameCycle():Promise<LabGameState>{
 if(!supabase)throw Error("Serviço de leitura indisponível.");
 const {data,error}=await supabase.rpc("lab_game_restart_completed");
 if(error)throw error;
 return data as LabGameState;
}

export type GCLeagueEntry={
 rank_position:number;group_id:string;group_name:string;
 members:number;consenting_members:number;days_completed:number;
 compliance_pct:number;window_start:string;window_end:string;
};
export async function getGCLeague():Promise<GCLeagueEntry[]>{
 if(!supabase)throw Error("Serviço de leitura indisponível");
 const {data,error}=await supabase.rpc("lab_game_gc_league");
 if(error)throw error;
 return (data??[]) as GCLeagueEntry[];
}
export async function setGCCompetition(groupId:string,enabled:boolean):Promise<void>{
 if(!supabase)throw Error("Serviço de leitura indisponível");
 const {error}=await supabase.rpc("lab_game_set_gc_competition",{p_group_id:groupId,p_enabled:enabled});
 if(error)throw error;
}
