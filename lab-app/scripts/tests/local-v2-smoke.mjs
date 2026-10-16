/** Real local GoTrue/JWT RLS test for LABGAME V2. No remote credentials. */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createClient} from "@supabase/supabase-js";

const content=readFileSync(process.env.LAB_SUPABASE_LOCAL_ENV_FILE||"/tmp/labgame-supabase-ci.env","utf8");
const kv=Object.fromEntries(content.split(/\r?\n/).map(x=>x.trim()).filter(x=>/^[A-Z_]+=/.test(x))
 .map(x=>{const i=x.indexOf("=");return [x.slice(0,i),x.slice(i+1).replace(/^["']|["']$/g,"")]}));
const url=kv.API_URL;
assert.ok(/^http:\/\/(?:localhost|127\.0\.0\.1):54321$/.test(url),"Only ephemeral local API allowed");
const opts={auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}};
const service=createClient(url,kv.SERVICE_ROLE_KEY||kv.SECRET_KEY,opts);
const client=()=>createClient(url,kv.ANON_KEY||kv.PUBLISHABLE_KEY,opts);
const ids=[];
const pwd="labLOCAL-strong-4game-2026!";
try{
 const participants=[];
 for(let i=0;i<2;i++){
  const email=`v2-local-${process.pid}-${Date.now()}-${i}@example.test`;
  const {data,error}=await service.auth.admin.createUser({
   email,password:pwd,email_confirm:true
  });
  assert.ifError(error);assert.ok(data.user?.id);ids.push(data.user.id);
  const c=client();
  const {data:session,error:loginError}=await c.auth.signInWithPassword({email,password:pwd});
  assert.ifError(loginError);assert.ok(session.session);
  participants.push({c,id:data.user.id});
 }
 const [a,b]=participants;
 const {data:started,error:startErr}=await a.c.rpc("lab_v2_start",{p_plan_length:365});
 assert.ifError(startErr);assert.equal(started.status,"active");
 assert.equal(started.run_xp,0);
 assert.ok(started.run_id);
 const runId=started.run_id;
 const {data:active,error:activeErr}=await a.c.rpc("lab_v2_activate",{
  p_run:runId,p_stage:1
 });
 assert.ifError(activeErr);assert.equal(active.stage,1);
 for(const chapter of ["1:1","19:1","43:1"]){
  const {error}=await a.c.rpc("lab_v2_confirm",{
   p_run:runId,p_stage:1,p_chapter:chapter
  });
  assert.ifError(error);
 }
 const sameChapterRequests=await Promise.all(Array.from({length:8},()=>
  a.c.rpc("lab_v2_confirm",{p_run:runId,p_stage:1,p_chapter:"43:1"})
 ));
 for(const response of sameChapterRequests)assert.ifError(response.error);
 const {data:checked,error:checkedErr}=await a.c.rpc("lab_v2_sync",{p_run:runId});
 assert.ifError(checkedErr);assert.equal(checked.run_xp,30);
 const {error:advanceErr}=await a.c.rpc("lab_v2_activate",{p_run:runId,p_stage:2});
 assert.ok(advanceErr?.message?.includes("não foi liberada"),
  "Next stage cannot be unlocked before 24h");
 const {data:otherRun,error:otherRunError}=await b.c.rpc("lab_v2_sync",{p_run:runId});
 assert.equal(otherRun,null);
 assert.ok(otherRunError?.message?.includes("não encontrada"),
  "Other account must not read another participant's V2 journey");
 const {data:foreign,error:foreignErr}=await b.c.from("lab_v2_chapter_checks")
  .select("*").eq("run_id",runId);
 assert.ifError(foreignErr);assert.deepEqual(foreign,[]);
 const {error:mutateError}=await b.c.from("lab_v2_chapter_checks")
  .insert({run_id:runId,day_number:1,chapter_id:"1:2",confirmed_at:new Date().toISOString()});
 assert.ok(mutateError,"Clients cannot write directly to the V2 ledger");

 // An irrevocable full reset is account-scoped, leaves profile & GC affiliation intact.
 const {data:reset,error:resetError}=await a.c.rpc("lab_game_full_reset",{
  p_confirmation:"ZERAR JORNADA"
 });
 assert.ifError(resetError);assert.equal(reset.reset,true);
 const {data:afterReset,error:afterResetErr}=await a.c.from("lab_v2_runs")
  .select("id").eq("id",runId);
 assert.ifError(afterResetErr);assert.deepEqual(afterReset,[]);
 const {data:fresh,error:freshErr}=await a.c.rpc("lab_v2_start",{p_plan_length:365});
 assert.ifError(freshErr);assert.equal(fresh.run_xp,0);
 assert.equal(fresh.best_completed_stages,0);
 assert.notEqual(fresh.run_id,runId);

 // Cleanup using Admin deletion proves FK cascades do not orphan V2 runs.
 await service.auth.admin.deleteUser(a.id);
 ids.splice(ids.indexOf(a.id),1);
 const {data:orphan,error:orphanErr}=await service.from("lab_v2_runs")
  .select("id").eq("user_id",a.id);
 assert.ifError(orphanErr);assert.deepEqual(orphan,[]);

 await b.c.auth.signOut({scope:"local"});
 console.log("PASS: real GoTrue V2 365 plan, concurrent idempotent XP, timers, cross-account RLS, full reset, cascade deletion");
}finally{
 for(const id of ids) await service.auth.admin.deleteUser(id).catch(()=>undefined);
}
