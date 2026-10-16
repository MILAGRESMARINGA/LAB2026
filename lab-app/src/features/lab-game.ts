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
export type LabGameChapterReadingStart={
 run_id:string;day:number;chapter_id:string;
 minimum_read_seconds:number;eligible_at:string;
};
export async function beginGameChapter(chapterId:string):Promise<LabGameChapterReadingStart>{
 if(!supabase)throw Error("Serviço de leitura indisponível.");
 if(!/^\d{1,2}:\d{1,3}$/.test(chapterId))throw Error("Capítulo inválido.");
 const {data,error}=await supabase.rpc("lab_game_begin_chapter",{p_chapter_id:chapterId});
 if(error)throw error;
 if(!data||typeof data.minimum_read_seconds!=="number")
  throw Error("O servidor não iniciou a validação da leitura.");
 return data as LabGameChapterReadingStart;
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

export type LabAnnualCycleAward={
 run_id:string;cycle_number:number;bonus_xp:number;awarded_at:string;
};
export type LabScorecard={
 /** Available after annual awards migration; absent on older backend versions. */
 cycle_bonus_xp?:number;
 completed_cycles?:number;
 cycle_awards?:LabAnnualCycleAward[];
 chapters_confirmed:number;
 panoramas_confirmed:number;
 reading_xp:number;
 video_xp:number;
 total_xp:number;
 recorded_xp:number;
 balanced:boolean;
 current_streak:number;
 best_streak:number;
 total_completed_days:number;
 chapter_rate:number;
 video_rate:number;
};
export type GCGroupSummary={
 group_id:string;
 name:string;
 owner_id:string;
 members:number;
 consenting_members:number;
 completed_member_days_7:number;
 compliance_pct:number;
 window_start:string;
 window_end:string;
};
export async function loadGameScorecard():Promise<LabScorecard>{
 if(!supabase)throw Error("Serviço de pontuação indisponível");
 const {data,error}=await supabase.rpc("lab_game_scorecard");
 if(error)throw error;
 return data as LabScorecard;
}
export async function loadGroupSummary(groupId:string):Promise<GCGroupSummary>{
 if(!supabase)throw Error("Serviço de grupos indisponível");
 const {data,error}=await supabase.rpc("lab_game_group_summary",{p_group_id:groupId});
 if(error)throw error;
 return data as GCGroupSummary;
}
