/**
 * Data-safe staged rollout. Existing V1 players must retain their original
 * stages and time rules; new users get V2 only when explicitly enabled.
 * A V2 run (even completed/failed) takes precedence for opted-in users.
 */
export type JourneyVersion="v1"|"v2";
export function chooseJourneyVersion(args:{
 featureEnabled:boolean;
 hasLegacyRun:boolean;
 hasV2Run:boolean;
 lookupFailed?:boolean;
}):JourneyVersion{
 if(!args.featureEnabled||args.lookupFailed)return "v1";
 if(args.hasV2Run)return "v2";
 if(args.hasLegacyRun)return "v1";
 return "v2";
}
