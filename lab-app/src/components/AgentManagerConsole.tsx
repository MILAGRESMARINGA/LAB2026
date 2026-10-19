import {useEffect,useRef,useState} from "react";
import {MessageSquare,Send,RefreshCw} from "lucide-react";

type ManagerEvent={id:number;request_id:string;message:string;reply:string;kind:string;created_at:string};
type ManagerState={events:ManagerEvent[];priorities:{issue_number:number;priority:string}[];history_partial:boolean;receipt?:{reply:string}|null};
type Props={request:(path:string,body?:Record<string,string>)=>Promise<ManagerState>;onReply:(text:string)=>void;onTask:(number:number)=>void;voiceMessage:{id:string;text:string}|null};
export function AgentManagerConsole({request,onReply,onTask,voiceMessage}:Props){
 const [state,setState]=useState<ManagerState|null>(null);
 const [draft,setDraft]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const pending=useRef<{id:string;message:string}|null>(null);
 const sending=useRef(false);
 const lastVoice=useRef("");
 useEffect(()=>{
  let active=true;
  void request("/v1/manager").then(value=>{if(active)setState(value)})
   .catch(()=>{if(active)setError("Não foi possível carregar a memória privada. Use Atualizar para tentar novamente.")});
  return()=>{active=false};
 },[request]);
 const refresh=async()=>{
  if(sending.current)return;
  sending.current=true;
  setBusy(true);setError("");
  try{setState(await request("/v1/manager"))}
  catch(e){setError(e instanceof Error?e.message:"Não foi possível carregar a conversa.")}
  finally{sending.current=false;setBusy(false)}
 };
 const submit=async(message=draft.trim())=>{
  if(sending.current||message.length<2)return;
  sending.current=true;
  if(pending.current?.message!==message)pending.current={id:crypto.randomUUID(),message};
  setBusy(true);setError("");
  try{
   const result=await request("/v1/manager",{message,request_id:pending.current!.id});
   setState(result);setDraft("");pending.current=null;
   if(result.receipt?.reply)onReply(result.receipt.reply);
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível confirmar a mensagem.")}
  finally{sending.current=false;setBusy(false)}
 };
 useEffect(()=>{
  if(!voiceMessage||lastVoice.current===voiceMessage.id)return;
  lastVoice.current=voiceMessage.id;
  if(sending.current){onReply("Aguarde a resposta do gerente antes de enviar outra mensagem.");return}
  setDraft(voiceMessage.text);void submit(voiceMessage.text);
 },[voiceMessage]);
 return <section className="agent-manager" aria-label="Conversa com o gerente">
  <h3><MessageSquare size={19} aria-hidden="true"/> Gerente · Memória e prioridades</h3>
  <p>Guarde decisões e acompanhe a fila. Experimente: “status”, “lembrar: validar os vídeos antes de publicar” ou “prioridade alta para tarefa 47”. Pelo microfone, comece com “gerente”.</p>
  <p className="small-caption">Modo operacional: decisões e prioridades ficam na sua memória privada. Não geram código nem alteram a ordem de execuções já iniciadas. A interpretação livre e a decomposição por IA ainda não estão disponíveis.</p>
  {state&&state.events.length===0&&<p>Nenhuma conversa salva. Suas próximas mensagens aparecerão aqui ao voltar.</p>}
  {state&&state.events.length>0&&<ol className="agent-manager-history" aria-label="Histórico privado da conversa">
   {state.events.map(event=><li key={event.request_id}>
    <p className="small-caption">{new Date(event.created_at).toLocaleString("pt-BR")}{event.kind==="decision"?" · Decisão registrada":""}</p>
    <p><strong>Você:</strong> {event.message}</p>
    <p><strong>Gerente:</strong> {event.reply}</p>
   </li>)}
  </ol>}
  {state?.history_partial&&<p className="small-caption">Exibindo as últimas 40 mensagens. O histórico anterior continua salvo.</p>}
  {!!state?.priorities.length&&<div aria-label="Prioridades registradas">
   <h4>Prioridades</h4>
   {state.priorities.map(item=><p key={item.issue_number}>
    <button type="button" className="subtle-button" onClick={()=>onTask(item.issue_number)}>Tarefa #{item.issue_number}</button>
    {" · "+({high:"Alta",normal:"Normal",low:"Baixa"}[item.priority]??"Normal")}
   </p>)}
  </div>}
  <label htmlFor="lab-manager-message"><strong>Mensagem ao gerente</strong></label>
  <textarea id="lab-manager-message" className="agent-message-input" rows={3} maxLength={3000} value={draft}
   onChange={e=>setDraft(e.target.value)} disabled={busy} placeholder="O que deseja lembrar ou acompanhar?"/>
  <div className="ps-actions">
   <button type="button" className="secondary-cta" disabled={busy||draft.trim().length<2} onClick={()=>void submit()}><Send size={16}/> CONVERSAR</button>
   <button type="button" className="subtle-button" disabled={busy} onClick={()=>void refresh()}><RefreshCw size={16}/> ATUALIZAR MEMÓRIA</button>
  </div>
  {busy&&<p role="status">Consultando o gerente…</p>}
  {error&&<p role="alert">{error}</p>}
  <p className="small-caption">Não envie senhas, chaves ou dados pessoais. Para pedir uma alteração de código, use Registrar tarefa abaixo.</p>
 </section>;
}
