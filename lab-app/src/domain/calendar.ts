import type {ParallelDay} from "./parallel-plan";
export function chaptersForDay(day:ParallelDay){return [...day.old,...day.psalms,...day.newTestament]}
export function readingDate(year:number,day:number):Date{
 const d=new Date(Date.UTC(year,0,day));
 if(d.getUTCFullYear()!==year)throw Error("Dia fora do ano");
 return d;
}
export function formatReadingDate(year:number,day:number):string{return readingDate(year,day).toLocaleDateString("pt-BR",{timeZone:"UTC",day:"2-digit",month:"long"})}
