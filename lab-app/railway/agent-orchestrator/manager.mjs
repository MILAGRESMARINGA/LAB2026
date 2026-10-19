// Operational manager: private memory and evidence-based commands, no inference.
export function managerInstruction(value){
 if(typeof value!=="string")throw Error("Mensagem inválida.");
 const text=value.normalize("NFC").replace(/\p{C}/gu," ").trim();
 if(text.length<2||text.length>3000)throw Error("A mensagem deve ter de 2 a 3000 caracteres.");
 if(/\b(?:sk-(?:proj-|svcacct-)?[a-z0-9_-]{12,}|sb_secret_[a-z0-9_-]{10,}|gh[pousr]_[a-z0-9_]{15,}|github_pat_[a-z0-9_]{15,}|eyJ[a-z0-9_-]{15,}\.[a-z0-9_-]+\.[a-z0-9_-]+)\b|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:senha|password|api[_ -]?key|token|service_role)\s*[:=]\s*\S{4,}/i.test(text))throw Error("Não envie senhas, tokens ou chaves. A mensagem não foi salva.");
 return text;
}
export function managerIntent(text){
 const priority=/\bprioridade\s+(alta|normal|baixa)\s+(?:para\s+)?(?:(?:a\s+)?tarefa\s*)?#?([1-9][0-9]{0,8})\b/i.exec(text);
 if(priority)return {kind:"priority",issue:Number(priority[2]),priority:({alta:"high",normal:"normal",baixa:"low"})[priority[1].toLowerCase()]};
 if(/^(?:lembrar|lembre|decis[aã]o|registre (?:esta |a )?decis[aã]o)\s*[: ]/i.test(text))return {kind:"decision"};
 if(/^(?:status|fila|andamento|prioridades|pr[oó]xim[oa]s?(?: tarefas?| passos?)?|como est[aá] (?:a fila|o projeto))[?!.\s]*$/i.test(text))return {kind:"status"};
 return {kind:"conversation"};
}
export function orderedTasks(tasks,priorities){
 const weights={high:0,normal:1,low:2};
 const byIssue=new Map(priorities.map(item=>[item.issue_number,item.priority]));
 return tasks.map(task=>({...task,priority:byIssue.get(task.number)??"normal"}))
  .sort((a,b)=>(weights[a.priority]??1)-(weights[b.priority]??1)||a.number-b.number);
}
export function managerReply(intent,evidence=[]){
 if(intent.kind==="decision")return "Decisão registrada na memória privada. Ela não altera código nem autoriza uma publicação. Posso recuperá-la neste painel após você voltar.";
 if(intent.kind==="priority")return `Prioridade ${({high:"alta",normal:"normal",low:"baixa"})[intent.priority]} registrada para a tarefa #${intent.issue}. A prioridade organiza a fila; não interrompe execuções nem declara a tarefa concluída.`;
 if(intent.kind==="status"){
  if(!evidence.length)return "Não encontrei tarefas abertas na consulta atual. Isso não comprova que todo o roadmap foi concluído.";
  const names={queued:"na fila",running:"executando",approval_required:"aguardando aprovação",failed:"com falha",draft_pr:"com PR em rascunho",review:"em revisão",merged:"integrada",closed:"com PR fechado",completed_without_pr:"encerrada sem PR"};
  return evidence.slice(0,8).map(item=>`#${item.number}: ${names[item.stage]??"estado não confirmado"}; prioridade ${({high:"alta",normal:"normal",low:"baixa"})[item.priority]??"normal"}.`).join(" ")+" PR aberto não comprova CI aprovado ou publicação. Consulte Acompanhar para abrir as evidências.";
 }
 return "Posso guardar decisões, organizar prioridades e consultar execuções reais. Diga ‘status’, ‘lembrar: sua decisão’ ou ‘prioridade alta para tarefa 47’. Para solicitar código, use Registrar tarefa. Este modo operacional ainda não interpreta objetivos livremente nem decompõe um projeto por IA.";
}
