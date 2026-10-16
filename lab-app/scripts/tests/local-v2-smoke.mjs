/** Real local GoTrue/JWT RLS test for LABGAME V2. No remote credentials. */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
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
function runEphemeralSql(sql){
 execFileSync("docker",["exec","supabase_db_labgame-free-ci","psql","-U","postgres","-d","postgres","-v","ON_ERROR_STOP=1","-c",sql],{stdio:"pipe"});
}
function seedEphemeralBibleVerses(){
 // Local Supabase has no Bible import; synthetic rows stay inside the disposable test DB.
 // Keep the parent chapter insert in a separate psql transaction from the verse
 // inserts: one multi-statement -c is atomic, so an FK error would roll the
 // parent fixtures back and hide the actual fixture problem.
 const chapterSql="INSERT INTO public.lab_bible_chapters(edition,chapter_id,book_name,chapter_number,verses)\nVALUES\n ('ALM1911','1:1','Gênesis',1,'[{\"verse_number\":1,\"text\":\"Fixture local de Gênesis 1:1.\"}]'::jsonb),\n ('ALM1911','19:1','Salmos',1,'[{\"verse_number\":1,\"text\":\"Fixture local de Salmos 1:1.\"}]'::jsonb),\n ('ALM1911','43:1','João',1,'[{\"verse_number\":1,\"text\":\"Fixture local de João 1:1.\"}]'::jsonb)\nON CONFLICT(edition,chapter_id) DO NOTHING;";
 const verseSql=[
  "CREATE TABLE IF NOT EXISTS public.lab_bible_verses(edition text NOT NULL,chapter_id text NOT NULL,verse_number smallint NOT NULL,verse_text text NOT NULL,PRIMARY KEY(edition,chapter_id,verse_number));",
  "ALTER TABLE public.lab_bible_verses ENABLE ROW LEVEL SECURITY;",
  "REVOKE ALL ON public.lab_bible_verses FROM PUBLIC,anon,authenticated;",
  "INSERT INTO public.lab_bible_verses VALUES('ALM1911','1:1',1,array_to_string(array_fill('palavra'::text,ARRAY[200]),' ')), ('ALM1911','43:1',1,'palavra') ON CONFLICT(edition,chapter_id,verse_number) DO UPDATE SET verse_text=EXCLUDED.verse_text;",
  "INSERT INTO public.lab_bible_verses SELECT 'ALM1911','19:1',g,'palavra' FROM generate_series(1,20) AS g ON CONFLICT(edition,chapter_id,verse_number) DO UPDATE SET verse_text=EXCLUDED.verse_text;"
 ].join("\n");
 runEphemeralSql(chapterSql);
 runEphemeralSql(verseSql);
}
try{
 seedEphemeralBibleVerses();
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
  participants.push({c,id:data.user.id,email});
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
  const {data:timer,error:timerError}=await a.c.rpc("lab_v2_begin_chapter",{
   p_run:runId,p_stage:1,p_chapter:chapter
  });
  assert.ifError(timerError);assert.ok(timer.minimum_read_seconds>=30);
  // Backdate only a local isolated fixture so CI never waits for human reading time.
  const updateSql="UPDATE public.lab_v2_chapter_read_sessions SET started_at=statement_timestamp()-interval '10 minutes' WHERE run_id='"+runId+"'::uuid AND day_number=1 AND chapter_id='"+chapter+"'";
  execFileSync("docker",["exec","supabase_db_labgame-free-ci","psql","-U","postgres","-d","postgres","-v","ON_ERROR_STOP=1","-c",updateSql],{stdio:"pipe"});
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

 // Force only the FIRST local session to become stale, without waiting.
 // This modifies disposable Supabase Auth in Docker, NEVER hosted data.
 const {data:oldSession,error:oldSessionError}=await a.c.auth.getSession();
 assert.ifError(oldSessionError);
 const payload=JSON.parse(Buffer.from(oldSession.session.access_token.split(".")[1],"base64url").toString("utf8"));
 assert.match(payload.session_id,/^[a-f0-9-]{36}$/i);
 assert.match(a.id,/^[a-f0-9-]{36}$/i);
 execFileSync("docker",["exec","supabase_db_labgame-free-ci","psql","-U","postgres","-d","postgres","-v","ON_ERROR_STOP=1","-c",
  `UPDATE auth.sessions SET created_at=statement_timestamp()-interval '10 minutes' WHERE id='${payload.session_id}'::uuid AND user_id='${a.id}'::uuid`],{stdio:"pipe"});
 // A new login on another device updates global last_sign_in_at; it must
 // NEVER make the stale JWT eligible to erase the user's journey.
 const reauthed=client();
 const freshLogin=await reauthed.auth.signInWithPassword({email:a.email,password:pwd});
 assert.ifError(freshLogin.error);assert.ok(freshLogin.data.session);
 const denied=await a.c.rpc("lab_game_full_reset",{p_confirmation:"ZERAR JORNADA"});
 assert.ok(denied.error?.message?.includes("Entre novamente"),
  "An old JWT must not reset a journey after another session has signed in");
 const {data:stillHere,error:stillHereErr}=await a.c.from("lab_v2_runs").select("id").eq("id",runId);
 assert.ifError(stillHereErr);assert.equal(stillHere.length,1);
 // An irrevocable full reset is account-scoped, leaves profile & GC affiliation intact.
 const {data:reset,error:resetError}=await reauthed.rpc("lab_game_full_reset",{
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
 console.log("PASS: real GoTrue V2 365 plan, server-timed reading, concurrent idempotent XP, cross-account RLS, full reset, cascade deletion");
}finally{
 for(const id of ids) await service.auth.admin.deleteUser(id).catch(()=>undefined);
}
