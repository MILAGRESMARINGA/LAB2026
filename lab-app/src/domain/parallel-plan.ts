import {CHAPTERS, type Chapter} from "./canon";
export type ParallelDay={day:number;old:Chapter[];psalms:Chapter[];newTestament:Chapter[]};
const distribute=(chapters:Chapter[],days:number)=>{
 let offset=0;
 return Array.from({length:days},(_,i)=>{
  // Front-load the first reading, then spread remaining readings evenly.
  const next=Math.ceil((i+1)*chapters.length/days);
  const part=chapters.slice(offset,next);
  offset=next;
  return part;
 });
};
export function createParallelPlan(year:number):ParallelDay[]{
 if(!Number.isInteger(year)||year<1||year>9999)throw Error("Ano inválido");
 const days=new Date(Date.UTC(year,1,29)).getUTCMonth()===1?366:365;
 const psalms=CHAPTERS.filter(c=>c.book==="Salmos");
 const old=CHAPTERS.filter(c=>c.testament==="AT"&&c.book!=="Salmos");
 const nt=CHAPTERS.filter(c=>c.testament==="NT");
 // Start with John as in the original LAB opening day; retain every NT chapter.
 const john=nt.filter(c=>c.book==="João"), other=nt.filter(c=>c.book!=="João");
 const [o,p,n]=[distribute(old,days),distribute(psalms,days),distribute([...john,...other],days)];
 return Array.from({length:days},(_,i)=>({day:i+1,old:o[i],psalms:p[i],newTestament:n[i]}));
}
export function verifyParallelPlan(plan:ParallelDay[]):boolean{
 const ids=plan.flatMap(d=>[...d.old,...d.psalms,...d.newTestament].map(c=>c.id));
 return ids.length===CHAPTERS.length&&new Set(ids).size===CHAPTERS.length&&CHAPTERS.every(c=>ids.includes(c.id));
}
