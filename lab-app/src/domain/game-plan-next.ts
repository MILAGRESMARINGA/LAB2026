import {CHAPTERS,type Chapter} from "./canon";
import type {GameDay} from "./game-plan";

/**
 * Candidate, immutable V2 plans. Kept separate from V1 on purpose:
 * production runs using GAME_PLAN_VERSION=1 must not silently change.
 * Nothing here writes to Supabase or replaces createGamePlan().
 */
export type NextPlanLength=365|366;
export type NextGamePlan={version:2;days:NextPlanLength;stages:GameDay[]};
const orderedBooks=["João","Mateus","Marcos","Lucas","Atos"];
const ntOrdered=()=>{
 const nt=CHAPTERS.filter(c=>c.testament==="NT");
 return nt.sort((a,b)=>{
  const rank=(c:Chapter)=>{
   const position=orderedBooks.indexOf(c.book);
   return position>=0?position:5+Number(c.id.split(":")[0]);
  };
  return rank(a)-rank(b)||a.chapter-b.chapter;
 });
};
function quotaSlot(index:number,quota:number,count:number):number{
 return Math.floor((index+1)*quota/count)-Math.floor(index*quota/count);
}

/**
 * Every day holds exactly 3 or 4 different chapters. The three streams keep
 * their original internal order (AT excluding Psalms, Psalms, NT starting at John).
 */
export function createNextGamePlan(days:NextPlanLength):NextGamePlan{
 if(days!==365&&days!==366)throw Error("Ciclo deve conter 365 ou 366 etapas.");
 const old=CHAPTERS.filter(c=>c.testament==="AT"&&c.book!=="Salmos");
 const psalms=CHAPTERS.filter(c=>c.book==="Salmos");
 const nt=ntOrdered();
 const stage=(day:number,at:Chapter[],ps:Chapter[],newT:Chapter[]):GameDay=>({
  day,old:at,psalms:ps,newTestament:newT,chapters:[...at,...ps,...newT]
 });
 const stages:GameDay[]=[stage(1,old.slice(0,1),psalms.slice(0,1),nt.slice(0,1))];
 const span=days-1;
 const quota=[(old.length-1)-2*span,psalms.length-1,nt.length-1];
 const used=[0,0,0];
 const totalExtras=quota.reduce((a,b)=>a+b,0);
 const doubleDays=totalExtras-span;
 if(quota.some(q=>q<0||q>span)||doubleDays<0||doubleDays>span)
  throw Error("Distribuição inválida para plano canônico.");
 let oldOffset=1,psOffset=1,ntOffset=1;
 for(let i=0;i<span;i++){
  const slots=1+quotaSlot(i,doubleDays,span);
  const futureDays=span-i-1;
  const chosen=[0,1,2].filter(t=>quota[t]-used[t]>futureDays);
  if(chosen.length>slots)throw Error("A sequência não cabe no plano.");
  while(chosen.length<slots){
   const options=[0,1,2].filter(t=>!chosen.includes(t)&&quota[t]>used[t]);
   if(!options.length)throw Error("Não há capítulos suficientes para completar a etapa.");
   options.sort((a,b)=>
    ((i+1)*quota[b]/span-used[b])-((i+1)*quota[a]/span-used[a])||a-b
   );
   chosen.push(options[0]);
  }
  for(const t of chosen)used[t]++;
  const countOld=2+(chosen.includes(0)?1:0);
  const countPs=chosen.includes(1)?1:0;
  const countNt=chosen.includes(2)?1:0;
  const at=old.slice(oldOffset,oldOffset+countOld);
  const ps=psalms.slice(psOffset,psOffset+countPs);
  const newT=nt.slice(ntOffset,ntOffset+countNt);
  stages.push(stage(i+2,at,ps,newT));
  oldOffset+=countOld;psOffset+=countPs;ntOffset+=countNt;
 }
 if(oldOffset!==old.length||psOffset!==psalms.length||ntOffset!==nt.length)
  throw Error("Plano não percorreu todos os capítulos.");
 const plan:NextGamePlan={version:2,days,stages};
 if(!validateNextGamePlan(plan))throw Error("Plano gerado não atende ao cânon.");
 return plan;
}

export function validateNextGamePlan(plan:NextGamePlan):boolean{
 if(plan.version!==2||![365,366].includes(plan.days)||plan.stages.length!==plan.days)
  return false;
 if(plan.stages.some((stage,i)=>stage.day!==i+1||
   stage.chapters.length<3||stage.chapters.length>4||
   stage.chapters.length!==stage.old.length+stage.psalms.length+stage.newTestament.length||
   stage.chapters.some((chapter,j)=>
    chapter.id!==[...stage.old,...stage.psalms,...stage.newTestament][j]?.id)))return false;
 const all=plan.stages.flatMap(s=>s.chapters);
 const first=plan.stages[0].chapters.map(c=>c.book+" "+c.chapter);
 if(first.join("|")!=="Gênesis 1|Salmos 1|João 1")return false;
 if(all.length!==1189||new Set(all.map(c=>c.id)).size!==1189)return false;
 for(const [stream,expected] of [
  [plan.stages.flatMap(d=>d.old),CHAPTERS.filter(c=>c.testament==="AT"&&c.book!=="Salmos")],
  [plan.stages.flatMap(d=>d.psalms),CHAPTERS.filter(c=>c.book==="Salmos")],
  [plan.stages.flatMap(d=>d.newTestament),ntOrdered()]
 ] as const){
  if(stream.length!==expected.length||stream.some((c,i)=>c.id!==expected[i].id))return false;
 }
 return true;
}
