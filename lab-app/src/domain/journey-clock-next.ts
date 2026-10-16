/**
 * Pure model of the APPROVED rolling-clock rules. This is intentionally NOT
 * connected to any RPC or UI; only a serializable SQL ledger may consume lives.
 * It never relies on localStorage, a client clock for authorizing actions,
 * browser timers or user-provided timezone.
 */
export const CLOCK_RULES={
 normalHours:24,graceHours:6,lifeExtensionHours:24,monthlyLives:3,
 chapterXp:10,videoXp:5
} as const;
const HOUR=60*60*1000;
const NORMAL=CLOCK_RULES.normalHours*HOUR;
const GRACE=CLOCK_RULES.graceHours*HOUR;
const EXTENSION=CLOCK_RULES.lifeExtensionHours*HOUR;
export const LIFE_TIME_ZONE="America/Sao_Paulo" as const;

function time(value:string):number{
 if(!/(Z|[+-]\d{2}:\d{2})$/.test(value))
  throw Error("Horário precisa de fuso explícito.");
 const ms=Date.parse(value);
 if(!Number.isFinite(ms))throw Error("Horário inválido.");
 return ms;
}
const iso=(ms:number)=>new Date(ms).toISOString();

export function deadlines(activatedAt:string){
 const start=time(activatedAt);
 return {normalAt:iso(start+NORMAL),graceAt:iso(start+NORMAL+GRACE)};
}

/** Period of FIRST expiry only. The same incident is never reclassified at a month rollover. */
export function incidentMonth(incidentAt:string):string{
 const parts=new Intl.DateTimeFormat("en-US",{
  timeZone:LIFE_TIME_ZONE,year:"numeric",month:"2-digit"
 }).formatToParts(new Date(time(incidentAt)));
 const year=parts.find(p=>p.type==="year")?.value;
 const month=parts.find(p=>p.type==="month")?.value;
 if(!year||!month)throw Error("Período inválido.");
 return year+"-"+month;
}
export type PassagePhase="normal"|"grace"|"rescue"|"failed";
export type PassageQuote={
 phase:PassagePhase;
 normalAt:string;graceAt:string;
 incidentAt:string|null;incidentPeriod:string|null;
 /** Number of lives required IN THIS SAME incident by the reference time. */
 requiredLives:number;
 /** Lives from the original incident-period snapshot, never from next month's balance. */
 availableAtIncident:number;
 /** Last instant protected by the available lives; only meaningful for failed runs. */
 rescueLimitAt:string|null;
};
/**
 * Computes what the SERVER should atomically debit in its own incident ledger.
 * 'availableAtIncident' is the historical budget at original grace expiry;
 * passing a renewed monthly balance is a caller bug.
 */
export function quotePassage(
 activatedAt:string,at:string,availableAtIncident:number=CLOCK_RULES.monthlyLives
):PassageQuote{
 if(!Number.isSafeInteger(availableAtIncident)||availableAtIncident<0||
    availableAtIncident>CLOCK_RULES.monthlyLives)
  throw Error("Saldo de vidas do incidente inválido.");
 const start=time(activatedAt),now=time(at);
 if(now<start)throw Error("Instante anterior à ativação.");
 const normal=start+NORMAL,grace=normal+GRACE;
 const expired=now>grace;
 const incidentAt=expired?iso(grace):null;
 const requiredLives=expired?Math.ceil((now-grace)/EXTENSION):0;
 const phase:PassagePhase=now<=normal?"normal":now<=grace?"grace":
  requiredLives<=availableAtIncident?"rescue":"failed";
 return {
  phase,normalAt:iso(normal),graceAt:iso(grace),
  incidentAt,incidentPeriod:incidentAt?incidentMonth(incidentAt):null,
  requiredLives,availableAtIncident,
  rescueLimitAt:expired?iso(grace+availableAtIncident*EXTENSION):null
 };
}
/** Single allowance (reading completion OR next activation, whichever is later). */
export function singleTransitionPenalty(
 activatedAt:string,completedAt:string,nextActivatedAt:string
):{penaltyXp:0|3|6;needsRescue:boolean;eligibleAt:string}{
 const start=time(activatedAt);
 const completed=time(completedAt),next=time(nextActivatedAt);
 const eligible=Math.max(start+NORMAL,completed);
 if(completed<start)throw Error("Leitura antes da ativação.");
 if(next<eligible)throw Error("Não é permitido antecipar a próxima etapa.");
 const elapsed=Math.max(completed,next)-start;
 return {
  penaltyXp:elapsed<=NORMAL?0:elapsed<=NORMAL+3*HOUR?3:6,
  needsRescue:elapsed>NORMAL+GRACE,
  eligibleAt:iso(eligible)
 };
}
/** Completing a stage is mandatory even if 1, 2 or 3 lives have been spent. */
export function nextEligibleAt(activatedAt:string,completedAt:string|null):string|null{
 if(completedAt===null)return null;
 const activated=time(activatedAt),completed=time(completedAt);
 if(completed<activated)throw Error("Conclusão antes da ativação.");
 return iso(Math.max(activated+NORMAL,completed));
}
/** No rollover of leftover lives; deductions are always applied to the period of the event. */
export function monthlyLifeBalance(usedInPeriod:number):number{
 if(!Number.isSafeInteger(usedInPeriod)||usedInPeriod<0)
  throw Error("Consumo mensal inválido.");
 return Math.max(0,CLOCK_RULES.monthlyLives-usedInPeriod);
}
export type StageReward={
 chapterIds:readonly string[];
 penaltyXp:0|3|6;
};
/** Score in ONE run, with no lifetime/history argument on purpose. */
export function stageXp({chapterIds,penaltyXp}:StageReward):number{
 if(new Set(chapterIds).size!==chapterIds.length)
  throw Error("Capítulo repetido na etapa.");
 if(chapterIds.length<0||chapterIds.length>4)
  throw Error("Número de capítulos inválido.");
 return Math.max(0,chapterIds.length*CLOCK_RULES.chapterXp-penaltyXp);
}
export function activeRunXp(stageAwards:readonly number[],videoXp:number=0,studyXp:number=0):number{
 if([...stageAwards,videoXp,studyXp].some(n=>!Number.isSafeInteger(n)||n<0))
  throw Error("Pontuação inválida.");
 return stageAwards.reduce((total,value)=>total+value,0)+videoXp+studyXp;
}
export function recordToBeat(previousBest:number,completedInThisRun:number):number{
 if(!Number.isSafeInteger(previousBest)||!Number.isSafeInteger(completedInThisRun)||
   previousBest<0||completedInThisRun<0)throw Error("Recorde inválido.");
 return Math.max(previousBest,completedInThisRun);
}
