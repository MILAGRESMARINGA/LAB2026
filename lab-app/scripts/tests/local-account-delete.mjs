/**
 * End-to-end Edge Function deletion contract against a disposable local Supabase.
 * No hosted accounts, remote APIs, or production credentials.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createClient} from "@supabase/supabase-js";

const env=Object.fromEntries(readFileSync(process.env.LAB_SUPABASE_LOCAL_ENV_FILE||"/tmp/labgame-supabase-ci.env","utf8")
 .split(/\r?\n/).filter(x=>/^[A-Z_]+=/.test(x.trim())).map(s=>{
 const i=s.indexOf("=");return [s.slice(0,i),s.slice(i+1).replace(/^["']|["']$/g,"")];
}));
const url=env.API_URL;
assert.match(url,/^http:\/\/(?:127\.0\.0\.1|localhost):54321$/);
const opts={auth:{autoRefreshToken:false,persistSession:false}};
const admin=createClient(url,env.SERVICE_ROLE_KEY||env.SECRET_KEY,opts);
const anon=()=>createClient(url,env.ANON_KEY||env.PUBLISHABLE_KEY,opts);
const endpoint="http://127.0.0.1:8000/";
const accounts=[];
const secretPwd="LabLOCAL-Edge-Delete-2026-98!";
async function request(token,confirmation,email,origin){
 return fetch(endpoint,{
  method:"POST",headers:{
   "content-type":"application/json",
   ...(token?{authorization:"Bearer "+token}:{}),
   ...(origin?{origin}:{})
  },body:JSON.stringify({confirmation,email_confirmation:email})
 });
}
try{
 const actors=[];
 for(const letter of ["a","b"]){
  const email=`lab-delete-${Date.now()}-${process.pid}-${letter}@example.test`;
  const {data,error}=await admin.auth.admin.createUser({email,password:secretPwd,email_confirm:true});
  assert.ifError(error);assert.ok(data.user);
  accounts.push(data.user.id);
  const c=anon();
  const login=await c.auth.signInWithPassword({email,password:secretPwd});
  assert.ifError(login.error);assert.ok(login.data.session);
  actors.push({id:data.user.id,email,token:login.data.session.access_token});
 }
 const [a,b]=actors;
 assert.equal((await request(null,"EXCLUIR CONTA",a.email)).status,401);
 assert.equal((await request(a.token,"INVALIDO",a.email)).status,400);
 assert.equal((await request(a.token,"EXCLUIR CONTA",b.email)).status,400);
 assert.equal((await request(a.token,"EXCLUIR CONTA",a.email,"https://evil.example")).status,403);

 const {data:group,error:groupError}=await admin.from("reading_groups")
  .insert({name:"Grupo CI temporario",owner_id:a.id}).select("id").single();
 assert.ifError(groupError);assert.ok(group.id);
 const {error:joinError}=await admin.from("reading_group_members")
  .insert({group_id:group.id,user_id:b.id,role:"member"});
 assert.ifError(joinError);
 const blocked=await request(a.token,"EXCLUIR CONTA",a.email);
 assert.equal(blocked.status,409,"Account deletion must be blocked while owning a GC with members");
 const {data:still,error:stillError}=await admin.auth.admin.getUserById(a.id);
 assert.ifError(stillError);assert.ok(still.user);

 const {error:leaveError}=await admin.from("reading_group_members")
  .delete().eq("group_id",group.id).eq("user_id",b.id);
 assert.ifError(leaveError);
 const deleted=await request(a.token,"EXCLUIR CONTA",a.email,
  "https://labgame-biblia.vercel.app");
 assert.equal(deleted.status,200,"No-member GC owner should delete own account");
 assert.equal((await deleted.json()).deleted,true);
 const {data:gone,error:goneError}=await admin.auth.admin.getUserById(a.id);
 assert.ok(goneError||!gone?.user,"Auth identity must be deleted");
 const {data:orphan,error:orphanError}=await admin.from("reading_groups")
  .select("id").eq("id",group.id);
 assert.ifError(orphanError);assert.deepEqual(orphan,[]);
 const {data:survivor,error:survivorError}=await admin.auth.admin.getUserById(b.id);
 assert.ifError(survivorError);assert.equal(survivor.user.id,b.id);
 accounts.splice(accounts.indexOf(a.id),1);
 console.log("PASS: Edge Function JWT, origin, phrase, email, GC-owner protection, Auth deletion and FK cascade");
}finally{
 for(const id of accounts)await admin.auth.admin.deleteUser(id).catch(()=>undefined);
}
