import fs from "node:fs";
import {pathToFileURL} from "node:url";

const REPO="MILAGRESMARINGA/LAB2026";
export async function queueAgentRecovery(runId,token,fetcher=fetch){
 if(!/^\d+$/.test(String(runId))||!Number.isSafeInteger(Number(runId))||Number(runId)<1||!token)throw Error("Invalid recovery dispatch");
 const response=await fetcher(`https://api.github.com/repos/${REPO}/actions/workflows/agent-patch-recovery.yml/dispatches`,{method:"POST",headers:{authorization:"Bearer "+token,accept:"application/vnd.github+json"},body:JSON.stringify({ref:"main",inputs:{run_id:String(runId)}}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error("Recovery dispatch failed");
 return {status:"recovery_queued",run:Number(runId)};
}
export async function recoverDispatchedRun(runId,token,fetcher=fetch,pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))){
 if(!/^\d+$/.test(String(runId))||!Number.isSafeInteger(Number(runId))||Number(runId)<1||!token)throw Error("Invalid recovery run");
 for(let i=0;i<12;i++){
  const response=await fetcher(`https://api.github.com/repos/${REPO}/actions/runs/${runId}`,{headers:{authorization:"Bearer "+token,accept:"application/vnd.github+json"},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error("Recovery run unavailable");
  const run=await response.json();
  if(run.id!==Number(runId))throw Error("Recovery identity mismatch");
  if(run.status==="completed")return recoverAgentRun({action:"completed",workflow_run:run},token,fetcher);
  await pause(5000);
 }
 return {status:"source_run_not_completed"};
}
export async function recoverAgentRun(event,token,fetcher=fetch){
 const run=event?.workflow_run;
 if(!run||event.action!=="completed"||run.path!==".github/workflows/ai-agent-orchestrator.yml"||run.event!=="workflow_dispatch"||run.conclusion!=="failure"||run.head_branch!=="lab-rebuild-2026"||run.head_repository?.full_name!==REPO||!Number.isSafeInteger(run.id)||!Number.isSafeInteger(run.run_attempt)||run.run_attempt>=3||!["MILAGRESMARINGA","github-actions[bot]"].includes(run.actor?.login))return {status:"ignored"};
 if(!token)throw Error("Recovery token unavailable");
 const call=async(path,method="GET")=>{
  const r=await fetcher("https://api.github.com/repos/"+REPO+path,{method,headers:{authorization:"Bearer "+token,accept:"application/vnd.github+json","x-github-api-version":"2022-11-28"},signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error("Recovery GitHub HTTP "+r.status);
  return r.status===201||r.status===204?{}:r.json();
 };
 const {jobs}=await call(`/actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100`);
 const job=jobs?.find(j=>j.name==="generate"&&j.conclusion==="failure"&&j.steps?.some(s=>s.name==="Account retryable patch protocol failure"&&s.conclusion==="success"))??
  (jobs?.some(j=>j.name==="verify"&&j.conclusion==="failure"&&j.steps?.some(s=>s.name==="Account retryable patch QA failure"&&s.conclusion==="success"))?jobs.find(j=>j.name==="generate"&&j.conclusion==="success"):null);
 if(!job||!Number.isSafeInteger(job.id))return {status:"not_retryable"};
 await call(`/actions/jobs/${job.id}/rerun`,"POST");
 return {status:"retry_requested",run:run.id,attempt:run.run_attempt+1};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,"utf8"));
  const result=process.argv.includes("--dispatch")?await queueAgentRecovery(process.env.GITHUB_RUN_ID,process.env.GITHUB_TOKEN):await recoverDispatchedRun(event.inputs?.run_id,process.env.GITHUB_TOKEN);
  console.log(JSON.stringify(result))}
 catch{console.error("Agent recovery failed; inspect the workflow status. No credentials were logged.");process.exitCode=1}
}
