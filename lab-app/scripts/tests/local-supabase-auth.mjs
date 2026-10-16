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
async function localMessageLink(recipient){
 const mailBase=kv.MAILPIT_URL||kv.INBUCKET_URL||"http://127.0.0.1:54324";
 assert.ok(/^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/.test(mailBase),"Local mail catcher only");
 for(let attempt=0;attempt<25;attempt++){
  const response=await fetch(mailBase+"/api/v1/messages");
  if(response.ok){
   const box=await response.json();
   for(const message of box.messages??[]){
    const addresses=(message.To??[]).map(item=>String(item.Address||item.address||item.Email||"").toLowerCase());
    if(!addresses.includes(recipient.toLowerCase()))continue;
    const detail=await fetch(mailBase+"/api/v1/message/"+encodeURIComponent(message.ID));
    if(!detail.ok)continue;
    const data=await detail.json();
    const body=[data.HTML,data.Text,data.HTMLBody,data.TextBody].filter(Boolean).join(" ");
    const url=body.replaceAll("&amp;","&").match(/https?:\/\/(?:localhost|127\.0\.0\.1):54321\/auth\/v1\/verify\?[^\s"'<>]+/i)?.[0];
    if(url)return url;
   }
  }
  await new Promise(resolve=>setTimeout(resolve,300));
 }
 throw Error("No confirmation URL arrived in the free local mail catcher");
}
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

 // Real signup must require email verification before the first login.
 const emailToVerify=prefix+"-verify@example.test";
 const unverified=userClient();
 const {data:signup,error:signupErr}=await unverified.auth.signUp({
  email:emailToVerify,password
 });
 assert.ifError(signupErr);
 assert.ok(signup?.user?.id);
 assert.equal(signup.session,null,"Registration must wait for email confirmation");
 ids.push(signup.user.id);
 const {error:deniedLogin}=await unverified.auth.signInWithPassword({
  email:emailToVerify,password
 });
 assert.ok(deniedLogin?.message?.match(/not confirmed/i),
  "Email not confirmed must prevent password authentication");
 const localUrl=await localMessageLink(emailToVerify);
 const parsed=new URL(localUrl);
 assert.ok(parsed.hostname==="localhost"||parsed.hostname==="127.0.0.1");
 assert.equal(parsed.pathname,"/auth/v1/verify");
 const confirmed=await fetch(localUrl,{redirect:"manual"});
 assert.ok([200,302,303].includes(confirmed.status),
  "Verification link from local SMTP must be accepted");
 const {data:verified,error:verifiedErr}=await unverified.auth.signInWithPassword({
  email:emailToVerify,password
 });
 assert.ifError(verifiedErr);
 assert.ok(verified.session);
 await unverified.auth.signOut({scope:"local"});

 // Password recovery follows the real Mailpit message, not an admin bypass.
 const {error:recoveryRequestError}=await a.auth.resetPasswordForEmail(emails[0],{
  redirectTo:"http://localhost:5173/auth/reset-password"
 });
 assert.ifError(recoveryRequestError);
 const recoveryLink=await localMessageLink(emails[0]);
 const recovery=await fetch(recoveryLink,{redirect:"manual"});
 assert.ok([302,303].includes(recovery.status),"Recovery link must redirect with session credentials");
 const location=recovery.headers.get("location")||"";
 const recoveryUrl=new URL(location);
 assert.equal(recoveryUrl.hostname,"localhost");
 const fragment=new URLSearchParams(recoveryUrl.hash.replace(/^#/,""));
 const access_token=fragment.get("access_token");
 const refresh_token=fragment.get("refresh_token");
 assert.ok(access_token&&refresh_token,"Recovery must provide a real password reset session");
 const recoveryClient=userClient();
 const {error:setRecoverySessionError}=await recoveryClient.auth.setSession({
  access_token,refresh_token
 });
 assert.ifError(setRecoverySessionError);
 const newPassword=password+"-renewed";
 const {error:changePasswordError}=await recoveryClient.auth.updateUser({password:newPassword});
 assert.ifError(changePasswordError);
 await recoveryClient.auth.signOut({scope:"local"});
 const newLogin=userClient();
 const {data:passwordUpdated,error:passwordUpdatedError}=await newLogin.auth.signInWithPassword({
  email:emails[0],password:newPassword
 });
 assert.ifError(passwordUpdatedError);
 assert.ok(passwordUpdated.session,"Password recovery should allow login with the new password");
 await newLogin.auth.signOut({scope:"local"});

 const {error:signoutError}=await a.auth.signOut({scope:"local"});
 assert.ifError(signoutError);
 const {data:afterSignout}=await a.auth.getSession();
 assert.equal(afterSignout.session,null);

 console.log("PASS: Real local GoTrue sign-in, confirmed signup and password recovery via Mailpit, isolated profile and preferences, V2 kill switch and sign-out");
}finally{
 for(const id of ids){
  await admin.auth.admin.deleteUser(id).catch(()=>undefined);
 }
}
