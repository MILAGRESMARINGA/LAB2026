#!/usr/bin/env node
/**
 * LABGAME P0 — two REAL authenticated accounts.
 *
 * Safe default: READ-ONLY smoke of Auth, RLS and non-mutating RPCs.
 * Staging writes must be deliberately enabled and are REFUSED for production.
 * No admin/service_role API key, JWT, email or password is printed.
 *
 * Run from lab-app with environment variables; see docs/P0-TWO-ACCOUNTS-QA.md.
 */
import {randomUUID} from "node:crypto";
import {createClient} from "@supabase/supabase-js";
import {pathToFileURL} from "node:url";

const PRODUCTION_REF="azejfxvaamgkmfmwdzjn";
export const expectedConfig=["P0_SUPABASE_URL","P0_SUPABASE_PUBLISHABLE_KEY",
 "P0_ACCOUNT_A_EMAIL","P0_ACCOUNT_A_PASSWORD","P0_ACCOUNT_B_EMAIL","P0_ACCOUNT_B_PASSWORD"];

export function checkModeSafety({url,mode,writeConfirmation}){
 let parsed;
 try{parsed=new URL(url)}catch{throw Error("P0_SUPABASE_URL inválida.");}
 if(parsed.protocol!=="https:"||!parsed.hostname.endsWith(".supabase.co"))
  throw Error("A URL deve ser HTTPS e terminar em .supabase.co.");
 if(!["readonly","staging"].includes(mode))throw Error("Modo inválido.");
 if(mode==="staging"&&(parsed.hostname.includes(PRODUCTION_REF)
   ||writeConfirmation!=="CONFIRMO_STAGING_ISOLADO"))
  throw Error("Operações de escrita exigem staging isolado, nunca o LABGAME de produção.");
 return parsed;
}
const assert=(ok,message)=>{if(!ok)throw Error(message);};
function ensureSuccess(result,label){
 if(result.error)throw Error(label+" falhou: "+(result.error.code||result.error.message||"erro"));
 return result.data;
}
function report(name){process.stdout.write("PASSOU | "+name+"\n");}
function client(url,key){
 return createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
}
function safeOneUserOnly(rows,userId,label){
 assert((rows??[]).every(row=>row.user_id===userId),
   label+": foi detectado acesso a registro de outra conta");
}
export async function executeP0({env=process.env,log=report}={}){
 const missing=expectedConfig.filter(n=>!env[n]);
 if(missing.length)throw Error("Variáveis ausentes: "+missing.join(", "));
 const mode=env.P0_MODE||"readonly";
 checkModeSafety({
  url:env.P0_SUPABASE_URL,mode,writeConfirmation:env.P0_WRITE_CONFIRMATION
 });
 assert(env.P0_ACCOUNT_A_EMAIL.trim().toLowerCase()!==env.P0_ACCOUNT_B_EMAIL.trim().toLowerCase(),
 "As duas contas precisam ser diferentes.");

 // Use the publishable client only: NEVER fetch or use service_role here.
 const {P0_SUPABASE_URL:url,P0_SUPABASE_PUBLISHABLE_KEY:key}=env;
 const a=client(url,key),b=client(url,key),anon=client(url,key);
 const users=[];
 for(const [letter,c,email,password] of [
  ["A",a,env.P0_ACCOUNT_A_EMAIL,env.P0_ACCOUNT_A_PASSWORD],
  ["B",b,env.P0_ACCOUNT_B_EMAIL,env.P0_ACCOUNT_B_PASSWORD]
 ]){
  const signed=await c.auth.signInWithPassword({email,password});
  const u=ensureSuccess(signed,"Login da conta "+letter)?.user;
  assert(Boolean(u?.id),"Login "+letter+" não retornou usuário autenticado.");
  const verified=ensureSuccess(await c.auth.getUser(),"Verificação de sessão "+letter)?.user;
  assert(verified?.id===u.id,"Identidade "+letter+" não foi validada pelo Auth.");
  users.push(u);
 }
 assert(users[0].id!==users[1].id,"As contas autenticadas têm o mesmo ID.");
 log("Autenticação com duas contas distintas e sessão verificada");

 const anonymousScore=await anon.rpc("lab_game_scorecard");
 assert(Boolean(anonymousScore.error),"A RPC de XP ficou acessível sem login.");
 log("RPC de pontuação bloqueada sem autenticação");

 for(const [letter,c,u] of [["A",a,users[0]],["B",b,users[1]]]){
  for(const [table,cols] of [
   ["lab_game_runs","id,user_id,status"],
   ["lab_game_stats","user_id,total_xp"],
   ["lab_game_video_rewards","user_id,video_key"]
  ]){
   const rows=ensureSuccess(await c.from(table).select(cols),"SELECT "+table+" da conta "+letter);
   safeOneUserOnly(rows,u.id,table+" da conta "+letter);
  }
  const score=ensureSuccess(await c.rpc("lab_game_scorecard"),"Scorecard "+letter);
  assert(score?.balanced===true,"Pontuação da conta "+letter+" sem reconciliação.");
  assert(score.total_xp===score.reading_xp+score.video_xp+(score.cycle_bonus_xp??0),
   "Scorecard "+letter+" não bate com as fontes de XP.");
  const forbidden=await c.rpc("lab_game_group_summary",{p_group_id:randomUUID()});
  assert(Boolean(forbidden.error),"Conta "+letter+" consultou grupo do qual não faz parte.");
 }
 log("RLS de jornadas, estatísticas, vídeos e RPC de grupos");
 log("XP de ambas as contas reconciliado sem misturar o GC");

 if(mode==="readonly"){
  log("Modo somente leitura: nenhum capítulo foi confirmado e nenhum GC criado");
  log("Observação: dados vazios não substituem um teste positivo de RLS com registros de terceiros.");
  return {mode,passed:true,groupAndMutationCoverage:false};
 }

 // STAGING ONLY! Confirming chapters and creating groups have durable side effects.
 const beforeA=ensureSuccess(await a.rpc("lab_game_sync"),"Sincronizar A");
 const beforeB=ensureSuccess(await b.rpc("lab_game_sync"),"Sincronizar B");
 assert(beforeA.day===1&&beforeB.day===1,"Staging precisa de DUAS CONTAS NOVAS no dia 1.");
 assert((beforeA.checked??[]).length===0&&(beforeB.checked??[]).length===0,
  "Contas de staging precisam estar sem capítulos confirmados.");
 const startingXpA=beforeA.total_xp,startingXpB=beforeB.total_xp;

 // Out-of-plan chapter is rejected before writing XP.
 const invalid=await a.rpc("lab_game_confirm_chapter",{p_chapter_id:"66:22"});
 assert(Boolean(invalid.error),"Capítulo fora da etapa foi aceito indevidamente");
 const first=ensureSuccess(await a.rpc("lab_game_confirm_chapter",{p_chapter_id:"1:1"}),"Confirmar Gênesis 1");
 assert(first.total_xp===startingXpA+10,"Confirmação válida não concedeu exatamente 10 XP");
 const retry=ensureSuccess(await a.rpc("lab_game_confirm_chapter",{p_chapter_id:"1:1"}),"Repetição Gênesis 1");
 assert(retry.total_xp===first.total_xp,"Repetição creditou XP em duplicidade.");
 const untouched=ensureSuccess(await b.rpc("lab_game_scorecard"),"Scorecard B após XP de A");
 assert(untouched.total_xp===startingXpB,"XP da conta A alterou pontuação da conta B");
 log("XP 10/capítulo, bloqueio fora do plano e idempotência; contas isoladas");

 const name="P0 Homologação "+randomUUID().slice(0,8);
 let createdGroupId;
 try{
  const created=ensureSuccess(await a.from("reading_groups")
    .insert({name,owner_id:users[0].id}).select("id,owner_id").single(),"Criar GC de teste");
  createdGroupId=created.id;
  assert(created.owner_id===users[0].id,"GC não pertence à conta A");
  const invite=ensureSuccess(await a.from("reading_group_invites")
    .select("invite_token").eq("group_id",createdGroupId).single(),"Convite de líder");
  const unauthorizedInvite=ensureSuccess(await b.from("reading_group_invites")
    .select("invite_token").eq("group_id",createdGroupId),"RLS convites para B");
  assert((unauthorizedInvite??[]).length===0,"Não integrante conseguiu ver código de convite");
  const joined=ensureSuccess(await b.rpc("join_reading_group",
    {p_invite_token:invite.invite_token}),"Entrar via convite");
  assert(joined===createdGroupId,"Convite não adicionou B ao grupo");
  const memberGroups=ensureSuccess(await b.from("reading_groups")
    .select("id").eq("id",createdGroupId),"GC visível ao participante B");
  assert(memberGroups.length===1,"Participante B não visualizou o próprio GC");
  const ownerSummary=ensureSuccess(await a.rpc("lab_game_group_summary",
    {p_group_id:createdGroupId}),"Resumo do GC para A");
  assert(ownerSummary.members===2,"O GC não reconheceu os dois participantes");
  const afterInvite=ensureSuccess(await b.from("reading_group_invites")
    .select("invite_token").eq("group_id",createdGroupId),"RLS do convite depois da entrada");
  assert(afterInvite.length===0,"Membro não líder leu o convite secreto do GC");
  log("GC, convite exclusivo do líder, entrada autorizada e resumo de participantes");
 }finally{
  if(createdGroupId){
   const deleted=await a.from("reading_groups").delete().eq("id",createdGroupId);
   if(deleted.error)process.stderr.write("ATENÇÃO: GC de staging requer limpeza manual.\n");
  }
  await Promise.allSettled([a.auth.signOut(),b.auth.signOut()]);
 }
 log("Staging validado (leituras de teste permanecem para auditoria)");
 return {mode,passed:true,groupAndMutationCoverage:true};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 executeP0().catch(e=>{
  process.stderr.write("P0 NÃO HOMOLOGADO: "+e.message+"\n");
  process.exitCode=1;
 });
}
