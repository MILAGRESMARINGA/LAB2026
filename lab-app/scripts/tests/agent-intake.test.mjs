import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {isTrustedIssue,fileContent,execute} from "../agent-intake.mjs";
const repo="MILAGRESMARINGA/LAB2026";
const issue={number:12,title:"LAB AGENTE · Melhorar responsividade do painel",
 body:"## Solicitação para fila LABGame\n\n> Ajuste layout de perfil responsivo para celulares.\n\n## Política\n- Nenhuma alteração de produção autorizada.",
 state:"open",user:{login:"MILAGRESMARINGA",id:173290142},author_association:"OWNER",labels:[{name:"lab-agent"}]};
function network(override={},permission="admin"){
 const calls=[];const issueValue={...issue,...override};
 const fetcher=async(url,options)=>{
  calls.push({url,method:options.method,body:options.body});
  if(url.endsWith("/issues/12"))return Response.json(issueValue);
  
  if(url.endsWith("/git/ref/heads/agent/intake-12"))return new Response("",{status:404});
  if(url.endsWith("/git/ref/heads/main"))return Response.json({object:{sha:"abcdef123456"}});
  if(url.endsWith("/git/refs"))return Response.json({ref:"refs/heads/agent/intake-12"},{status:201});
  if(url.includes("/contents/.agents/intake/"))return Response.json({content:{sha:"safe"}});
  if(url.endsWith("/pulls"))return Response.json({html_url:"https://github.com/"+repo+"/pull/17",number:17});
  if(url.endsWith("/actions/workflows/lab-ci.yml/dispatches"))return new Response(null,{status:204});
  if(url.endsWith("/issues/12/comments"))return Response.json({id:1234});
  return new Response("",{status:404});
 };
 return {calls,fetcher};
}
const env={GITHUB_REPOSITORY:repo,GITHUB_TOKEN:"fake-gh-token-for-ci",ISSUE_NUMBER:"12"};
test("only admin may create agent PR, not writer or unknown account",()=>{
 assert.ok(isTrustedIssue(issue));
 assert.ok(!isTrustedIssue({...issue,user:{...issue.user,id:999999}}));
 assert.ok(!isTrustedIssue({...issue,pull_request:{}}));
 assert.ok(!isTrustedIssue({...issue,state:"closed"}));
});
test("untrusted issue text becomes quoted documentation, not shell commands",()=>{
 const md=fileContent({...issue,body:"hi\nrm -rf /\n@github-admin"});
 assert.ok(md.includes("> rm -rf /"));
 assert.ok(md.includes("＠github-admin"));
 assert.ok(md.includes("não implementa"));
});
test("untrusted author cannot request Github write actions",async()=>{
 const networkCase=network({user:{login:"attacker",id:999999},author_association:"NONE"});
 const result=await execute(env,networkCase.fetcher);
 assert.equal(result.status,"untrusted");
 assert.ok(!networkCase.calls.some(x=>x.method==="POST"||x.method==="PUT"));
});
test("sensitive request cannot create a PR or dispatch the CI",async()=>{
 const networkCase=network({title:"LAB AGENTE · Excluir contas no Supabase"});
 const result=await execute(env,networkCase.fetcher);
 assert.equal(result.status,"approval_required");
 assert.equal(networkCase.calls.filter(x=>x.method==="POST").length,1);
 assert.ok(!networkCase.calls.some(x=>x.url.endsWith("/pulls")));
});
test("safe admin request opens draft PR and queues tests, without coding changes",async()=>{
 const n=network();
 const outcome=await execute(env,n.fetcher);
 assert.equal(outcome.status,"triaged");
 assert.equal(outcome.number,17);
 const pr=JSON.parse(n.calls.find(x=>x.url.endsWith("/pulls")).body);
 assert.equal(pr.draft,true);
 assert.equal(pr.base,"main");
 assert.ok(!n.calls.some(x=>x.url.includes("/deployments")||x.url.includes("/migrations")));
 const write=n.calls.find(x=>x.url.includes("/contents/"));
 assert.ok(write.url.endsWith("/contents/.agents/intake/issue-12.md"));
 const content=Buffer.from(JSON.parse(write.body).content,"base64").toString("utf8");
 assert.ok(content.includes("nenhuma alteração funcional foi realizada"));
 assert.ok(n.calls.some(x=>x.url.endsWith("/actions/workflows/lab-ci.yml/dispatches")));
});
test("GitHub restriction 403 on PR creation preserves branch, report and CI",async()=>{
 const n=network();
 const wrapped=async(url,opts)=>{
  if(url.endsWith("/pulls"))return new Response("",{status:403});
  return n.fetcher(url,opts);
 };
 const result=await execute(env,wrapped);
 assert.equal(result.status,"triaged_without_pr");
 assert.equal(result.ciStarted,true);
 assert.ok(result.url.endsWith("/tree/agent/intake-12"));
 assert.ok(n.calls.some(x=>x.url.endsWith("/actions/workflows/lab-ci.yml/dispatches")));
 assert.ok(n.calls.some(x=>x.url.endsWith("/issues/12/comments")));
});
test("workflow requires privileged author; cannot execute arbitrary pull request scripts",()=>{
 const yaml=readFileSync(new URL("../../../.github/workflows/lab-agent-intake.yml",import.meta.url),"utf8");
 assert.ok(yaml.includes("issues:"));
 assert.ok(yaml.includes("types: [opened]"));
 assert.ok(yaml.includes("node lab-app/scripts/agent-intake.mjs"));
 assert.ok(!yaml.includes("pull_request_target:"));
 assert.ok(!yaml.includes("eval("));
});
