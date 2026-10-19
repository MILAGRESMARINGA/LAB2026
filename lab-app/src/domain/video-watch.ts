/** Server is authoritative. These values only render its receipt. */
export type VideoWatchState={
 session_id:string;ready:boolean;duration_seconds:number;covered_seconds:number;
 next_position:number;playback_complete:boolean;already_awarded:boolean;
 questions?:{id:number;prompt:string;options:string[]}[];
 feedback?:string[];passed?:boolean;awarded?:boolean;total_xp?:number;
};
export function formatVideoTime(seconds:number):string{
 const value=Number.isFinite(seconds)?Math.max(0,Math.round(seconds)):0;
 return `${Math.floor(value/60)}:${String(value%60).padStart(2,"0")}`;
}
