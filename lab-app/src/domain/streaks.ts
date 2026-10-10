import type {DailyReading} from "./plan";
export function readingStreak(completedIds:ReadonlySet<string>,days:ReadonlyArray<{day:number;chapters:ReadonlyArray<{id:string}>}>,throughDay:number):number{
 let count=0;
 for(let i=Math.min(throughDay,days.length)-1;i>=0;i--){
  const chapters=days[i].chapters;
  if(!chapters.length||!chapters.every(ch=>completedIds.has(ch.id)))break;
  count++;
 }
 return count;
}
export function completedDayCount(completedIds:ReadonlySet<string>,days:ReadonlyArray<{chapters:ReadonlyArray<{id:string}>}>):number{
 return days.filter(d=>d.chapters.length>0&&d.chapters.every(ch=>completedIds.has(ch.id))).length;
}
