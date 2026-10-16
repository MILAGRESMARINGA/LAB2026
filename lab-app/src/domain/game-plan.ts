import {CHAPTERS,type Chapter} from "./canon";
/** LABGAME competitive path: exactly 365 consecutive daily stages. */
export const GAME_DAYS=365;
export const GAME_PLAN_VERSION=1;
export type GameDay={day:number;old:Chapter[];psalms:Chapter[];newTestament:Chapter[];chapters:Chapter[]};
export function createGamePlan():GameDay[]{
 const old=CHAPTERS.filter(c=>c.testament==="AT"&&c.book!=="Salmos");
 const psalms=CHAPTERS.filter(c=>c.book==="Salmos");
 const orderedBooks=["João","Mateus","Marcos","Lucas","Atos"];
 const nt=CHAPTERS.filter(c=>c.testament==="NT").sort((a,b)=>{
  const rank=(c:Chapter)=>{const pos=orderedBooks.indexOf(c.book);return pos<0?5+Number(c.id.split(":")[0]):pos};
  return rank(a)-rank(b)||a.chapter-b.chapter;
 });
 const result:GameDay[]=[];
 const start=(day:number,o:Chapter[],p:Chapter[],n:Chapter[]):GameDay=>({day,old:o,psalms:p,newTestament:n,chapters:[...o,...p,...n]});
 result.push(start(1,old.slice(0,1),psalms.slice(0,1),nt.slice(0,1)));
 const span=GAME_DAYS-1;
 const restOld=old.slice(1),restPsalm=psalms.slice(1),restNT=nt.slice(1);
 const neededExtras=restOld.length-span*2;
 if(neededExtras<0)throw Error("Distribuição inválida de livros históricos");
 const flag=(index:number,count:number)=>Math.floor((index+1)*count/span)-Math.floor(index*count/span);
 const template=Array.from({length:span},(_,i)=>({ps:flag(i,restPsalm.length),nt:flag(i,restNT.length)}));
 const candidates=template.flatMap((entry,i)=>entry.ps+entry.nt<=1?[i]:[]);
 if(candidates.length<neededExtras)throw Error("Impossível distribuir em até quatro capítulos por dia");
 const extras=new Set(Array.from({length:neededExtras},(_,i)=>candidates[Math.floor((i+.5)*candidates.length/neededExtras)]));
 let o=0,p=0,n=0;
 template.forEach((entry,i)=>{
  const oldCount=2+(extras.has(i)?1:0);
  result.push(start(i+2,restOld.slice(o,o+oldCount),restPsalm.slice(p,p+entry.ps),restNT.slice(n,n+entry.nt)));
  o+=oldCount;p+=entry.ps;n+=entry.nt;
 });
 if(o!==restOld.length||p!==restPsalm.length||n!==restNT.length)throw Error("Capítulos não distribuídos");
 return result;
}
export function verifyGamePlan(plan:ReadonlyArray<GameDay>):boolean{
 if(plan.length!==GAME_DAYS||plan.some((d,i)=>d.day!==i+1||d.chapters.length<1||d.chapters.length>4))return false;
 const ids=plan.flatMap(d=>d.chapters.map(c=>c.id));
 return ids.length===CHAPTERS.length&&new Set(ids).size===CHAPTERS.length&&CHAPTERS.every(c=>ids.includes(c.id))
 &&plan[0].old[0]?.book==="Gênesis"&&plan[0].psalms[0]?.book==="Salmos"&&plan[0].newTestament[0]?.book==="João"
 &&plan[0].chapters.every(c=>c.chapter===1);
}
export function chaptersByStage(day:number):Chapter[]{
 if(!Number.isInteger(day)||day<1||day>GAME_DAYS)throw Error("Etapa inválida");
 return createGamePlan()[day-1].chapters;
}
