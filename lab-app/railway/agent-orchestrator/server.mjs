/**
 * LABGame developer-only task intake. It is NOT an autonomous coding model.
 * Credentials live ONLY on Railway. Defaults to disabled/fail-closed.
 * GitHub Issues are untrusted requests: never execute their bodies as code.
 */
import {createServer} from "node:http";
import {pathToFileURL} from "node:url";
import {managerInstruction,managerIntent,managerReply,orderedTasks} from "./manager.mjs";
import {converseManager} from "./manager-ai.mjs";

export const REPO="MILAGRESMARINGA/LAB2026";
export const SUPABASE_ORIGIN="https://azejfxvaamgkmfmwdzjn.supabase.co";
export const MAX_REQUEST_BYTES=8192;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_TEXT=3000;
const incident=/\b(exclu(?:ir|s[aã]o)|apag(?:ar|ue)|delet(?:ar|e)|remov(?:er|a)|migr(?:ar|a[cç][aã]o)|produ[cç][aã]o|production|deploy|dom[ií]nio|auth|senha|password|chave|token|rls|permiss[aã]o|custo|pagar|comprar|plano pago|assinatura|supabase|billing)\b/i;
const quotas=new Map();
const managerPending=new Map();
async function singleManagerMessage(key,message,work){
 const current=managerPending.get(key);
 if(current){
  if(current.message!==message)throw Error("Mensagem inválida.");
  return (await current.promise).clone();
 }
 const promise=work();managerPending.set(key,{message,promise});
 try{return (await promise).clone()}finally{managerPending.delete(key)}
}

export function classifyTask(text){
 // Recognize only explicit, narrow prohibitions; other risky clauses remain checked.
 const scope=String(text).replace(/\b(?:não alterar|sem (?:alterar|mudar)) (?:o banco de produção|produção, banco, migrations ou dados reais|dados da produção|produção|banco de produção)\b[.!]?/giu,"");
 return incident.test(scope)?"approval_required":"review";
}
export function settings(env){
 const origins=(env.LAB_AGENT_ALLOWED_ORIGINS??"").split(",").map(s=>s.trim()).filter(Boolean);
 const admins=(env.LAB_AGENT_ADMIN_USER_IDS??"").split(",").map(s=>s.trim()).filter(Boolean);
 if(!origins.every(o=>/^https:\/\/[a-z0-9.-]+$/i.test(o)||/^http:\/\/localhost:5173$/.test(o)))throw Error("Invalid allowed origin");
 if(!admins.every(x=>UUID.test(x)))throw Error("Invalid administrator ID");
 return {
  enabled:env.LAB_AGENT_ENABLED==="true",
  origins:new Set(origins),admins:new Set(admins),
  apiKey:env.LAB_AGENT_SUPABASE_ANON_KEY??"",
  githubToken:env.LAB_AGENT_GITHUB_TOKEN??""
 };
}
export function cleanRequest(value){
 if(typeof value!=="string")throw Error("Pedido inválido.");
 const text=value.normalize("NFC").replace(/\p{C}/gu," ").trim();
 if(text.length<15||text.length>MAX_TEXT)throw Error("O pedido deve ter de 15 a 3000 caracteres.");
 return managerInstruction(text);
}
function json(status,body,origin,config){
 return new Response(JSON.stringify(body),{status,headers:{
  "content-type":"application/json;charset=utf-8","cache-control":"no-store",
  "x-content-type-options":"nosniff",
  "vary":"Origin",
  ...(origin&&config.origins.has(origin)?{"access-control-allow-origin":origin}: {})
 }});
}
function limitUser(id,at,method){
 const span=Math.floor(at/60000);
 const key=id+":"+method+":"+span;
 if(quotas.size>500)quotas.clear();
 const n=(quotas.get(key)??0)+1;quotas.set(key,n);
 return n<=(method==="GET"?20:5); // Reads never launch runs; mutations remain bounded.
}
async function getAdmin(token,config,fetcher){
 const r=await fetcher(SUPABASE_ORIGIN+"/auth/v1/user",{
  headers:{apikey:config.apiKey,authorization:"Bearer "+token},
  signal:AbortSignal.timeout(12000)
 });
 if(!r.ok)return null;
 const user=await r.json();
 // user_metadata is user-editable. Require BOTH server-managed app_metadata
 // and an independent server-side UUID allowlist.
 if(!UUID.test(user?.id??"")||
    !config.admins.has(user.id)||
    user.app_metadata?.labgame_orchestrator_admin!==true)return null;
 return user;
}
async function gh(path,options,config,fetcher){
 const r=await fetcher("https://api.github.com/repos/"+REPO+path,{
  ...options,headers:{
   accept:"application/vnd.github+json","content-type":"application/json",
   authorization:"Bearer "+config.githubToken,
   "x-github-api-version":"2022-11-28",
   "user-agent":"labgame-agent-intake/1",
   ...(options?.headers??{})
  },signal:AbortSignal.timeout(15000)
 });
 if(!r.ok)throw Error("GitHub request failed (HTTP "+r.status+")");
 return r.json();
}
async function managerState(token,config,fetcher,args={}){
 const r=await fetcher(SUPABASE_ORIGIN+"/rest/v1/rpc/lab_agent_manager_state",{
  method:"POST",headers:{apikey:config.apiKey,authorization:"Bearer "+token,"content-type":"application/json"},
  body:JSON.stringify(args),signal:AbortSignal.timeout(15000)
 });
 if(!r.ok)throw Error("Private manager storage unavailable");
 return r.json();
}
// Read-only projection of GitHub evidence. Never infer success from a green
// intake job, and never return raw provider logs, prompts or credentials.
export function summarizeTask(issue,runs,pulls){
 const number=issue.number;
 const safeUrl=(url,kind)=>typeof url==="string"&&url.startsWith("https://github.com/"+REPO+"/"+kind+"/")?url:null;
 const attempts=(runs.workflow_runs??[]).filter(r=>r.display_title===`LAB coding · Issue ${number}`)
  .sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
 const run=attempts[0];
 const prs=pulls.filter(p=>new RegExp(`^agent/task-${number}-run-[0-9]+$`).test(p.head?.ref??""))
  .filter(p=>p.head?.repo?.full_name===REPO)
  .sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
 const pr=prs[0];
 let stage="queued";
 if(issue.labels?.some(l=>l.name==="lab-approval-required")||issue.body?.includes("Classificação automática: approval_required."))stage="approval_required";
 else if(pr?.merged_at)stage="merged";
 else if(run&&run.status!=="completed")stage="running";
 else if(pr)stage=pr.state==="closed"?"closed":pr.draft?"draft_pr":"review";
 else if(run&&run.conclusion!=="success")stage="failed";
 else if(run)stage="completed_without_pr";
 return {number,title:issue.title,stage,checked_at:new Date().toISOString(),
  history_complete:(runs.total_count??0)<=100&&pulls.length<100,
  run:run?{id:run.id,status:run.status,conclusion:run.conclusion,url:safeUrl(run.html_url,"actions/runs")}:null,
  pr:pr?{number:pr.number,draft:pr.draft,state:pr.state,url:safeUrl(pr.html_url,"pull")}:null};
}
export async function handle(request,env=process.env,fetcher=fetch,now=Date.now()){
 let config;
 try{config=settings(env)}catch{return new Response("Configuration error",{status:503})}
 const origin=request.headers.get("origin");
 const path=new URL(request.url).pathname;
 const ready=config.enabled&&config.githubToken&&config.apiKey&&config.admins.size>0&&config.origins.size>0;
 if(path==="/health")return json(200,{status:ready?"configured":"disabled"},origin,config);
 if(origin&&!config.origins.has(origin))return json(403,{message:"Origem não autorizada."},origin,config);
 if(request.method==="OPTIONS"){
  return new Response(null,{status:204,headers:{
   ...(origin?{"access-control-allow-origin":origin}:{}),
   "access-control-allow-methods":"POST, GET, OPTIONS",
   "access-control-allow-headers":"authorization,content-type",
   "access-control-max-age":"600","vary":"Origin"
  }});
 }
 const detail=/^\/v1\/tasks\/([1-9][0-9]{0,8})$/.exec(path);
 const manager=path==="/v1/manager";
 if((path!=="/v1/tasks"&&!detail&&!manager)||!["GET","POST"].includes(request.method)||(detail&&request.method!=="GET"))
  return json(404,{message:"Rota não encontrada."},origin,config);
 if(!config.enabled||!config.githubToken||!config.apiKey||config.admins.size===0||config.origins.size===0)
  return json(503,{message:"Orquestrador ainda não foi habilitado."},origin,config);
 const auth=request.headers.get("authorization")??"";
 const token=/^Bearer ([A-Za-z0-9_.~-]{40,8192})$/.exec(auth)?.[1];
 if(!token)return json(401,{message:"Entre na conta de administração."},origin,config);
 let user;
 try{user=await getAdmin(token,config,fetcher)}catch{return json(503,{message:"Não foi possível verificar a sessão."},origin,config)}
 if(!user)return json(403,{message:"Sua conta não tem permissão para criar tarefas."},origin,config);
 if(!limitUser(user.id,now,request.method))return json(429,{message:"Limite temporário: aguarde um minuto."},origin,config);
 try{
  if(manager){
   if(request.method==="GET")return json(200,{...await managerState(token,config,fetcher),ai_available:Boolean(env.OPENAI_API_KEY)},origin,config);
   const raw=await request.text();
   if(Buffer.byteLength(raw,"utf8")>MAX_REQUEST_BYTES)return json(413,{message:"Pedido muito grande."},origin,config);
   let payload;try{payload=JSON.parse(raw)}catch{return json(400,{message:"JSON inválido."},origin,config)}
   if(!UUID.test(payload?.request_id??""))return json(400,{message:"Identificador da mensagem inválido."},origin,config);
   const text=managerInstruction(payload.message);
   const intent=managerIntent(text);
   return await singleManagerMessage(user.id+":"+payload.request_id,text,async()=>{
   const state=await managerState(token,config,fetcher);
   const previous=state.events?.find(event=>event.request_id===payload.request_id);
   if(previous){
    if(previous.message!==text)return json(409,{message:"Esta mensagem já foi enviada com outro conteúdo."},origin,config);
    return json(200,{...state,ai_available:Boolean(env.OPENAI_API_KEY),receipt:{request_id:previous.request_id,reply:previous.reply}},origin,config);
   }
   let evidence=[];
   if(intent.kind==="priority"){
    const issue=await gh("/issues/"+intent.issue,{},config,fetcher);
    if(issue.pull_request||!issue.title?.startsWith("LAB AGENTE · "))return json(404,{message:"Tarefa não encontrada."},origin,config);
   }
   if(intent.kind==="status"||(intent.kind==="conversation"&&env.OPENAI_API_KEY)){
    const [issues,runs,pulls]=await Promise.all([
     gh("/issues?state=open&sort=created&direction=desc&per_page=100",{},config,fetcher),
     gh("/actions/workflows/ai-agent-orchestrator.yml/runs?per_page=100",{},config,fetcher),
     gh("/pulls?state=all&per_page=100",{},config,fetcher)
    ]);
    evidence=orderedTasks(issues.filter(issue=>!issue.pull_request&&issue.title?.startsWith("LAB AGENTE · "))
     .map(issue=>summarizeTask(issue,runs,pulls)),state.priorities??[]);
   }
   const reply=intent.kind==="conversation"&&env.OPENAI_API_KEY?
    await converseManager({key:env.OPENAI_API_KEY,message:text,events:state.events,tasks:evidence},fetcher):managerReply(intent,evidence);
   const saved=await managerState(token,config,fetcher,{p_request_id:payload.request_id,p_message:text,
    p_reply:reply,p_kind:intent.kind,p_issue:intent.issue??null,p_priority:intent.priority??null});
   return json(200,{...saved,tasks:evidence,ai_available:Boolean(env.OPENAI_API_KEY)},origin,config);
   });
  }
  if(detail){
   const number=Number(detail[1]);
   const issue=await gh("/issues/"+number,{},config,fetcher);
   if(issue.pull_request||!issue.title?.startsWith("LAB AGENTE · "))return json(404,{message:"Tarefa não encontrada."},origin,config);
   const [runs,pulls]=await Promise.all([
    gh("/actions/workflows/ai-agent-orchestrator.yml/runs?per_page=100",{},config,fetcher),
    gh("/pulls?state=all&per_page=100",{},config,fetcher)
   ]);
   return json(200,summarizeTask(issue,runs,pulls),origin,config);
  }
  if(request.method==="GET"){

   const issues=await gh("/issues?state=open&sort=created&direction=desc&per_page=100",{},config,fetcher);
   return json(200,{tasks:issues.filter(x=>!x.pull_request&&x.title?.startsWith("LAB AGENTE · ")).map(x=>({
    number:x.number,title:x.title,url:x.html_url,state:x.state
   }))},origin,config);
  }
  const length=Number(request.headers.get("content-length")??"0");
  if(length>MAX_REQUEST_BYTES)return json(413,{message:"Pedido muito grande."},origin,config);
  const raw=await request.text();
  if(Buffer.byteLength(raw,"utf8")>MAX_REQUEST_BYTES)return json(413,{message:"Pedido muito grande."},origin,config);
  let payload;
  try{payload=JSON.parse(raw)}catch{return json(400,{message:"JSON inválido."},origin,config)}
  const text=cleanRequest(payload?.instruction);
  const classification=classifyTask(text);
  // Quote user content as DATA, never interpreted as action instructions.
  const quoted=text.replace(/@/g,"＠").split("\n").map(line=>"> "+line).join("\n");
  const issue=await gh("/issues",{method:"POST",body:JSON.stringify({
   title:"LAB AGENTE · "+text.slice(0,70).replace(/\s+/g," "),
   body:"## Solicitação para fila LABGame\n\n"+quoted+
    "\n\n## Política\n- Origem: painel de voz do LABGame (conta administradora autorizada).\n"+
    "- Classificação automática: "+classification+".\n"+
    "- Nenhuma alteração de produção ou compra autorizada por esta solicitação.\n"+
    "- Exige testes e PR; instruções deste issue nunca serão executadas como shell.\n",
   labels:classification==="approval_required"?["lab-agent","lab-approval-required"]:["lab-agent"]
  })},config,fetcher);
  return json(201,{number:issue.number,url:issue.html_url,classification},origin,config);
 }catch(e){
  if(/^(O pedido|A mensagem|Mensagem inválida|Não envie)/.test(e?.message??"")||e?.message==="Pedido inválido.")
   return json(400,{message:e.message},origin,config);
  return json(502,{message:manager?"Não foi possível confirmar a conversa. Tente novamente sem alterar a mensagem para evitar duplicação.":"Falha na comunicação com o GitHub. Nenhuma execução foi confirmada."},origin,config);
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const server=createServer(async(req,res)=>{
  try{
   const request=new Request("http://localhost"+(req.url??"/"),{
    method:req.method,headers:req.headers,
    ...(req.method==="POST"?{body:await new Promise((resolve,reject)=>{
     let bytes=0;const chunks=[];
     req.on("data",chunk=>{bytes+=chunk.length;if(bytes>MAX_REQUEST_BYTES){reject(Error("Too large"));req.destroy();return}chunks.push(chunk)});
     req.on("end",()=>resolve(Buffer.concat(chunks)));req.on("error",reject)
    })}:{})
   });
   const result=await handle(request);
   res.writeHead(result.status,Object.fromEntries(result.headers));
   res.end(await result.text());
  }catch{res.writeHead(500,{"content-type":"application/json"});res.end('{"message":"Falha de processamento."}')}
 });
 server.listen(Number(process.env.PORT||3000),"0.0.0.0");
}
