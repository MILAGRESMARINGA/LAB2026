#!/usr/bin/env node
/**
 * LABGAME engineering security baseline.
 * This is a static gate, NOT a pentest, comprehensive SAST or a replacement
 * for authenticated Supabase RLS and dependency audit tests.
 * The LABGAME repository must reject legacy CRM trees at its root.
 */
import {readFileSync,readdirSync,existsSync} from "node:fs";
import {join,resolve,relative,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {execFileSync} from "node:child_process";

const repoRoot=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const appRoot=join(repoRoot,"lab-app");
const required=[
 "README.md",
 "docs/ARCHITECTURE.md",
 "docs/ROADMAP.md",
 "docs/ENGINEERING-BASELINE-AUDIT.md",
 "docs/ENGINEERING-STANDARDS.md",
 "docs/SECURITY-THREAT-MODEL.md",
 "docs/AI-ARCHITECTURE-AND-GOVERNANCE.md",
 "docs/TEST-AND-RELEASE-PLAN.md",
 "docs/OPERATIONS-INCIDENTS.md",
 "docs/adr/0001-boundaries.md",
 "docs/adr/0002-rag-first.md",
 "docs/adr/0003-server-game.md",
 "docs/adr/0004-quality-and-security-gates.md",
 ".agents/WORKFLOW.md",
 ".agents/AUTONOMY-CONTROL.md",
 ".agents/manifest.json",
 ".agents/scripts/agent-writer-core.mjs",
 ".agents/scripts/run-ai-orchestrator.mjs",
 ".github/workflows/lab-ci.yml",
 "lab-app/vercel.json",
 "lab-app/src/domain/canon.ts",
 "lab-app/src/domain/game-plan.ts",
 "lab-app/src/lib/supabase.ts"
];
const specialistRoles=[
 "ai-engineer","backend-engineer","database-engineer","security-engineer",
 "frontend-ux-engineer","qa-reliability-engineer","integration-engineer",
 "platform-observability-engineer","principal-architect","ux-designer",
 "gamification-engineer","biblical-canon-engineer"
];
const errors=[];
export function walk(root){
 if(!existsSync(root))return[];
 const entries=readdirSync(root,{withFileTypes:true});
 return entries.flatMap(entry=>{
  if(["node_modules","dist",".git",".next","coverage"].includes(entry.name))return[];
  const path=join(root,entry.name);
  return entry.isDirectory()?walk(path):entry.isFile()?[path]:[];
 });
}
export function scanSource(text,file="<source>"){
 const messages=[];
 const patterns=[
  [/\bVITE_[A-Z0-9_]*(?:SERVICE_ROLE|SECRET|PRIVATE|SMTP|RESEND|OPENAI)[A-Z0-9_]*\b/g,"Variável sensível prefixada VITE_ (exposta no browser)"],
  [/\bsb_secret_[A-Za-z0-9_-]{10,}\b/g,"Token Supabase secreto aparentemente embutido"],
  [/\bsk-proj-[A-Za-z0-9_-]{10,}\b/g,"Chave de API aparentemente embutida"],
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,"Chave privada aparentemente embutida"],
  [/\bdangerouslySetInnerHTML\s*=/g,"HTML arbitrário não autorizado no frontend"],
  [/\beval\s*\(|\bnew\s+Function\s*\(/g,"Avaliação dinâmica de código"]
 ];
 for(const [pattern,message] of patterns){
  pattern.lastIndex=0;
  if(pattern.test(text))messages.push(file+": "+message);
 }
 return messages;
}
/** Consolidated SQL review across migration revisions: later migrations may apply RLS. */
export function scanMigrations(sql){
 const messages=[];
 const tables=[...sql.matchAll(/\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?((?:[a-z][a-z_0-9]*\.)?[a-z][a-z_0-9]*)/gi)].map(m=>m[1].toLowerCase());
 for(const table of new Set(tables)){
  const qualified=table.includes(".")?table:"public."+table;
  const escaped=qualified.startsWith("public.")?"(?:public\\.)?"+qualified.slice(7):qualified.replace(".","\\.");
  const re=new RegExp("\\bALTER\\s+TABLE\\s+"+escaped+"\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY\\b","i");
  if(!re.test(sql))messages.push("Tabela sem RLS explícita: "+table);
 }
 const declarations=[...sql.matchAll(/\bCREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-z][a-z_0-9]*)\s*\(/gi)];
 for(let i=0;i<declarations.length;i++){
  const start=declarations[i].index;
  const rest=sql.slice(start);
  const as=/\bAS\s+\$[A-Za-z0-9_]*\$/i.exec(rest);
  const header=rest.slice(0,as?as.index:800);
  if(/SECURITY\s+DEFINER/i.test(header)&&!/\bSET\s+search_path\s*=/i.test(header)){
   messages.push("SECURITY DEFINER sem search_path: "+declarations[i][1]);
  }
 }
 if(/\bGRANT\s+ALL\s+ON\b[^;]{0,300}\bTO\s+(?:anon|PUBLIC)\b/i.test(sql)){
  messages.push("GRANT ALL anônimo/público possivelmente inseguro");
 }
 return messages;
}
export function scanTrackedPrivateFiles(list){
 return list.filter(name=>
  /(?:^|\/)\.env(?:\.(?!example$)[^/]*)?$/.test(name)||
  /\.(?:pem|p12|pfx|key)$/.test(name)
 ).map(name=>"Arquivo privado versionado: "+name);
}
export function verifyRepository(root=repoRoot){
 const failures=[];
 // Product isolation is a P0 release invariant. A CRM root must never
 // be reintroduced alongside LABGAME; the only Supabase source of truth
 // is lab-app/supabase/.
 for(const name of ["project","supabase"]){
  if(existsSync(join(root,name))){
   failures.push("P0 ISOLAMENTO: diretório legado de CRM proibido na raiz: "+name+"/");
  }
 }
 for(const name of required){
  if(!existsSync(join(root,name)))failures.push("Documento/contrato obrigatório ausente: "+name);
 }
 for(const role of specialistRoles){
  if(!existsSync(join(root,".agents/agents",role,"agent.md")))
   failures.push("Definição de agente ausente: "+role);
 }
 const sources=walk(join(root,"lab-app/src"))
  .filter(p=>/\.(?:ts|tsx|js|jsx)$/.test(p));
 for(const path of sources)failures.push(...scanSource(readFileSync(path,"utf8"),relative(root,path)));
 const migrations=walk(join(root,"lab-app/supabase/migrations")).filter(p=>p.endsWith(".sql"));
 if(!migrations.length)failures.push("Sem migrações LABGAME");
 else failures.push(...scanMigrations(migrations.map(p=>readFileSync(p,"utf8")).join("\n")));
 // Check tracked artifacts only; developers may keep untracked .env.local locally.
 try{
  const tracked=execFileSync("git",["-C",root,"ls-files","--cached"],{encoding:"utf8",timeout:8000}).trim().split("\n");
  failures.push(...scanTrackedPrivateFiles(tracked.filter(p=>p.startsWith("lab-app/"))));
 }catch{
  // Without git metadata (e.g. source archive), source/SQL gates still run.
 }
 return {failures,sourceCount:sources.length,migrationCount:migrations.length,roleCount:specialistRoles.length};
}
const script=fileURLToPath(import.meta.url);
if(process.argv[1]&&resolve(process.argv[1])===script){
 const result=verifyRepository();
 if(result.failures.length){
  for(const err of result.failures)console.error("ENGINEERING GATE FAILED:",err);
  console.error(result.failures.length+" finding(s).");
  process.exitCode=1;
 }else{
  console.log("ENGINEERING GATE PASSED: "+result.sourceCount+" source files, "+result.migrationCount+" SQL migrations, "+result.roleCount+" agent contracts; docs and security baselines verified.");
 }
}
