import {CHAPTERS, type Chapter} from "./canon";
export type DailyReading={day:number;chapters:Chapter[]};
export function createAnnualPlan(year:number):DailyReading[]{
 if(!Number.isInteger(year)||year<1||year>9999) throw new Error("Ano inválido");
 const days=new Date(Date.UTC(year,1,29)).getUTCMonth()===1?366:365;
 // Balanced distribution, complete coverage, no repetition.
 const base=Math.floor(CHAPTERS.length/days), remainder=CHAPTERS.length%days;
 let offset=0;
 return Array.from({length:days},(_,i)=>{
   const count=base+(i<remainder?1:0);
   const chapters=CHAPTERS.slice(offset,offset+count);offset+=count;
   return {day:i+1,chapters};
 });
}
export function verifyAnnualPlan(plan:DailyReading[]):boolean{
 const ids=plan.flatMap(day=>day.chapters.map(ch=>ch.id));
 return ids.length===CHAPTERS.length&&new Set(ids).size===CHAPTERS.length&&CHAPTERS.every(ch=>ids.includes(ch.id));
}
export function dayOfYear(date:Date):number{
 const start=Date.UTC(date.getFullYear(),0,1);
 const today=Date.UTC(date.getFullYear(),date.getMonth(),date.getDate());
 return Math.floor((today-start)/86400000)+1;
}
