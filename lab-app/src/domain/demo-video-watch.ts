/** Local demo guard only. Production awards remain server-authoritative. */
export type WatchSample={position:number;clock:number};
export type DemoWatch={frontier:number;previous:WatchSample|null};
export const newDemoWatch=():DemoWatch=>({frontier:0,previous:null});
export function sampleDemoWatch(state:DemoWatch,sample:WatchSample,eligible:boolean):DemoWatch{
 if(!eligible||!Number.isFinite(sample.position)||!Number.isFinite(sample.clock))return {...state,previous:null};
 const previous=state.previous;
 if(!previous)return {...state,previous:sample};
 const elapsed=(sample.clock-previous.clock)/1000,delta=sample.position-previous.position;
 // Reject jumps, stale callbacks, playback acceleration and replaying past a gap.
 const contiguous=elapsed>0&&elapsed<=1.5&&delta>=0&&delta<=elapsed+0.15&&previous.position<=state.frontier+0.15;
 return {frontier:contiguous?Math.max(state.frontier,sample.position):state.frontier,previous:sample};
}
export function demoWatchComplete(state:DemoWatch,duration:number,ended:boolean):boolean{
 return ended&&Number.isFinite(duration)&&duration>0&&state.frontier>=duration-0.35;
}
