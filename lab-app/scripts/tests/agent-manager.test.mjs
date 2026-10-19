import test from "node:test";
import assert from "node:assert/strict";
import {managerInstruction,managerIntent,managerReply,orderedTasks} from "../../railway/agent-orchestrator/manager.mjs";
import {handle} from "../../railway/agent-orchestrator/server.mjs";
const owner="11111111-1111-4111-8111-111111111111",requestId="22222222-2222-4222-8222-222222222222";
const origin="https://labgame-biblia.vercel.app",jwt="a".repeat(170);
const env={LAB_AGENT_ENABLED:"true",LAB_AGENT_SUPABASE_ANON_KEY:"public-test",LAB_AGENT_GITHUB_TOKEN:"server-test",LAB_AGENT_ALLOWED_ORIGINS:origin,LAB_AGENT_ADMIN_USER_IDS:owner};
const req=(body,headers={})=>new Request("https://gateway.test/v1/manager",{method:body?"POST":"GET",headers:{origin,authorization:"Bearer "+jwt,...headers},...(body?{body:JSON.stringify(body)}:{})});
const empty={events:[],priorities:[],history_partial:false};
test("operational manager routes explicit commands and never treats free text as execution",()=>{
 assert.deepEqual(managerIntent("prioridade alta para tarefa 47"),{kind:"priority",issue:47,priority:"high"});
 assert.equal(managerIntent("lembrar: conferir vídeos").kind,"decision");
 assert.equal(managerIntent("status").kind,"status");
 assert.equal(managerIntent("Publique o aplicativo imediatamente").kind,"conversation");
 assert.match(managerReply({kind:"conversation"}),/ainda não interpreta/);
 assert.match(managerReply({kind:"status"},[{number:47,stage:"draft_pr",priority:"high"}]),/não comprova CI/);
 assert.deepEqual(orderedTasks([{number:1},{number:47}],[{issue_number:47,priority:"high"}]).map(x=>x.number),[47,1]);
});
test("credential-like text is rejected rather than saved or sent to GitHub",()=>{
 for(const secret of ["senha: valor-teste", "sk-"+"x".repeat(25),"github_pat_"+"x".repeat(25)])assert.throws(()=>managerInstruction(secret),/não foi salva/);
});
test("private memory uses the user's JWT, not a service role or the GitHub token",async()=>{
 const calls=[];
 const fetcher=async(url,init)=>{calls.push({url,init});return Response.json(url.includes("/auth/")?{id:owner,app_metadata:{labgame_orchestrator_admin:true}}:empty)};
 const response=await handle(req(),env,fetcher,88000000);
 assert.equal(response.status,200);assert.equal(calls.length,2);
 assert.ok(calls[1].url.endsWith("/rest/v1/rpc/lab_agent_manager_state"));
 assert.equal(calls[1].init.headers.authorization,"Bearer "+jwt);
 assert.ok(!JSON.stringify(await response.json()).includes(jwt));
});
test("non-admin and credential messages never reach private storage",async()=>{
 let calls=0;
 const adminFetch=async()=>{calls++;return Response.json({id:owner,app_metadata:{labgame_orchestrator_admin:true}})};
 const response=await handle(req({request_id:requestId,message:"senha: valor-teste"}),env,adminFetch,88100000);
 assert.equal(response.status,400);assert.equal(calls,1);
 const denied=await handle(req(),env,async()=>Response.json({id:owner,user_metadata:{labgame_orchestrator_admin:true}}),88200000);
 assert.equal(denied.status,403);
});
test("decisions are committed with an idempotency key and never create public issues",async()=>{
 const writes=[];
 const fetcher=async(url,init)=>{
  if(url.includes("/auth/"))return Response.json({id:owner,app_metadata:{labgame_orchestrator_admin:true}});
  assert.ok(url.includes("/rpc/"));const body=JSON.parse(init.body);
  if(body.p_request_id){writes.push(body);return Response.json({...empty,receipt:{reply:body.p_reply}})}
  return Response.json(empty);
 };
 const response=await handle(req({request_id:requestId,message:"lembrar: testar vídeos antes de publicar"}),env,fetcher,88300000);
 assert.equal(response.status,200);assert.equal(writes.length,1);
 assert.equal(writes[0].p_kind,"decision");assert.equal(writes[0].p_request_id,requestId);
});
test("a duplicate message replays its original reply without side effects",async()=>{
 let writes=0;
 const fetcher=async(url,init)=>{
  if(url.includes("/auth/"))return Response.json({id:owner,app_metadata:{labgame_orchestrator_admin:true}});
  const body=JSON.parse(init.body);if(body.p_request_id)writes++;
  return Response.json({...empty,events:[{request_id:requestId,message:"status",reply:"Resposta já registrada"}]});
 };
 const response=await handle(req({request_id:requestId,message:"status"}),env,fetcher,88400000);
 assert.equal((await response.json()).receipt.reply,"Resposta já registrada");assert.equal(writes,0);
});
test("status uses real run and PR evidence and never writes public GitHub data",async()=>{
 let saved;
 const fetcher=async(url,init)=>{
  if(url.includes("/auth/"))return Response.json({id:owner,app_metadata:{labgame_orchestrator_admin:true}});
  if(url.includes("/rpc/")){
   const args=JSON.parse(init.body);if(args.p_request_id)saved=args;
   return Response.json({...empty,priorities:[{issue_number:47,priority:"high"}]});
  }
  assert.ok(!init.method||init.method==="GET");
  if(url.includes("/issues?"))return Response.json([{number:47,title:"LAB AGENTE · Teste",labels:[]}]);
  if(url.includes("/actions/"))return Response.json({workflow_runs:[{display_title:"LAB coding · Issue 47",status:"in_progress"}]});
  if(url.includes("/pulls?"))return Response.json([]);
  throw Error("Unexpected request");
 };
 const response=await handle(req({request_id:requestId,message:"status"}),env,fetcher,88500000);
 const value=await response.json();assert.equal(response.status,200);
 assert.equal(value.tasks[0].stage,"running");assert.equal(value.tasks[0].priority,"high");
 assert.match(saved.p_reply,/#47: executando; prioridade alta/);
});
test("priority rejects unrelated issues before committing memory",async()=>{
 let writes=0;
 const fetcher=async(url,init)=>{
  if(url.includes("/auth/"))return Response.json({id:owner,app_metadata:{labgame_orchestrator_admin:true}});
  if(url.includes("/rpc/")){if(JSON.parse(init.body).p_request_id)writes++;return Response.json(empty)}
  return Response.json({number:47,title:"Unrelated issue"});
 };
 const response=await handle(req({request_id:requestId,message:"prioridade alta para tarefa 47"}),env,fetcher,88600000);
 assert.equal(response.status,404);assert.equal(writes,0);
});
test("concurrent retries share one AI response and one private commit",async()=>{
 let aiCalls=0,writes=0;let release;
 const barrier=new Promise(resolve=>{release=resolve});
 const fetcher=async(url,init)=>{
  if(url.includes("/auth/"))return Response.json({id:owner,app_metadata:{labgame_orchestrator_admin:true}});
  if(url.includes("/rpc/")){
   const args=JSON.parse(init.body);
   if(args.p_request_id){writes++;return Response.json({...empty,receipt:{reply:args.p_reply}})}
   await barrier;return Response.json(empty);
  }
  if(url.includes("api.openai.com")){aiCalls++;return Response.json({output_text:JSON.stringify({reply:"Proponho testar a interface antes da revisão.",steps:[]})})}
  if(url.includes("/actions/"))return Response.json({workflow_runs:[]});
  return Response.json([]);
 };
 const body={request_id:requestId,message:"Como devemos organizar a próxima melhoria?"};
 const first=handle(req(body),{...env,OPENAI_API_KEY:"test-provider-only"},fetcher,88700000);
 const second=handle(req(body),{...env,OPENAI_API_KEY:"test-provider-only"},fetcher,88700000);
 release();
 const responses=await Promise.all([first,second]);
 assert.deepEqual(responses.map(r=>r.status),[200,200]);
 assert.equal(aiCalls,1);assert.equal(writes,1);
 const data=await responses[0].json();assert.equal(data.ai_available,true);
 assert.ok(!JSON.stringify(data).includes("test-provider-only"));
});
