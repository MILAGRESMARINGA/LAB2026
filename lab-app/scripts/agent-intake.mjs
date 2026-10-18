/**
 * Event-driven LABGame intake. Trusted low-risk owner issues can dispatch the
 * controlled code-agent workflow; inference remains disabled at the zero budget.
 */
import {classifyTask} from "../railway/agent-orchestrator/server.mjs";
import {pathToFileURL} from "node:url";
import fs from "node:fs";
import {createTaskBriefing,renderTaskBriefing,routeSpecialist} from "../../.agents/scripts/task-briefing.mjs";

// Stable GitHub numeric owner ID, verified against GitHub's issue.author_association.
// The Actions GITHUB_TOKEN cannot read collaborator permissions with admin scope.
// This allowlist is deliberately NOT configurable through an issue body.
const OWNER_ID=173290142;
const MANIFEST=JSON.parse(fs.readFileSync(new URL("../../.agents/manifest.json",import.meta.url),"utf8"));
function issueTask(issue){
 const body=String(issue.body??"");
 const section=body.split("## Solicitação para fila LABGame")[1]?.split("\n## Política")[0]??body;
 return section.split("\n").map(line=>line.replace(/^>\s?/ ,"")).join("\n").trim();
}
export function isTrustedIssue(issue){
 return Boolean(issue&&Number.isSafeInteger(issue.number)&&issue.number>0&&
  issue.title?.startsWith("LAB AGENTE · ")&&
  issue.body?.includes("## Solicitação para fila LABGame")&&
  !issue.pull_request&&issue.state==="open"&&
  issue.user?.id===OWNER_ID&&issue.user?.login==="MILAGRESMARINGA"&&
  issue.author_association==="OWNER");
}
export function fileContent(issue){
 const body=String(issue.body??"");
 const lines=body.slice(0,9000).replace(/\r/g,"").split("\n")
  .map(x=>"> "+x.replace(/@/g,"＠")).join("\n");
 const task=issueTask(issue);
 const agent=routeSpecialist(issue.title+"\n"+task,MANIFEST);
 const briefing=agent?createTaskBriefing({task,issueNumber:issue.number,agent:agent.id,manifest:MANIFEST,approvedBudget:0}):null;
 return "# LABGame — Pedido "+issue.number+"\n\n"+
  "Estado: **triagem automática; nenhuma alteração funcional foi realizada**.\n\n"+
  "Issue original: https://github.com/MILAGRESMARINGA/LAB2026/issues/"+issue.number+"\n\n"+
  (briefing?renderTaskBriefing(briefing)+"\n\n":"## Briefing Executivo de Tarefa (BET)\n\nAgente responsável pendente de classificação; triagem não autorizou execução.\n\n")+
  "## Pedido (conteúdo não confiável)\n\n"+lines+
  "\n\n## Próximas etapas\n\n"+
  "- [ ] Arquiteto e agente de desenvolvimento avaliam os requisitos.\n"+
  "- [ ] Implementar em branch isolada, com testes.\n"+
  "- [ ] Validar RLS, segurança, direitos autorais e impacto de custos.\n"+
  "- [ ] Obter autorização expressa se afetar produção, contas ou cobrança.\n\n"+
  "**Este PR não implementa nem publica a funcionalidade solicitada.**\n";
}
export async function execute(env=process.env,fetcher=fetch){
 const repo=env.GITHUB_REPOSITORY;
 const token=env.GITHUB_TOKEN;
 const number=Number(env.ISSUE_NUMBER);
 if(repo!=="MILAGRESMARINGA/LAB2026"||!token||!Number.isSafeInteger(number)||number<1)
  throw Error("Invalid LABGame request context");
 const base="https://api.github.com/repos/"+repo;
 const call=async(path,method="GET",data)=>{
  const res=await fetcher(base+path,{
   method,headers:{authorization:"Bearer "+token,"accept":"application/vnd.github+json",
    "x-github-api-version":"2022-11-28","content-type":"application/json"},
   ...(data?{body:JSON.stringify(data)}:{}),
   signal:AbortSignal.timeout(20000)
  });
  if(!res.ok)throw Error("GitHub API "+res.status+" on "+method+" "+path.slice(0,110));
  return res.status===204?{}:res.json();
 };
 const issue=await call("/issues/"+number);
 if(!issue.title?.startsWith("LAB AGENTE · ")||!issue.body?.includes("## Solicitação para fila LABGame")){
  return {status:"ignored"};
 }
 const username=String(issue.user?.login??"");
 if(!/^[a-z\d](?:[a-z\d-]{0,37})$/i.test(username))return {status:"untrusted"};
 // Verify trusted issue fields from GitHub's API; never trust request body.
 if(!isTrustedIssue(issue))return {status:"untrusted"};
 // Classify only the quoted request, never our standard policy boilerplate.
 const userRequest=String(issue.body).split("\n## Política")[0];
 if(classifyTask(issue.title+"\n"+userRequest)==="approval_required"||
    (issue.labels??[]).some(label=>label.name==="lab-approval-required")){
  await call("/issues/"+number+"/comments","POST",{
   body:"LABGame: solicitação registrada, mas exige aprovação humana para operações de risco. Nenhuma execução, migração ou compra foi iniciada."
  });
  return {status:"approval_required"};
 }
 const branch="agent/intake-"+number;
 const path=".agents/intake/issue-"+number+".md";
 const branchRef=await call("/git/ref/heads/"+branch).catch(()=>null);
 if(branchRef)return {status:"already_triaged",branch};
 const main=await call("/git/ref/heads/main");
 const sha=main.object.sha;
 await call("/git/refs","POST",{ref:"refs/heads/"+branch,sha});
 await call("/contents/"+path,"PUT",{
  message:"docs(agent): triage authorized issue #"+number,
  branch,content:Buffer.from(fileContent(issue),"utf8").toString("base64")
 });
 let pr=null;
 try{pr=await call("/pulls","POST",{
  title:"[LAB AGENT] Triagem #"+number+": "+issue.title.slice(0,80),
  base:"main",head:branch,draft:true,
  body:"Triagem automática e não funcional da solicitação #"+number+
   ".\n\n**Não contém código gerado por IA nem aprovação de produção.**"+
   "\n\nO executor de programação requer orçamento e integração expressamente autorizados."
 });}catch(e){
  // GitHub Actions can restrict creation of pull requests even with write
  // scopes. Preserve the branch and CI, with no permissions escalation.
  if(!String(e.message).includes("GitHub API 403 on POST /pulls"))throw e;
 }
 let ciStarted=false;
 try{await call("/actions/workflows/lab-ci.yml/dispatches","POST",{ref:branch});ciStarted=true}catch(e){
  if(!String(e.message).includes("GitHub API 403 on POST /actions/"))throw e;
 }
 const refUrl="https://github.com/"+repo+"/tree/"+branch;
 let codingRunStarted=false;
 try{
  await call("/actions/workflows/ai-agent-orchestrator.yml/dispatches","POST",{
   ref:"lab-rebuild-2026",
   inputs:{issue_number:String(number),approved_spend_brl:"0",task:""}
  });
  codingRunStarted=true;
 }catch(e){
  if(!String(e.message).includes("GitHub API 403 on POST /actions/workflows/ai-agent-orchestrator.yml/dispatches"))throw e;
 }
 await call("/issues/"+number+"/comments","POST",{
  body:"LABGame: triagem criada em "+(pr?.html_url??refUrl)+
   (pr?" (PR draft).":" (branch, criação de PR bloqueada por configuração GitHub).")+
   (ciStarted?" CI solicitada.":" CI não iniciada: permissões GitHub Actions insuficientes.")+
   (codingRunStarted?" O workflow controlado foi acionado com orçamento R$ 0,00; ele não fará inferência paga nem alteração de código sem aprovação orçamentária explícita.":" O workflow de código não pôde ser acionado por configuração de permissões.")+
   " Nenhum código do aplicativo ou dado real foi alterado por esta triagem."
 });
 return {status:pr?"triaged":"triaged_without_pr",number:pr?.number??null,url:pr?.html_url??refUrl,branch,ciStarted,codingRunStarted};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 execute().then(r=>console.log(JSON.stringify(r))).catch(e=>{
  console.error("LABGAME agent intake failed: "+String(e.message).slice(0,140));
  process.exitCode=1;
 });
}
