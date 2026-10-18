import test from "node:test";
import assert from "node:assert/strict";
import {recoverAgentRun} from "../../../.agents/scripts/recover-agent-run.mjs";
const event={action:"completed",workflow_run:{id:42,run_attempt:1,name:"Controlled LABGame coding agent",event:"workflow_dispatch",conclusion:"failure",head_branch:"lab-rebuild-2026",head_repository:{full_name:"MILAGRESMARINGA/LAB2026"},actor:{login:"github-actions[bot]"}}};
test("recovers only explicitly marked protocol failures",async()=>{
 const calls=[];
 const fetcher=async(url,init)=>{calls.push({url,method:init.method});return new Response(init.method==="POST"?null:JSON.stringify({jobs:[{id:8,name:"generate",conclusion:"failure",steps:[{name:"Account retryable patch protocol failure",conclusion:"success"}]}]}),{status:init.method==="POST"?201:200})};
 assert.equal((await recoverAgentRun(event,"fake",fetcher)).status,"retry_requested");
 assert.equal(calls[1].url,"https://api.github.com/repos/MILAGRESMARINGA/LAB2026/actions/jobs/8/rerun");
});
test("untrusted runs and exhausted attempts never use the token",async()=>{
 const fetcher=()=>{throw Error("Unexpected network")};
 for(const patch of [{run_attempt:3},{actor:{login:"attacker"}},{head_repository:{full_name:"other/repo"}},{head_branch:"main"},{event:"pull_request"}])assert.equal((await recoverAgentRun({...event,workflow_run:{...event.workflow_run,...patch}},"fake",fetcher)).status,"ignored");
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
