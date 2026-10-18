export type FlameStatus="inactive"|"active"|"failed"|"completed";
export type FlameTone="quiet"|"ember"|"growing"|"steady"|"intense";
export type FlameUrgency="normal"|"watch"|"grace";
export type FlamePresentation={tone:FlameTone;title:string;description:string;iconSize:number;completedDays:number;urgency:FlameUrgency};
export type FlameTiming={serverNow?:string|null;deadlineAt?:string|null;graceDeadlineAt?:string|null};

function urgencyFor(timing:FlameTiming|undefined):FlameUrgency{
 if(!timing?.deadlineAt)return "normal";
 const deadline=Date.parse(timing.deadlineAt);
 const grace=timing.graceDeadlineAt?Date.parse(timing.graceDeadlineAt):NaN;
 const now=timing.serverNow?Date.parse(timing.serverNow):Date.now();
 if(!Number.isFinite(deadline)||!Number.isFinite(now))return "normal";
 if(now>deadline&&Number.isFinite(grace)&&now<=grace)return "grace";
 if(now<=deadline&&deadline-now<=60*60*1000)return "watch";
 return "normal";
}

/** Presentation only: derives its state from completed stages and the persisted run status. */
export function flamePresentation(completedDays:number,status:FlameStatus="active",timing?:FlameTiming):FlamePresentation{
 const count=Number.isFinite(completedDays)?Math.max(0,Math.floor(completedDays)):0;
 const urgency=urgencyFor(timing);
 if(status==="active"&&urgency==="watch"){
  return {tone:"ember",title:"Proteja a sua chama",description:"A janela da etapa está perto do fim. Ainda há tempo para concluir com calma.",iconSize:56,completedDays:count,urgency};
 }
 if(status==="active"&&urgency==="grace"){
  return {tone:"ember",title:"Chama em alerta",description:"Você está na janela de carência. O servidor registrará a conclusão conforme as regras da jornada.",iconSize:50,completedDays:count,urgency};
 }
 if(status==="failed"){
  return {tone:"ember",title:"Chama em brasa",description:"Esta tentativa foi encerrada. Seus registros e recorde permanecem no histórico.",iconSize:42,completedDays:count,urgency:"normal"};
 }
 if(status==="completed"){
  return {tone:"intense",title:"Jornada concluída",description:count+" "+(count===1?"dia confirmado":"dias confirmados")+" nesta tentativa.",iconSize:76,completedDays:count,urgency:"normal"};
 }
 if(count>=30){
  return {tone:"intense",title:"Chama viva e firme",description:count+" dias confirmados nesta tentativa.",iconSize:76,completedDays:count,urgency};
 }
 if(count>=7){
  return {tone:"steady",title:"Chama constante",description:count+" dias confirmados nesta tentativa.",iconSize:64,completedDays:count,urgency};
 }
 if(count>0){
  return {tone:"growing",title:"Chama em crescimento",description:count+" "+(count===1?"dia confirmado":"dias confirmados")+" nesta tentativa.",iconSize:52,completedDays:count,urgency};
 }
 return {
  tone:"quiet",
  title:"Pronta para acender",
  description:status==="inactive"?"Confirme a primeira etapa para começar a registrar sua constância.":"Sua constância começa ao confirmar a primeira etapa.",
  iconSize:38,
  completedDays:0,
  urgency
 };
}
