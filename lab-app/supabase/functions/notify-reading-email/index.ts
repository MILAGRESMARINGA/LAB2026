// LABGAME opt-in reading email worker: NOT DEPLOYED.
// Deploy only after staging testing, verified sender domain and RESEND_API_KEY.
// Configure verify_jwt=false ONLY with an independent high-entropy CRON_SECRET.
// This route never accepts user-generated content, recipient lists or templates.
import {createClient} from "npm:@supabase/supabase-js@2";

const utcDayInBrazil=(at:Date)=>{
 const parts=new Intl.DateTimeFormat("en-US",{
  timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"
 }).formatToParts(at);
 const part=(kind:string)=>parts.find(p=>p.type===kind)?.value;
 return `${part("year")}-${part("month")}-${part("day")}`;
};
const localHour=(at:Date)=>Number(new Intl.DateTimeFormat("en-US",{
 timeZone:"America/Sao_Paulo",hour:"2-digit",hour12:false
}).formatToParts(at).find(p=>p.type==="hour")?.value??-1);

/** Compares a fixed secret without immediately returning on the first mismatch. */
function sameSecret(a:string,b:string){
 if(!a||!b||a.length!==b.length)return false;
 let difference=0;
 for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);
 return difference===0;
}
const respond=(code:number,body:Record<string,unknown>)=>
 new Response(JSON.stringify(body),{
  status:code,headers:{"content-type":"application/json","cache-control":"no-store"}
 });
Deno.serve(async req=>{
 if(req.method!=="POST")return respond(405,{message:"Method not allowed"});
 const cronSecret=Deno.env.get("LAB_NOTIFICATION_CRON_SECRET")??"";
 const token=req.headers.get("authorization")?.replace(/^Bearer\s+/,"")??"";
 if(cronSecret.length<32||!sameSecret(token,cronSecret))
  return respond(401,{message:"Unauthorized"});
 const url=Deno.env.get("SUPABASE_URL");
 const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 const apiKey=Deno.env.get("RESEND_API_KEY");
 const from=Deno.env.get("LAB_NOTIFICATION_FROM");
 const ready=Deno.env.get("LAB_NOTIFICATION_EMAIL_READY");
 if(!url||!service||!apiKey||!from||ready!=="true")
  return respond(503,{message:"Email delivery is not configured"});
 const now=new Date();
 // A scheduled job may run anytime; never email before 08:00 or after 20:00.
 const hour=localHour(now);
 if(hour<8||hour>=20)return respond(200,{sent:0,skipped:"quiet hours"});
 const localDay=utcDayInBrazil(now);
 const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 let sent=0,suppressed=0,errors=0,checked=0;
 const batch=200,maxPages=10;
 for(let page=0;page<maxPages;page++){
  const {data:subscribers,error:selectionError}=await admin
   .from("lab_notification_preferences").select("user_id")
   .eq("enabled",true).eq("reading_email",true)
   .order("user_id",{ascending:true}).range(page*batch,page*batch+batch-1);
  if(selectionError)return respond(503,{message:"Preference lookup failed"});
  for(const row of subscribers??[]){
   checked++;
   try{
    const userId=String(row.user_id);
    // No reminder unless a real user has an active reading stage awaiting chapters.
    const {data:run,error:runError}=await admin.from("lab_v2_runs")
     .select("id").eq("user_id",userId).eq("status","active")
     .limit(1).maybeSingle();
    if(runError||!run){suppressed++;continue}
    const {data:stage,error:stageError}=await admin.from("lab_v2_stages")
     .select("activated_at,completed_at").eq("run_id",run.id)
     .order("day_number",{ascending:false}).limit(1).maybeSingle();
    if(stageError||!stage||stage.completed_at){suppressed++;continue}
    const elapsed=now.getTime()-Date.parse(stage.activated_at);
    // Reminder only after the participant actually had time to read.
    if(!Number.isFinite(elapsed)||elapsed<12*3600000||elapsed>30*3600000){
     suppressed++;continue;
    }
    // Re-check opt-out immediately before reserving a send.
    const {data:consent,error:consentError}=await admin
     .from("lab_notification_preferences")
     .select("enabled,reading_email").eq("user_id",userId).maybeSingle();
    if(consentError||!consent?.enabled||!consent.reading_email){
     suppressed++;continue;
    }
    // Unique key in SQL prevents two jobs sending to the same user twice per day.
    const {error:reserveError}=await admin.from("lab_notification_deliveries")
     .insert({user_id:userId,category:"reading",channel:"email",
      local_day:localDay,status:"reserved"});
    if(reserveError?.code==="23505"){suppressed++;continue}
    if(reserveError){errors++;continue}
    const mark=async(status:"sent"|"failed"|"suppressed",providerId?:string)=>{
     await admin.from("lab_notification_deliveries")
      .update({status,provider_message_id:providerId??null,
       sent_at:status==="sent"?new Date().toISOString():null})
      .eq("user_id",userId).eq("category","reading")
      .eq("channel","email").eq("local_day",localDay);
    };
    const {data:{user},error:userError}=await admin.auth.admin.getUserById(userId);
    if(userError||!user?.email){await mark("suppressed");suppressed++;continue}
    // Final subscription check immediately preceding network transmission.
    const {data:lastConsent,error:lastError}=await admin
     .from("lab_notification_preferences").select("enabled,reading_email")
     .eq("user_id",userId).maybeSingle();
    if(lastError||!lastConsent?.enabled||!lastConsent.reading_email){
     await mark("suppressed");suppressed++;continue;
    }
    const provider=await fetch("https://api.resend.com/emails",{
     method:"POST",headers:{
      "authorization":`Bearer ${apiKey}`,
      "content-type":"application/json",
      "idempotency-key":`lab-reading-${userId}-${localDay}`
     },
     body:JSON.stringify({
      from,to:[user.email],subject:"LABGAME — sua Jornada de leitura",
      text:"Sua etapa de leitura do LABGAME está em andamento. Continue seus capítulos no aplicativo: https://labgame-biblia.vercel.app\n\nPara parar de receber lembretes, abra Perfil > Configurações > Notificações e desative E-mail em Leitura diária."
     })
    });
    if(!provider.ok){await mark("failed");errors++;continue}
    const payload=await provider.json().catch(()=>({}));
    await mark("sent",typeof payload?.id==="string"?payload.id:undefined);
    sent++;
   }catch{
    // No user identifiers, emails or provider responses in the public output.
    errors++;
   }
  }
  if((subscribers??[]).length<batch)break;
 }
 return respond(200,{sent,suppressed,errors,checked,day:localDay});
});
