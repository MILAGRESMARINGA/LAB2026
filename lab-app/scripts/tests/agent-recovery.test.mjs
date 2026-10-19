import test from "node:test";
import assert from "node:assert/strict";
import {recoverAgentRun,queueAgentRecovery,recoverDispatchedRun} from "../../../.agents/scripts/recover-agent-run.mjs";
const event={action:"completed",workflow_run:{id:42,run_attempt:1,name:"LAB coding · Issue 47",path:".github/workflows/ai-agent-orchestrator.yml",event:"workflow_dispatch",conclusion:"failure",head_branch:"lab-rebuild-2026",head_repository:{full_name:"MILAGRESMARINGA/LAB2026"},actor:{login:"github-actions[bot]"}}};
test("recovers only explicitly marked protocol failures",async()=>{
 const calls=[];
 const fetcher=async(url,init)=>{calls.push({url,method:init.method});return new Response(init.method==="POST"?null:JSON.stringify({jobs:[{id:8,name:"generate",conclusion:"failure",steps:[{name:"Account retryable patch protocol failure",conclusion:"success"}]}]}),{status:init.method==="POST"?201:200})};
 assert.equal((await recoverAgentRun(event,"fake",fetcher)).status,"retry_requested");
 assert.equal(calls[1].url,"https://api.github.com/repos/MILAGRESMARINGA/LAB2026/actions/jobs/8/rerun");
});
test("untrusted runs and exhausted attempts never use the token",async()=>{
 const fetcher=()=>{throw Error("Unexpected network")};
 for(const patch of [{run_attempt:3},{actor:{login:"attacker"}},{head_repository:{full_name:"other/repo"}},{head_branch:"main"},{event:"pull_request"},{path:".github/workflows/lab-ci.yml"},{path:undefined}])assert.equal((await recoverAgentRun({...event,workflow_run:{...event.workflow_run,...patch}},"fake",fetcher)).status,"ignored");
});
test("safety, provider and QA failures without protocol marker are not retried",async()=>{
 const fetcher=async()=>new Response(JSON.stringify({jobs:[{id:8,name:"generate",conclusion:"failure",steps:[]}]}));
 assert.equal((await recoverAgentRun(event,"fake",fetcher)).status,"not_retryable");
});
test("marked QA failures regenerate the patch rather than rerunning broken code",async()=>{
 const calls=[];
 const fetcher=async(url,init)=>{calls.push({url,method:init.method});return new Response(init.method==="POST"?null:JSON.stringify({jobs:[{id:8,name:"generate",conclusion:"success",steps:[]},{id:9,name:"verify",conclusion:"failure",steps:[{name:"Account retryable patch QA failure",conclusion:"success"}]}]}),{status:init.method==="POST"?201:200})};
 assert.equal((await recoverAgentRun(event,"fake",fetcher)).status,"retry_requested");
 assert.ok(calls[1].url.endsWith("/actions/jobs/8/rerun"));
});
test("dispatcher sends only a numeric run identifier to the trusted main workflow",async()=>{
 let sent;
 await queueAgentRecovery(42,"fake",async(url,init)=>{sent={url,...init};return new Response(null,{status:204})});
 assert.ok(sent.url.endsWith("/actions/workflows/agent-patch-recovery.yml/dispatches"));
 assert.deepEqual(JSON.parse(sent.body),{ref:"main",inputs:{run_id:"42"}});
 await assert.rejects(queueAgentRecovery("42/other","fake",()=>{throw Error("Must not call network")}));
});
test("dispatched recovery waits for canonical completion and validates the fetched run",async()=>{
 const calls=[];let reads=0;let pauses=0;
 const fetcher=async(url,init)=>{
  calls.push(url);
  if(url.endsWith("/actions/runs/42"))return new Response(JSON.stringify({...event.workflow_run,status:++reads===1?"in_progress":"completed"}));
  if(init.method==="POST")return new Response(null,{status:201});
  return new Response(JSON.stringify({jobs:[{id:8,name:"generate",conclusion:"failure",steps:[{name:"Account retryable patch protocol failure",conclusion:"success"}]}]}));
 };
 assert.equal((await recoverDispatchedRun(42,"fake",fetcher,async()=>{pauses++})).status,"retry_requested");
 assert.equal(pauses,1);
 assert.ok(calls.at(-1).endsWith("/actions/jobs/8/rerun"));
});
test("dispatched recovery rejects mismatched identifiers and never retries unrelated workflows",async()=>{
 await assert.rejects(recoverDispatchedRun(42,"fake",async()=>new Response(JSON.stringify({...event.workflow_run,id:99,status:"completed"}))));
 let calls=0;
 assert.equal((await recoverDispatchedRun(42,"fake",async()=>{calls++;return new Response(JSON.stringify({...event.workflow_run,status:"completed",path:".github/workflows/lab-ci.yml"}))})).status,"ignored");
 assert.equal(calls,1);
});
