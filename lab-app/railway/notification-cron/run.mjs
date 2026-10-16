/**
 * LABGAME Railway cron adapter: opt-in reminder dispatch only.
 * It NEVER reads player records or grants XP. It invokes a protected
 * Supabase Edge Function, which enforces consent, quiet hours and deduplication.
 *
 * Default state is DISABLED. No secrets may be committed to source control.
 */
import {pathToFileURL} from "node:url";

export const NOTIFICATION_ENDPOINT =
 "https://azejfxvaamgkmfmwdzjn.supabase.co/functions/v1/notify-reading-email";

/** Fail closed: a Railway deployment alone cannot start sending email. */
export function getConfig(env) {
 if(env.LAB_RAILWAY_WORKER_ENABLED!=="true")return {enabled:false};
 const secret=env.LAB_NOTIFICATION_CRON_SECRET;
 if(typeof secret!=="string"||secret.length<32)
  throw Error("Cron authorization is not configured.");
 return {enabled:true,secret};
}

export async function run(env=process.env,request=fetch){
 const config=getConfig(env);
 if(!config.enabled)return {state:"disabled",sent:0};
 const response=await request(NOTIFICATION_ENDPOINT,{
  method:"POST",
  headers:{"authorization":"Bearer "+config.secret,"content-type":"application/json"},
  body:"{}",
  signal:AbortSignal.timeout(20000)
 });
 if(!response.ok)throw Error("Notification worker returned HTTP "+response.status);
 // Never log raw response bodies or recipient/user details.
 const result=await response.json();
 const count=value=>Number.isSafeInteger(value)&&value>=0?value:0;
 return {
  state:"ok",
  sent:count(result?.sent),
  suppressed:count(result?.suppressed),
  errors:count(result?.errors)
 };
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const summary=await run();
  console.log(JSON.stringify(summary));
 }catch{
  // Credentials, provider responses and personal information are never logged.
  console.error("LABGAME notification cron unsuccessful; see private service diagnostics.");
  process.exitCode=1;
 }
}
