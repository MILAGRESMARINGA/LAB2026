import fs from "node:fs";
import {pathToFileURL} from "node:url";

const REPO="MILAGRESMARINGA/LAB2026";
export async function recoverAgentRun(event,token,fetcher=fetch){
 const run=event?.workflow_run;
 if(!run||event.action!=="completed"||run.name!=="Controlled LABGame coding agent"||run.event!=="workflow_dispatch"||run.conclusion!=="failure"||run.head_branch!=="lab-rebuild-2026"||run.head_repository?.full_name!==REPO||!Number.isSafeInteger(run.id)||!Number.isSafeInteger(run.run_attempt)||run.run_attempt>=3||!["MILAGRESMARINGA","github-actions[bot]"].includes(run.actor?.login))return {status:"ignored"};
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
 try{const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,"utf8"));console.log(JSON.stringify(await recoverAgentRun(event,process.env.GITHUB_TOKEN)))}
 catch{console.error("Agent recovery failed; inspect the workflow status. No credentials were logged.");process.exitCode=1}
}
