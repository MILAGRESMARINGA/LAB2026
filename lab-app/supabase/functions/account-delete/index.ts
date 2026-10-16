// LABGAME privacy: only deploy after testing Supabase Auth/Storage/GC
// deletion in isolated staging. Never ship service role to a browser bundle.
// Supabase Edge Function (Deno) with verify_jwt = true at deployment.
import {createClient} from "npm:@supabase/supabase-js@2";

const PROD="https://labgame-biblia.vercel.app";
function permittedOrigin(value:string|null):string|null{
 if(!value)return null;
 try{
  const url=new URL(value);
  if(url.protocol!=="https:"||url.pathname!=="/")return null;
  if(url.origin===PROD)return url.origin;
  if(/^labgame-biblia-(?:git-lab-rebuild-2026|[a-z0-9]+)-antonios-projects-0bf892e8\.vercel\.app$/.test(url.hostname))
   return url.origin;
 }catch{/* no origin */ }
 return null;
}
function response(status:number,body:unknown,origin:string|null){
 return new Response(JSON.stringify(body),{status,headers:{
  "content-type":"application/json; charset=utf-8",
  "cache-control":"no-store",
  ...(origin?{"access-control-allow-origin":origin,"vary":"Origin"}:{})
 }});
}
Deno.serve(async req=>{
 const origin=permittedOrigin(req.headers.get("origin"));
 if(req.headers.has("origin")&&!origin)return response(403,{message:"Origem não autorizada."},null);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{
  "access-control-allow-origin":origin??PROD,
  "access-control-allow-headers":"authorization,apikey,content-type,x-client-info",
  "access-control-allow-methods":"POST,OPTIONS",
  "vary":"Origin"
 }});
 if(req.method!=="POST")return response(405,{message:"Método não permitido."},origin);
 const bearer=req.headers.get("authorization")||"";
 if(!/^Bearer\s+\S+$/.test(bearer))return response(401,{message:"Autenticação necessária."},origin);
 const url=Deno.env.get("SUPABASE_URL");
 const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 const anonKey=Deno.env.get("SUPABASE_ANON_KEY");
 if(!url||!serviceKey||!anonKey)return response(503,{message:"Exclusão indisponível."},origin);
 try{
  const payload=await req.json();
  if(payload?.confirmation!=="EXCLUIR CONTA"||typeof payload?.email_confirmation!=="string"||typeof payload?.password!=="string"||!payload.password)
   return response(400,{message:"Confirmação explícita obrigatória."},origin);
  const jwt=bearer.replace(/^Bearer\s+/,"");
  const authClient=createClient(url,anonKey,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:{user},error:authError}=await authClient.auth.getUser(jwt);
  if(authError||!user?.id||!user.email)return response(401,{message:"Sessão inválida."},origin);
  if(user.email.trim().toLowerCase()!==payload.email_confirmation.trim().toLowerCase())
   return response(400,{message:"E-mail não corresponde à conta."},origin);
  // Never rely only on auth.users.last_sign_in_at: it is shared across all
  // devices/sessions. Require this request to prove the account password.
  // Do not log, persist or return the password or the sign-in tokens.
  const {data:reauthenticated,error:passwordError}=await authClient.auth.signInWithPassword({
   email:user.email,password:payload.password
  });
  if(passwordError||reauthenticated.user?.id!==user.id)
   return response(403,{message:"Confirme sua senha para excluir a conta."},origin);
  const admin=createClient(url,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:{user:verified},error:adminError}=await admin.auth.admin.getUserById(user.id);
  if(adminError||!verified)return response(403,{message:"Não foi possível verificar a conta."},origin);
  const signedIn=Date.parse(verified.last_sign_in_at??"");
  if(!Number.isFinite(signedIn)||Date.now()-signedIn>5*60*1000)
   return response(403,{message:"Faça login novamente antes de excluir sua conta."},origin);

  // Deleting auth.users cascades to owned GCs. Protect other users from
  // unexpectedly losing their group: only self-only groups can be removed.
  const {data:owned,error:ownedError}=await admin.from("reading_groups").select("id")
   .eq("owner_id",user.id);
  if(ownedError)return response(503,{message:"Não foi possível avaliar seus GCs."},origin);
  for(const group of owned??[]){
   const {count,error}=await admin.from("reading_group_members")
    .select("user_id",{count:"exact",head:true})
    .eq("group_id",group.id).neq("user_id",user.id);
   if(error)return response(503,{message:"Não foi possível avaliar participantes do GC."},origin);
   if((count??0)>0)return response(409,{
    message:"Você lidera um GC com outros participantes. Antes de excluir sua conta, transfira a liderança ou resolva a gestão do grupo com o administrador."
   },origin);
  }
  const deleted=await admin.auth.admin.deleteUser(user.id);
  if(deleted.error)return response(503,{message:"Não foi possível excluir a conta agora. Tente mais tarde."},origin);
  return response(200,{deleted:true},origin);
 }catch{
  return response(400,{message:"Não foi possível processar a solicitação."},origin);
 }
});
