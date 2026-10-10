import {CANON,CHAPTERS} from "./canon";
import {createParallelPlan,verifyParallelPlan} from "./parallel-plan";
export type AuditResult={year:number;days:number;books:number;chapters:number;valid:boolean;issues:string[]};
export function auditPlan(year:number):AuditResult{
 const plan=createParallelPlan(year);
 const issues:string[]=[];
 if(CANON.length!==66)issues.push("O cânon deve conter 66 livros.");
 if(CHAPTERS.length!==1189)issues.push("O cânon deve conter 1.189 capítulos.");
 if(!verifyParallelPlan(plan))issues.push("Capítulos ausentes ou duplicados.");
 if(plan[0].old[0]?.book!=="Gênesis"||plan[0].old[0]?.chapter!==1)issues.push("Dia 1 não começa em Gênesis 1.");
 if(plan[0].psalms[0]?.book!=="Salmos"||plan[0].psalms[0]?.chapter!==1)issues.push("Dia 1 não começa em Salmos 1.");
 if(plan[0].newTestament[0]?.book!=="João"||plan[0].newTestament[0]?.chapter!==1)issues.push("Dia 1 não começa em João 1.");
 return {year,days:plan.length,books:CANON.length,chapters:CHAPTERS.length,valid:issues.length===0,issues};
}
