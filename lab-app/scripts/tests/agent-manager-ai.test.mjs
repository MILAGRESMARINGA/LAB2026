import test from "node:test";
import assert from "node:assert/strict";
import {converseManager} from "../../railway/agent-orchestrator/manager-ai.mjs";
const args={key:"provider-test-only",message:"Planeje a melhoria dos vídeos",events:[],tasks:[{number:47,stage:"draft_pr",priority:"high",title:"Private title not needed"}]};
test("conversational manager makes one structured, tool-free request and returns a proposal",async()=>{
 let calls=0,body;
 const reply=await converseManager({...args,events:[{message:"senha: valor-ficticio",reply:"Never include"}]},async(url,init)=>{
  calls++;assert.equal(url,"https://api.openai.com/v1/responses");body=JSON.parse(init.body);
  return Response.json({status:"completed",output_text:JSON.stringify({reply:"Vamos validar os players.",steps:[{agent:"frontend-ux-engineer",objective:"Validar player interno",acceptance:"Todos os livros abrem no modal"}]})});
 });
 assert.equal(calls,1);assert.equal(body.store,false);assert.equal(body.max_output_tokens,1600);assert.equal(body.tools,undefined);
 assert.ok(!JSON.stringify(body).includes("valor-ficticio"));assert.ok(!JSON.stringify(body).includes("Private title not needed"));
 assert.match(reply,/nenhuma ação executada/);assert.match(reply,/frontend-ux-engineer/);
});
test("provider failures and invalid plans never become trusted manager messages",async()=>{
 await assert.rejects(converseManager(args,async()=>new Response("untrusted provider error",{status:429})),/provider unavailable/);
 await assert.rejects(converseManager(args,async()=>Response.json({status:"incomplete",output_text:"{}"})),/incomplete/);
 await assert.rejects(converseManager(args,async()=>Response.json({output_text:JSON.stringify({reply:"Plano",steps:[{agent:"shell-executor",objective:"execute",acceptance:"ok"}]})})),/Invalid manager proposal/);
 await assert.rejects(converseManager({...args,key:""},()=>{throw Error("No network allowed")}),/unavailable/);
});
