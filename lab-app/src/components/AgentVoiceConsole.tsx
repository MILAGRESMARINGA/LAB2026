import {useEffect,useRef,useState} from "react";
import {Bot,Mic,MicOff,Send,Volume2,VolumeX,RefreshCw,ExternalLink} from "lucide-react";
import {supabase} from "../lib/supabase";

type VoiceResult={results:ArrayLike<ArrayLike<{transcript:string}>>};
type NativeRecognizer={
 lang:string;interimResults:boolean;continuous:boolean;
 onresult:((event:VoiceResult)=>void)|null;
 onerror:((event:{error:string})=>void)|null;
 onend:(()=>void)|null;
 start:()=>void;stop:()=>void;
};
type NativeRecognizerCtor=new()=>NativeRecognizer;
type QueueItem={number:number;title:string;url:string;state:string};
const stages:Record<string,string>={queued:"Na fila",running:"Executando",approval_required:"Aguardando aprovação",failed:"Execução falhou",draft_pr:"PR em rascunho",review:"Em revisão",merged:"Integrada",closed:"PR fechado",completed_without_pr:"Execução encerrada sem PR"};
type TaskEvidence={number:number;stage:string;history_complete:boolean;run:{url:string|null}|null;pr:{url:string|null}|null};
const api=import.meta.env.VITE_LAB_AGENT_API_URL?.replace(/\/$/,"")??"";
const listenCtor=():NativeRecognizerCtor|undefined=>{
 if(typeof window==="undefined")return undefined;
 const scope=window as Window & {SpeechRecognition?:NativeRecognizerCtor;webkitSpeechRecognition?:NativeRecognizerCtor};
 return scope.SpeechRecognition??scope.webkitSpeechRecognition;
};
function replyOut(message:string,enabled:boolean){
 if(!enabled||typeof window==="undefined"||!("speechSynthesis" in window))return;
 window.speechSynthesis.cancel();
 const utterance=new SpeechSynthesisUtterance(message);
 utterance.lang="pt-BR";utterance.rate=1;utterance.pitch=1;
 window.speechSynthesis.speak(utterance);
}
async function send(path:string,body?:{instruction:string}){
 if(!api||!/^https:\/\//.test(api))throw Error("Servidor dos agentes ainda não foi habilitado.");
 if(!supabase)throw Error("Entre em sua conta do LABGame.");
 const {data:{session},error}=await supabase.auth.getSession();
 if(error||!session)throw Error("Sua sessão expirou. Entre novamente.");
 const response=await fetch(api+path,{
  method:body?"POST":"GET",
  headers:{authorization:"Bearer "+session.access_token,...(body?{"content-type":"application/json"}:{})},
  ...(body?{body:JSON.stringify(body)}:{}),
  signal:AbortSignal.timeout(20000)
 });
 const value=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(value.message||"Não foi possível acessar a fila de tarefas.");
 return value;
}

export function AgentVoiceConsole(){
 const [draft,setDraft]=useState("");
 const textRef=useRef("");
 const [heard,setHeard]=useState("");
 const [busy,setBusy]=useState(false);
 const [listening,setListening]=useState(false);
 const [spoken,setSpoken]=useState(true);
 const [status,setStatus]=useState("Diga sua solicitação. Vou registrar o pedido para os agentes.");
 const [tasks,setTasks]=useState<QueueItem[]>([]);
 const [selected,setSelected]=useState<number|null>(null);
 const [evidence,setEvidence]=useState<TaskEvidence|null>(null);
 const [trackingError,setTrackingError]=useState("");
 const [receipt,setReceipt]=useState<{number:number;url:string}|null>(null);
 useEffect(()=>{
  if(selected===null)return;
  let active=true;
  setEvidence(null);setTrackingError("");
  const update=async()=>{
   if(document.hidden)return;
   try{const value=await send("/v1/tasks/"+selected);if(active){setEvidence(value);setTrackingError("")}}
   catch{if(active)setTrackingError("Não foi possível atualizar. O último estado pode estar desatualizado.")}
  };
  void update();const timer=window.setInterval(()=>void update(),30000);
  return()=>{active=false;window.clearInterval(timer)};
 },[selected]);
 const recognizer=useRef<NativeRecognizer|null>(null);
 const recognitionSupported=Boolean(listenCtor());
 useEffect(()=>()=>{recognizer.current?.stop();if(typeof window!=="undefined")window.speechSynthesis?.cancel()},[]);
 const announce=(text:string)=>{setStatus(text);replyOut(text,spoken)};
 const edit=(text:string)=>{textRef.current=text;setDraft(text)};
 const load=async()=>{
  setBusy(true);
  try{
   const r=await send("/v1/tasks");
   setTasks(r.tasks??[]);
   announce((r.tasks?.length??0)?"Encontrei "+r.tasks.length+" tarefas abertas na fila.":"Nenhuma tarefa aberta no momento.");
  }catch(e){announce(e instanceof Error?e.message:"Não foi possível consultar as tarefas.")}
  finally{setBusy(false)}
 };
 const submit=async(instruction:string)=>{
  if(busy)return;
  setBusy(true);
  try{
   const result=await send("/v1/tasks",{instruction});
   setReceipt({number:result.number,url:result.url});
   setSelected(result.number);
   edit("");
   announce("Pedido "+result.number+" registrado no GitHub. "+
     (result.classification==="approval_required"?"Esta tarefa precisa de autorização antes de qualquer alteração sensível.":"Os testes e a análise técnica serão organizados automaticamente."));
   const queue=await send("/v1/tasks");
   const listed:QueueItem[]=queue.tasks??[];
   setTasks(listed.some(task=>task.number===result.number)?listed:[{number:result.number,title:"LAB AGENTE · "+instruction.slice(0,70),url:result.url,state:"open"},...listed]);
  }catch(e){announce(e instanceof Error?e.message:"O pedido não foi registrado.")}
  finally{setBusy(false)}
 };
 const interpret=(phrase:string)=>{
  const t=phrase.trim();
  setHeard(t);
  if(/^(?:enviar|registrar|confirmar|pode registrar)(?: tarefa| pedido)?[.!]?$/i.test(t)){
   if(textRef.current.length>=15)void submit(textRef.current);
   else announce("Ainda não há um pedido completo para registrar.");
  }else if(/^(?:status|listar tarefas|mostrar tarefas|como est[aá] a fila)[?!.]?$/i.test(t)){
   void load();
  }else if(/^(?:cancelar|apagar rascunho|limpar)[.!]?$/i.test(t)){
   edit("");announce("Rascunho descartado. Nenhuma tarefa foi executada.");
  }else{
   edit(t);
   announce("Anotei o pedido. Para registrar no GitHub, diga registrar ou use o botão. Se preferir, pode corrigir o texto antes.");
  }
 };
 const listen=()=>{
  if(listening){recognizer.current?.stop();return}
  const Ctor=listenCtor();
  if(!Ctor){announce("Seu navegador não oferece reconhecimento de voz. Você pode digitar a solicitação.");return}
  try{
   const instance=new Ctor();
   recognizer.current=instance;
   instance.lang="pt-BR";instance.continuous=false;instance.interimResults=false;
   instance.onresult=e=>{
    const result=Array.from(e.results).map(x=>x[0]?.transcript??"").join(" ").trim();
    if(result)interpret(result);
   };
   instance.onerror=e=>{setListening(false);setStatus("Microfone indisponível ("+e.error+"). Confira a permissão do navegador.")};
   instance.onend=()=>{setListening(false);recognizer.current=null};
   instance.start();setListening(true);setStatus("Ouvindo. Fale normalmente.");
  }catch{setListening(false);announce("Não consegui iniciar o microfone. Verifique a permissão do navegador.")}
 };
 return <details className="ps-section" aria-label="Console de agentes do LABGame">
  <summary><span><Bot size={19}/> Central de agentes · Voz</span></summary>
  <div className="ps-settings-body">
   <p className="muted">Área restrita da administração. Solicite melhorias, consulte a fila e receba respostas em áudio. Pedidos sensíveis não são executados sem aprovação.</p>
   <div className="ps-actions">
    <button type="button" className="secondary-cta" onClick={listen} disabled={busy||!recognitionSupported}>
     {listening?<MicOff size={18}/>:<Mic size={18}/>} {listening?"PARAR DE OUVIR":"FALAR COM AGENTES"}
    </button>
    <button type="button" className="subtle-button" onClick={()=>setSpoken(v=>!v)} aria-pressed={spoken}>
     {spoken?<Volume2 size={18}/>:<VolumeX size={18}/>} {spoken?"Áudio ligado":"Áudio desligado"}
    </button>
   </div>
   {!recognitionSupported&&<p role="note" className="muted">Reconhecimento por voz indisponível neste navegador. Chrome/Edge compatíveis podem utilizar o recurso, mediante permissão do microfone.</p>}
   <p className="small-caption">O reconhecimento de fala pode ser processado pelo fornecedor do navegador. Não dite senhas, tokens ou dados pessoais. Nenhum áudio é salvo pelo LABGame.</p>
   {heard&&<p className="small-caption">Última fala reconhecida: {heard}</p>}
   <label htmlFor="lab-agent-instruction"><strong>Pedido aos agentes</strong></label>
   <textarea id="lab-agent-instruction" rows={4} maxLength={3000}
    placeholder="Ex.: Testem o cadastro e preparem uma correção em PR, sem mudar dados da produção."
    value={draft} onChange={e=>edit(e.target.value)} disabled={busy}/>
   <div className="ps-actions">
    <button type="button" className="secondary-cta" disabled={busy||draft.trim().length<15}
     onClick={()=>void submit(textRef.current)}><Send size={16}/> REGISTRAR TAREFA</button>
    <button type="button" className="subtle-button" disabled={busy} onClick={()=>void load()}>
     <RefreshCw size={16}/> VER FILA</button>
   </div>
   <p role="status" aria-live="polite" className="feedback-message">{status}</p>
   {receipt&&<p>Último pedido registrado: <a href={receipt.url} target="_blank" rel="noopener noreferrer">#{receipt.number} · Abrir tarefa no GitHub</a>. Registro não significa execução iniciada.</p>}
   {tasks.length>0&&<div aria-label="Fila de tarefas dos agentes">
    <h3>Tarefas registradas</h3>
    {tasks.map(task=><p key={task.number}>
     <a href={task.url} target="_blank" rel="noopener noreferrer">#{task.number} · {task.title} <ExternalLink size={13} aria-hidden="true"/></a>
     <button type="button" className="subtle-button" onClick={()=>setSelected(task.number)}>ACOMPANHAR</button>
    </p>)}
   </div>}
   {selected!==null&&<section aria-label="Acompanhamento da tarefa">
    <h3>Tarefa #{selected}</h3>
    <p role="status">{evidence?stages[evidence.stage]??"Estado desconhecido":"Consultando execução…"}</p>
    {trackingError&&<p role="alert">{trackingError}</p>}
    {evidence?.run?.url&&<p><a href={evidence.run.url} target="_blank" rel="noopener noreferrer">Ver execução no GitHub</a></p>}
    {evidence?.pr?.url&&<p><a href={evidence.pr.url} target="_blank" rel="noopener noreferrer">Ver Pull Request</a></p>}
    {evidence&&!evidence.history_complete&&<p>Histórico parcial. Confira o GitHub para execuções anteriores.</p>}
    <p className="small-caption">Atualização a cada 30 segundos enquanto esta página estiver visível. PR aberto não significa CI aprovado.</p>
   </section>}
   <p className="small-caption">Criar uma tarefa não autoriza despesas, exclusão de contas, migrações de produção ou publicação. Sem configurar o gateway Railway e as permissões de administrador, o painel permanece inativo.</p>
  </div>
 </details>;
}
