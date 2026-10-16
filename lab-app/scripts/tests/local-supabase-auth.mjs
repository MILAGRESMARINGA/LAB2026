/**
 * Free local-only GoTrue/PostgREST P0 smoke, against ephemeral Docker Supabase.
 * Uses fake example.test accounts. Never read production env or hosted credentials.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createClient} from "@supabase/supabase-js";

const source=readFileSync(process.env.LAB_SUPABASE_LOCAL_ENV_FILE||"/tmp/labgame-supabase-ci.env","utf8");
const kv=Object.fromEntries(source.split(/\r?\n/).map(s=>s.trim()).filter(s=>/^[A-Z_]+=/.test(s))
 .map(s=>{const i=s.indexOf("=");return [s.slice(0,i),s.slice(i+1).replace(/^["']|["']$/g,"")]}));
const url=kv.API_URL;
const anon=kv.ANON_KEY||kv.PUBLISHABLE_KEY;
const service=kv.SERVICE_ROLE_KEY||kv.SECRET_KEY;
assert.ok(url?.startsWith("http://127.0.0.1:")||url?.startsWith("http://localhost:"),
 "Refusing to exercise a Supabase API outside localhost");
assert.ok(anon&&service,"Supabase local keys unavailable");
const opts={auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}};
const admin=createClient(url,service,opts);
const userClient=()=>createClient(url,anon,opts);
const password="lab-LOCAL-TEST-2026-Strong-53!";
const prefix="lab-ci-"+process.pid+"-"+Date.now();
const emails=[prefix+"-a@example.test",prefix+"-b@example.test"];
const ids=[];
try{
 for(const email of emails){
  const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});
  assert.ifError(error); assert.ok(data?.user?.id);
  ids.push(data.user.id);
 }
 const [a,b]=[userClient(),userClient()];
 for(const [client,email] of [[a,emails[0]],[b,emails[1]]]){
  const {data,error}=await client.auth.signInWithPassword({email,password});
  assert.ifError(error); assert.ok(data?.session?.access_token);
  assert.equal(data.user.email,email);
 }
 const {data:sessionA,error:errA}=await a.auth.getUser();
 assert.ifError(errA); assert.equal(sessionA.user.id,ids[0]);
 const {data:sessionB,error:errB}=await b.auth.getUser();
 assert.ifError(errB); assert.equal(sessionB.user.id,ids[1]);
 const {error:profileErr}=await a.from("lab_member_profiles").upsert({
  user_id:ids[0],full_name:"Usuário de teste A",profession:"Teste automatizado"
 });
 assert.ifError(profileErr);
 const {data:visible,error:profileReadErr}=await a.from("lab_member_profiles")
  .select("user_id,profession").eq("user_id",ids[0]);
 assert.ifError(profileReadErr);assert.equal(visible.length,1);
 const {data:forbidden,error:forbiddenErr}=await b.from("lab_member_profiles")
  .select("*").eq("user_id",ids[0]);
 assert.ifError(forbiddenErr);assert.deepEqual(forbidden,[]);
 const {error:evilErr}=await b.from("lab_member_profiles").upsert({
  user_id:ids[0],full_name:"Tentativa de alteração indevida"
 });
 assert.ok(evilErr,"RLS must block cross-user writes");
 const {data:unchanged,error:unchangedErr}=await a.from("lab_member_profiles")
  .select("full_name").eq("user_id",ids[0]).single();
 assert.ifError(unchangedErr);assert.equal(unchanged.full_name,"Usuário de teste A");

 const {error:settingsErr}=await a.from("lab_notification_preferences").upsert({
  user_id:ids[0],enabled:true,reading_popup:true,reading_email:false,
  gc_popup:false,gc_email:false,stage_popup:false,stage_email:false
 });
 assert.ifError(settingsErr);
 const {data:otherPrefs,error:otherErr}=await b.from("lab_notification_preferences")
  .select("*").eq("user_id",ids[0]);
 assert.ifError(otherErr);assert.deepEqual(otherPrefs,[]);
 const {data:ownPrefs,error:ownErr}=await a.from("lab_notification_preferences")
  .select("enabled,reading_popup,reading_email").eq("user_id",ids[0]).single();
 assert.ifError(ownErr);
 assert.deepEqual(ownPrefs,{enabled:true,reading_popup:true,reading_email:false});

 const {data:noStage,error:notReady}=await a.rpc("lab_v2_start",{p_plan_length:365});
 assert.equal(noStage,null);
 assert.ok(notReady?.message?.includes("não liberada"),
  "V2 release-switch must reject real authenticated start");

 // An anonymous caller must never obtain access to an individual account RPC.
 const publicClient=userClient();
 const {error:anonymousError}=await publicClient.rpc("lab_v2_sync",{p_run:ids[0]});
 assert.ok(anonymousError,"Anonymous access to V2 RPC must fail");

 const {error:signoutError}=await a.auth.signOut({scope:"local"});
 assert.ifError(signoutError);
 const {data:afterSignout}=await a.auth.getSession();
 assert.equal(afterSignout.session,null);

 console.log("PASS: Real local GoTrue sign-in, isolated profile and preferences, V2 kill switch and sign-out for two accounts");
}finally{
 for(const id of ids){
  await admin.auth.admin.deleteUser(id).catch(()=>undefined);
 }
}
