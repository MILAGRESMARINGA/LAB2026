import test from "node:test";
import assert from "node:assert/strict";
import {settings,cleanRequest,classifyTask,handle,REPO,summarizeTask} from "../../railway/agent-orchestrator/server.mjs";

const admin="11111111-1111-4111-8111-111111111111";
const origin="https://labgame-biblia.vercel.app";
const token="a".repeat(170);
const config={LAB_AGENT_ENABLED:"true",
 LAB_AGENT_SUPABASE_ANON_KEY:"test-anon-only",
 LAB_AGENT_GITHUB_TOKEN:"test-github-only",
 LAB_AGENT_ALLOWED_ORIGINS:origin,
 LAB_AGENT_ADMIN_USER_IDS:admin};
function request(method="POST",body={instruction:"Corrija a interface dos botões em dispositivo móvel."},headers={}){
 return new Request("https://voice.local/v1/tasks",{
  method,headers:{origin,authorization:"Bearer "+token,"content-type":"application/json",...headers},
  ...(method==="POST"?{body:JSON.stringify(body)}:{})
 });
}
function mock(options={}){
 const calls=[];
 const fetcher=async(url,init)=>{
  calls.push({url,init});
  if(url.includes("/auth/v1/user"))return new Response(JSON.stringify({
   id:admin,app_metadata:{labgame_orchestrator_admin:options.isAdmin!==false}
  }),{status:200});
  if(url.includes("/issues?"))return new Response(JSON.stringify([{number:50,title:"LAB AGENTE · Teste",html_url:"https://github.com/"+REPO+"/issues/50",state:"open"}]),{status:200});
  if(url.endsWith("/issues"))return new Response(JSON.stringify({number:51,html_url:"https://github.com/"+REPO+"/issues/51"}),{status:201});
  return new Response("{}",{status:404});
 };
 return {calls,fetcher};
}
test("default-disabled worker never asks Auth or GitHub",async()=>{
 const net=mock();
 const r=await handle(request("POST",undefined,{origin:""}),{},net.fetcher,700000);
 assert.equal(r.status,503);assert.equal(net.calls.length,0);
});
test("non-admin is blocked even with valid login",async()=>{
 const net=mock({isAdmin:false});
 const r=await handle(request(),config,net.fetcher,1200000);
 assert.equal(r.status,403);assert.equal(net.calls.length,1);
});
test("untrusted origin is rejected before credentials are used",async()=>{
 const net=mock();
 const r=await handle(request("POST",undefined,{origin:"https://evil.example"}),config,net.fetcher,1800000);
 assert.equal(r.status,403);assert.equal(net.calls.length,0);
});
test("github token stays on server; admin task is queued, never executed",async()=>{
 const net=mock();
 const r=await handle(request(),config,net.fetcher,2400000);
 assert.equal(r.status,201);
 const d=await r.json();
 assert.equal(d.number,51);assert.equal(d.classification,"review");
 assert.equal(net.calls.length,2);
 assert.equal(net.calls[0].url,"https://azejfxvaamgkmfmwdzjn.supabase.co/auth/v1/user");
 assert.ok(net.calls[1].url.endsWith("/issues"));
 assert.equal(net.calls[1].init.headers.authorization,"Bearer test-github-only");
 assert.ok(!net.calls[1].init.body.includes("test-github-only"));
 assert.ok(!net.calls[1].init.body.includes(token));
});
test("destructive, billing and production requests are marked for approval",async()=>{
 const net=mock();
 const r=await handle(request("POST",{instruction:"Apague usuários na produção e aumente o plano pago do Railway."}),config,net.fetcher,3000000);
 assert.equal(r.status,201);
 assert.equal((await r.json()).classification,"approval_required");
 const issue=JSON.parse(net.calls[1].init.body);
 assert.ok(issue.labels.includes("lab-approval-required"));
});
test("strict input limits and no shortcuts using editable user metadata",async()=>{
 assert.throws(()=>cleanRequest("abc"),/15 a 3000/);
 assert.throws(()=>cleanRequest("x".repeat(3001)),/15 a 3000/);
 assert.equal(classifyTask("Excluir dados reais"),"approval_required");
 assert.equal(classifyTask("Melhorar o desenho do menu"),"review");
 assert.throws(()=>settings({...config,LAB_AGENT_ADMIN_USER_IDS:"nonsensical"}),/Invalid administrator ID/);
});

test("tracking distinguishes real coding runs from intake and matches issue exactly",()=>{
 const issue={number:21,title:"LAB AGENTE · Menu",labels:[]};
 const runs={total_count:2,workflow_runs:[{id:1,display_title:"LAB coding · Issue 210",status:"completed",conclusion:"success"},{id:2,display_title:"LAB coding · Issue 21",status:"completed",conclusion:"failure",created_at:"2026-10-18",html_url:"https://evil.example"}]};
 const result=summarizeTask(issue,runs,[]);
 assert.equal(result.stage,"failed");assert.equal(result.run.id,2);assert.equal(result.run.url,null);
 assert.equal(summarizeTask(issue,{workflow_runs:[]},[]).stage,"queued");
});
test("tracking identifies trusted draft PR, merged PR and incomplete history",()=>{
 const issue={number:21,labels:[]};
 const pr={number:29,head:{ref:"agent/task-21-run-123",repo:{full_name:REPO}},draft:true,state:"open",html_url:"https://github.com/"+REPO+"/pull/29"};
 assert.equal(summarizeTask(issue,{},[pr]).stage,"draft_pr");
 assert.equal(summarizeTask(issue,{},[{...pr,merged_at:"2026-10-18"}]).stage,"merged");
 assert.equal(summarizeTask(issue,{},[{...pr,head:{...pr.head,repo:{full_name:"evil/repo"}}}]).stage,"queued");
 assert.equal(summarizeTask(issue,{total_count:101},[]).history_complete,false);
});
test("tracking route requires the same dual administrator check",async()=>{
 const net=mock({isAdmin:false});
 const r=await handle(new Request("https://voice.local/v1/tasks/21",{headers:{origin,authorization:"Bearer "+token}}),config,net.fetcher,9000000);
 assert.equal(r.status,403);assert.equal(net.calls.length,1);
});

test("authenticated tracking returns evidence only and never launches a run",async()=>{
 const calls=[];
 const fetcher=async(url,init)=>{
  calls.push({url,init});
  if(url.includes("/auth/"))return Response.json({id:admin,app_metadata:{labgame_orchestrator_admin:true}});
  if(url.endsWith("/issues/21"))return Response.json({number:21,title:"LAB AGENTE · Menu",labels:[]});
  if(url.includes("/actions/"))return Response.json({total_count:1,workflow_runs:[{id:1,display_title:"LAB coding · Issue 21",status:"in_progress",html_url:"https://github.com/"+REPO+"/actions/runs/1"}]});
  if(url.includes("/pulls?"))return Response.json([]);
  throw Error("Unexpected URL");
 };
 const result=await handle(new Request("https://voice.local/v1/tasks/21",{headers:{origin,authorization:"Bearer "+token}}),config,fetcher,10000000);
 assert.equal(result.status,200);const data=await result.json();assert.equal(data.stage,"running");
 assert.equal(calls.length,4);assert.ok(calls.every(c=>!c.init.method||c.init.method==="GET"));
 assert.ok(!JSON.stringify(data).includes("test-github-only"));
});
test("health never claims configured with missing credentials",async()=>{
 const r=await handle(new Request("https://voice.local/health"),{LAB_AGENT_ENABLED:"true"});
 assert.equal((await r.json()).status,"disabled");
});
