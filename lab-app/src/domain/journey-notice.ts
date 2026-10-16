export type JourneyNoticeKind="reading"|"closing"|"grace"|"late";
type Input={
 visibleOnJourney:boolean;readingComplete:boolean;now:number;
 normalDeadlineAt:string|null;graceDeadlineAt:string|null;
 readingPopup:boolean;stagePopup:boolean;
};
const TWO_HOURS=2*60*60*1000;
/** Select one foreground notice, preferring a server-timed stage alert. */
export function selectJourneyNotice(input:Input):JourneyNoticeKind|null{
 if(!input.visibleOnJourney||input.readingComplete)return null;
 const normal=input.normalDeadlineAt?Date.parse(input.normalDeadlineAt):NaN;
 const grace=input.graceDeadlineAt?Date.parse(input.graceDeadlineAt):NaN;
 if(input.stagePopup&&Number.isFinite(normal)&&Number.isFinite(grace)&&grace>normal){
  const remaining=normal-input.now;
  if(remaining>=0&&remaining<=TWO_HOURS)return "closing";
  if(input.now>normal&&input.now<=grace)return "grace";
  if(input.now>grace)return "late";
 }
 return input.readingPopup?"reading":null;
}

/** One persisted foreground notice per user and journey day/stage. */
export function dailyNoticeStorageKey(userId:string,journeyDay:string):string{
 return "labgame-notice:"+userId+":"+journeyDay;
}
